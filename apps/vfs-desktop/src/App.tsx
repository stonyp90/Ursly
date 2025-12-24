import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Header } from './components/Header';
import { FinderPage } from './pages/FinderPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeCustomizer } from './components/ThemeCustomizer';
import { ToastProvider } from './components/Toast';
import { ErrorDialogProvider } from './components/ErrorDialog';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);

  useEffect(() => {
    const initVfs = async () => {
      try {
        await invoke('vfs_init');
        setIsLoading(false);
      } catch (err) {
        console.warn('VFS init warning:', err);
        setIsLoading(false);
      }
    };

    initVfs();
  }, []);

  useEffect(() => {
    const handleDevToolsShortcut = async (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const shouldToggle = isMac
        ? e.metaKey && e.altKey && e.key.toLowerCase() === 'i'
        : e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i';

      if (shouldToggle) {
        e.preventDefault();
        try {
          await invoke('toggle_devtools');
        } catch (err) {
          console.error('Failed to toggle devtools:', err);
        }
      }
    };

    window.addEventListener('keydown', handleDevToolsShortcut);
    return () => window.removeEventListener('keydown', handleDevToolsShortcut);
  }, []);

  if (isLoading) {
    return (
      <div className="app loading">
        <div className="loader">
          <div className="loader-ring"></div>
          <span>Initializing Virtual File System...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app error">
        <div className="error-card">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorDialogProvider>
          <div className="app">
            <Header appName="Ursly VFS" tagline="VIRTUAL CLOUD FILE SYSTEM" />

            <main className="main-content full-height">
              <FinderPage />
            </main>

            <button
              className="floating-settings-btn"
              onClick={() => setIsThemeCustomizerOpen(true)}
              title="Customize Appearance"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>

            <ThemeCustomizer
              isOpen={isThemeCustomizerOpen}
              onClose={() => setIsThemeCustomizerOpen(false)}
            />
          </div>
        </ErrorDialogProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

