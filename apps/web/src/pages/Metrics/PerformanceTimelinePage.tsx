import { useMetrics } from './MetricsContext';
import { MetricsChart } from '../GpuMetrics/MetricsChart';
import styles from './Metrics.module.css';

export function PerformanceTimelinePage() {
  const { metrics } = useMetrics();
  const gpus = metrics?.gpus || [];

  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h2>Performance Timeline</h2>
        <p>Historical view of GPU utilization and memory usage over time</p>
      </div>

      <div className={styles.chartsGrid}>
        {gpus.map((gpu) => (
          <MetricsChart key={gpu.info.id} gpu={gpu} />
        ))}

        {gpus.length === 0 && (
          <div className={styles.emptyState}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <h3>No Data Available</h3>
            <p>Performance data will appear here once a GPU is detected.</p>
          </div>
        )}
      </div>
    </div>
  );
}


