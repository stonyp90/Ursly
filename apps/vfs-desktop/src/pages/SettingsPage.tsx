/**
 * SettingsPage - Full-page settings view
 * Displays theme customization and app settings
 */
import { useEffect, useState } from 'react';
import { useTheme, themeColors, ThemeColorKey } from '../contexts/ThemeContext';
import {
  startOnboardingTour,
  resetOnboardingTour,
} from '../components/OnboardingTour';
import { OperationHistory } from '../components/OperationHistory';
import './SettingsPage.css';

interface SettingsPageProps {
  onClose?: () => void;
}

const colorDisplayNames: Record<ThemeColorKey, string> = {
  cyan: 'Cyan',
  purple: 'Purple',
  neonCyan: 'Neon Cyan',
  neonMagenta: 'Neon Magenta',
  electricPurple: 'Electric Purple',
  neonGreen: 'Neon Green',
  sunsetOrange: 'Sunset Orange',
  electricBlue: 'Electric Blue',
  cyberYellow: 'Cyber Yellow',
  neonRed: 'Neon Red',
};

export function SettingsPage({ onClose }: SettingsPageProps) {
  const { mode, toggleMode, colorKey, setColorKey } = useTheme();
  const [activeTab, setActiveTab] = useState<
    'settings' | 'history' | 'organization'
  >('settings');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button
            className={`settings-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Operation History
          </button>
          <button
            className={`settings-tab ${activeTab === 'organization' ? 'active' : ''}`}
            onClick={() => setActiveTab('organization')}
          >
            Organization Audit
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'settings' && (
            <>
              {/* Mode Toggle */}
              <div className="settings-section">
                <h2>Theme Mode</h2>
                <div className="mode-toggle">
                  <button
                    className={`mode-btn ${mode === 'dark' ? 'active' : ''}`}
                    onClick={() => mode !== 'dark' && toggleMode()}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    <span>Dark</span>
                  </button>
                  <button
                    className={`mode-btn ${mode === 'light' ? 'active' : ''}`}
                    onClick={() => mode !== 'light' && toggleMode()}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                    <span>Light</span>
                  </button>
                </div>
              </div>

              {/* Accent Colors */}
              <div className="settings-section">
                <h2>Accent Color</h2>
                <div className="color-grid">
                  {(Object.keys(themeColors) as ThemeColorKey[]).map((key) => (
                    <button
                      key={key}
                      className={`color-swatch ${colorKey === key ? 'active' : ''}`}
                      onClick={() => setColorKey(key)}
                      style={
                        {
                          '--swatch-color': themeColors[key].primary,
                          '--swatch-secondary': themeColors[key].secondary,
                        } as React.CSSProperties
                      }
                      title={colorDisplayNames[key]}
                    >
                      <div className="swatch-inner" />
                      {colorKey === key && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="check-icon"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                <p className="selected-color">{colorDisplayNames[colorKey]}</p>
              </div>

              {/* Preview */}
              <div className="settings-section">
                <h2>Preview</h2>
                <div className="theme-preview">
                  <div className="preview-sidebar">
                    <div className="preview-item active" />
                    <div className="preview-item" />
                    <div className="preview-item" />
                  </div>
                  <div className="preview-content">
                    <div className="preview-toolbar" />
                    <div className="preview-grid">
                      <div className="preview-file" />
                      <div className="preview-file selected" />
                      <div className="preview-file" />
                      <div className="preview-file" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Log */}
              <div className="settings-section">
                <h2>Operations Audit</h2>
                <div className="tour-buttons">
                  <button
                    className="tour-btn"
                    onClick={() => {
                      // Open audit page - will be handled by parent component
                      if (onClose) onClose();
                      // Trigger audit page open via custom event
                      window.dispatchEvent(new CustomEvent('open-audit-page'));
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 12h6m-3-3v6" />
                      <path d="M21 12c0 1.66-1.34 3-3 3H6c-1.66 0-3-1.34-3-3s1.34-3 3-3h12c1.66 0 3 1.34 3 3z" />
                      <path d="M3 12h1m17 0h1" />
                    </svg>
                    <span>View Audit Log</span>
                  </button>
                </div>
                <p className="tour-description">
                  View operation history and audit logs for user and
                  organization activities. Track uploads, downloads, deletes,
                  and other file operations.
                </p>
              </div>

              {/* Onboarding Tour */}
              <div className="settings-section">
                <h2>Onboarding</h2>
                <div className="tour-buttons">
                  <button
                    className="tour-btn"
                    onClick={() => {
                      startOnboardingTour();
                      if (onClose) onClose();
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span>Start Feature Tour</span>
                  </button>
                  <button
                    className="tour-btn secondary"
                    onClick={() => {
                      resetOnboardingTour();
                      if (onClose) onClose();
                    }}
                    title="Reset onboarding tour (will show on next app start)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                      <path d="M3 21v-5h5" />
                    </svg>
                    <span>Reset</span>
                  </button>
                </div>
                <p className="tour-description">
                  Take a quick tour to learn about Ursly VFS features and
                  keyboard shortcuts. Use "Reset" if you want to see it again on
                  next app start.
                </p>
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="settings-section-full">
              <OperationHistory limit={500} />
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="settings-section-full">
              <div className="organization-audit-placeholder">
                <div className="placeholder-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h2>Organization Audit</h2>
                <p className="placeholder-description">
                  Organization operation history and audit logs will be
                  available here.
                </p>
                <div className="placeholder-badge">
                  <span>Under Development</span>
                </div>
                <p className="placeholder-details">
                  This feature will allow organization administrators to view
                  and audit all operations performed by team members across
                  shared storage resources. It will include filtering, search,
                  and export capabilities.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
