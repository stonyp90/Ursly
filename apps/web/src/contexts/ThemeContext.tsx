import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';

// Theme modes
export type ThemeMode = 'dark' | 'light';

// Available theme colors - Cyberpunk themed
export const themeColors = {
  neonCyan: {
    name: 'Neon Cyan',
    primary: '#00f5ff',
    primaryDark: '#00c4cc',
    secondary: '#ff00ea',
    accent: '#00f5ff',
  },
  neonMagenta: {
    name: 'Neon Magenta',
    primary: '#ff00ea',
    primaryDark: '#cc00bb',
    secondary: '#00f5ff',
    accent: '#ff00ea',
  },
  neonGreen: {
    name: 'Neon Green',
    primary: '#00ff88',
    primaryDark: '#00cc6a',
    secondary: '#ff00ea',
    accent: '#00ff88',
  },
  neonYellow: {
    name: 'Neon Yellow',
    primary: '#ffea00',
    primaryDark: '#ccbb00',
    secondary: '#ff6600',
    accent: '#ffea00',
  },
  neonOrange: {
    name: 'Neon Orange',
    primary: '#ff6600',
    primaryDark: '#cc5200',
    secondary: '#00f5ff',
    accent: '#ff6600',
  },
  neonPurple: {
    name: 'Neon Purple',
    primary: '#a855f7',
    primaryDark: '#9333ea',
    secondary: '#00f5ff',
    accent: '#a855f7',
  },
  synthwave: {
    name: 'Synthwave',
    primary: '#f472b6',
    primaryDark: '#ec4899',
    secondary: '#818cf8',
    accent: '#f472b6',
  },
  matrix: {
    name: 'Matrix',
    primary: '#22c55e',
    primaryDark: '#16a34a',
    secondary: '#00ff88',
    accent: '#22c55e',
  },
} as const;

export type ThemeColorKey = keyof typeof themeColors;

// Light mode color overrides - Cyberpunk inspired light theme
const lightModeColors = {
  background: '#f0f4f8',
  backgroundSubtle: '#e2e8f0',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  surfaceOverlay: '#f8fafc',
  border: 'rgba(0, 0, 0, 0.1)',
  borderSubtle: 'rgba(0, 0, 0, 0.05)',
  borderHover: 'rgba(0, 0, 0, 0.2)',
  textPrimary: '#0a0a14',
  textSecondary: '#3a3a4a',
  textMuted: '#5a5a6a',
  textDim: '#8a8a9a',
  cardBg: 'rgba(255, 255, 255, 0.95)',
  cardBgGradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
};

// Dark mode color overrides - Cyberpunk dark theme
const darkModeColors = {
  background: '#08080c',
  backgroundSubtle: '#0a0a0f',
  surface: '#0e0e14',
  surfaceElevated: '#14141c',
  surfaceOverlay: '#1a1a24',
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  borderHover: 'rgba(255, 255, 255, 0.15)',
  textPrimary: '#e8e8f0',
  textSecondary: '#a0a0b0',
  textMuted: '#6a6a7a',
  textDim: '#4a4a5a',
  cardBg: 'rgba(10, 10, 20, 0.95)',
  cardBgGradient: 'linear-gradient(135deg, rgba(10, 10, 20, 0.95) 0%, rgba(15, 15, 30, 0.9) 100%)',
};

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  colorKey: ThemeColorKey;
  setColorKey: (key: ThemeColorKey) => void;
  colors: typeof themeColors[ThemeColorKey];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const COLOR_STORAGE_KEY = 'ursly_theme_color';
const MODE_STORAGE_KEY = 'ursly_theme_mode';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function applyThemeColors(colors: typeof themeColors[ThemeColorKey]) {
  const root = document.documentElement;
  
  // Core accent colors
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-600', colors.primaryDark);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--accent', colors.accent);
  
  // Cyberpunk accent mappings
  root.style.setProperty('--cyber-cyan', colors.primary);
  root.style.setProperty('--cyber-magenta', colors.secondary);
  root.style.setProperty('--cyber-accent', colors.accent);
  
  // Generate glow colors with proper rgba
  const primaryRgb = hexToRgb(colors.primary);
  const secondaryRgb = hexToRgb(colors.secondary);
  
  if (primaryRgb) {
    root.style.setProperty('--primary-glow', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2)`);
    root.style.setProperty('--primary-glow-strong', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.35)`);
    root.style.setProperty('--primary-glow-soft', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`);
    root.style.setProperty('--primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    
    // Border colors derived from primary
    root.style.setProperty('--border-glow', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.3)`);
    root.style.setProperty('--border-focus', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.5)`);
  }
  
  if (secondaryRgb) {
    root.style.setProperty('--secondary-glow', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.2)`);
    root.style.setProperty('--secondary-glow-strong', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.35)`);
    root.style.setProperty('--secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
  }
}

function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement;
  const colors = mode === 'light' ? lightModeColors : darkModeColors;
  
  // Base background colors
  root.style.setProperty('--background', colors.background);
  root.style.setProperty('--background-subtle', colors.backgroundSubtle);
  root.style.setProperty('--surface', colors.surface);
  root.style.setProperty('--surface-elevated', colors.surfaceElevated);
  root.style.setProperty('--surface-overlay', colors.surfaceOverlay);
  
  // Card backgrounds
  root.style.setProperty('--card-bg', colors.cardBg);
  root.style.setProperty('--card-bg-gradient', colors.cardBgGradient);
  
  // Border colors
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--border-subtle', colors.borderSubtle);
  root.style.setProperty('--border-hover', colors.borderHover);
  
  // Text colors
  root.style.setProperty('--text-primary', colors.textPrimary);
  root.style.setProperty('--text-secondary', colors.textSecondary);
  root.style.setProperty('--text-muted', colors.textMuted);
  root.style.setProperty('--text-dim', colors.textDim);
  
  // Also set a data attribute for CSS-based theming
  root.setAttribute('data-theme', mode);
  
  // Update body background
  document.body.style.backgroundColor = colors.background;
  document.body.style.color = colors.textPrimary;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    // Default to dark mode - user can switch to light in settings
    return 'dark';
  });

  const [colorKey, setColorKeyState] = useState<ThemeColorKey>(() => {
    const stored = localStorage.getItem(COLOR_STORAGE_KEY);
    if (stored && stored in themeColors) {
      return stored as ThemeColorKey;
    }
    return 'neonCyan';
  });

  const colors = themeColors[colorKey];

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
    applyThemeMode(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const setColorKey = useCallback((key: ThemeColorKey) => {
    setColorKeyState(key);
    localStorage.setItem(COLOR_STORAGE_KEY, key);
    applyThemeColors(themeColors[key]);
  }, []);

  // Apply theme on mount
  useEffect(() => {
    applyThemeColors(colors);
    applyThemeMode(mode);
  }, [colors, mode]);


  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode, colorKey, setColorKey, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
