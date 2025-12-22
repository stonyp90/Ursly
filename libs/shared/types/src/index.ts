// Core model types
export * from './lib/model.types';

// Auth types
export * from './lib/auth.types';

// Zod Schemas - these are the primary exports
export {
  // Agent
  AgentSchema,
  AgentStatusSchema,
  CreateAgentDtoSchema,
  UpdateAgentDtoSchema,
  QueryAgentDtoSchema,
  AgentListResponseSchema,
  type Agent,
  type AgentStatus,
  type CreateAgentDto,
  type UpdateAgentDto,
  type QueryAgentDto,
  type AgentListResponse,
  // Task
  TaskSchema,
  TaskStatusSchema,
  CreateTaskDtoSchema,
  QueryTaskDtoSchema,
  TaskListResponseSchema,
  TaskStreamEventSchema,
  type Task,
  type TaskStatus,
  type CreateTaskDto,
  type QueryTaskDto,
  type TaskListResponse,
  type TaskStreamEvent,
  // Audit Log
  AuditLogSchema,
  AuditEventTypeSchema,
  TokenUsageSchema,
  CreateAuditLogDtoSchema,
  QueryAuditLogDtoSchema,
  AuditLogListResponseSchema,
  type AuditLog,
  type AuditEventType,
  type TokenUsage,
  type CreateAuditLogDto,
  type QueryAuditLogDto,
  type AuditLogListResponse,
} from './lib/schemas';

// Runtime enum values for backwards compatibility
export { AgentStatus as AgentStatusEnum } from './lib/agent.types';
export { TaskStatus as TaskStatusEnum } from './lib/task.types';
export { AuditEventType as AuditEventTypeEnum } from './lib/audit.types';

// Legacy types (deprecated - use Zod schemas)
export { AuditLogQuery } from './lib/audit.types';

// Real-time event types
export * from './lib/realtime.types';

