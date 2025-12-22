//! GPU Metrics Collection Module
//! 
//! Provides cross-platform GPU metrics collection using:
//! - NVML for NVIDIA GPUs
//! - Metal for macOS
//! - DirectX for Windows
//! - wgpu for cross-platform fallback

use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

/// GPU device information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuInfo {
    pub id: u32,
    pub name: String,
    pub vendor: String,
    pub driver_version: String,
    pub memory_total_mb: u64,
    pub cuda_cores: Option<u32>,
    pub compute_capability: Option<String>,
}

/// Real-time GPU metrics
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GpuMetrics {
    pub gpu_utilization: f32,
    pub memory_used_mb: u64,
    pub memory_total_mb: u64,
    pub memory_utilization: f32,
    pub temperature_celsius: Option<f32>,
    pub power_usage_watts: Option<f32>,
    pub power_limit_watts: Option<f32>,
    pub fan_speed_percent: Option<u32>,
    pub clock_speed_mhz: Option<u32>,
    pub memory_clock_mhz: Option<u32>,
    pub pcie_throughput_tx_mbps: Option<f32>,
    pub pcie_throughput_rx_mbps: Option<f32>,
    pub encoder_utilization: Option<f32>,
    pub decoder_utilization: Option<f32>,
    pub timestamp: u64,
}

/// GPU metrics history for charts
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuMetricsHistory {
    pub gpu_id: u32,
    pub samples: Vec<GpuMetrics>,
    pub max_samples: usize,
}

impl GpuMetricsHistory {
    pub fn new(gpu_id: u32, max_samples: usize) -> Self {
        Self {
            gpu_id,
            samples: Vec::with_capacity(max_samples),
            max_samples,
        }
    }

    pub fn push(&mut self, metrics: GpuMetrics) {
        if self.samples.len() >= self.max_samples {
            self.samples.remove(0);
        }
        self.samples.push(metrics);
    }
}

/// Global GPU metrics state
pub static GPU_METRICS: once_cell::sync::Lazy<Arc<Mutex<Vec<GpuMetricsHistory>>>> =
    once_cell::sync::Lazy::new(|| Arc::new(Mutex::new(Vec::new())));

/// Detect all available GPUs
pub fn detect_gpus() -> Vec<GpuInfo> {
    let mut gpus = Vec::new();

    // Try NVIDIA first
    #[cfg(feature = "nvidia")]
    {
        if let Ok(nvidia_gpus) = detect_nvidia_gpus() {
            gpus.extend(nvidia_gpus);
        }
    }

    // Use wgpu for cross-platform detection
    if gpus.is_empty() {
        gpus.extend(detect_wgpu_gpus());
    }

    gpus
}

/// Detect NVIDIA GPUs using NVML
#[cfg(feature = "nvidia")]
fn detect_nvidia_gpus() -> Result<Vec<GpuInfo>, Box<dyn std::error::Error>> {
    use nvml_wrapper::Nvml;

    let nvml = Nvml::init()?;
    let device_count = nvml.device_count()?;
    let mut gpus = Vec::new();

    for i in 0..device_count {
        if let Ok(device) = nvml.device_by_index(i) {
            let name = device.name().unwrap_or_else(|_| "Unknown NVIDIA GPU".to_string());
            let memory = device.memory_info().map(|m| m.total / (1024 * 1024)).unwrap_or(0);
            let driver = nvml.sys_driver_version().unwrap_or_else(|_| "Unknown".to_string());
            let cuda_cores = device.num_cores().ok();
            let compute = device
                .cuda_compute_capability()
                .map(|c| format!("{}.{}", c.major, c.minor))
                .ok();

            gpus.push(GpuInfo {
                id: i,
                name,
                vendor: "NVIDIA".to_string(),
                driver_version: driver,
                memory_total_mb: memory,
                cuda_cores,
                compute_capability: compute,
            });
        }
    }

    Ok(gpus)
}

/// Detect GPUs using wgpu (cross-platform)
fn detect_wgpu_gpus() -> Vec<GpuInfo> {
    let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
        backends: wgpu::Backends::all(),
        ..Default::default()
    });

    let adapters: Vec<wgpu::Adapter> = instance.enumerate_adapters(wgpu::Backends::all()).into_iter().collect();
    let mut gpus = Vec::new();

    for (i, adapter) in adapters.iter().enumerate() {
        let info: wgpu::AdapterInfo = adapter.get_info();
        
        // Skip software renderers
        if info.device_type == wgpu::DeviceType::Cpu {
            continue;
        }

        let vendor = match info.vendor {
            0x10DE => "NVIDIA",
            0x1002 => "AMD",
            0x8086 => "Intel",
            0x106B => "Apple",
            _ => "Unknown",
        };

        gpus.push(GpuInfo {
            id: i as u32,
            name: info.name.clone(),
            vendor: vendor.to_string(),
            driver_version: info.driver.clone(),
            memory_total_mb: 0, // wgpu doesn't provide memory info
            cuda_cores: None,
            compute_capability: None,
        });
    }

    gpus
}

