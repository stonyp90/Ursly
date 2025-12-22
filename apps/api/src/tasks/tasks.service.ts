import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { TaskDocument } from '@ursly/audit-logger';
import {
  Task,
  TaskStatusEnum,
  CreateTaskDto,
  AuditEventTypeEnum,
} from '@ursly/shared/types';
import { AuditService } from '../audit/audit.service';
import { TasksGateway } from './tasks.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  private readonly ollamaUrl: string;

  constructor(
    @InjectModel('Task') private taskModel: Model<TaskDocument>,
    private configService: ConfigService,
    private auditService: AuditService,
    private tasksGateway: TasksGateway,
    private notificationsService: NotificationsService,
  ) {
    this.ollamaUrl =
      this.configService.get<string>('OLLAMA_URL') || 'http://localhost:11434';
  }

  async create(dto: CreateTaskDto, userId: string): Promise<Task> {
    const task = new this.taskModel({
      ...dto,
      createdBy: userId,
      status: TaskStatusEnum.PENDING,
    });

    const saved = await task.save();
    const taskObj = saved.toJSON() as unknown as Task;

    // Audit log
    await this.auditService.log({
      eventType: 'task_started',
      agentId: dto.agentId,
      taskId: taskObj.id,
      userId,
      metadata: { prompt: dto.prompt },
    });

    // Execute task asynchronously
    this.executeTask(taskObj.id, dto, userId).catch((error) => {
      console.error('Task execution failed:', error);
    });

    return taskObj;
  }

  async findAll(query: {
    agentId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const filter: any = {};
    if (query.agentId) {
      filter.agentId = query.agentId;
    }
    if (query.status) {
      filter.status = query.status;
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const [tasks, total] = await Promise.all([
      this.taskModel
        .find(filter)
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.taskModel.countDocuments(filter).exec(),
    ]);

    return {
      tasks: tasks.map((t) => ({ ...t, id: t._id.toString() })) as Task[],
      total,
      hasMore: offset + tasks.length < total,
    };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskModel.findById(id).lean().exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return { ...task, id: task._id.toString() } as Task;
  }

  async cancel(id: string): Promise<Task> {
    const task = await this.taskModel
      .findByIdAndUpdate(
        id,
        { status: TaskStatusEnum.CANCELLED, completedAt: new Date() },
        { new: true },
      )
      .lean()
      .exec();

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Emit WebSocket event
    this.tasksGateway.emitTaskUpdate(id, {
      type: 'status',
      data: { status: TaskStatusEnum.CANCELLED },
      taskId: id,
      timestamp: new Date(),
    });

    return { ...task, id: task._id.toString() } as Task;
  }

  async delete(id: string, userId?: string): Promise<void> {
    const task = await this.taskModel.findById(id).lean().exec();

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    await this.taskModel.findByIdAndDelete(id).exec();

    // Emit WebSocket event for deletion
    this.tasksGateway.emitTaskUpdate(id, {
      type: 'status',
      data: { deleted: true },
      taskId: id,
      timestamp: new Date(),
    });

    // Audit log
    await this.auditService.log({
      eventType: 'task_deleted',
      agentId: task.agentId,
      taskId: id,
      userId,
      metadata: { prompt: task.prompt },
    });
  }

  private async executeTask(
    taskId: string,
    dto: CreateTaskDto,
    userId: string,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Update status to running
      await this.taskModel.findByIdAndUpdate(taskId, {
        status: TaskStatusEnum.RUNNING,
        startedAt: new Date(),
      });

      // Emit WebSocket event
      this.tasksGateway.emitTaskUpdate(taskId, {
        type: 'status',
        data: { status: TaskStatusEnum.RUNNING },
        taskId,
        timestamp: new Date(),
      });

      // Send task started notification
      await this.notificationsService.notifyTaskStarted(
        userId,
        taskId,
        dto.prompt,
        dto.agentId,
      );

      // Call Ollama API
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'llama2', // TODO: Get from agent configuration
        prompt: dto.prompt,
        stream: false,
      });

      const duration = Date.now() - startTime;
      const result = response.data.response;

      // Update task with result
      await this.taskModel.findByIdAndUpdate(taskId, {
        status: TaskStatusEnum.COMPLETED,
        result,
        completedAt: new Date(),
      });

      // Emit completion event
      this.tasksGateway.emitTaskUpdate(taskId, {
        type: 'complete',
        data: { result },
        taskId,
        timestamp: new Date(),
      });

      // Send task completed notification
      await this.notificationsService.notifyTaskCompleted(
        userId,
        taskId,
        dto.prompt,
        dto.agentId,
        duration,
      );

      // Audit log
      await this.auditService.log({
        eventType: 'task_completed',
        agentId: dto.agentId,
        taskId,
        duration,
        metadata: { success: true },
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      // Update task with error
      await this.taskModel.findByIdAndUpdate(taskId, {
        status: TaskStatusEnum.FAILED,
        error: error.message,
        completedAt: new Date(),
      });

      // Emit error event
      this.tasksGateway.emitTaskUpdate(taskId, {
        type: 'error',
        data: { error: error.message },
        taskId,
        timestamp: new Date(),
      });

      // Send task failed notification
      await this.notificationsService.notifyTaskFailed(
        userId,
        taskId,
        dto.prompt,
        dto.agentId,
        error.message,
        duration,
      );

      // Audit log
      await this.auditService.log({
        eventType: 'task_failed',
        agentId: dto.agentId,
        taskId,
        duration,
        metadata: { error: error.message },
      });
    }
  }
}
