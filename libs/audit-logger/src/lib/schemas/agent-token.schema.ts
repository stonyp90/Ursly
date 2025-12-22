import { Schema, model, Document } from 'mongoose';
import { AgentToken } from '@ursly/shared/types';

export interface AgentTokenDocument {
  agentId: string;
  token: string;
  issuedAt: Date;
  expiresAt: Date;
  userId: string;
}

const AgentTokenSchema = new Schema(
  {
    agentId: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
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

// TTL index to automatically delete expired tokens
AgentTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for common queries
AgentTokenSchema.index({ agentId: 1, expiresAt: 1 });
AgentTokenSchema.index({ userId: 1, expiresAt: 1 });

export const AgentTokenModel = model<AgentTokenDocument & Document>(
  'AgentToken',
  AgentTokenSchema,
);
