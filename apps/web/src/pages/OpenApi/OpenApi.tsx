import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from 'react-oidc-context';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import './OpenApi.css';
import { useTheme } from '../../contexts/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SwaggerSystem {
  preauthorizeApiKey: (name: string, value: string) => void;
  authActions: {
    authorize: (auth: Record<string, unknown>) => void;
  };
}

export function OpenApi() {
  const auth = useAuth();
  const { mode } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [authApplied, setAuthApplied] = useState(false);
  const token = auth.user?.access_token;

  // Calculate token expiry status
  const tokenInfo = useMemo(() => {
    if (!auth.user?.expires_at) return null;
    const expiresAt = new Date(auth.user.expires_at * 1000);
    const now = new Date();
    const remaining = Math.floor(
      (expiresAt.getTime() - now.getTime()) / 1000 / 60,
    );
    return {
      expiresAt,
      remainingMinutes: remaining,
      isExpiringSoon: remaining < 5,
    };
  }, [auth.user?.expires_at]);

  useEffect(() => {
    // Wait for auth to be ready
    if (!auth.isLoading && auth.isAuthenticated) {
      setIsReady(true);
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  // Request interceptor to add auth token to all API requests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestInterceptor = useCallback(
    (req: any) => {
      if (token && req.headers) {
        req.headers['Authorization'] = `Bearer ${token}`;
        // Log for debugging (can be removed in production)
        console.log(
          '[OpenAPI] Request intercepted, token applied to:',
          req.url,
        );
      }
      return req;
    },
    [token],
  );

  // Response interceptor to handle auth errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const responseInterceptor = useCallback((response: any) => {
    if (response.status === 401) {
      console.warn('[OpenAPI] Received 401 - token may have expired');
    }
    return response;
  }, []);

  // Pre-authorize when Swagger UI loads
  const onComplete = useCallback(
    (system: SwaggerSystem) => {
      if (token) {
        // Use authActions.authorize for proper Bearer auth
        system.authActions.authorize({
          bearer: {
            name: 'bearer',
            schema: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            value: token,
          },
        });
        setAuthApplied(true);
        console.log('[OpenAPI] Bearer token applied to Swagger UI');
      }
    },
    [token],
  );

  if (auth.isLoading) {
    return (
      <div className="openapi-loading">
        <div className="loading-spinner" />
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="openapi-error">
        <h3>Authentication Required</h3>
        <p>Please log in to access the API documentation.</p>
      </div>
    );
  }

  return (
    <div className="openapi-container">
      <div className="openapi-header">
        <div className="openapi-title">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="openapi-icon"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <h4>API Documentation</h4>
        </div>
        <div className="openapi-status">
          <span
            className={`status-badge ${authApplied ? 'authenticated' : 'pending'}`}
          >
            {authApplied ? (
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Secured
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Initializing...
              </>
            )}
          </span>
          {tokenInfo && (
            <span
              className={`status-badge ${tokenInfo.isExpiringSoon ? 'warning' : 'info'}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {tokenInfo.remainingMinutes}m left
            </span>
          )}
          <span className="api-url">{API_URL}</span>
        </div>
      </div>

      {isReady && (
        <div
          className={`swagger-wrapper ${mode === 'light' ? 'light-theme' : 'dark-theme'}`}
        >
          <SwaggerUI
            url={`${API_URL}/api/docs-json`}
            requestInterceptor={requestInterceptor}
            responseInterceptor={responseInterceptor}
            onComplete={onComplete}
            docExpansion="list"
            defaultModelsExpandDepth={-1}
            persistAuthorization={true}
            tryItOutEnabled={true}
          />
        </div>
      )}
    </div>
  );
}
