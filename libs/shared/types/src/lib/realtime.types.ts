/**
 * Real-time Event Types for WebSocket Communication
 */

/**
 * Entity types that can emit real-time events
 */
export type RealtimeEntityType =
  | 'agent'
  | 'model'
  | 'task'
  | 'conversation'
  | 'audit-log'
  | 'organization';

/**
 * Real-time event types
 */
export type RealtimeEventType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'progress'
  | 'stream'
  | 'error'
  | 'connected'
  | 'disconnected';

/**
 * Base real-time event structure
 */
export interface RealtimeEvent<T = unknown> {
  id: string;
  entityType: RealtimeEntityType;
  entityId: string;
  eventType: RealtimeEventType;
  data: T;
  timestamp: Date;
  organizationId: string;
  userId?: string;
}

/**
 * Agent-specific events
 */
export interface AgentRealtimeEvent extends RealtimeEvent {
  entityType: 'agent';
  data: {
    agentId: string;
    name?: string;
    status?: string;
    previousStatus?: string;
    model?: string;
    contextUsage?: {
      current: number;
      max: number;
      percentage: number;
    };
  };
}

/**
 * Model-specific events
 */
export interface ModelRealtimeEvent extends RealtimeEvent {
  entityType: 'model';
  data: {
    modelName: string;
    status?: 'pulling' | 'ready' | 'error' | 'deleted';
    progress?: number;
    size?: number;
    error?: string;
  };
}

/**
 * Task-specific events
 */
export interface TaskRealtimeEvent extends RealtimeEvent {
  entityType: 'task';
  data: {
    taskId: string;
    status?: string;
    progress?: number;
    result?: unknown;
    error?: string;
    streamChunk?: string;
  };
}

/**
 * Conversation-specific events
 */
export interface ConversationRealtimeEvent extends RealtimeEvent {
  entityType: 'conversation';
  data: {
    conversationId: string;
    messageId?: string;
    role?: 'user' | 'assistant' | 'system';
    content?: string;
    streamChunk?: string;
    tokenCount?: number;
    isComplete?: boolean;
  };
}

/**
 * Audit log events (for real-time audit dashboard)
 */
export interface AuditRealtimeEvent extends RealtimeEvent {
  entityType: 'audit-log';
  data: {
    logId: string;
    action: string;
    resource: string;
    resourceId?: string;
    userId: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
  };
}

/**
 * WebSocket namespaces
 */
export const WS_NAMESPACES = {
  AGENTS: '/agents',
  MODELS: '/models',
  TASKS: '/tasks',
  CONVERSATIONS: '/conversations',
  AUDIT: '/audit',
  NOTIFICATIONS: '/notifications',
} as const;

/**
 * WebSocket room naming conventions
 */
export const WS_ROOMS = {
  entity: (type: RealtimeEntityType, id: string) => `${type}:${id}`,
  organization: (orgId: string) => `org:${orgId}`,
  user: (userId: string) => `user:${userId}`,
  all: (type: RealtimeEntityType) => `${type}:all`,
} as const;

/**
 * Subscription request
 */
export interface SubscriptionRequest {
  entityType: RealtimeEntityType;
  entityId?: string; // If not provided, subscribe to all entities of type
  organizationId: string;
}

/**
 * Subscription response
 */
export interface SubscriptionResponse {
  success: boolean;
  subscription: SubscriptionRequest;
  room: string;
  error?: string;
}

