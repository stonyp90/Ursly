import { connect, connection, Connection } from 'mongoose';
import {
  CreateAuditLogDto,
  AuditLogQuery,
  AuditLog,
} from '@ursly/shared/types';
import { AuditLogModel } from './schemas';

export class AuditService {
  private connection: Connection | null = null;

  async connect(uri: string): Promise<void> {
    await connect(uri);
    this.connection = connection;
    console.log('MongoDB connected for audit logging');
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  async createAuditLog(dto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = new AuditLogModel({
      ...dto,
      timestamp: new Date(),
    });

    await auditLog.save();
    const result = await AuditLogModel.findById(auditLog._id).lean().exec();
    return {
      ...result,
      id: result?._id?.toString() || '',
    } as AuditLog;
  }

  async queryAuditLogs(query: AuditLogQuery): Promise<{
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
      AuditLogModel.find(filter)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec(),
      AuditLogModel.countDocuments(filter).exec(),
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

  async deleteOldAuditLogs(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await AuditLogModel.deleteMany({
      timestamp: { $lt: cutoffDate },
    }).exec();

    return result.deletedCount || 0;
  }

  async getAuditLogStats(agentId?: string): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    avgDuration?: number;
  }> {
    const filter = agentId ? { agentId } : {};

    const [total, eventsByType, avgDuration] = await Promise.all([
      AuditLogModel.countDocuments(filter).exec(),
      AuditLogModel.aggregate([
        { $match: filter },
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
      ]).exec(),
      AuditLogModel.aggregate([
        { $match: { ...filter, duration: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$duration' } } },
      ]).exec(),
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
