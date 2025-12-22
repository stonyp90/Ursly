import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// Enums
export const AuditEventTypeSchema = z.enum([
  'agent_created',
  'agent_updated',
  'agent_deleted',
  'task_created',
  'task_started',
  'task_completed',
  'task_failed',
  'task_deleted',
  'token_issued',
  'token_revoked',
  'model_inference',
]);
export type AuditEventType = z.infer<typeof AuditEventTypeSchema>;

// Token Usage Schema
export const TokenUsageSchema = z.object({
  promptTokens: z.number().optional(),
  completionTokens: z.number().optional(),
  totalTokens: z.number().optional(),
}).openapi('TokenUsage');

export type TokenUsage = z.infer<typeof TokenUsageSchema>;

// Base Audit Log Schema
export const AuditLogSchema = z.object({
  id: z.string().openapi({ description: 'Unique audit log identifier' }),
  timestamp: z.date().openapi({ description: 'Event timestamp' }),
  eventType: AuditEventTypeSchema.openapi({ description: 'Type of audit event' }),
  agentId: z.string().optional().openapi({ description: 'Associated agent ID' }),
  taskId: z.string().optional().openapi({ description: 'Associated task ID' }),
  userId: z.string().optional().openapi({ description: 'User ID who triggered the event' }),
  metadata: z.record(z.any()).optional().openapi({ description: 'Additional metadata' }),
  duration: z.number().optional().openapi({ description: 'Duration in milliseconds' }),
  tokenUsage: TokenUsageSchema.optional().openapi({ description: 'Token usage info' }),
}).openapi('AuditLog');

export type AuditLog = z.infer<typeof AuditLogSchema>;

// Create Audit Log DTO
export const CreateAuditLogDtoSchema = z.object({
  eventType: AuditEventTypeSchema,
  agentId: z.string().optional(),
  taskId: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  duration: z.number().optional(),
  tokenUsage: TokenUsageSchema.optional(),
}).openapi('CreateAuditLogDto');

export type CreateAuditLogDto = z.infer<typeof CreateAuditLogDtoSchema>;

// Query Audit Log DTO
export const QueryAuditLogDtoSchema = z.object({
  eventType: AuditEventTypeSchema.optional(),
  agentId: z.string().optional(),
  taskId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
}).openapi('QueryAuditLogDto');

export type QueryAuditLogDto = z.infer<typeof QueryAuditLogDtoSchema>;

// Audit Log List Response
export const AuditLogListResponseSchema = z.object({
  logs: z.array(AuditLogSchema),
  total: z.number(),
  hasMore: z.boolean(),
}).openapi('AuditLogListResponse');

export type AuditLogListResponse = z.infer<typeof AuditLogListResponseSchema>;

