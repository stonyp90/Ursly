import { Schema, model, Document } from 'mongoose';
import { Task, TaskStatus, TaskStatusEnum } from '@ursly/shared/types';

export interface TaskDocument {
  agentId: string;
  prompt: string;
  status: TaskStatus;
  result?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

const TaskSchema = new Schema(
  {
    agentId: {
      type: String,
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatusEnum),
      default: TaskStatusEnum.PENDING,
      required: true,
      index: true,
    },
    result: {
      type: String,
    },
    error: {
      type: String,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
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
TaskSchema.index({ agentId: 1, status: 1 });
TaskSchema.index({ createdBy: 1, status: 1 });
TaskSchema.index({ createdAt: -1 });
TaskSchema.index({ completedAt: -1 });

// Compound index for common queries
TaskSchema.index({ agentId: 1, createdAt: -1 });

export const TaskModel = model<TaskDocument & Document>('Task', TaskSchema);
