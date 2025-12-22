import '@testing-library/jest-dom';

// Mock import.meta.env for Vite environment variables
// This needs to be done before any imports that use import.meta.env
(globalThis as any).importMetaEnv = {
  VITE_API_URL: 'http://localhost:3000',
  VITE_WS_URL: 'ws://localhost:3000',
  VITE_KEYCLOAK_URL: 'http://localhost:8080',
  VITE_KEYCLOAK_REALM: 'agent-orchestrator',
  VITE_KEYCLOAK_CLIENT_ID: 'agent-web',
  VITE_NOVU_APPLICATION_IDENTIFIER: 'test-app-id',
  MODE: 'test',
  DEV: true,
  PROD: false,
};

// Mock the entire config/env module
jest.mock('./config/env', () => ({
  env: {
    keycloak: {
      url: 'http://localhost:8080',
      realm: 'agent-orchestrator',
      clientId: 'agent-web',
      get accountUrl() {
        return `${this.url}/realms/${this.realm}/account`;
      },
      get passwordUrl() {
        return `${this.accountUrl}/password`;
      },
      get personalInfoUrl() {
        return `${this.accountUrl}/personal-info`;
      },
      get sessionsUrl() {
        return `${this.accountUrl}/sessions`;
      },
      get securityUrl() {
        return `${this.accountUrl}/security`;
      },
    },
    api: {
      url: 'http://localhost:3000',
      endpoint(path: string) {
        return `${this.url}${path.startsWith('/') ? path : `/${path}`}`;
      },
    },
    ws: { url: 'ws://localhost:3000' },
    novu: {
      appIdentifier: 'test-app-id',
      get isConfigured() {
        return !!this.appIdentifier;
      },
    },
    app: {
      name: 'Ursly.io',
      version: '1.0.0',
      get isDev() {
        return true;
      },
      get isProd() {
        return false;
      },
    },
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
