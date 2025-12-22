import { WebStorageStateStore } from 'oidc-client-ts';
import { env } from '../config';

export const oidcConfig = {
  authority: `${env.keycloak.url}/realms/${env.keycloak.realm}`,
  client_id: env.keycloak.clientId,
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email',
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  // Refresh token settings
  silent_redirect_uri: `${window.location.origin}/silent-renew.html`,
  revokeTokensOnSignout: true,
};

