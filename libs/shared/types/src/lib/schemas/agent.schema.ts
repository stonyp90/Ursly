import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// Enums
export const AgentStatusSchema = z.enum(['active', 'suspended', 'stopped']);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

// Base Agent Schema
export const AgentSchema = z.object({
  id: z.string().uuid().openapi({ description: 'Unique agent identifier' }),
  name: z.string().min(1).max(255).openapi({ description: 'Agent name' }),
  model: z.string().min(1).openapi({ description: 'Ollama model name' }),
  systemPrompt: z.string().min(1).openapi({ description: 'System prompt for the agent' }),
  status: AgentStatusSchema.openapi({ description: 'Current agent status' }),
  capabilities: z.array(z.string()).default([]).openapi({ description: 'Agent capabilities' }),
  createdBy: z.string().openapi({ description: 'User ID who created the agent' }),
  createdAt: z.date().openapi({ description: 'Creation timestamp' }),
  updatedAt: z.date().openapi({ description: 'Last update timestamp' }),
  metadata: z.record(z.any()).optional().openapi({ description: 'Additional metadata' }),
}).openapi('Agent');

export type Agent = z.infer<typeof AgentSchema>;

// Create Agent DTO
export const CreateAgentDtoSchema = z.object({
  name: z.string().min(1).max(255).openapi({ description: 'Agent name' }),
  model: z.string().min(1).openapi({ description: 'Ollama model to use' }),
  systemPrompt: z.string().min(1).openapi({ description: 'System prompt for the agent' }),
  capabilities: z.array(z.string()).optional().openapi({ description: 'Agent capabilities' }),
  metadata: z.record(z.any()).optional().openapi({ description: 'Additional metadata' }),
}).openapi('CreateAgentDto');

export type CreateAgentDto = z.infer<typeof CreateAgentDtoSchema>;

// Update Agent DTO
export const UpdateAgentDtoSchema = z.object({
  name: z.string().min(1).max(255).optional().openapi({ description: 'Agent name' }),
  model: z.string().min(1).optional().openapi({ description: 'Ollama model to use' }),
  systemPrompt: z.string().min(1).optional().openapi({ description: 'System prompt' }),
  status: AgentStatusSchema.optional().openapi({ description: 'Agent status' }),
  capabilities: z.array(z.string()).optional().openapi({ description: 'Agent capabilities' }),
  metadata: z.record(z.any()).optional().openapi({ description: 'Additional metadata' }),
}).openapi('UpdateAgentDto');

export type UpdateAgentDto = z.infer<typeof UpdateAgentDtoSchema>;

// Query Agent DTO
export const QueryAgentDtoSchema = z.object({
  status: AgentStatusSchema.optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
}).openapi('QueryAgentDto');

export type QueryAgentDto = z.infer<typeof QueryAgentDtoSchema>;

// Agent List Response
export const AgentListResponseSchema = z.object({
  agents: z.array(AgentSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
}).openapi('AgentListResponse');

export type AgentListResponse = z.infer<typeof AgentListResponseSchema>;

