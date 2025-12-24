import { Logo } from './Logo';
import type { AppTab } from '../App';
import './Header.css';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-brand">
        <Logo size={28} />
        <div className="brand-text">
          <h1>Ursly</h1>
          <span className="brand-tagline">VIRTUAL CLOUD FILE SYSTEM</span>
        </div>
      </div>

      <nav className="header-tabs">
        <button
          className={`header-tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => onTabChange('files')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span>Files</span>
        </button>
        <button
          className={`header-tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => onTabChange('metrics')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>Metrics</span>
        </button>
      </nav>

      <div className="header-info">
        <div className="status-indicator online">
          <span className="status-dot"></span>
          <span>Connected</span>
        </div>
      </div>
    </header>
  );
}
