import { MetricsChart } from '../components/MetricsChart';
import type { GpuWithMetrics } from '../types';

interface PerformanceTimelinePageProps {
  gpus: GpuWithMetrics[];
}

export function PerformanceTimelinePage({ gpus }: PerformanceTimelinePageProps) {
  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Performance Timeline</h2>
        <p className="page-description">Historical view of GPU utilization and memory usage over time</p>
      </div>

      <div className="charts-grid">
        {gpus.map((gpu) => (
          <MetricsChart key={gpu.info.id} gpu={gpu} />
        ))}

        {gpus.length === 0 && (
          <div className="no-gpu-card">
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <h3>No Data Available</h3>
              <p>Performance data will appear here once a GPU is detected.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


