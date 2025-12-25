/**
 * MetricsPage - Comprehensive metrics dashboard with configurable thresholds
 * Displays all available system and GPU metrics with beautiful visualizations
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../components/Toast';
import { isTauriAvailable } from '../hooks';
import './MetricsPage.css';

// Dynamic import for Tauri
const invokeTauri = async <T,>(command: string): Promise<T> => {
  if (!isTauriAvailable()) {
    throw new Error('Metrics are only available in the desktop app');
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command);
};

// ============================================================================
// Types matching Rust backend
// ============================================================================
interface GpuInfo {
  id: number;
  name: string;
  vendor: string;
  memory_total_mb: number;
}

interface GpuMetrics {
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
}

interface SystemMetrics {
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
}

interface GpuWithMetrics {
  info: GpuInfo;
  current: GpuMetrics;
  history: GpuMetrics[];
}

interface AllMetrics {
  gpus: GpuWithMetrics[];
  system: SystemMetrics;
}

// ============================================================================
// Threshold Configuration
// ============================================================================
interface ThresholdConfig {
  cpu: number;
  memory: number;
  swap: number;
  gpu: number;
  gpuMemory: number;
  temperature: number;
  diskIO: number; // MB/s
  networkIO: number; // MB/s
}

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  cpu: 90,
  memory: 85,
  swap: 75,
  gpu: 90,
  gpuMemory: 90,
  temperature: 85,
  diskIO: 500, // 500 MB/s
  networkIO: 100, // 100 MB/s
};

const loadThresholds = (): ThresholdConfig => {
  try {
    const saved = localStorage.getItem('ursly-metric-thresholds');
    if (saved) {
      return { ...DEFAULT_THRESHOLDS, ...JSON.parse(saved) };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_THRESHOLDS;
};

const saveThresholds = (thresholds: ThresholdConfig): void => {
  try {
    localStorage.setItem('ursly-metric-thresholds', JSON.stringify(thresholds));
  } catch {
    /* ignore */
  }
};

// ============================================================================
// Helper Functions
// ============================================================================
const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes.toFixed(0)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatThroughput = (bytesPerSec: number) =>
  `${formatBytes(bytesPerSec)}/s`;

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getUsageColor = (value: number, threshold = 90) => {
  if (value < threshold * 0.7) return 'var(--success)';
  if (value < threshold) return 'var(--warning)';
  return 'var(--error)';
};

const getStatusClass = (
  value: number,
  threshold = 90,
): 'good' | 'warning' | 'critical' => {
  if (value < threshold * 0.7) return 'good';
  if (value < threshold) return 'warning';
  return 'critical';
};

// ============================================================================
// Sparkline Component
// ============================================================================
const Sparkline = ({
  data,
  color,
  height = 50,
}: {
  data: number[];
  color: string;
  height?: number;
}) => {
  if (data.length < 2)
    return <div className="sparkline-empty" style={{ height }} />;

  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 85 - 5}`,
    )
    .join(' ');
  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <svg
      className="sparkline"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ height }}
    >
      <defs>
        <linearGradient
          id={`grad-${color.replace(/\W/g, '')}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#grad-${color.replace(/\W/g, '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ============================================================================
