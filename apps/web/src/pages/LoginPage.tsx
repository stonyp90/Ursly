import { useAuth } from 'react-oidc-context';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Container,
  CircularProgress,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const subtleFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const GradientBackground = styled(Box)({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#08080c',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(ellipse at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.03) 0%, transparent 70%)
    `,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px)
    `,
    backgroundSize: '64px 64px',
    maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
    WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
    opacity: 0.4,
  },
});

const LoginCard = styled(Card)({
  background: 'linear-gradient(145deg, #101016 0%, #0c0c10 100%)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 12,
  boxShadow: `
    0 24px 64px rgba(0, 0, 0, 0.6),
    0 8px 24px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.03)
  `,
  maxWidth: 420,
  width: '100%',
  position: 'relative',
  zIndex: 1,
  overflow: 'visible',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent)',
    borderRadius: '12px 12px 0 0',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: -1,
    left: 20,
    right: 20,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent)',
    filter: 'blur(1px)',
  },
});

const LogoContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 32,
  gap: 14,
  animation: `${subtleFloat} 4s ease-in-out infinite`,
});

const LogoIcon = styled(Box)({
  width: 54,
  height: 54,
  borderRadius: 10,
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: `
    0 8px 24px rgba(99, 102, 241, 0.35),
    0 0 32px rgba(99, 102, 241, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2)
  `,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%)',
  },
});

const BrandText = styled(Typography)({
  fontWeight: 700,
  fontSize: '1.85rem',
  color: '#f8fafc',
  letterSpacing: '-0.03em',
  textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
});

const LoginButton = styled(Button)({
  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  color: '#fff',
  padding: '14px 28px',
  borderRadius: 8,
  fontSize: '14px',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: `
    0 4px 16px rgba(99, 102, 241, 0.3),
    0 0 20px rgba(99, 102, 241, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1)
  `,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
    opacity: 0,
    transition: 'opacity 0.2s ease',
  },
  '&:hover': {
    boxShadow: `
      0 8px 28px rgba(99, 102, 241, 0.4),
      0 0 32px rgba(99, 102, 241, 0.25)
    `,
    transform: 'translateY(-2px)',
    '&::before': {
      opacity: 1,
    },
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: `
      0 2px 12px rgba(99, 102, 241, 0.25),
      0 0 16px rgba(99, 102, 241, 0.1)
    `,
  },
  '&:disabled': {
    background: 'rgba(99, 102, 241, 0.3)',
    color: 'rgba(255, 255, 255, 0.4)',
    boxShadow: 'none',
  },
});

const FeatureItem = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  color: '#a1a1aa',
  fontSize: '13px',
  background: 'rgba(255, 255, 255, 0.02)',
  borderRadius: 8,
  border: '1px solid transparent',
  transition: 'all 0.15s ease',
  marginBottom: 8,
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  '& svg': {
    color: '#818cf8',
    fontSize: '18px',
    filter: 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.3))',
  },
});

const ShimmerText = styled(Typography)({
  background: 'linear-gradient(90deg, #6b7280, #94a3b8, #6b7280)',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  animation: `${shimmer} 3s linear infinite`,
});

export function LoginPage() {
  const auth = useAuth();

  const handleLogin = () => {
    auth.signinRedirect();
  };

  return (
    <GradientBackground>
      <Container maxWidth="sm">
        <LoginCard>
          <CardContent sx={{ p: 5 }}>
            <LogoContainer>
              <LogoIcon>
                <SmartToyIcon sx={{ fontSize: 28, color: '#fff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
              </LogoIcon>
              <BrandText>Ursly.io</BrandText>
            </LogoContainer>

            <Typography
              variant="h6"
              sx={{
                textAlign: 'center',
                color: '#f8fafc',
                fontWeight: 600,
                mb: 0.5,
                fontSize: '19px',
                letterSpacing: '-0.02em',
              }}
            >
              Agent Orchestrator
            </Typography>

            <Typography
              sx={{
                textAlign: 'center',
                color: '#6b7280',
                mb: 4,
                fontSize: '13px',
              }}
            >
              AI-powered automation platform
            </Typography>

            <Box sx={{ mb: 4 }}>
              <FeatureItem>
                <SmartToyIcon />
                <span>Intelligent agent management</span>
              </FeatureItem>
              <FeatureItem>
                <AutoAwesomeIcon />
                <span>Dynamic context window optimization</span>
              </FeatureItem>
              <FeatureItem>
                <LockOutlinedIcon />
                <span>Enterprise-grade OIDC security</span>
              </FeatureItem>
            </Box>

            <LoginButton
              onClick={handleLogin}
              disabled={auth.isLoading}
              startIcon={
                auth.isLoading ? (
                  <CircularProgress size={18} sx={{ color: 'inherit' }} />
                ) : (
                  <LockOutlinedIcon sx={{ fontSize: 18 }} />
                )
              }
            >
              {auth.isLoading ? 'Connecting...' : 'Sign in with Keycloak'}
            </LoginButton>

            <ShimmerText
              sx={{
                textAlign: 'center',
                mt: 3,
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              Protected by enterprise-grade security
            </ShimmerText>
          </CardContent>
        </LoginCard>

        <Typography
          sx={{
            textAlign: 'center',
            color: '#4b5563',
            mt: 4,
            fontSize: '12px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          © {new Date().getFullYear()} Ursly.io. All rights reserved.
        </Typography>
      </Container>
    </GradientBackground>
  );
}
