import { useState, useEffect, useMemo } from 'react';
import { isTauri, invokeTauri, listenTauri } from '../../lib/tauri';
import { GpuCard } from './GpuCard';
import { MetricsChart } from './MetricsChart';
import { SystemCard } from './SystemCard';
import type { AllMetrics, GpuMetricsEvent, SystemInfo } from './types';
import styles from './GpuMetrics.module.css';

export function GpuMetrics() {
  const [metrics, setMetrics] = useState<AllMetrics | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Safely check if running in Tauri (memoized to avoid re-checking)
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
      setError('GPU metrics are only available in the desktop app');
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
        console.error('Failed to fetch GPU metrics:', err);
        setError('Failed to connect to GPU monitoring service. Please ensure the desktop app is running correctly.');
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
      console.warn('Failed to setup GPU metrics listener:', err);
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

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loaderRing}></div>
          <span>Detecting GPUs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>GPU Metrics</h1>
          <p className={styles.subtitle}>Monitor your GPU performance in real-time</p>
        </div>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h2>Desktop App Required</h2>
          <p>GPU metrics monitoring requires the Ursly.io desktop application.</p>
          <p className={styles.errorHint}>
            Download the desktop app to access real-time GPU metrics, temperature monitoring, and power consumption data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>GPU Metrics</h1>
          <p className={styles.subtitle}>Real-time monitoring of your GPU performance</p>
        </div>
        {systemInfo && (
          <div className={styles.headerInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Host</span>
              <span className={styles.infoValue}>{systemInfo.hostname}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>OS</span>
              <span className={styles.infoValue}>{systemInfo.os_name} {systemInfo.os_version}</span>
            </div>
            <div className={styles.statusIndicator}>
              <span className={styles.statusDot}></span>
              <span>Connected</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.dashboardGrid}>
        {/* GPU Cards */}
        <section className={styles.gpuSection}>
          <h2 className={styles.sectionTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="2" x2="9" y2="4" />
              <line x1="15" y1="2" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="22" />
              <line x1="15" y1="20" x2="15" y2="22" />
              <line x1="2" y1="9" x2="4" y2="9" />
              <line x1="2" y1="15" x2="4" y2="15" />
              <line x1="20" y1="9" x2="22" y2="9" />
              <line x1="20" y1="15" x2="22" y2="15" />
            </svg>
            GPU Metrics
          </h2>
          
          {metrics?.gpus.map((gpu) => (
            <GpuCard key={gpu.info.id} gpu={gpu} />
          ))}
          
          {metrics?.gpus.length === 0 && (
            <div className={styles.noGpuCard}>
              <p>No GPU detected. Make sure GPU drivers are installed.</p>
            </div>
          )}
        </section>

        {/* Charts Section */}
        <section className={styles.chartsSection}>
          <h2 className={styles.sectionTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Performance Timeline
          </h2>
          
          {metrics?.gpus.map((gpu) => (
            <MetricsChart key={gpu.info.id} gpu={gpu} />
          ))}
        </section>

        {/* System Card */}
        <aside className={styles.sidebar}>
          <SystemCard metrics={metrics?.system} info={systemInfo} />
        </aside>
      </div>
    </div>
  );
}

