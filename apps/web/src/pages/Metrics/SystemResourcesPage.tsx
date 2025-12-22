import { useMetrics } from './MetricsContext';
import { SystemCard } from '../GpuMetrics/SystemCard';
import styles from './Metrics.module.css';

export function SystemResourcesPage() {
  const { metrics, systemInfo, processes } = useMetrics();

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h2>System Resources</h2>
        <p>CPU, memory, network, and process monitoring</p>
      </div>

      <div className={styles.systemGrid}>
        <div className={styles.systemMain}>
          <SystemCard metrics={metrics?.system} info={systemInfo} />
        </div>

        {processes.length > 0 && (
          <div className={styles.processesCard}>
            <div className={styles.cardHeader}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6" y2="6" />
                <line x1="6" y1="18" x2="6" y2="18" />
              </svg>
              <h3>AI/ML Processes</h3>
            </div>
            <div className={styles.processList}>
              {processes.map((process) => (
                <div key={process.pid} className={styles.processItem}>
                  <div className={styles.processInfo}>
                    <span className={styles.processName}>{process.name}</span>
                    <span className={styles.processPid}>PID: {process.pid}</span>
                  </div>
                  <div className={styles.processStats}>
                    <div className={styles.stat}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                      </svg>
                      <span>{process.cpu_usage.toFixed(1)}%</span>
                    </div>
                    <div className={styles.stat}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="20" rx="2" />
                        <path d="M7 2v20M17 2v20" />
                      </svg>
                      <span>{formatBytes(process.memory_mb * 1024 * 1024)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disk I/O Card */}
        {metrics?.system && (
          <div className={styles.ioCard}>
            <div className={styles.cardHeader}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
              <h3>Disk I/O</h3>
            </div>
            <div className={styles.ioStats}>
              <div className={styles.ioItem}>
                <div className={styles.ioLabel}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span>Read</span>
                </div>
                <span className={styles.ioValue}>{formatBytes(metrics.system.disk_read_bytes_sec)}/s</span>
              </div>
              <div className={styles.ioItem}>
                <div className={styles.ioLabel}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  <span>Write</span>
                </div>
                <span className={styles.ioValue}>{formatBytes(metrics.system.disk_write_bytes_sec)}/s</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


