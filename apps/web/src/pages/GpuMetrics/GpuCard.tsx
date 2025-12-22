import type { GpuWithMetrics } from './types';
import styles from './GpuMetrics.module.css';

interface GpuCardProps {
  gpu: GpuWithMetrics;
}

export function GpuCard({ gpu }: GpuCardProps) {
  const { info, current } = gpu;

  const getUtilizationColor = (value: number) => {
    if (value < 50) return 'var(--success)';
    if (value < 80) return 'var(--warning)';
    return 'var(--error)';
  };

  const getTempColor = (temp: number) => {
    if (temp < 60) return 'var(--success)';
    if (temp < 80) return 'var(--warning)';
    return 'var(--error)';
  };

  const formatMemory = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  const formatThroughput = (mbps: number | null) => {
    if (mbps === null) return null;
    if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} GB/s`;
    return `${mbps.toFixed(0)} MB/s`;
  };

  return (
    <div className={styles.gpuCard}>
      <div className={styles.gpuHeader}>
        <div className={styles.gpuIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
          </svg>
        </div>
        <div className={styles.gpuInfo}>
          <h3>{info.name}</h3>
          <span className={styles.gpuVendor}>
            {info.vendor} | {info.driver_version}
            {info.compute_capability && ` | CUDA ${info.compute_capability}`}
          </span>
        </div>
        {info.cuda_cores && (
          <div className={styles.gpuBadge}>
            {info.cuda_cores.toLocaleString()} CUDA Cores
          </div>
        )}
        {info.memory_total_mb > 0 && !info.cuda_cores && (
          <div className={styles.gpuBadge}>
            {formatMemory(info.memory_total_mb)} VRAM
          </div>
        )}
      </div>

      <div className={styles.gpuMetricsGrid}>
        {/* GPU Utilization - Primary metric */}
        <div className={styles.metricItem}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>GPU Usage</span>
            <span className={styles.metricValue} style={{ color: getUtilizationColor(current.gpu_utilization) }}>
              {current.gpu_utilization.toFixed(1)}%
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ 
                backgroundColor: getUtilizationColor(current.gpu_utilization),
                width: `${current.gpu_utilization}%` 
              }}
            />
          </div>
        </div>

        {/* Memory Usage - Primary metric */}
        <div className={styles.metricItem}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>VRAM</span>
            <span className={styles.metricValue}>
              {formatMemory(current.memory_used_mb)} / {formatMemory(current.memory_total_mb)}
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${styles.progressMemory}`}
              style={{ width: `${current.memory_utilization}%` }}
            />
          </div>
        </div>

        {/* Temperature */}
        {current.temperature_celsius !== null && (
          <div className={`${styles.metricItem} ${styles.metricItemSmall}`}>
            <span className={styles.metricIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
              </svg>
            </span>
            <span className={styles.metricLabel}>Temperature</span>
            <span 
              className={styles.metricValue}
              style={{ color: getTempColor(current.temperature_celsius) }}
            >
              {current.temperature_celsius.toFixed(0)}°C
            </span>
          </div>
        )}

        {/* Power Usage */}
        {current.power_usage_watts !== null && (
          <div className={`${styles.metricItem} ${styles.metricItemSmall}`}>
            <span className={styles.metricIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            <span className={styles.metricLabel}>Power</span>
            <span className={styles.metricValue}>
              {current.power_usage_watts.toFixed(0)}W
              {current.power_limit_watts && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                  {' '}/ {current.power_limit_watts.toFixed(0)}W
                </span>
              )}
            </span>
          </div>
        )}

        {/* Fan Speed */}
        {current.fan_speed_percent !== null && (
          <div className={`${styles.metricItem} ${styles.metricItemSmall}`}>
            <span className={styles.metricIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </span>
            <span className={styles.metricLabel}>Fan Speed</span>
            <span className={styles.metricValue}>{current.fan_speed_percent}%</span>
          </div>
        )}

        {/* GPU Clock Speed */}
        {current.clock_speed_mhz !== null && (
          <div className={`${styles.metricItem} ${styles.metricItemSmall}`}>
            <span className={styles.metricIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <span className={styles.metricLabel}>GPU Clock</span>
            <span className={styles.metricValue}>{current.clock_speed_mhz.toLocaleString()} MHz</span>
          </div>
        )}

        {/* Memory Clock Speed */}
        {current.memory_clock_mhz !== null && (
          <div className={`${styles.metricItem} ${styles.metricItemSmall}`}>
            <span className={styles.metricIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" />
              </svg>
            </span>
            <span className={styles.metricLabel}>Mem Clock</span>
            <span className={styles.metricValue}>{current.memory_clock_mhz.toLocaleString()} MHz</span>
          </div>
        )}

        {/* PCIe Throughput RX */}
        {current.pcie_throughput_rx_mbps !== null && formatThroughput(current.pcie_throughput_rx_mbps) && (
          <div className={`${styles.metricItem} ${styles.metricItemSmall}`}>
            <span className={styles.metricIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </span>
            <span className={styles.metricLabel}>PCIe RX</span>
            <span className={styles.metricValue}>{formatThroughput(current.pcie_throughput_rx_mbps)}</span>
          </div>
        )}

        {/* PCIe Throughput TX */}
        {current.pcie_throughput_tx_mbps !== null && formatThroughput(current.pcie_throughput_tx_mbps) && (
          <div className={`${styles.metricItem} ${styles.metricItemSmall}`}>
            <span className={styles.metricIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
                <line x1="12" y1="9" x2="12" y2="21" />
              </svg>
            </span>
            <span className={styles.metricLabel}>PCIe TX</span>
            <span className={styles.metricValue}>{formatThroughput(current.pcie_throughput_tx_mbps)}</span>
          </div>
        )}

        {/* Encoder Utilization */}
        {current.encoder_utilization !== null && current.encoder_utilization > 0 && (
          <div className={`${styles.metricItem} ${styles.metricItemSmall}`}>
            <span className={styles.metricIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
            </span>
            <span className={styles.metricLabel}>Encoder</span>
            <span className={styles.metricValue}>{current.encoder_utilization.toFixed(0)}%</span>
          </div>
        )}

        {/* Decoder Utilization */}
        {current.decoder_utilization !== null && current.decoder_utilization > 0 && (
          <div className={`${styles.metricItem} ${styles.metricItemSmall}`}>
            <span className={styles.metricIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </span>
            <span className={styles.metricLabel}>Decoder</span>
            <span className={styles.metricValue}>{current.decoder_utilization.toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
