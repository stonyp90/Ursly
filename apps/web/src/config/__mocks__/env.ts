/**
 * Mock environment configuration for tests
 */
export const env = {
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'agent-orchestrator',
    clientId: 'agent-web',
    get accountUrl(): string {
      return `${this.url}/realms/${this.realm}/account`;
    },
    get passwordUrl(): string {
      return `${this.accountUrl}/password`;
    },
    get personalInfoUrl(): string {
      return `${this.accountUrl}/personal-info`;
    },
    get sessionsUrl(): string {
      return `${this.accountUrl}/sessions`;
    },
    get securityUrl(): string {
      return `${this.accountUrl}/security`;
    },
  },
  api: {
    url: 'http://localhost:3000',
    endpoint(path: string): string {
      return `${this.url}${path.startsWith('/') ? path : `/${path}`}`;
    },
  },
  ws: {
    url: 'ws://localhost:3000',
  },
  novu: {
    appIdentifier: 'test-app-id',
    get isConfigured(): boolean {
      return !!this.appIdentifier;
    },
  },
  app: {
    name: 'Ursly.io',
    version: '1.0.0',
    get isDev(): boolean {
      return true;
    },
    get isProd(): boolean {
      return false;
    },
  },
} as const;

export type EnvConfig = typeof env;
