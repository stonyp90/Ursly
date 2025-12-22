import { SystemCard } from '../components/SystemCard';
import type { SystemMetrics, SystemInfo, ProcessInfo } from '../types';

interface SystemResourcesPageProps {
  metrics: SystemMetrics | undefined;
  info: SystemInfo | null;
  processes: ProcessInfo[];
}

export function SystemResourcesPage({ metrics, info, processes }: SystemResourcesPageProps) {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>System Resources</h2>
        <p className="page-description">CPU, memory, network, and process monitoring</p>
      </div>

      <div className="system-grid">
        <div className="system-main">
          <SystemCard metrics={metrics} info={info} />
        </div>

        {processes.length > 0 && (
          <div className="processes-card">
            <div className="card-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6" y2="6" />
                <line x1="6" y1="18" x2="6" y2="18" />
              </svg>
              <h3>AI/ML Processes</h3>
            </div>
            <div className="process-list">
              {processes.map((process) => (
                <div key={process.pid} className="process-item">
                  <div className="process-info">
                    <span className="process-name">{process.name}</span>
                    <span className="process-pid">PID: {process.pid}</span>
                  </div>
                  <div className="process-stats">
                    <div className="stat">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                      </svg>
                      <span>{process.cpu_usage.toFixed(1)}%</span>
                    </div>
                    <div className="stat">
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
        {metrics && (
          <div className="io-card">
            <div className="card-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
              <h3>Disk I/O</h3>
            </div>
            <div className="io-stats">
              <div className="io-item">
                <div className="io-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span>Read</span>
                </div>
                <span className="io-value">{formatBytes(metrics.disk_read_bytes_sec)}/s</span>
              </div>
              <div className="io-item">
                <div className="io-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  <span>Write</span>
                </div>
                <span className="io-value">{formatBytes(metrics.disk_write_bytes_sec)}/s</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


