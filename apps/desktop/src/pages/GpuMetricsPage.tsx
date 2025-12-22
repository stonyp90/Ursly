import { GpuCard } from '../components/GpuCard';
import type { GpuWithMetrics } from '../types';

interface GpuMetricsPageProps {
  gpus: GpuWithMetrics[];
}

export function GpuMetricsPage({ gpus }: GpuMetricsPageProps) {
  return (
    <div className="page-content">
      <div className="page-header">
        <h2>GPU Metrics</h2>
        <p className="page-description">Real-time monitoring of GPU utilization, memory, temperature, and power consumption</p>
      </div>

      <div className="gpu-grid">
        {gpus.map((gpu) => (
          <GpuCard key={gpu.info.id} gpu={gpu} />
        ))}

        {gpus.length === 0 && (
          <div className="no-gpu-card">
            <div className="empty-state">
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
          </div>
        )}
      </div>
    </div>
  );
}


