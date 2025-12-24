/**
 * BottomToolbar - Redesigned action bar
 * Contains keyboard shortcuts and settings with prominent themed buttons
 */
import { KeyboardShortcutHelper } from '../KeyboardShortcutHelper';
import './BottomToolbar.css';

interface BottomToolbarProps {
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  isShortcutsOpen: boolean;
  onCloseShortcuts: () => void;
}

export function BottomToolbar({
  onOpenSettings,
  onOpenShortcuts,
  isShortcutsOpen,
  onCloseShortcuts,
}: BottomToolbarProps) {
  return (
    <>
      <div className="bottom-toolbar">
        <div className="toolbar-section left">
          <span className="toolbar-hint">
            Press <kbd>?</kbd> for shortcuts
          </span>
        </div>

        <div className="toolbar-section right">
          <button
            className="action-btn shortcuts-btn"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts"
          >
            <div className="action-btn-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2" y="4" width="20" height="16" rx="3" ry="3" />
                <line x1="6" y1="8" x2="6.01" y2="8" strokeWidth="2" strokeLinecap="round" />
                <line x1="10" y1="8" x2="10.01" y2="8" strokeWidth="2" strokeLinecap="round" />
                <line x1="14" y1="8" x2="14.01" y2="8" strokeWidth="2" strokeLinecap="round" />
                <line x1="18" y1="8" x2="18.01" y2="8" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="12" x2="8.01" y2="12" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="12" x2="12.01" y2="12" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="12" x2="16.01" y2="12" strokeWidth="2" strokeLinecap="round" />
                <line x1="7" y1="16" x2="17" y2="16" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="action-btn-label">Shortcuts</span>
          </button>

          <button
            className="action-btn settings-btn"
            onClick={onOpenSettings}
            title="Settings"
          >
            <div className="action-btn-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <span className="action-btn-label">Settings</span>
          </button>
        </div>
      </div>

      <KeyboardShortcutHelper isOpen={isShortcutsOpen} onClose={onCloseShortcuts} />
    </>
  );
}

export default BottomToolbar;
