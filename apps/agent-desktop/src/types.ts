// GPU Types
export interface GpuInfo {
  id: number;
  name: string;
  vendor: string;
  driver_version: string;
  memory_total_mb: number;
  cuda_cores: number | null;
  compute_capability: string | null;
}

export interface GpuMetrics {
  gpu_utilization: number;
  memory_used_mb: number;
  memory_total_mb: number;
  memory_utilization: number;
  temperature_celsius: number | null;
  power_usage_watts: number | null;
  power_limit_watts: number | null;
  fan_speed_percent: number | null;
  clock_speed_mhz: number | null;
  memory_clock_mhz: number | null;
  pcie_throughput_tx_mbps: number | null;
  pcie_throughput_rx_mbps: number | null;
  encoder_utilization: number | null;
  decoder_utilization: number | null;
  timestamp: number;
}

export interface GpuWithMetrics {
  info: GpuInfo;
  current: GpuMetrics;
  history: GpuMetrics[];
}

// System Types
export interface SystemInfo {
  os_name: string;
  os_version: string;
  kernel_version: string;
  hostname: string;
  cpu_brand: string;
  cpu_cores: number;
  total_memory_mb: number;
  total_swap_mb: number;
}

export interface SystemMetrics {
  cpu_usage: number;
  per_core_usage: number[];
  memory_used_mb: number;
  memory_total_mb: number;
  memory_usage_percent: number;
  swap_used_mb: number;
  swap_total_mb: number;
  disk_read_bytes_sec: number;
  disk_write_bytes_sec: number;
  network_rx_bytes_sec: number;
  network_tx_bytes_sec: number;
  load_average: [number, number, number];
  uptime_seconds: number;
  timestamp: number;
}

// Process Types
export interface ProcessInfo {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_mb: number;
  status: string;
  start_time: number;
}

// Model Types
export interface ModelStatus {
  name: string;
  running: boolean;
  started_at: number;
  duration_seconds: number;
}

export interface ModelConfig {
  name: string;
  ollama_url?: string;
}

// Combined Metrics
export interface AllMetrics {
  gpus: GpuWithMetrics[];
  system: SystemMetrics;
  model_processes: ProcessInfo[];
  running_model: ModelStatus | null;
}

// Events
export interface GpuMetricsEvent {
  gpu_id: number;
  metrics: GpuMetrics;
}

