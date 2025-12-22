import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLogDocument } from '@ursly/audit-logger';
import {
  CreateAuditLogDto,
  AuditLogQuery,
  AuditLog,
} from '@ursly/shared/types';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel('AuditLog') private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = new this.auditLogModel({
      ...dto,
      timestamp: new Date(),
    });

    const saved = await auditLog.save();
    return saved.toJSON() as unknown as AuditLog;
  }

  async query(query: AuditLogQuery): Promise<{
    logs: AuditLog[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      eventType,
      agentId,
      taskId,
      userId,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = query;

    const filter: any = {};

    if (eventType) {
      if (Array.isArray(eventType)) {
        filter.eventType = { $in: eventType };
      } else {
        filter.eventType = eventType;
      }
    }

    if (agentId) {
      filter.agentId = agentId;
    }

    if (taskId) {
      filter.taskId = taskId;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = startDate;
      }
      if (endDate) {
        filter.timestamp.$lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return {
      logs: logs.map((log) => ({
        ...log,
        id: log._id.toString(),
      })) as AuditLog[],
      total,
      hasMore: offset + logs.length < total,
    };
  }

  async getStats(agentId?: string): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    avgDuration?: number;
  }> {
    const filter = agentId ? { agentId } : {};

    const [total, eventsByType, avgDuration] = await Promise.all([
      this.auditLogModel.countDocuments(filter).exec(),
      this.auditLogModel
        .aggregate([
          { $match: filter },
          { $group: { _id: '$eventType', count: { $sum: 1 } } },
        ])
        .exec(),
      this.auditLogModel
        .aggregate([
          { $match: { ...filter, duration: { $exists: true } } },
          { $group: { _id: null, avg: { $avg: '$duration' } } },
        ])
        .exec(),
    ]);

    const eventsByTypeMap: Record<string, number> = {};
    eventsByType.forEach((item) => {
      eventsByTypeMap[item._id] = item.count;
    });

    return {
      totalEvents: total,
      eventsByType: eventsByTypeMap,
      avgDuration: avgDuration[0]?.avg,
    };
  }
}
