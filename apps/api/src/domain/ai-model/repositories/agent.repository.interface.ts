import { Agent } from '../entities/agent.entity';
import { AgentId } from '../value-objects/agent-id.vo';

export interface IAgentRepository {
  save(agent: Agent): Promise<void>;
  findById(id: AgentId): Promise<Agent | null>;
  findAll(filters?: AgentFilters): Promise<Agent[]>;
  update(agent: Agent): Promise<void>;
  delete(id: AgentId): Promise<void>;
  existsByName(name: string, excludeId?: AgentId): Promise<boolean>;
}

export interface AgentFilters {
  status?: string;
  createdBy?: string;
  limit?: number;
  offset?: number;
}

