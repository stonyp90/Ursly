import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  AuditLog,
  CreateAuditLogDto,
  QueryAuditLogDto,
  AuditLogListResponse,
} from '@ursly/shared/types';
import { IAuditLogRepository } from '../../../application/ports/audit-log.repository.port';

interface AuditLogDocument {
  _id: string;
  timestamp: Date;
  eventType: string;
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

@Injectable()
export class AuditLogRepositoryAdapter implements IAuditLogRepository {
  constructor(
    @InjectModel('AuditLog')
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = new this.auditLogModel({
      _id: uuidv4(),
      ...dto,
      timestamp: new Date(),
    });

    const saved = await auditLog.save();
    return this.toAuditLog(saved);
  }

  async findById(id: string): Promise<AuditLog | null> {
    const doc = await this.auditLogModel.findById(id).lean().exec();
    return doc ? this.toAuditLog(doc as AuditLogDocument) : null;
  }

  async query(query: QueryAuditLogDto): Promise<AuditLogListResponse> {
    const filter: Record<string, any> = {};

    if (query.eventType) filter.eventType = query.eventType;
    if (query.agentId) filter.agentId = query.agentId;
    if (query.taskId) filter.taskId = query.taskId;
    if (query.userId) filter.userId = query.userId;

    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) filter.timestamp.$gte = query.startDate;
      if (query.endDate) filter.timestamp.$lte = query.endDate;
    }

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .skip(query.offset)
        .limit(query.limit)
        .sort({ timestamp: -1 })
        .lean()
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return {
      logs: logs.map((l) => this.toAuditLog(l as AuditLogDocument)),
      total,
      hasMore: query.offset + logs.length < total,
    };
  }

  async findByAgentId(agentId: string, limit = 100): Promise<AuditLog[]> {
    const docs = await this.auditLogModel
      .find({ agentId })
      .limit(limit)
      .sort({ timestamp: -1 })
      .lean()
      .exec();

    return docs.map((d) => this.toAuditLog(d as AuditLogDocument));
  }

  async findByTaskId(taskId: string): Promise<AuditLog[]> {
    const docs = await this.auditLogModel
      .find({ taskId })
      .sort({ timestamp: -1 })
      .lean()
      .exec();

    return docs.map((d) => this.toAuditLog(d as AuditLogDocument));
  }

  async findByUserId(userId: string, limit = 100): Promise<AuditLog[]> {
    const docs = await this.auditLogModel
      .find({ userId })
      .limit(limit)
      .sort({ timestamp: -1 })
      .lean()
      .exec();

    return docs.map((d) => this.toAuditLog(d as AuditLogDocument));
  }

  private toAuditLog(doc: AuditLogDocument): AuditLog {
    return {
      id: doc._id,
      timestamp: doc.timestamp,
      eventType: doc.eventType as AuditLog['eventType'],
      agentId: doc.agentId,
      taskId: doc.taskId,
      userId: doc.userId,
      metadata: doc.metadata,
      duration: doc.duration,
      tokenUsage: doc.tokenUsage,
    };
  }
}
