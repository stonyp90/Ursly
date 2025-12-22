import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { RealtimeGateway } from './realtime.gateway';
import {
  RealtimeEvent,
  RealtimeEntityType,
  RealtimeEventType,
  AgentRealtimeEvent,
  ModelRealtimeEvent,
  TaskRealtimeEvent,
  ConversationRealtimeEvent,
  AuditRealtimeEvent,
} from '@ursly/shared/types';

@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  /**
   * Create and emit a real-time event
   */
  private emit<T>(
    entityType: RealtimeEntityType,
    entityId: string,
    eventType: RealtimeEventType,
    organizationId: string,
    data: T,
    userId?: string,
  ): RealtimeEvent<T> {
    const event: RealtimeEvent<T> = {
      id: uuid(),
      entityType,
      entityId,
      eventType,
      data,
      timestamp: new Date(),
      organizationId,
      userId,
    };

    this.gateway.emitToEntity(entityType, entityId, event);
    this.gateway.emitToOrganization(organizationId, event);

    return event;
  }

  // ========================
  // Agent Events
  // ========================

  emitAgentCreated(
    agentId: string,
    name: string,
    organizationId: string,
    userId?: string,
  ): void {
    this.emit<AgentRealtimeEvent['data']>(
      'agent',
      agentId,
      'created',
      organizationId,
      { agentId, name },
      userId,
    );
  }

  emitAgentUpdated(
    agentId: string,
    name: string,
    organizationId: string,
    userId?: string,
  ): void {
    this.emit<AgentRealtimeEvent['data']>(
      'agent',
      agentId,
      'updated',
      organizationId,
      { agentId, name },
      userId,
    );
  }

  emitAgentStatusChanged(
    agentId: string,
    status: string,
    previousStatus: string,
    organizationId: string,
  ): void {
    this.emit<AgentRealtimeEvent['data']>(
      'agent',
      agentId,
      'status_changed',
      organizationId,
      { agentId, status, previousStatus },
    );
  }

  emitAgentDeleted(
    agentId: string,
    organizationId: string,
    userId?: string,
  ): void {
    this.emit<AgentRealtimeEvent['data']>(
      'agent',
      agentId,
      'deleted',
      organizationId,
      { agentId },
      userId,
    );
  }

  emitAgentContextUsage(
    agentId: string,
    current: number,
    max: number,
    organizationId: string,
  ): void {
    this.emit<AgentRealtimeEvent['data']>(
      'agent',
      agentId,
      'progress',
      organizationId,
      {
        agentId,
        contextUsage: {
          current,
          max,
          percentage: Math.round((current / max) * 100),
        },
      },
    );
  }

  // ========================
  // Model Events
  // ========================

  emitModelPulling(
    modelName: string,
    progress: number,
    organizationId: string,
  ): void {
    this.emit<ModelRealtimeEvent['data']>(
      'model',
      modelName,
      'progress',
      organizationId,
      { modelName, status: 'pulling', progress },
    );
  }

  emitModelReady(
    modelName: string,
    size: number,
    organizationId: string,
  ): void {
    this.emit<ModelRealtimeEvent['data']>(
      'model',
      modelName,
      'status_changed',
      organizationId,
      { modelName, status: 'ready', size },
    );
  }

  emitModelDeleted(modelName: string, organizationId: string): void {
    this.emit<ModelRealtimeEvent['data']>(
      'model',
      modelName,
      'deleted',
      organizationId,
      { modelName, status: 'deleted' },
    );
  }

  emitModelError(
    modelName: string,
    error: string,
    organizationId: string,
  ): void {
    this.emit<ModelRealtimeEvent['data']>(
      'model',
      modelName,
      'error',
      organizationId,
      { modelName, status: 'error', error },
    );
  }

  // ========================
  // Task Events
  // ========================

  emitTaskCreated(
    taskId: string,
    organizationId: string,
    userId?: string,
  ): void {
    this.emit<TaskRealtimeEvent['data']>(
      'task',
      taskId,
      'created',
      organizationId,
      { taskId },
      userId,
    );
  }

  emitTaskProgress(
    taskId: string,
    progress: number,
    status: string,
    organizationId: string,
  ): void {
    this.emit<TaskRealtimeEvent['data']>(
      'task',
      taskId,
      'progress',
      organizationId,
      {
        taskId,
        progress,
        status,
      },
    );
  }

  emitTaskStream(taskId: string, chunk: string, organizationId: string): void {
    this.emit<TaskRealtimeEvent['data']>(
      'task',
      taskId,
      'stream',
      organizationId,
      {
        taskId,
        streamChunk: chunk,
      },
    );
  }

  emitTaskCompleted(
    taskId: string,
    result: unknown,
    organizationId: string,
  ): void {
    this.emit<TaskRealtimeEvent['data']>(
      'task',
      taskId,
      'status_changed',
      organizationId,
      { taskId, status: 'completed', result },
    );
  }

  emitTaskFailed(taskId: string, error: string, organizationId: string): void {
    this.emit<TaskRealtimeEvent['data']>(
      'task',
      taskId,
      'error',
      organizationId,
      {
        taskId,
        status: 'failed',
        error,
      },
    );
  }

  // ========================
  // Conversation Events
  // ========================

  emitConversationMessage(
    conversationId: string,
    messageId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    organizationId: string,
  ): void {
    this.emit<ConversationRealtimeEvent['data']>(
      'conversation',
      conversationId,
      'created',
      organizationId,
      { conversationId, messageId, role, content, isComplete: true },
    );
  }

  emitConversationStream(
    conversationId: string,
    chunk: string,
    organizationId: string,
  ): void {
    this.emit<ConversationRealtimeEvent['data']>(
      'conversation',
      conversationId,
      'stream',
      organizationId,
      { conversationId, streamChunk: chunk, isComplete: false },
    );
  }

  emitConversationComplete(
    conversationId: string,
    tokenCount: number,
    organizationId: string,
  ): void {
    this.emit<ConversationRealtimeEvent['data']>(
      'conversation',
      conversationId,
      'status_changed',
      organizationId,
      { conversationId, tokenCount, isComplete: true },
    );
  }

  // ========================
  // Audit Events
  // ========================

  emitAuditEvent(
    logId: string,
    action: string,
    resource: string,
    userId: string,
    organizationId: string,
    resourceId?: string,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
  ): void {
    this.emit<AuditRealtimeEvent['data']>(
      'audit-log',
      logId,
      'created',
      organizationId,
      { logId, action, resource, resourceId, userId, severity },
      userId,
    );
  }

  // ========================
  // User Notifications
  // ========================

  notifyUser(
    userId: string,
    notification: { title: string; message: string; type: string },
  ): void {
    const event: RealtimeEvent = {
      id: uuid(),
      entityType: 'agent', // Using agent as placeholder
      entityId: userId,
      eventType: 'connected',
      data: notification,
      timestamp: new Date(),
      organizationId: '',
      userId,
    };
    this.gateway.emitToUser(userId, event);
  }
}