// Gauge Component
// ============================================================================
const Gauge = ({
  value,
  max = 100,
  label,
  unit = '%',
  size = 90,
  threshold = 90,
}: {
  value: number;
  max?: number;
  label: string;
  unit?: string;
  size?: number;
  threshold?: number;
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI * 1.5;
  const offset = circumference - (percentage / 100) * circumference;
  const color = getUsageColor(percentage, threshold);

  return (
    <div className="gauge-container" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="gauge-svg">
        <circle
          className="gauge-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference * 0.33}`}
          strokeDashoffset={0}
          transform={`rotate(135 ${size / 2} ${size / 2})`}
        />
        <circle
          className="gauge-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference * 0.33}`}
          strokeDashoffset={offset}
          transform={`rotate(135 ${size / 2} ${size / 2})`}
          style={{ stroke: color }}
        />
      </svg>
      <div className="gauge-content">
        <span className="gauge-value-text" style={{ color }}>
          {value.toFixed(0)}
          <span className="gauge-unit">{unit}</span>
        </span>
        <span className="gauge-label">{label}</span>
      </div>
    </div>
  );
};

// ============================================================================
// Mini Gauge for per-core CPU
// ============================================================================
const MiniGauge = ({
  value,
  label,
  threshold = 90,
}: {
  value: number;
  label: string;
  threshold?: number;
}) => {
  const color = getUsageColor(value, threshold);
  return (
    <div className="mini-gauge">
      <div className="mini-gauge-bar">
        <div
          className="mini-gauge-fill"
          style={{ height: `${Math.min(value, 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="mini-gauge-label">{label}</span>
      <span className="mini-gauge-value" style={{ color }}>
        {value.toFixed(0)}%
      </span>
    </div>
  );
};

// ============================================================================
// Settings Modal Component
// ============================================================================
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: ThresholdConfig;
  onSave: (thresholds: ThresholdConfig) => void;
}

const SettingsModal = ({
  isOpen,
  onClose,
  thresholds,
  onSave,
}: SettingsModalProps) => {
  const [local, setLocal] = useState(thresholds);

  useEffect(() => {
    setLocal(thresholds);
  }, [thresholds, isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(local);
    onClose();
  };

  const handleReset = () => {
    setLocal(DEFAULT_THRESHOLDS);
  };

  const updateThreshold = (key: keyof ThresholdConfig, value: number) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const thresholdItems: {
    key: keyof ThresholdConfig;
    label: string;
    unit: string;
    min: number;
    max: number;
    step: number;
  }[] = [
    { key: 'cpu', label: 'CPU Usage', unit: '%', min: 50, max: 100, step: 5 },
    {
      key: 'memory',
      label: 'Memory Usage',
      unit: '%',
      min: 50,
      max: 100,
      step: 5,
    },
    { key: 'swap', label: 'Swap Usage', unit: '%', min: 25, max: 100, step: 5 },
    {
      key: 'gpu',
      label: 'GPU Utilization',
      unit: '%',
      min: 50,
      max: 100,
      step: 5,
    },
    {
      key: 'gpuMemory',
      label: 'GPU Memory',
      unit: '%',
      min: 50,
      max: 100,
      step: 5,
    },
    {
      key: 'temperature',
      label: 'GPU Temperature',
      unit: '°C',
      min: 60,
      max: 100,
      step: 5,
    },
    {
      key: 'diskIO',
      label: 'Disk I/O',
      unit: 'MB/s',
      min: 100,
      max: 2000,
      step: 100,
    },
    {
      key: 'networkIO',
      label: 'Network I/O',
      unit: 'MB/s',
      min: 10,
      max: 1000,
      step: 10,
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Alert Thresholds</h2>
          <button className="modal-close" onClick={onClose}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-description">
            Configure when to show warning notifications. Alerts trigger when
            metrics exceed these values.
          </p>
          <div className="threshold-grid">
            {thresholdItems.map(({ key, label, unit, min, max, step }) => (
              <div key={key} className="threshold-input-group">
                <label className="threshold-label">
                  <span>{label}</span>
                  <span className="threshold-current">
                    {local[key]}
                    {unit}
                  </span>
                </label>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={local[key]}
                  onChange={(e) =>
                    updateThreshold(key, parseInt(e.target.value))
                  }
                  className="threshold-slider"
                />
                <div className="threshold-range">
                  <span>
                    {min}
                    {unit}
                  </span>
                  <span>
                    {max}
                    {unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleReset}>
            Reset to Defaults
          </button>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main MetricsPage Component
// ============================================================================
export function MetricsPage() {
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState<AllMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionUptime, setSessionUptime] = useState(0);
  const [thresholds, setThresholds] = useState<ThresholdConfig>(loadThresholds);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const alertedRef = useRef<Set<string>>(new Set());
  const [historicalData, setHistoricalData] = useState<{
    cpu: number[];
    memory: number[];
    swap: number[];
    gpu: number[];
    gpuMem: number[];
    gpuTemp: number[];
    diskRead: number[];
    diskWrite: number[];
    netRx: number[];
    netTx: number[];
  }>({
    cpu: [],
    memory: [],
    swap: [],
    gpu: [],
    gpuMem: [],
    gpuTemp: [],
    diskRead: [],
    diskWrite: [],
    netRx: [],
    netTx: [],
  });

  const handleSaveThresholds = useCallback((newThresholds: ThresholdConfig) => {
    setThresholds(newThresholds);
    saveThresholds(newThresholds);
    alertedRef.current.clear(); // Reset alerts when thresholds change
  }, []);

  const checkThresholds = useCallback(
    (data: AllMetrics) => {
      const alerts = alertedRef.current;

      // CPU Alert
      if (data.system.cpu_usage >= thresholds.cpu && !alerts.has('cpu')) {
        showToast({
          type: 'warning',
          message: `CPU critical: ${data.system.cpu_usage.toFixed(0)}%`,
          duration: 5000,
        });
        alerts.add('cpu');
      } else if (data.system.cpu_usage < thresholds.cpu * 0.9) {
        alerts.delete('cpu');
      }

      // Memory Alert
      if (
        data.system.memory_usage_percent >= thresholds.memory &&
        !alerts.has('memory')
      ) {
        showToast({
          type: 'warning',
          message: `Memory critical: ${data.system.memory_usage_percent.toFixed(0)}%`,
          duration: 5000,
        });
        alerts.add('memory');
      } else if (data.system.memory_usage_percent < thresholds.memory * 0.9) {
        alerts.delete('memory');
      }

      // Swap Alert
      const swapPercent =
        data.system.swap_total_mb > 0
          ? (data.system.swap_used_mb / data.system.swap_total_mb) * 100
          : 0;
      if (swapPercent >= thresholds.swap && !alerts.has('swap')) {
        showToast({
          type: 'warning',
          message: `Swap critical: ${swapPercent.toFixed(0)}%`,
          duration: 5000,
        });
        alerts.add('swap');
      } else if (swapPercent < thresholds.swap * 0.9) {
        alerts.delete('swap');
      }

      // GPU Alerts
      data.gpus.forEach((gpu, i) => {
        if (
          gpu.current.gpu_utilization >= thresholds.gpu &&
          !alerts.has(`gpu-${i}`)
        ) {
          showToast({
            type: 'warning',
            message: `GPU at ${gpu.current.gpu_utilization.toFixed(0)}%`,
            duration: 5000,
          });
          alerts.add(`gpu-${i}`);
        } else if (gpu.current.gpu_utilization < thresholds.gpu * 0.9) {
          alerts.delete(`gpu-${i}`);
        }

        // GPU Memory
        if (
          gpu.current.memory_utilization >= thresholds.gpuMemory &&
          !alerts.has(`gpuMem-${i}`)
        ) {
          showToast({
            type: 'warning',
            message: `GPU VRAM at ${gpu.current.memory_utilization.toFixed(0)}%`,
            duration: 5000,
          });
          alerts.add(`gpuMem-${i}`);
        } else if (
          gpu.current.memory_utilization <
          thresholds.gpuMemory * 0.9
        ) {
          alerts.delete(`gpuMem-${i}`);
        }

        // Temperature
        if (
          gpu.current.temperature_celsius &&
          gpu.current.temperature_celsius >= thresholds.temperature &&
          !alerts.has(`temp-${i}`)
        ) {
          showToast({
            type: 'error',
            message: `GPU temp: ${gpu.current.temperature_celsius.toFixed(0)}°C`,
            duration: 5000,
          });
          alerts.add(`temp-${i}`);
        } else if (
          !gpu.current.temperature_celsius ||
          gpu.current.temperature_celsius < thresholds.temperature * 0.9
        ) {
          alerts.delete(`temp-${i}`);
        }
      });
    },
    [showToast, thresholds],
  );

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await invokeTauri<AllMetrics>('get_all_metrics');
      setMetrics(data);
      setError(null);
      setSessionUptime((prev) => prev + 2);
      checkThresholds(data);

      const gpu = data.gpus[0];
      setHistoricalData((prev) => ({
        cpu: [...prev.cpu.slice(-59), data.system.cpu_usage],
        memory: [...prev.memory.slice(-59), data.system.memory_usage_percent],
        swap: [
          ...prev.swap.slice(-59),
          data.system.swap_total_mb > 0
            ? (data.system.swap_used_mb / data.system.swap_total_mb) * 100
            : 0,
        ],
        gpu: [...prev.gpu.slice(-59), gpu?.current.gpu_utilization ?? 0],
        gpuMem: [
          ...prev.gpuMem.slice(-59),
          gpu?.current.memory_utilization ?? 0,
        ],
        gpuTemp: [
          ...prev.gpuTemp.slice(-59),
          gpu?.current.temperature_celsius ?? 0,
        ],
        diskRead: [
          ...prev.diskRead.slice(-59),
          data.system.disk_read_bytes_sec,
        ],
        diskWrite: [
          ...prev.diskWrite.slice(-59),
          data.system.disk_write_bytes_sec,
        ],
        netRx: [...prev.netRx.slice(-59), data.system.network_rx_bytes_sec],
        netTx: [...prev.netTx.slice(-59), data.system.network_tx_bytes_sec],
      }));
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    }
  }, [checkThresholds]);

  useEffect(() => {
    if (!isTauriAvailable()) {
      setError('Metrics are only available in the desktop app');
      return;
    }
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (error) {
    return (
      <div className="metrics-page">
        <div className="metrics-error">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>Metrics Unavailable</h2>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchMetrics}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="metrics-page">
        <div className="metrics-loading">
          <div className="loader-ring" />
          <span>Loading metrics...</span>
        </div>
      </div>
    );
  }

  const gpu = metrics.gpus[0];
  const swapPercent =
    metrics.system.swap_total_mb > 0
      ? (metrics.system.swap_used_mb / metrics.system.swap_total_mb) * 100
      : 0;
  const cpuStatus = getStatusClass(metrics.system.cpu_usage, thresholds.cpu);
  const memStatus = getStatusClass(
    metrics.system.memory_usage_percent,
    thresholds.memory,
  );
  const swapStatus = getStatusClass(swapPercent, thresholds.swap);
  const gpuStatus = gpu
    ? getStatusClass(gpu.current.gpu_utilization, thresholds.gpu)
    : 'good';

  return (
    <div className="metrics-page">
      {/* Header */}
      <div className="metrics-header">
        <div className="header-title">
          <h1>System Performance</h1>
          <span className="header-subtitle">Real-time monitoring</span>
        </div>
        <div className="header-controls">
          <div className="meta-group">
            <div className="meta-item">
              <span className="meta-label">Session</span>
              <span className="meta-value">
                {formatDuration(sessionUptime)}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">System Uptime</span>
              <span className="meta-value">
                {formatUptime(metrics.system.uptime_seconds)}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Load Avg</span>
              <span className="meta-value">
                {metrics.system.load_average[0].toFixed(2)}{' '}
                <span className="meta-sub">
                  / {metrics.system.load_average[1].toFixed(2)} /{' '}
                  {metrics.system.load_average[2].toFixed(2)}
                </span>
              </span>
            </div>
          </div>
          <button
            className="settings-btn"
            onClick={() => setIsSettingsOpen(true)}
            title="Configure Thresholds"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Top Gauges Row */}
      <div className="metrics-gauge-row">
        <Gauge
          value={metrics.system.cpu_usage}
          label="CPU"
          threshold={thresholds.cpu}
        />
        <Gauge
          value={metrics.system.memory_usage_percent}
          label="Memory"
          threshold={thresholds.memory}
        />
        {swapPercent > 0 && (
          <Gauge value={swapPercent} label="Swap" threshold={thresholds.swap} />
        )}
        {gpu && (
          <Gauge
            value={gpu.current.gpu_utilization}
            label="GPU"
            threshold={thresholds.gpu}
          />
        )}
        {gpu && (
          <Gauge
            value={gpu.current.memory_utilization}
            label="VRAM"
            threshold={thresholds.gpuMemory}
          />
        )}
        {gpu?.current.temperature_celsius && (
          <Gauge
            value={gpu.current.temperature_celsius}
            max={100}
            label="Temp"
            unit="°C"
            threshold={thresholds.temperature}
          />
        )}
      </div>

      {/* Main Grid */}
      <div className="metrics-grid">
        {/* CPU Panel */}
        <div
          className={`metric-panel ${cpuStatus === 'critical' ? 'status-critical' : cpuStatus === 'warning' ? 'status-warning' : ''}`}
        >
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <line x1="9" y1="1" x2="9" y2="4" />
                  <line x1="15" y1="1" x2="15" y2="4" />
                  <line x1="9" y1="20" x2="9" y2="23" />
                  <line x1="15" y1="20" x2="15" y2="23" />
                </svg>
              </span>
              CPU
              <span className={`status-dot ${cpuStatus}`} />
            </div>
            <span
              className="panel-value"
              style={{
                color: getUsageColor(metrics.system.cpu_usage, thresholds.cpu),
              }}
            >
              {metrics.system.cpu_usage.toFixed(1)}%
            </span>
          </div>
          <div className="panel-content">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${metrics.system.cpu_usage}%`,
                  backgroundColor: getUsageColor(
                    metrics.system.cpu_usage,
                    thresholds.cpu,
                  ),
                }}
              />
            </div>

            {/* Per-Core Usage */}
            {metrics.system.per_core_usage.length > 0 && (
              <div className="per-core-container">
                <div className="per-core-label">Per Core</div>
                <div className="per-core-grid">
                  {metrics.system.per_core_usage.map((usage, i) => (
                    <MiniGauge
                      key={i}
                      value={usage}
                      label={`${i}`}
                      threshold={thresholds.cpu}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="sparkline-container">
              <Sparkline data={historicalData.cpu} color="var(--primary)" />
            </div>
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-label">Avg</span>
                <span className="stat-value">
                  {historicalData.cpu.length > 0
                    ? (
                        historicalData.cpu.reduce((a, b) => a + b, 0) /
                        historicalData.cpu.length
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Peak</span>
                <span className="stat-value">
                  {historicalData.cpu.length > 0
                    ? Math.max(...historicalData.cpu).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Cores</span>
                <span className="stat-value">
                  {metrics.system.per_core_usage.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Panel */}
        <div
          className={`metric-panel ${memStatus === 'critical' ? 'status-critical' : memStatus === 'warning' ? 'status-warning' : ''}`}
        >
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" />
                </svg>
              </span>
              Memory
              <span className={`status-dot ${memStatus}`} />
            </div>
            <span
              className="panel-value"
              style={{
                color: getUsageColor(
                  metrics.system.memory_usage_percent,
                  thresholds.memory,
                ),
              }}
            >
              {metrics.system.memory_usage_percent.toFixed(1)}%
            </span>
          </div>
          <div className="panel-content">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${metrics.system.memory_usage_percent}%`,
                  backgroundColor: getUsageColor(
                    metrics.system.memory_usage_percent,
                    thresholds.memory,
                  ),
                }}
              />
            </div>
            <div className="sparkline-container">
              <Sparkline
                data={historicalData.memory}
                color="var(--secondary)"
              />
            </div>
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-label">Used</span>
                <span className="stat-value">
                  {(metrics.system.memory_used_mb / 1024).toFixed(1)} GB
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total</span>
                <span className="stat-value">
                  {(metrics.system.memory_total_mb / 1024).toFixed(0)} GB
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Available</span>
                <span className="stat-value">
                  {(
                    (metrics.system.memory_total_mb -
                      metrics.system.memory_used_mb) /
                    1024
                  ).toFixed(1)}{' '}
                  GB
                </span>
              </div>
            </div>

            {/* Swap Section */}
            {metrics.system.swap_total_mb > 0 && (
              <div
                className={`swap-section ${swapStatus === 'critical' ? 'status-critical' : swapStatus === 'warning' ? 'status-warning' : ''}`}
              >
                <div className="swap-header">
                  <span className="swap-title">Swap</span>
                  <span
                    className="swap-value"
                    style={{
                      color: getUsageColor(swapPercent, thresholds.swap),
                    }}
                  >
                    {swapPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="progress-bar small">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${swapPercent}%`,
                      backgroundColor: getUsageColor(
                        swapPercent,
                        thresholds.swap,
                      ),
                    }}
                  />
                </div>
                <div className="swap-stats">
                  <span>
                    {(metrics.system.swap_used_mb / 1024).toFixed(1)} /{' '}
                    {(metrics.system.swap_total_mb / 1024).toFixed(0)} GB
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* GPU Panel */}
        {gpu && (
          <div
            className={`metric-panel gpu-panel ${gpuStatus === 'critical' ? 'status-critical' : gpuStatus === 'warning' ? 'status-warning' : ''}`}
          >
            <div className="panel-header">
              <div className="panel-title">
                <span className="panel-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M6 8h4M14 8h4M6 12h4M14 12h4M6 16h4M14 16h4" />
                  </svg>
                </span>
                GPU
                <span className={`status-dot ${gpuStatus}`} />
              </div>
              <span
                className="panel-value"
                style={{
                  color: getUsageColor(
                    gpu.current.gpu_utilization,
                    thresholds.gpu,
                  ),
                }}
              >
                {gpu.current.gpu_utilization.toFixed(0)}%
              </span>
            </div>
            <div className="panel-content">
              <div className="gpu-name">{gpu.info.name}</div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${gpu.current.gpu_utilization}%`,
                    backgroundColor: getUsageColor(
                      gpu.current.gpu_utilization,
                      thresholds.gpu,
                    ),
                  }}
                />
              </div>
              <div className="sparkline-container">
                <Sparkline
                  data={historicalData.gpu}
                  color="var(--accent, #10b981)"
                />
              </div>

              {/* GPU Details Grid */}
              <div className="gpu-details-grid">
                <div className="gpu-detail">
                  <span className="detail-label">VRAM</span>
                  <span className="detail-value">
                    {(gpu.current.memory_used_mb / 1024).toFixed(1)} /{' '}
                    {(gpu.info.memory_total_mb / 1024).toFixed(0)} GB
                  </span>
                  <div className="detail-bar">
                    <div
                      className="detail-fill"
                      style={{
                        width: `${gpu.current.memory_utilization}%`,
                        backgroundColor: getUsageColor(
                          gpu.current.memory_utilization,
                          thresholds.gpuMemory,
                        ),
                      }}
                    />
                  </div>
                </div>

                {gpu.current.temperature_celsius && (
                  <div className="gpu-detail">
                    <span className="detail-label">Temperature</span>
                    <span
                      className="detail-value"
                      style={{
                        color: getUsageColor(
                          gpu.current.temperature_celsius,
                          thresholds.temperature,
                        ),
                      }}
                    >
                      {gpu.current.temperature_celsius.toFixed(0)}°C
                    </span>
                  </div>
                )}

                {gpu.current.power_usage_watts && (
                  <div className="gpu-detail">
                    <span className="detail-label">Power</span>
                    <span className="detail-value">
                      {gpu.current.power_usage_watts.toFixed(0)}W
                      {gpu.current.power_limit_watts && (
                        <span className="detail-sub">
                          {' '}
                          / {gpu.current.power_limit_watts.toFixed(0)}W
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {gpu.current.fan_speed_percent !== null && (
                  <div className="gpu-detail">
                    <span className="detail-label">Fan</span>
                    <span className="detail-value">
                      {gpu.current.fan_speed_percent.toFixed(0)}%
                    </span>
                  </div>
                )}

                {gpu.current.clock_speed_mhz && (
                  <div className="gpu-detail">
                    <span className="detail-label">Core Clock</span>
                    <span className="detail-value">
                      {gpu.current.clock_speed_mhz} MHz
                    </span>
                  </div>
                )}

                {gpu.current.memory_clock_mhz && (
                  <div className="gpu-detail">
                    <span className="detail-label">Mem Clock</span>
                    <span className="detail-value">
                      {gpu.current.memory_clock_mhz} MHz
                    </span>
                  </div>
                )}

                {(gpu.current.encoder_utilization !== null ||
                  gpu.current.decoder_utilization !== null) && (
                  <>
                    {gpu.current.encoder_utilization !== null && (
                      <div className="gpu-detail">
                        <span className="detail-label">Encoder</span>
                        <span className="detail-value">
                          {gpu.current.encoder_utilization.toFixed(0)}%
                        </span>
                      </div>
                    )}
                    {gpu.current.decoder_utilization !== null && (
                      <div className="gpu-detail">
                        <span className="detail-label">Decoder</span>
                        <span className="detail-value">
                          {gpu.current.decoder_utilization.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </>
                )}

                {(gpu.current.pcie_throughput_tx_mbps !== null ||
                  gpu.current.pcie_throughput_rx_mbps !== null) && (
                  <div className="gpu-detail wide">
                    <span className="detail-label">PCIe</span>
                    <span className="detail-value">
                      ↓ {gpu.current.pcie_throughput_rx_mbps?.toFixed(0) ?? 0}{' '}
                      MB/s &nbsp; ↑{' '}
                      {gpu.current.pcie_throughput_tx_mbps?.toFixed(0) ?? 0}{' '}
                      MB/s
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Disk I/O Panel */}
        <div className="metric-panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>
              Disk I/O
            </div>
            <span className="panel-value">
              {formatThroughput(
                metrics.system.disk_read_bytes_sec +
                  metrics.system.disk_write_bytes_sec,
              )}
            </span>
          </div>
          <div className="panel-content">
            <div className="io-stats">
              <div className="io-stat read">
                <span className="io-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="17 11 12 6 7 11" />
                    <line x1="12" y1="6" x2="12" y2="18" />
                  </svg>
                </span>
                <div className="io-info">
                  <span className="io-label">Read</span>
                  <span className="io-value">
                    {formatThroughput(metrics.system.disk_read_bytes_sec)}
                  </span>
                </div>
              </div>
              <div className="io-stat write">
                <span className="io-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="7 13 12 18 17 13" />
                    <line x1="12" y1="6" x2="12" y2="18" />
                  </svg>
                </span>
                <div className="io-info">
                  <span className="io-label">Write</span>
                  <span className="io-value">
                    {formatThroughput(metrics.system.disk_write_bytes_sec)}
                  </span>
                </div>
              </div>
            </div>
            <div className="dual-sparkline">
              <div className="sparkline-labeled">
                <span className="sparkline-label">Read</span>
                <Sparkline
                  data={historicalData.diskRead}
                  color="var(--success)"
                  height={35}
                />
              </div>
              <div className="sparkline-labeled">
                <span className="sparkline-label">Write</span>
                <Sparkline
                  data={historicalData.diskWrite}
                  color="var(--warning)"
                  height={35}
                />
              </div>
            </div>
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-label">Peak Read</span>
                <span className="stat-value">
                  {formatBytes(
                    historicalData.diskRead.length > 0
                      ? Math.max(...historicalData.diskRead)
                      : 0,
                  )}
                  /s
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Peak Write</span>
                <span className="stat-value">
                  {formatBytes(
                    historicalData.diskWrite.length > 0
                      ? Math.max(...historicalData.diskWrite)
                      : 0,
                  )}
                  /s
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Network Panel */}
        <div className="metric-panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <circle cx="12" cy="20" r="1" />
                </svg>
              </span>
              Network
            </div>
            <span className="panel-value">
              {formatThroughput(
                metrics.system.network_rx_bytes_sec +
                  metrics.system.network_tx_bytes_sec,
              )}
            </span>
          </div>
          <div className="panel-content">
            <div className="io-stats">
              <div className="io-stat download">
                <span className="io-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="7 13 12 18 17 13" />
                    <line x1="12" y1="6" x2="12" y2="18" />
                  </svg>
                </span>
                <div className="io-info">
                  <span className="io-label">Download</span>
                  <span className="io-value">
                    {formatThroughput(metrics.system.network_rx_bytes_sec)}
                  </span>
                </div>
              </div>
              <div className="io-stat upload">
                <span className="io-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="17 11 12 6 7 11" />
                    <line x1="12" y1="6" x2="12" y2="18" />
                  </svg>
                </span>
                <div className="io-info">
                  <span className="io-label">Upload</span>
                  <span className="io-value">
                    {formatThroughput(metrics.system.network_tx_bytes_sec)}
                  </span>
                </div>
              </div>
            </div>
            <div className="dual-sparkline">
              <div className="sparkline-labeled">
                <span className="sparkline-label">Download</span>
                <Sparkline
                  data={historicalData.netRx}
                  color="var(--primary)"
                  height={35}
                />
              </div>
              <div className="sparkline-labeled">
                <span className="sparkline-label">Upload</span>
                <Sparkline
                  data={historicalData.netTx}
                  color="var(--secondary)"
                  height={35}
                />
              </div>
            </div>
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-label">Peak Down</span>
                <span className="stat-value">
                  {formatBytes(
                    historicalData.netRx.length > 0
                      ? Math.max(...historicalData.netRx)
                      : 0,
                  )}
                  /s
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Peak Up</span>
                <span className="stat-value">
                  {formatBytes(
                    historicalData.netTx.length > 0
                      ? Math.max(...historicalData.netTx)
                      : 0,
                  )}
                  /s
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="metrics-footer">
        <div className="threshold-info">
          <span>Thresholds:</span>
          <span className="threshold-item">
            <span className="threshold-dot warning" /> &gt;
            {Math.round(thresholds.cpu * 0.7)}% Warning
          </span>
          <span className="threshold-item">
            <span className="threshold-dot critical" /> &gt;{thresholds.cpu}%
            Critical
          </span>
          <button
            className="threshold-edit-btn"
            onClick={() => setIsSettingsOpen(true)}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        thresholds={thresholds}
        onSave={handleSaveThresholds}
      />
    </div>
  );
}
