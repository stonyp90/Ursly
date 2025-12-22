export enum AgentStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  STOPPED = 'stopped',
}

export interface Agent {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  status: AgentStatus;
  capabilities: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface CreateAgentDto {
  name: string;
  model: string;
  systemPrompt: string;
  capabilities?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateAgentDto {
  name?: string;
  model?: string;
  systemPrompt?: string;
  status?: AgentStatus;
  capabilities?: string[];
  metadata?: Record<string, any>;
}

