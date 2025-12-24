import { Logo } from './Logo';

export function Header() {
  return (
    <header className="header">
      <div className="header-brand">
        <Logo size={28} />
        <div className="brand-text">
          <h1>Ursly</h1>
          <span className="brand-tagline">VIRTUAL CLOUD FILE SYSTEM</span>
        </div>
      </div>

      <div className="header-info">
        <div className="status-indicator online">
          <span className="status-dot"></span>
          <span>Connected</span>
        </div>
      </div>
    </header>
  );
}
