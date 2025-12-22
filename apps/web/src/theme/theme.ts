import { createTheme, alpha } from '@mui/material/styles';

// Design tokens - Extended color palette
const colors = {
  // Primary - Indigo spectrum
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryLighter: '#a5b4fc',
  primaryDark: '#4f46e5',
  primaryDarker: '#4338ca',
  primaryGlow: 'rgba(99, 102, 241, 0.2)',
  primaryGlowStrong: 'rgba(99, 102, 241, 0.35)',
  
  // Secondary - Violet spectrum
  secondary: '#8b5cf6',
  secondaryLight: '#a78bfa',
  secondaryDark: '#7c3aed',
  
  // Backgrounds - Deep dark tones
  background: '#08080c',
  backgroundSubtle: '#0a0a10',
  surface: '#101016',
  surfaceElevated: '#16161e',
  surfaceOverlay: '#1c1c26',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.06)',
  borderHover: 'rgba(255, 255, 255, 0.12)',
  borderFocus: 'rgba(99, 102, 241, 0.5)',
  
  // Text hierarchy
  textPrimary: '#f8fafc',
  textSecondary: '#a1a1aa',
  textMuted: '#6b7280',
  textDim: '#4b5563',
  
  // Status colors with variants
  success: '#10b981',
  successLight: '#34d399',
  successGlow: 'rgba(16, 185, 129, 0.2)',
  
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningGlow: 'rgba(245, 158, 11, 0.2)',
  
  error: '#ef4444',
  errorLight: '#f87171',
  errorGlow: 'rgba(239, 68, 68, 0.2)',
};

