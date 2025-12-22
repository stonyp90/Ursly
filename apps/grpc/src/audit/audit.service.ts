import { Injectable } from '@nestjs/common';

interface AuditEvent {
  eventType: string;
  agentId?: string;
  taskId?: string;
  duration?: number;
  metadata?: any;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

@Injectable()
export class AuditService {
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      // In production, this would write to MongoDB
      // For now, just log to console
      console.log('[AUDIT]', {
        ...event,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log audit event:', error.message);
    }
  }
}

