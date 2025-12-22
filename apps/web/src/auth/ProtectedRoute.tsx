import { ReactNode, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { Box, CircularProgress, Typography } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

interface ProtectedRouteProps {
  children: ReactNode;
}

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const LoadingContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
    `,
    pointerEvents: 'none',
  },
});

const Logo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '24px',
  zIndex: 1,
});

const LogoIcon = styled(Box)({
  width: 48,
  height: 48,
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
  animation: `${pulse} 2s ease-in-out infinite`,
});

const LoadingText = styled(Typography)({
  color: '#e2e8f0',
  marginTop: '16px',
  fontSize: '0.95rem',
  zIndex: 1,
});

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useAuth();

  // Auto-redirect to Keycloak when not authenticated
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.error) {
      // User is not authenticated, redirect to Keycloak
      auth.signinRedirect();
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.error, auth]);

  if (auth.isLoading) {
    return (
      <LoadingContainer>
        <Logo>
          <LogoIcon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12L11 14L15 10"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="white"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </LogoIcon>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1.5rem',
              background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Ursly.io
          </Typography>
        </Logo>
        <CircularProgress sx={{ color: '#6366f1' }} />
        <LoadingText>Connecting securely...</LoadingText>
      </LoadingContainer>
    );
  }

  if (auth.error) {
    return (
      <LoadingContainer>
        <Logo>
          <LogoIcon sx={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </LogoIcon>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1.5rem',
              color: '#e2e8f0',
            }}
          >
            Ursly.io
          </Typography>
        </Logo>
        <Typography sx={{ color: '#ef4444', mb: 2, zIndex: 1 }}>
          Authentication Error
        </Typography>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
          {auth.error.message}
        </Typography>
        <Box
          component="button"
          onClick={() => auth.signinRedirect()}
          sx={{
            mt: 3,
            px: 4,
            py: 1.5,
            borderRadius: '8px',
            border: '1px solid rgba(99, 102, 241, 0.5)',
            background: 'transparent',
            color: '#6366f1',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 500,
            zIndex: 1,
            '&:hover': {
              background: 'rgba(99, 102, 241, 0.1)',
            },
          }}
        >
          Try Again
        </Box>
      </LoadingContainer>
    );
  }

  // While redirecting to Keycloak, show loading
  if (!auth.isAuthenticated) {
    return (
      <LoadingContainer>
        <Logo>
          <LogoIcon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12L11 14L15 10"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="white"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </LogoIcon>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1.5rem',
              background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Ursly.io
          </Typography>
        </Logo>
        <CircularProgress sx={{ color: '#6366f1' }} />
        <LoadingText>Redirecting to sign in...</LoadingText>
      </LoadingContainer>
    );
  }

  return <>{children}</>;
}

