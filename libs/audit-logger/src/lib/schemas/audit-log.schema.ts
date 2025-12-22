import { Schema, model, Document } from 'mongoose';
import {
  AuditLog,
  AuditEventType,
  AuditEventTypeSchema,
} from '@ursly/shared/types';

// Audit event types - lowercase values matching Zod schema
const AUDIT_EVENT_TYPES = AuditEventTypeSchema.options;

export interface AuditLogDocument {
  timestamp: Date;
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

const TokenUsageSchema = new Schema(
  {
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number,
  },
  { _id: false },
);

const AuditLogSchema = new Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: AUDIT_EVENT_TYPES,
      required: true,
      index: true,
    },
    agentId: {
      type: String,
      index: true,
    },
    taskId: {
      type: String,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    duration: {
      type: Number,
    },
    tokenUsage: {
      type: TokenUsageSchema,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes for performance
AuditLogSchema.index({ eventType: 1, timestamp: -1 });
AuditLogSchema.index({ agentId: 1, timestamp: -1 });
AuditLogSchema.index({ taskId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

// Compound indexes for common query patterns
AuditLogSchema.index({ agentId: 1, eventType: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, eventType: 1, timestamp: -1 });

// TTL index to automatically delete old audit logs after 90 days (optional)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

export const AuditLogModel = model<AuditLogDocument & Document>(
  'AuditLog',
  AuditLogSchema,
);
