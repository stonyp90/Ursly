import {
  Task,
  CreateTaskDto,
  QueryTaskDto,
  TaskListResponse,
  TaskStatus,
} from '@ursly/shared/types';

/**
 * Port (interface) for Task Repository
 * This defines the contract that any adapter must implement
 */
export interface ITaskRepository {
  /**
   * Create a new task
   */
  create(dto: CreateTaskDto, createdBy: string): Promise<Task>;

  /**
   * Find a task by ID
   */
  findById(id: string): Promise<Task | null>;

  /**
   * Find all tasks with pagination and filtering
   */
  findAll(query: QueryTaskDto): Promise<TaskListResponse>;

  /**
   * Update task status
   */
  updateStatus(
    id: string,
    status: TaskStatus,
    result?: string,
    error?: string,
  ): Promise<Task | null>;

  /**
   * Mark task as started
   */
  markStarted(id: string): Promise<Task | null>;

  /**
   * Mark task as completed
   */
  markCompleted(id: string, result: string): Promise<Task | null>;

  /**
   * Mark task as failed
   */
  markFailed(id: string, error: string): Promise<Task | null>;

  /**
   * Delete a task by ID
   */
  delete(id: string): Promise<boolean>;
}

export const TASK_REPOSITORY = Symbol('ITaskRepository');
