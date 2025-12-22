import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { isTauri, invokeTauri, listenTauri } from '../../lib/tauri';
import type { AllMetrics, GpuMetricsEvent, SystemInfo, ProcessInfo } from '../GpuMetrics/types';

interface MetricsContextValue {
  metrics: AllMetrics | null;
  systemInfo: SystemInfo | null;
  processes: ProcessInfo[];
  isLoading: boolean;
  error: string | null;
  isDesktopApp: boolean;
}

const MetricsContext = createContext<MetricsContextValue | null>(null);

export function MetricsProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<AllMetrics | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDesktopApp = useMemo(() => {
    try {
      return isTauri();
    } catch {
      return false;
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    if (!isDesktopApp) {
      setError('Metrics are only available in the desktop app');
      setIsLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        const [allMetrics, sysInfo] = await Promise.all([
          invokeTauri<AllMetrics>('get_all_metrics'),
          invokeTauri<SystemInfo>('get_system_info'),
        ]);
        setMetrics(allMetrics);
        setSystemInfo(sysInfo);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
        setError('Failed to connect to monitoring service. Please ensure the desktop app is running correctly.');
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [isDesktopApp]);

  // Listen for real-time GPU metrics updates
  useEffect(() => {
    if (!isDesktopApp) return;

    let cleanup: (() => void) | undefined;

    listenTauri<GpuMetricsEvent>('gpu-metrics', (event) => {
      setMetrics((prev) => {
        if (!prev) return prev;

        const updatedGpus = prev.gpus.map((gpu) => {
          if (gpu.info.id === event.gpu_id) {
            return {
              ...gpu,
              current: event.metrics,
              history: [...gpu.history.slice(-119), event.metrics],
            };
          }
          return gpu;
        });

        return { ...prev, gpus: updatedGpus };
      });
    }).then((fn) => {
      cleanup = fn;
    }).catch((err) => {
      console.warn('Failed to setup metrics listener:', err);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [isDesktopApp]);

  // Poll for system metrics every 2 seconds
  useEffect(() => {
    if (!isDesktopApp) return;

    const interval = setInterval(async () => {
      try {
        const allMetrics = await invokeTauri<AllMetrics>('get_all_metrics');
        setMetrics((prev) => ({
          ...allMetrics,
          gpus: prev?.gpus || allMetrics.gpus,
        }));
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isDesktopApp]);

  const value: MetricsContextValue = {
    metrics,
    systemInfo,
    processes: metrics?.model_processes || [],
    isLoading,
    error,
    isDesktopApp,
  };

  return (
    <MetricsContext.Provider value={value}>
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetrics() {
  const context = useContext(MetricsContext);
  if (!context) {
    throw new Error('useMetrics must be used within a MetricsProvider');
  }
  return context;
}


