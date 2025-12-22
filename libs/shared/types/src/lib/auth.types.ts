export interface AgentToken {
  id: string;
  agentId: string;
  token: string;
  issuedAt: Date;
  expiresAt: Date;
  userId: string;
}

export interface TokenExchangeRequest {
  keycloakToken: string;
  agentId: string;
}

export interface TokenExchangeResponse {
  agentToken: string;
  expiresIn: number;
  agentId: string;
}

export interface KeycloakUser {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  groups?: string[];
}

export interface AgentTokenPayload {
  agentId: string;
  userId: string;
  iat: number;
  exp: number;
}

