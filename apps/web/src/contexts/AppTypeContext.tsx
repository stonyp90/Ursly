/**
 * AppTypeContext - Detects whether running in Agent Desktop, VFS Desktop, or Web
 *
 * Used to conditionally show/hide features based on the deployment context.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

type AppType = 'web' | 'agent' | 'vfs';

interface AppTypeContextValue {
  appType: AppType;
  isAgentDesktop: boolean;
  isVfsDesktop: boolean;
  isTauri: boolean;
}

const AppTypeContext = createContext<AppTypeContextValue>({
  appType: 'web',
  isAgentDesktop: false,
  isVfsDesktop: false,
  isTauri: false,
});

export function AppTypeProvider({ children }: { children: ReactNode }) {
  // Synchronous initial check based on window title
  const getInitialAppType = (): AppType => {
    if (typeof window === 'undefined') return 'web';
    const title = document.title.toLowerCase();
    if (title.includes('agent')) return 'agent';
    if (title.includes('vfs')) return 'vfs';
    return 'web';
  };

  const [appType, setAppType] = useState<AppType>(getInitialAppType);
  const [isTauri, setIsTauri] = useState(
    typeof window !== 'undefined' && '__TAURI__' in window,
  );

  useEffect(() => {
    const checkAppType = async () => {
      const tauriAvailable =
        typeof window !== 'undefined' && '__TAURI__' in window;
      setIsTauri(tauriAvailable);

      if (!tauriAvailable) {
        setAppType('web');
        return;
      }

      try {
        const { invoke } = await import('@tauri-apps/api/core');

        // Try Agent Desktop command
        try {
          const result = await invoke<string>('get_app_type');
          if (result === 'agent') {
            setAppType('agent');
            return;
          }
        } catch {
          // Not agent desktop
        }

        // Try VFS Desktop command
        try {
          await invoke('vfs_list_sources');
          setAppType('vfs');
          return;
        } catch {
          // Not VFS desktop
        }

        // Fallback to title-based detection
        const title = document.title.toLowerCase();
        if (title.includes('agent')) {
          setAppType('agent');
        } else if (title.includes('vfs')) {
          setAppType('vfs');
        } else {
          setAppType('web');
        }
      } catch {
        setAppType('web');
      }
    };

    checkAppType();

    // Listen for title changes
    const observer = new MutationObserver(() => {
      const title = document.title.toLowerCase();
      if (title.includes('agent')) {
        setAppType('agent');
      } else if (title.includes('vfs')) {
        setAppType('vfs');
      }
    });

    const titleElement = document.querySelector('title');
    if (titleElement) {
      observer.observe(titleElement, {
        subtree: true,
        characterData: true,
        childList: true,
      });
    }

    return () => observer.disconnect();
  }, []);

  const value: AppTypeContextValue = {
    appType,
    isAgentDesktop: appType === 'agent',
    isVfsDesktop: appType === 'vfs',
    isTauri,
  };

  return (
    <AppTypeContext.Provider value={value}>{children}</AppTypeContext.Provider>
  );
}

export function useAppType() {
  return useContext(AppTypeContext);
}
