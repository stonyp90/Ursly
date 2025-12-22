import type { SystemInfo } from '../types';

interface HeaderProps {
  systemInfo: SystemInfo | null;
}

export function Header({ systemInfo }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-brand">
        <div className="logo">
          <svg viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="28" height="28" rx="6" fill="url(#logo-gradient)" />
            <path
              d="M10 16L14 20L22 12"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="brand-text">
          <h1>Ursly.io</h1>
          <span className="tagline">GPU Metrics Monitor</span>
        </div>
      </div>

      <div className="header-info">
        {systemInfo && (
          <>
            <div className="info-item">
              <span className="info-label">Host</span>
              <span className="info-value">{systemInfo.hostname}</span>
            </div>
            <div className="info-item">
              <span className="info-label">OS</span>
              <span className="info-value">{systemInfo.os_name} {systemInfo.os_version}</span>
            </div>
            <div className="info-item">
              <span className="info-label">CPU</span>
              <span className="info-value">{systemInfo.cpu_cores} cores</span>
            </div>
          </>
        )}
        
        <div className="status-indicator online">
          <span className="status-dot"></span>
          <span>Connected</span>
        </div>
      </div>
    </header>
  );
}

