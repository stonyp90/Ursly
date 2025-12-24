/**
 * MetricsPage - Full metrics dashboard
 * Shows comprehensive system and GPU metrics with expandable sections
 */
import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './MetricsPage.css';

// Types matching Rust backend
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
}

interface SystemMetrics {
  cpu_usage: number;
  memory_used_mb: number;
  memory_total_mb: number;
  memory_usage_percent: number;
  disk_read_bytes_sec: number;
  disk_write_bytes_sec: number;
  network_rx_bytes_sec: number;
  network_tx_bytes_sec: number;
}

interface GpuWithMetrics {
  info: GpuInfo;
  current: GpuMetrics;
}

interface AllMetrics {
  gpus: GpuWithMetrics[];
  system: SystemMetrics;
}

// Helper functions
const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes.toFixed(0)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatThroughput = (bytesPerSec: number) => `${formatBytes(bytesPerSec)}/s`;

const calculateIOPS = (bytesPerSec: number) => Math.round(bytesPerSec / 4096);

const getUsageColor = (value: number) => {
  if (value < 50) return 'var(--success)';
  if (value < 80) return 'var(--warning)';
  return 'var(--error)';
};

// Sparkline component
const Sparkline = ({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) => {
  if (data.length < 2) return <div className="sparkline-empty" style={{ height }} />;
  const max = Math.max(...data, 1);
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(' ');
  return (
    <svg className="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
};

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultExpanded = true }: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`metrics-section ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button className="section-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="section-title">
          <span className="section-icon">{icon}</span>
          <span>{title}</span>
        </div>
        <svg
          className="chevron"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points={isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
        </svg>
      </button>
      {isExpanded && <div className="section-content">{children}</div>}
    </div>
  );
}

export function MetricsPage() {
  const [metrics, setMetrics] = useState<AllMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<{
    cpu: number[];
    gpu: number[];
    diskRead: number[];
    diskWrite: number[];
    netRx: number[];
    netTx: number[];
    memory: number[];
    gpuMemory: number[];
  }>({
    cpu: [],
    gpu: [],
    diskRead: [],
    diskWrite: [],
    netRx: [],
    netTx: [],
    memory: [],
    gpuMemory: [],
  });

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await invoke<AllMetrics>('get_all_metrics');
      setMetrics(data);
      setError(null);

      // Update historical data (keep last 60 samples = 2 min at 2s interval)
      setHistoricalData((prev) => ({
        cpu: [...prev.cpu.slice(-59), data.system.cpu_usage],
        gpu: [...prev.gpu.slice(-59), data.gpus[0]?.current.gpu_utilization ?? 0],
        diskRead: [...prev.diskRead.slice(-59), data.system.disk_read_bytes_sec],
        diskWrite: [...prev.diskWrite.slice(-59), data.system.disk_write_bytes_sec],
        netRx: [...prev.netRx.slice(-59), data.system.network_rx_bytes_sec],
        netTx: [...prev.netTx.slice(-59), data.system.network_tx_bytes_sec],
        memory: [...prev.memory.slice(-59), data.system.memory_usage_percent],
        gpuMemory: [...prev.gpuMemory.slice(-59), data.gpus[0]?.current.memory_utilization ?? 0],
      }));
    } catch (err) {
      setError('Failed to fetch metrics');
      console.error('Metrics error:', err);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (error) {
    return (
      <div className="metrics-page">
        <div className="metrics-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="metrics-page">
        <div className="metrics-loading">
          <div className="loader-ring"></div>
          <span>Loading metrics...</span>
        </div>
      </div>
    );
  }

  const totalDiskThroughput = metrics.system.disk_read_bytes_sec + metrics.system.disk_write_bytes_sec;
  const totalNetThroughput = metrics.system.network_rx_bytes_sec + metrics.system.network_tx_bytes_sec;
  const totalDiskIOPS = calculateIOPS(totalDiskThroughput);

  return (
    <div className="metrics-page">
      {/* Summary Bar */}
      <div className="metrics-summary-bar">
        <div className="summary-item">
          <span className="summary-label">CPU</span>
          <span className="summary-value" style={{ color: getUsageColor(metrics.system.cpu_usage) }}>
            {metrics.system.cpu_usage.toFixed(0)}%
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Memory</span>
          <span className="summary-value" style={{ color: getUsageColor(metrics.system.memory_usage_percent) }}>
            {metrics.system.memory_usage_percent.toFixed(0)}%
          </span>
        </div>
        {metrics.gpus[0] && (
          <div className="summary-item">
            <span className="summary-label">GPU</span>
            <span className="summary-value" style={{ color: getUsageColor(metrics.gpus[0].current.gpu_utilization) }}>
              {metrics.gpus[0].current.gpu_utilization.toFixed(0)}%
            </span>
          </div>
        )}
        <div className="summary-item">
          <span className="summary-label">Disk I/O</span>
          <span className="summary-value">{formatThroughput(totalDiskThroughput)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Network</span>
          <span className="summary-value">{formatThroughput(totalNetThroughput)}</span>
        </div>
      </div>

      <div className="metrics-grid">
        {/* CPU Section */}
        <CollapsibleSection
          title="CPU"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <line x1="9" y1="1" x2="9" y2="4" />
              <line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" />
              <line x1="15" y1="20" x2="15" y2="23" />
            </svg>
          }
        >
          <div className="metric-card large">
            <div className="metric-header">
              <span className="metric-label">Usage</span>
              <span className="metric-value" style={{ color: getUsageColor(metrics.system.cpu_usage) }}>
                {metrics.system.cpu_usage.toFixed(1)}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${metrics.system.cpu_usage}%`,
                  backgroundColor: getUsageColor(metrics.system.cpu_usage),
                }}
              />
            </div>
            <div className="sparkline-container">
              <Sparkline data={historicalData.cpu} color="var(--primary)" height={60} />
              <span className="sparkline-label">Last 2 minutes</span>
            </div>
          </div>
        </CollapsibleSection>

        {/* Memory Section */}
        <CollapsibleSection
          title="Memory"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" />
            </svg>
          }
        >
          <div className="metric-card large">
            <div className="metric-header">
              <span className="metric-label">RAM Usage</span>
              <span className="metric-value">
                {(metrics.system.memory_used_mb / 1024).toFixed(1)} / {(metrics.system.memory_total_mb / 1024).toFixed(0)} GB
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill gradient"
                style={{ width: `${metrics.system.memory_usage_percent}%` }}
              />
            </div>
            <div className="sparkline-container">
              <Sparkline data={historicalData.memory} color="var(--secondary)" height={60} />
              <span className="sparkline-label">Last 2 minutes</span>
            </div>
            <div className="metric-details">
              <div className="detail-item">
                <span className="detail-label">Used</span>
                <span className="detail-value">{(metrics.system.memory_used_mb / 1024).toFixed(2)} GB</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Available</span>
                <span className="detail-value">
                  {((metrics.system.memory_total_mb - metrics.system.memory_used_mb) / 1024).toFixed(2)} GB
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total</span>
                <span className="detail-value">{(metrics.system.memory_total_mb / 1024).toFixed(0)} GB</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* GPU Section */}
        {metrics.gpus.map((gpu) => (
          <CollapsibleSection
            key={gpu.info.id}
            title={gpu.info.name}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <rect x="9" y="9" width="6" height="6" />
              </svg>
            }
          >
            <div className="metric-card large">
              <div className="metric-row-grid">
                <div>
                  <div className="metric-header">
                    <span className="metric-label">Utilization</span>
                    <span className="metric-value" style={{ color: getUsageColor(gpu.current.gpu_utilization) }}>
                      {gpu.current.gpu_utilization.toFixed(0)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${gpu.current.gpu_utilization}%`,
                        backgroundColor: getUsageColor(gpu.current.gpu_utilization),
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="metric-header">
                    <span className="metric-label">VRAM</span>
                    <span className="metric-value">
                      {(gpu.current.memory_used_mb / 1024).toFixed(1)} / {(gpu.current.memory_total_mb / 1024).toFixed(0)} GB
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill gradient"
                      style={{ width: `${gpu.current.memory_utilization}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="sparkline-container">
                <Sparkline data={historicalData.gpu} color="var(--primary)" height={60} />
                <span className="sparkline-label">GPU Utilization - Last 2 minutes</span>
              </div>
              <div className="metric-details">
                <div className="detail-item">
                  <span className="detail-label">Vendor</span>
                  <span className="detail-value">{gpu.info.vendor}</span>
                </div>
                {gpu.current.temperature_celsius !== null && (
                  <div className="detail-item">
                    <span className="detail-label">Temperature</span>
                    <span
                      className="detail-value"
                      style={{
                        color:
                          gpu.current.temperature_celsius > 80
                            ? 'var(--error)'
                            : gpu.current.temperature_celsius > 60
                            ? 'var(--warning)'
                            : 'var(--success)',
                      }}
                    >
                      {gpu.current.temperature_celsius.toFixed(0)}°C
                    </span>
                  </div>
                )}
                {gpu.current.power_usage_watts !== null && (
                  <div className="detail-item">
                    <span className="detail-label">Power Draw</span>
                    <span className="detail-value">{gpu.current.power_usage_watts.toFixed(0)}W</span>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>
        ))}

        {/* Disk I/O Section */}
        <CollapsibleSection
          title="Disk I/O"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          }
        >
          <div className="metric-card large">
            <div className="io-grid">
              <div className="io-item read">
                <div className="io-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="7 10 12 5 17 10" />
                    <line x1="12" y1="5" x2="12" y2="19" />
                  </svg>
                </div>
                <div className="io-details">
                  <span className="io-label">Read</span>
                  <span className="io-value">{formatThroughput(metrics.system.disk_read_bytes_sec)}</span>
                  <span className="io-iops">{calculateIOPS(metrics.system.disk_read_bytes_sec)} IOPS</span>
                </div>
              </div>
              <div className="io-item write">
                <div className="io-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="17 14 12 19 7 14" />
                    <line x1="12" y1="19" x2="12" y2="5" />
                  </svg>
                </div>
                <div className="io-details">
                  <span className="io-label">Write</span>
                  <span className="io-value">{formatThroughput(metrics.system.disk_write_bytes_sec)}</span>
                  <span className="io-iops">{calculateIOPS(metrics.system.disk_write_bytes_sec)} IOPS</span>
                </div>
              </div>
            </div>
            <div className="sparkline-row">
              <div className="sparkline-container">
                <Sparkline data={historicalData.diskRead} color="var(--success)" height={50} />
                <span className="sparkline-label">Read Throughput</span>
              </div>
              <div className="sparkline-container">
                <Sparkline data={historicalData.diskWrite} color="var(--warning)" height={50} />
                <span className="sparkline-label">Write Throughput</span>
              </div>
            </div>
            <div className="metric-details">
              <div className="detail-item">
                <span className="detail-label">Total IOPS</span>
                <span className="detail-value">{totalDiskIOPS}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Throughput</span>
                <span className="detail-value">{formatThroughput(totalDiskThroughput)}</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Network Section */}
        <CollapsibleSection
          title="Network"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <circle cx="12" cy="20" r="1" />
            </svg>
          }
        >
          <div className="metric-card large">
            <div className="io-grid">
              <div className="io-item download">
                <div className="io-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="17 14 12 19 7 14" />
                    <line x1="12" y1="19" x2="12" y2="5" />
                  </svg>
                </div>
                <div className="io-details">
                  <span className="io-label">Download</span>
                  <span className="io-value">{formatThroughput(metrics.system.network_rx_bytes_sec)}</span>
                </div>
              </div>
              <div className="io-item upload">
                <div className="io-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="7 10 12 5 17 10" />
                    <line x1="12" y1="5" x2="12" y2="19" />
                  </svg>
                </div>
                <div className="io-details">
                  <span className="io-label">Upload</span>
                  <span className="io-value">{formatThroughput(metrics.system.network_tx_bytes_sec)}</span>
                </div>
              </div>
            </div>
            <div className="sparkline-row">
              <div className="sparkline-container">
                <Sparkline data={historicalData.netRx} color="var(--primary)" height={50} />
                <span className="sparkline-label">Download</span>
              </div>
              <div className="sparkline-container">
                <Sparkline data={historicalData.netTx} color="var(--secondary)" height={50} />
                <span className="sparkline-label">Upload</span>
              </div>
            </div>
            <div className="metric-details">
              <div className="detail-item">
                <span className="detail-label">Total Throughput</span>
                <span className="detail-value">{formatThroughput(totalNetThroughput)}</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

export default MetricsPage;

