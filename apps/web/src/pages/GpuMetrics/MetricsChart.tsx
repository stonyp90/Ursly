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
import type { GpuWithMetrics } from './types';
import styles from './GpuMetrics.module.css';

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

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value?: number }> }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className={styles.chartTooltip}>
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>GPU:</span>
          <span className={`${styles.tooltipValue} ${styles.tooltipUtilization}`}>
            {payload[0]?.value?.toFixed(1)}%
          </span>
        </div>
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>Memory:</span>
          <span className={`${styles.tooltipValue} ${styles.tooltipMemory}`}>
            {payload[1]?.value?.toFixed(1)}%
          </span>
        </div>
        {payload[2]?.value && payload[2].value > 0 && (
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Temp:</span>
            <span className={`${styles.tooltipValue} ${styles.tooltipTemp}`}>
              {payload[2]?.value?.toFixed(0)}°C
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.metricsChart}>
      <div className={styles.chartHeader}>
        <h4>{gpu.info.name}</h4>
        <div className={styles.chartLegend}>
          <span className={`${styles.legendItem} ${styles.legendUtilization}`}>
            <span className={styles.legendDot}></span>
            GPU Usage
          </span>
          <span className={`${styles.legendItem} ${styles.legendMemory}`}>
            <span className={styles.legendDot}></span>
            Memory
          </span>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="utilizationGradient" x1="0" y1="0" x2="0" y2="1">
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

      <div className={styles.chartFooter}>
        <span className={styles.timeLabel}>Last 2 minutes</span>
        <span className={styles.updateIndicator}>
          <span className={styles.pulseDot}></span>
          Live
        </span>
      </div>
    </div>
  );
}

