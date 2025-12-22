import { useMetrics } from './MetricsContext';
import { GpuCard } from '../GpuMetrics/GpuCard';
import styles from './Metrics.module.css';

export function GpuMetricsPage() {
  const { metrics } = useMetrics();
  const gpus = metrics?.gpus || [];

  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h2>GPU Metrics</h2>
        <p>Real-time monitoring of GPU utilization, memory, temperature, and power consumption</p>
      </div>

      <div className={styles.gpuGrid}>
        {gpus.map((gpu) => (
          <GpuCard key={gpu.info.id} gpu={gpu} />
        ))}

        {gpus.length === 0 && (
          <div className={styles.emptyState}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="2" x2="9" y2="4" />
              <line x1="15" y1="2" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="22" />
              <line x1="15" y1="20" x2="15" y2="22" />
            </svg>
            <h3>No GPU Detected</h3>
            <p>Make sure GPU drivers are installed and the device is properly connected.</p>
          </div>
        )}
      </div>
    </div>
  );
}


