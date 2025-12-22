import { ReactNode, useEffect } from 'react';
import { AuthProvider as OidcAuthProvider, useAuth } from 'react-oidc-context';
import { oidcConfig } from './authConfig';
import { setAccessTokenGetter } from '../services/api';

interface AuthProviderProps {
  children: ReactNode;
}

// Inner component that sets up the token getter after auth is available
function AuthTokenSetter({ children }: { children: ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    setAccessTokenGetter(() => auth.user?.access_token ?? null);
  }, [auth.user?.access_token]);

  return <>{children}</>;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const onSigninCallback = () => {
    // Remove the code and state from the URL after successful login
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return (
    <OidcAuthProvider {...oidcConfig} onSigninCallback={onSigninCallback}>
      <AuthTokenSetter>{children}</AuthTokenSetter>
    </OidcAuthProvider>
  );
}

