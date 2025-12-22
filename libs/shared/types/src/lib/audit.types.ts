export enum AuditEventType {
  AGENT_CREATED = 'AGENT_CREATED',
  AGENT_UPDATED = 'AGENT_UPDATED',
  AGENT_DELETED = 'AGENT_DELETED',
  TASK_STARTED = 'TASK_STARTED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_FAILED = 'TASK_FAILED',
  TASK_DELETED = 'TASK_DELETED',
  PROMPT_SENT = 'PROMPT_SENT',
  RESPONSE_RECEIVED = 'RESPONSE_RECEIVED',
  MODEL_PULLED = 'MODEL_PULLED',
  TOKEN_ISSUED = 'TOKEN_ISSUED',
  TOKEN_VALIDATED = 'TOKEN_VALIDATED',
  API_CALL = 'API_CALL',
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  agentId?: string;
  taskId?: string;
  userId?: string;
  metadata: Record<string, any>;
  duration?: number;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface CreateAuditLogDto {
  eventType: AuditEventType;
  agentId?: string;
  taskId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  duration?: number;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AuditLogQuery {
  eventType?: AuditEventType | AuditEventType[];
  agentId?: string;
  taskId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

