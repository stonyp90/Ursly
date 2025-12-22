import { Schema, model, Document, Types } from 'mongoose';
import { Agent, AgentStatus, AgentStatusEnum } from '@ursly/shared/types';

// Define the document interface
export interface AgentDocument {
  name: string;
  model: string;
  systemPrompt: string;
  status: AgentStatus;
  capabilities: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

const AgentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    systemPrompt: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AgentStatusEnum),
      default: AgentStatusEnum.ACTIVE,
      required: true,
    },
    capabilities: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: String,
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
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
AgentSchema.index({ name: 1, createdBy: 1 });
AgentSchema.index({ status: 1 });
AgentSchema.index({ createdAt: -1 });

export const AgentModel = model<AgentDocument & Document>('Agent', AgentSchema);
