/**
 * Task Queue for agent task management
 * Placeholder for future implementation
 */

export interface QueuedTask {
  id: string;
  agentId: string;
  prompt: string;
  priority: number;
  createdAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface TaskQueueConfig {
  maxConcurrent: number;
  retryAttempts: number;
  retryDelayMs: number;
}

export class TaskQueue {
  private queue: QueuedTask[] = [];
  private config: TaskQueueConfig;

  constructor(config?: Partial<TaskQueueConfig>) {
    this.config = {
      maxConcurrent: config?.maxConcurrent || 1,
      retryAttempts: config?.retryAttempts || 3,
      retryDelayMs: config?.retryDelayMs || 1000,
    };
  }

  enqueue(task: Omit<QueuedTask, 'createdAt' | 'status'>): QueuedTask {
    const queuedTask: QueuedTask = {
      ...task,
      createdAt: new Date(),
      status: 'pending',
    };
    
    this.queue.push(queuedTask);
    this.queue.sort((a, b) => b.priority - a.priority);
    
    return queuedTask;
  }

  dequeue(): QueuedTask | undefined {
    return this.queue.shift();
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getTasksByAgent(agentId: string): QueuedTask[] {
    return this.queue.filter(t => t.agentId === agentId);
  }

  removeTask(taskId: string): boolean {
    const index = this.queue.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  clear(): void {
    this.queue = [];
  }
}