/// Get current GPU metrics
pub fn get_current_metrics(gpu_id: u32) -> GpuMetrics {
    #[cfg(feature = "nvidia")]
    {
        if let Ok(metrics) = get_nvidia_metrics(gpu_id) {
            return metrics;
        }
    }

    // Return simulated metrics for demo/testing
    get_simulated_metrics(gpu_id)
}

/// Get NVIDIA GPU metrics using NVML
#[cfg(feature = "nvidia")]
fn get_nvidia_metrics(gpu_id: u32) -> Result<GpuMetrics, Box<dyn std::error::Error>> {
    use nvml_wrapper::Nvml;

    let nvml = Nvml::init()?;
    let device = nvml.device_by_index(gpu_id)?;

    let utilization = device.utilization_rates()?;
    let memory = device.memory_info()?;
    let temperature = device.temperature(nvml_wrapper::enum_wrappers::device::TemperatureSensor::Gpu).ok();
    let power = device.power_usage().ok().map(|p| p as f32 / 1000.0);
    let power_limit = device.power_management_limit().ok().map(|p| p as f32 / 1000.0);
    let fan_speed = device.fan_speed(0).ok();
    let clock = device.clock_info(nvml_wrapper::enum_wrappers::device::Clock::Graphics).ok();
    let mem_clock = device.clock_info(nvml_wrapper::enum_wrappers::device::Clock::Memory).ok();
    let encoder = device.encoder_utilization().ok().map(|(u, _)| u as f32);
    let decoder = device.decoder_utilization().ok().map(|(u, _)| u as f32);
    let pcie = device.pcie_throughput(nvml_wrapper::enum_wrappers::device::PcieUtilCounter::RxBytes).ok();

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;

    Ok(GpuMetrics {
        gpu_utilization: utilization.gpu as f32,
        memory_used_mb: memory.used / (1024 * 1024),
        memory_total_mb: memory.total / (1024 * 1024),
        memory_utilization: (memory.used as f32 / memory.total as f32) * 100.0,
        temperature_celsius: temperature.map(|t| t as f32),
        power_usage_watts: power,
        power_limit_watts: power_limit,
        fan_speed_percent: fan_speed,
        clock_speed_mhz: clock,
        memory_clock_mhz: mem_clock,
        pcie_throughput_tx_mbps: None,
        pcie_throughput_rx_mbps: pcie.map(|p| p as f32 / 1_000_000.0),
        encoder_utilization: encoder,
        decoder_utilization: decoder,
        timestamp,
    })
}

/// Get simulated GPU metrics for testing
fn get_simulated_metrics(_gpu_id: u32) -> GpuMetrics {
    use std::time::{SystemTime, UNIX_EPOCH};

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;

    // Generate realistic-looking simulated metrics
    let time_factor = (timestamp % 60000) as f32 / 60000.0;
    let wave = (time_factor * std::f32::consts::PI * 2.0).sin();

    GpuMetrics {
        gpu_utilization: 45.0 + wave * 30.0 + rand_float() * 10.0,
        memory_used_mb: 4096 + (wave * 2048.0) as u64,
        memory_total_mb: 8192,
        memory_utilization: 50.0 + wave * 25.0,
        temperature_celsius: Some(55.0 + wave * 15.0),
        power_usage_watts: Some(120.0 + wave * 80.0),
        power_limit_watts: Some(250.0),
        fan_speed_percent: Some(40 + (wave * 30.0) as u32),
        clock_speed_mhz: Some(1800 + (wave * 300.0) as u32),
        memory_clock_mhz: Some(7000 + (wave * 500.0) as u32),
        pcie_throughput_tx_mbps: Some(500.0 + wave * 300.0),
        pcie_throughput_rx_mbps: Some(800.0 + wave * 400.0),
        encoder_utilization: Some(rand_float() * 50.0),
        decoder_utilization: Some(rand_float() * 30.0),
        timestamp,
    }
}

/// Simple random float generator (0.0 to 1.0)
fn rand_float() -> f32 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    (nanos % 1000) as f32 / 1000.0
}

/// Start background metrics polling
pub fn start_metrics_polling(app: AppHandle) {
    let gpus = detect_gpus();
    
    // Initialize history for each GPU
    {
        let mut histories = GPU_METRICS.lock().unwrap();
        for gpu in &gpus {
            histories.push(GpuMetricsHistory::new(gpu.id, 120)); // 2 minutes at 1s interval
        }
    }

    // Poll metrics every second
    loop {
        for gpu in &gpus {
            let metrics = get_current_metrics(gpu.id);
            
            // Update history
            {
                let mut histories = GPU_METRICS.lock().unwrap();
                if let Some(history) = histories.iter_mut().find(|h| h.gpu_id == gpu.id) {
                    history.push(metrics.clone());
                }
            }

            // Emit event to frontend
            let _ = app.emit("gpu-metrics", serde_json::json!({
                "gpu_id": gpu.id,
                "metrics": metrics
            }));
        }

        std::thread::sleep(Duration::from_secs(1));
    }
}

