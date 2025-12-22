export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Task {
  id: string;
  agentId: string;
  prompt: string;
  status: TaskStatus;
  result?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface CreateTaskDto {
  agentId: string;
  prompt: string;
  metadata?: Record<string, any>;
}

export interface TaskStreamEvent {
  taskId: string;
  type: 'status' | 'chunk' | 'complete' | 'error';
  data: any;
  timestamp: Date;
}

