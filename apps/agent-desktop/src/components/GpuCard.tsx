import { motion } from 'framer-motion';
import type { GpuWithMetrics } from '../types';

interface GpuCardProps {
  gpu: GpuWithMetrics;
}

export function GpuCard({ gpu }: GpuCardProps) {
  const { info, current } = gpu;

  const getUtilizationColor = (value: number) => {
    if (value < 50) return 'var(--color-success)';
    if (value < 80) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const formatMemory = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  return (
    <motion.div
      className="gpu-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="gpu-header">
        <div className="gpu-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
          </svg>
        </div>
        <div className="gpu-info">
          <h3>{info.name}</h3>
          <span className="gpu-vendor">{info.vendor} | {info.driver_version}</span>
        </div>
        {info.cuda_cores && (
          <div className="gpu-badge">
            {info.cuda_cores} CUDA Cores
          </div>
        )}
      </div>

      <div className="gpu-metrics-grid">
        {/* GPU Utilization */}
        <div className="metric-item">
          <div className="metric-header">
            <span className="metric-label">GPU Usage</span>
            <span className="metric-value" style={{ color: getUtilizationColor(current.gpu_utilization) }}>
              {current.gpu_utilization.toFixed(1)}%
            </span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              style={{ backgroundColor: getUtilizationColor(current.gpu_utilization) }}
              animate={{ width: `${current.gpu_utilization}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Memory Usage */}
        <div className="metric-item">
          <div className="metric-header">
            <span className="metric-label">Memory</span>
            <span className="metric-value">
              {formatMemory(current.memory_used_mb)} / {formatMemory(current.memory_total_mb)}
            </span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill memory"
              animate={{ width: `${current.memory_utilization}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Temperature */}
        {current.temperature_celsius !== null && (
          <div className="metric-item small">
            <span className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
              </svg>
            </span>
            <span className="metric-label">Temp</span>
            <span 
              className="metric-value"
              style={{ color: current.temperature_celsius > 80 ? 'var(--color-error)' : 'inherit' }}
            >
              {current.temperature_celsius.toFixed(0)}°C
            </span>
          </div>
        )}

        {/* Power Usage */}
        {current.power_usage_watts !== null && (
          <div className="metric-item small">
            <span className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            <span className="metric-label">Power</span>
            <span className="metric-value">
              {current.power_usage_watts.toFixed(0)}W
              {current.power_limit_watts && ` / ${current.power_limit_watts.toFixed(0)}W`}
            </span>
          </div>
        )}

        {/* Fan Speed */}
        {current.fan_speed_percent !== null && (
          <div className="metric-item small">
            <span className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </span>
            <span className="metric-label">Fan</span>
            <span className="metric-value">{current.fan_speed_percent}%</span>
          </div>
        )}

        {/* Clock Speed */}
        {current.clock_speed_mhz !== null && (
          <div className="metric-item small">
            <span className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <span className="metric-label">Clock</span>
            <span className="metric-value">{current.clock_speed_mhz} MHz</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