// Shadow definitions
const shadows = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.25)',
  sm: '0 2px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.25)',
  md: '0 4px 8px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.25)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)',
  xl: '0 16px 32px rgba(0, 0, 0, 0.5), 0 8px 16px rgba(0, 0, 0, 0.35)',
  xxl: '0 24px 48px rgba(0, 0, 0, 0.55), 0 12px 24px rgba(0, 0, 0, 0.4)',
  inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  glow: `0 0 20px ${colors.primaryGlow}, 0 4px 12px rgba(99, 102, 241, 0.15)`,
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
    },
    secondary: {
      main: colors.secondary,
      light: colors.secondaryLight,
      dark: colors.secondaryDark,
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
    error: {
      main: colors.error,
      light: colors.errorLight,
    },
    success: {
      main: colors.success,
      light: colors.successLight,
    },
    warning: {
      main: colors.warning,
      light: colors.warningLight,
    },
    divider: colors.border,
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    h1: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.015em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '14px',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '13px',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
    caption: {
      fontSize: '11px',
      color: colors.textMuted,
    },
    overline: {
      fontSize: '10px',
      fontWeight: 600,
      letterSpacing: '0.08em',
      color: colors.textMuted,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    shadows.xs,
    shadows.sm,
    shadows.sm,
    shadows.md,
    shadows.md,
    shadows.lg,
    shadows.lg,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xxl,
    shadows.xxl,
    shadows.xxl,
    shadows.xxl,
    shadows.xxl,
    shadows.xxl,
    shadows.xxl,
    shadows.xxl,
    shadows.xxl,
    shadows.xxl,
    shadows.xxl,
    shadows.xxl,
    shadows.xxl,
    shadows.xxl,
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '10px 18px',
          fontSize: '13px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:active:not(:disabled)': {
            transform: 'translateY(1px)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          boxShadow: `${shadows.sm}, ${shadows.glow}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            opacity: 0,
            transition: 'opacity 0.15s ease',
          },
          '&:hover': {
            boxShadow: `${shadows.md}, 0 0 28px ${colors.primaryGlowStrong}`,
            transform: 'translateY(-2px)',
            '&::before': {
              opacity: 1,
            },
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: `${shadows.xs}, ${shadows.glow}`,
          },
        },
        outlined: {
          borderColor: colors.border,
          background: colors.surfaceElevated,
          boxShadow: shadows.xs,
          '&:hover': {
            borderColor: colors.borderHover,
            backgroundColor: colors.surfaceOverlay,
            boxShadow: shadows.sm,
          },
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          boxShadow: `${shadows.sm}, ${shadows.inset}`,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.025) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
          '&:hover': {
            borderColor: colors.borderHover,
            boxShadow: `${shadows.lg}, ${shadows.inset}`,
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            fontSize: '13px',
            background: colors.background,
            transition: 'all 0.15s ease',
            '& fieldset': {
              borderColor: colors.border,
              transition: 'all 0.15s ease',
            },
            '&:hover fieldset': {
              borderColor: colors.borderHover,
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${colors.primaryGlow}`,
              '& fieldset': {
                borderColor: colors.primary,
              },
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 10,
        },
        elevation1: {
          boxShadow: shadows.sm,
        },
        elevation2: {
          boxShadow: shadows.md,
        },
        elevation3: {
          boxShadow: shadows.lg,
        },
        elevation8: {
          boxShadow: shadows.xl,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '11px',
          fontWeight: 600,
          height: 26,
          letterSpacing: '0.02em',
          boxShadow: shadows.xs,
        },
        filled: {
          background: `linear-gradient(135deg, ${alpha(colors.primary, 0.15)} 0%, ${alpha(colors.primary, 0.08)} 100%)`,
          border: `1px solid ${alpha(colors.primary, 0.2)}`,
        },
        outlined: {
          borderColor: colors.border,
          background: colors.surfaceElevated,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          boxShadow: shadows.xxl,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          border: `1px solid ${colors.border}`,
          background: colors.surfaceElevated,
          boxShadow: shadows.xl,
          marginTop: 6,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        },
        list: {
          padding: 8,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '13px',
          padding: '10px 14px',
          marginBottom: 2,
          transition: 'all 0.1s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          },
          '&.Mui-selected': {
            backgroundColor: alpha(colors.primary, 0.12),
            '&:hover': {
              backgroundColor: alpha(colors.primary, 0.18),
            },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.surfaceOverlay,
          border: `1px solid ${colors.border}`,
          borderRadius: 6,
          fontSize: '12px',
          padding: '8px 12px',
          boxShadow: shadows.lg,
        },
        arrow: {
          color: colors.surfaceOverlay,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 44,
        },
        indicator: {
          height: 2,
          borderRadius: 1,
          boxShadow: `0 0 8px ${colors.primaryGlow}`,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          padding: '10px 18px',
          fontSize: '13px',
          fontWeight: 500,
          textTransform: 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: shadows.sm,
        },
        rounded: {
          borderRadius: 8,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
          backgroundColor: colors.surfaceElevated,
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
        },
        bar: {
          borderRadius: 4,
          background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.border,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: colors.border,
          padding: '14px 18px',
          fontSize: '13px',
        },
        head: {
          fontWeight: 600,
          color: colors.textSecondary,
          backgroundColor: colors.surfaceElevated,
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.1s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 44,
          height: 26,
          padding: 0,
        },
        switchBase: {
          padding: 3,
          '&.Mui-checked': {
            transform: 'translateX(18px)',
            '& + .MuiSwitch-track': {
              backgroundColor: colors.primary,
              opacity: 1,
              boxShadow: `0 0 8px ${colors.primaryGlow}`,
            },
          },
        },
        thumb: {
          width: 20,
          height: 20,
          boxShadow: shadows.sm,
        },
        track: {
          borderRadius: 13,
          backgroundColor: colors.surfaceElevated,
          opacity: 1,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '13px',
          boxShadow: shadows.sm,
        },
        standardSuccess: {
          background: `linear-gradient(135deg, ${alpha(colors.success, 0.12)} 0%, ${alpha(colors.success, 0.06)} 100%)`,
          border: `1px solid ${alpha(colors.success, 0.2)}`,
        },
        standardWarning: {
          background: `linear-gradient(135deg, ${alpha(colors.warning, 0.12)} 0%, ${alpha(colors.warning, 0.06)} 100%)`,
          border: `1px solid ${alpha(colors.warning, 0.2)}`,
        },
        standardError: {
          background: `linear-gradient(135deg, ${alpha(colors.error, 0.12)} 0%, ${alpha(colors.error, 0.06)} 100%)`,
          border: `1px solid ${alpha(colors.error, 0.2)}`,
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          boxShadow: `0 0 0 2px ${colors.surface}`,
          fontWeight: 600,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surfaceElevated,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '13px',
        },
      },
    },
  },
});
