/**
 * BottomToolbar - Clean floating action bar
 * Inspired by Linear, Raycast, and Arc browser
 */
import { KeyboardShortcutHelper } from '../KeyboardShortcutHelper';
import './BottomToolbar.css';

interface BottomToolbarProps {
  onOpenShortcuts: () => void;
  onOpenSearch?: () => void;
  isShortcutsOpen: boolean;
  onCloseShortcuts: () => void;
}

export function BottomToolbar({
  onOpenShortcuts,
  onOpenSearch,
  isShortcutsOpen,
  onCloseShortcuts,
}: BottomToolbarProps) {
  return (
    <>
      <div className="bottom-toolbar">
        <button
          className="action-pill shortcuts"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (Press ?)"
        >
          <div className="pill-glow" />
          <svg
            className="pill-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <path
              d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M8 12h.01M12 12h.01M16 12h.01"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="7"
              y1="16"
              x2="17"
              y2="16"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="pill-label">Shortcuts</span>
        </button>

        {onOpenSearch && (
          <>
            <div className="action-divider" />
            <button
              className="action-pill search"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenSearch();
              }}
              title="Search Files (Cmd+K / Ctrl+K)"
              type="button"
            >
              <div className="pill-glow" />
              <svg
                className="pill-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span className="pill-label">Search</span>
            </button>
          </>
        )}
      </div>

      <KeyboardShortcutHelper
        isOpen={isShortcutsOpen}
        onClose={onCloseShortcuts}
      />
    </>
  );
}

export default BottomToolbar;
