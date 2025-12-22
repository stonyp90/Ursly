import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { GpuWithMetrics } from '../types';

interface MetricsChartProps {
  gpu: GpuWithMetrics;
}

export function MetricsChart({ gpu }: MetricsChartProps) {
  const chartData = useMemo(() => {
    return gpu.history.map((m, i) => ({
      time: i,
      utilization: m.gpu_utilization,
      memory: m.memory_utilization,
      temperature: m.temperature_celsius ?? 0,
      power: m.power_usage_watts ?? 0,
    }));
  }, [gpu.history]);

  const CustomTooltip = ({ active, payload, label: _label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="chart-tooltip">
        <div className="tooltip-row">
          <span className="tooltip-label">GPU:</span>
          <span className="tooltip-value utilization">
            {payload[0]?.value?.toFixed(1)}%
          </span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Memory:</span>
          <span className="tooltip-value memory">
            {payload[1]?.value?.toFixed(1)}%
          </span>
        </div>
        {payload[2]?.value > 0 && (
          <div className="tooltip-row">
            <span className="tooltip-label">Temp:</span>
            <span className="tooltip-value temp">
              {payload[2]?.value?.toFixed(0)}°C
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="metrics-chart">
      <div className="chart-header">
        <h4>{gpu.info.name}</h4>
        <div className="chart-legend">
          <span className="legend-item utilization">
            <span className="legend-dot"></span>
            GPU Usage
          </span>
          <span className="legend-item memory">
            <span className="legend-dot"></span>
            Memory
          </span>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="utilizationGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={false}
            />

            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              tickFormatter={(v) => `${v}%`}
              width={40}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="utilization"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#utilizationGradient)"
              animationDuration={300}
            />

            <Area
              type="monotone"
              dataKey="memory"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#memoryGradient)"
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer">
        <span className="time-label">Last 2 minutes</span>
        <span className="update-indicator">
          <span className="pulse-dot small"></span>
          Live
        </span>
      </div>
    </div>
  );
}
