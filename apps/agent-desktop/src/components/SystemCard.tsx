import type { SystemMetrics, SystemInfo } from '../types';

interface SystemCardProps {
  metrics: SystemMetrics | undefined;
  info: SystemInfo | null;
}

export function SystemCard({ metrics, info }: SystemCardProps) {
  if (!metrics || !info) return null;

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="system-card">
      <div className="card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <h3>System Resources</h3>
      </div>

      <div className="system-metrics">
        {/* CPU */}
        <div className="system-metric">
          <div className="metric-row">
            <span className="metric-label">CPU</span>
            <span className="metric-value">{metrics.cpu_usage.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill cpu"
              style={{ width: `${metrics.cpu_usage}%` }}
            />
          </div>
          <div className="cpu-cores">
            {metrics.per_core_usage.slice(0, 8).map((usage, i) => (
              <div key={i} className="core-bar">
                <div 
                  className="core-fill"
                  style={{ height: `${usage}%` }}
                />
              </div>
            ))}
            {metrics.per_core_usage.length > 8 && (
              <span className="more-cores">+{metrics.per_core_usage.length - 8}</span>
            )}
          </div>
        </div>

        {/* Memory */}
        <div className="system-metric">
          <div className="metric-row">
            <span className="metric-label">Memory</span>
            <span className="metric-value">
              {(metrics.memory_used_mb / 1024).toFixed(1)} / {(metrics.memory_total_mb / 1024).toFixed(1)} GB
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill memory"
              style={{ width: `${metrics.memory_usage_percent}%` }}
            />
          </div>
        </div>

        {/* Swap */}
        {metrics.swap_total_mb > 0 && (
          <div className="system-metric small">
            <div className="metric-row">
              <span className="metric-label">Swap</span>
              <span className="metric-value">
                {(metrics.swap_used_mb / 1024).toFixed(1)} / {(metrics.swap_total_mb / 1024).toFixed(1)} GB
              </span>
            </div>
          </div>
        )}

        {/* Network */}
        <div className="system-metric network">
          <div className="metric-row">
            <span className="metric-label">Network</span>
          </div>
          <div className="network-stats">
            <div className="network-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <span>{formatBytes(metrics.network_rx_bytes_sec)}/s</span>
            </div>
            <div className="network-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              <span>{formatBytes(metrics.network_tx_bytes_sec)}/s</span>
            </div>
          </div>
        </div>

        {/* Load Average */}
        <div className="system-metric load">
          <div className="metric-row">
            <span className="metric-label">Load Average</span>
          </div>
          <div className="load-values">
            <span>{metrics.load_average[0].toFixed(2)}</span>
            <span>{metrics.load_average[1].toFixed(2)}</span>
            <span>{metrics.load_average[2].toFixed(2)}</span>
          </div>
        </div>

        {/* Uptime */}
        <div className="system-metric uptime">
          <div className="metric-row">
            <span className="metric-label">Uptime</span>
            <span className="metric-value">{formatUptime(metrics.uptime_seconds)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

