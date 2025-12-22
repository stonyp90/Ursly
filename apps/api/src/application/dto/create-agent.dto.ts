import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Zod Schema
export const CreateAgentSchema = z.object({
  name: z.string().min(1).max(255).describe('Agent name'),
  model: z.string().min(1).describe('Ollama model to use (e.g., llama2, mistral)'),
  systemPrompt: z.string().min(1).max(10000).describe('System prompt for the agent'),
  capabilities: z.array(z.string()).optional().describe('Agent capabilities'),
  metadata: z.record(z.any()).optional().describe('Additional metadata'),
});

// DTO Class for NestJS
export class CreateAgentDto extends createZodDto(CreateAgentSchema) {}

// Type inference
export type CreateAgentCommand = z.infer<typeof CreateAgentSchema>;

