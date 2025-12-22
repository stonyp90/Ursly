import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { Box, CircularProgress, Typography, Button } from '@mui/material';

export function CallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already authenticated, navigate to home
    if (!auth.isLoading && auth.isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    // Handle authentication errors
    if (auth.error) {
      console.error('Auth error:', auth.error);
      setError(auth.error.message || 'Authentication failed');
      return;
    }

    // If not loading and not authenticated, there might be an issue
    // Wait a bit and retry or show error
    const timeout = setTimeout(() => {
      if (!auth.isLoading && !auth.isAuthenticated && !auth.error) {
        // Try to complete the sign-in if the URL has auth params
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('code') && urlParams.has('state')) {
          // The library should handle this automatically
          // If we're here after 5 seconds, something went wrong
          console.log('Auth still pending after timeout, current state:', {
            isLoading: auth.isLoading,
            isAuthenticated: auth.isAuthenticated,
            user: auth.user,
            error: auth.error
          });
        }
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [auth.isLoading, auth.isAuthenticated, auth.error, auth.user, navigate]);

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: '#0a0a0f',
          gap: 2,
        }}
      >
        <Typography sx={{ color: '#ef4444', fontSize: '1.1rem' }}>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => auth.signinRedirect()}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#0a0a0f',
        gap: 2,
      }}
    >
      <CircularProgress sx={{ color: '#6366f1' }} size={48} />
      <Typography sx={{ color: '#e2e8f0', fontSize: '1.1rem' }}>
        Completing sign in...
      </Typography>
    </Box>
  );
}

