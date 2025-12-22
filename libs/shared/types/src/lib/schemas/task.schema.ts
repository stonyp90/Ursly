import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// Enums
export const TaskStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// Base Task Schema
export const TaskSchema = z.object({
  id: z.string().uuid().openapi({ description: 'Unique task identifier' }),
  agentId: z.string().openapi({ description: 'Associated agent ID' }),
  prompt: z.string().min(1).openapi({ description: 'Task prompt' }),
  status: TaskStatusSchema.openapi({ description: 'Current task status' }),
  result: z.string().optional().openapi({ description: 'Task result' }),
  error: z.string().optional().openapi({ description: 'Error message if failed' }),
  startedAt: z.date().optional().openapi({ description: 'Task start timestamp' }),
  completedAt: z.date().optional().openapi({ description: 'Task completion timestamp' }),
  createdBy: z.string().openapi({ description: 'User ID who created the task' }),
  createdAt: z.date().openapi({ description: 'Creation timestamp' }),
  metadata: z.record(z.any()).optional().openapi({ description: 'Additional metadata' }),
}).openapi('Task');

export type Task = z.infer<typeof TaskSchema>;

// Create Task DTO
export const CreateTaskDtoSchema = z.object({
  agentId: z.string().openapi({ description: 'Agent ID to execute the task' }),
  prompt: z.string().min(1).openapi({ description: 'Task prompt' }),
  metadata: z.record(z.any()).optional().openapi({ description: 'Additional metadata' }),
}).openapi('CreateTaskDto');

export type CreateTaskDto = z.infer<typeof CreateTaskDtoSchema>;

// Query Task DTO
export const QueryTaskDtoSchema = z.object({
  agentId: z.string().optional(),
  status: TaskStatusSchema.optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
}).openapi('QueryTaskDto');

export type QueryTaskDto = z.infer<typeof QueryTaskDtoSchema>;

// Task List Response
export const TaskListResponseSchema = z.object({
  tasks: z.array(TaskSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
}).openapi('TaskListResponse');

export type TaskListResponse = z.infer<typeof TaskListResponseSchema>;

// Task Stream Event
export const TaskStreamEventSchema = z.object({
  taskId: z.string(),
  type: z.enum(['status', 'chunk', 'complete', 'error']),
  data: z.any(),
  timestamp: z.date(),
}).openapi('TaskStreamEvent');

export type TaskStreamEvent = z.infer<typeof TaskStreamEventSchema>;

