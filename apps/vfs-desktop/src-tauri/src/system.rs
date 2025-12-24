//! System Metrics Collection Module
//! 
//! Provides CPU, memory, and system information using sysinfo crate.

use serde::{Deserialize, Serialize};
use sysinfo::{System, Disks, Networks};

/// System information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os_name: String,
    pub os_version: String,
    pub kernel_version: String,
    pub hostname: String,
    pub cpu_brand: String,
    pub cpu_cores: usize,
    pub total_memory_mb: u64,
    pub total_swap_mb: u64,
}

/// Real-time system metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub cpu_usage: f32,
    pub per_core_usage: Vec<f32>,
    pub memory_used_mb: u64,
    pub memory_total_mb: u64,
    pub memory_usage_percent: f32,
    pub swap_used_mb: u64,
    pub swap_total_mb: u64,
    pub disk_read_bytes_sec: u64,
    pub disk_write_bytes_sec: u64,
    pub network_rx_bytes_sec: u64,
    pub network_tx_bytes_sec: u64,
    pub load_average: [f64; 3],
    pub uptime_seconds: u64,
    pub timestamp: u64,
}

/// Process information for running models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory_mb: u64,
    pub status: String,
    pub start_time: u64,
}

/// Get system information
pub fn get_system_info() -> SystemInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpu_cores = sys.cpus().len();
    let cpu_brand = sys
        .cpus()
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "Unknown CPU".to_string());

    SystemInfo {
        os_name: System::name().unwrap_or_else(|| "Unknown".to_string()),
        os_version: System::os_version().unwrap_or_else(|| "Unknown".to_string()),
        kernel_version: System::kernel_version().unwrap_or_else(|| "Unknown".to_string()),
        hostname: System::host_name().unwrap_or_else(|| "Unknown".to_string()),
        cpu_brand,
        cpu_cores,
        total_memory_mb: sys.total_memory() / (1024 * 1024),
        total_swap_mb: sys.total_swap() / (1024 * 1024),
    }
}

/// Get current system metrics
pub fn get_system_metrics() -> SystemMetrics {
    let mut sys = System::new_all();
    sys.refresh_all();

    // Wait a bit for accurate CPU readings
    std::thread::sleep(std::time::Duration::from_millis(100));
    sys.refresh_cpu_all();

    let cpu_usage = sys.global_cpu_usage();
    let per_core_usage: Vec<f32> = sys.cpus().iter().map(|c| c.cpu_usage()).collect();

    let memory_used = sys.used_memory() / (1024 * 1024);
    let memory_total = sys.total_memory() / (1024 * 1024);
    let memory_usage_percent = if memory_total > 0 {
        (memory_used as f32 / memory_total as f32) * 100.0
    } else {
        0.0
    };

    // Get disk I/O
    let disks = Disks::new_with_refreshed_list();
    let (disk_read, disk_write) = get_disk_io(&disks);

    // Get network I/O
    let networks = Networks::new_with_refreshed_list();
    let (net_rx, net_tx) = get_network_io(&networks);

    let load_avg = System::load_average();

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;

    SystemMetrics {
        cpu_usage,
        per_core_usage,
        memory_used_mb: memory_used,
        memory_total_mb: memory_total,
        memory_usage_percent,
        swap_used_mb: sys.used_swap() / (1024 * 1024),
        swap_total_mb: sys.total_swap() / (1024 * 1024),
        disk_read_bytes_sec: disk_read,
        disk_write_bytes_sec: disk_write,
        network_rx_bytes_sec: net_rx,
        network_tx_bytes_sec: net_tx,
        load_average: [load_avg.one, load_avg.five, load_avg.fifteen],
        uptime_seconds: System::uptime(),
        timestamp,
    }
}

/// Get disk I/O statistics
fn get_disk_io(_disks: &Disks) -> (u64, u64) {
    // sysinfo doesn't provide per-second disk I/O
    // This would need platform-specific implementation
    (0, 0)
}

/// Get network I/O statistics  
fn get_network_io(networks: &Networks) -> (u64, u64) {
    let mut rx = 0u64;
    let mut tx = 0u64;

    for (_, data) in networks.iter() {
        rx += data.received();
        tx += data.transmitted();
    }

    (rx, tx)
}

/// Find processes related to AI model execution
pub fn find_model_processes() -> Vec<ProcessInfo> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let model_keywords = ["ollama", "llama", "python", "torch", "cuda", "transformers"];
    let mut processes = Vec::new();

    for (pid, process) in sys.processes() {
        let name = process.name().to_string_lossy().to_lowercase();
        
        if model_keywords.iter().any(|k| name.contains(k)) {
            processes.push(ProcessInfo {
                pid: pid.as_u32(),
                name: process.name().to_string_lossy().to_string(),
                cpu_usage: process.cpu_usage(),
                memory_mb: process.memory() / (1024 * 1024),
                status: format!("{:?}", process.status()),
                start_time: process.start_time(),
            });
        }
    }

    processes
}

