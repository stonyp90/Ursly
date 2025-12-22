import {
  Agent,
  CreateAgentDto,
  UpdateAgentDto,
  QueryAgentDto,
  AgentListResponse,
} from '@ursly/shared/types';

/**
 * Port (interface) for Agent Repository
 * This defines the contract that any adapter must implement
 */
export interface IAgentRepository {
  /**
   * Create a new agent
   */
  create(dto: CreateAgentDto, createdBy: string): Promise<Agent>;

  /**
   * Find an agent by ID
   */
  findById(id: string): Promise<Agent | null>;

  /**
   * Find all agents with pagination and filtering
   */
  findAll(query: QueryAgentDto): Promise<AgentListResponse>;

  /**
   * Update an agent by ID
   */
  update(id: string, dto: UpdateAgentDto): Promise<Agent | null>;

  /**
   * Delete an agent by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if an agent exists
   */
  exists(id: string): Promise<boolean>;
}

export const AGENT_REPOSITORY = Symbol('IAgentRepository');
