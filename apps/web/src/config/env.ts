/**
 * Environment configuration for the web application.
 * All URLs and external service configurations should be defined here.
 * Values are loaded from environment variables with sensible defaults for local development.
 */

export const env = {
  // Keycloak Configuration
  keycloak: {
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'agent-orchestrator',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'agent-web',
    
    /**
     * Get the Keycloak account management URL for the current user
     */
    get accountUrl(): string {
      return `${this.url}/realms/${this.realm}/account`;
    },
    
    /**
     * Get the Keycloak password change URL
     */
    get passwordUrl(): string {
      return `${this.accountUrl}/password`;
    },
    
    /**
     * Get the Keycloak personal info URL
     */
    get personalInfoUrl(): string {
      return `${this.accountUrl}/personal-info`;
    },
    
    /**
     * Get the Keycloak sessions URL
     */
    get sessionsUrl(): string {
      return `${this.accountUrl}/sessions`;
    },
    
    /**
     * Get the Keycloak security settings URL
     */
    get securityUrl(): string {
      return `${this.accountUrl}/security`;
    },
  },
  
  // API Configuration
  api: {
    url: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    
    /**
     * Get a full API endpoint URL
     */
    endpoint(path: string): string {
      return `${this.url}${path.startsWith('/') ? path : `/${path}`}`;
    },
  },
  
  // WebSocket Configuration
  ws: {
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  },
  
  // Novu Notifications
  novu: {
    appIdentifier: import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER || 'FNfEAbhmW05j',
    
    get isConfigured(): boolean {
      return !!this.appIdentifier;
    },
  },
  
  // App Configuration
  app: {
    name: 'Ursly.io',
    version: '1.0.0',
    
    /**
     * Check if running in development mode
     */
    get isDev(): boolean {
      return import.meta.env.DEV;
    },
    
    /**
     * Check if running in production mode
     */
    get isProd(): boolean {
      return import.meta.env.PROD;
    },
  },
} as const;

// Type for the environment configuration
export type EnvConfig = typeof env;

