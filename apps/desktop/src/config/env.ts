/**
 * Environment configuration for the desktop app
 * Supports both local development and production endpoints
 */

// Detect if running in development mode
const isDev = import.meta.env.DEV;

// Production endpoints
const PROD_ENDPOINTS = {
  API_URL: 'https://api.ursly.io',
  WS_URL: 'wss://api.ursly.io',
  AUTH_URL: 'https://auth.ursly.io',
  APP_URL: 'https://app.ursly.io',
  GRPC_URL: 'https://grpc.ursly.io',
};

// Development endpoints
const DEV_ENDPOINTS = {
  API_URL: 'http://localhost:3000',
  WS_URL: 'ws://localhost:3000',
  AUTH_URL: 'http://localhost:8080',
  APP_URL: 'http://localhost:4200',
  GRPC_URL: 'http://localhost:50051',
};

// Export based on environment
export const API_URL = isDev ? DEV_ENDPOINTS.API_URL : PROD_ENDPOINTS.API_URL;
export const WS_URL = isDev ? DEV_ENDPOINTS.WS_URL : PROD_ENDPOINTS.WS_URL;
export const AUTH_URL = isDev
  ? DEV_ENDPOINTS.AUTH_URL
  : PROD_ENDPOINTS.AUTH_URL;
export const APP_URL = isDev ? DEV_ENDPOINTS.APP_URL : PROD_ENDPOINTS.APP_URL;
export const GRPC_URL = isDev
  ? DEV_ENDPOINTS.GRPC_URL
  : PROD_ENDPOINTS.GRPC_URL;

// Keycloak config
export const KEYCLOAK_REALM = 'agent-orchestrator';
export const KEYCLOAK_CLIENT_ID = 'agent-desktop';

// Export all config
export const env = {
  isDev,
  apiUrl: API_URL,
  wsUrl: WS_URL,
  authUrl: AUTH_URL,
  appUrl: APP_URL,
  grpcUrl: GRPC_URL,
  keycloak: {
    realm: KEYCLOAK_REALM,
    clientId: KEYCLOAK_CLIENT_ID,
    url: AUTH_URL,
  },
};

export default env;
