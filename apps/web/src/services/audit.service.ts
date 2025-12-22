import { apiClient } from './api';
import type { AuditLog, AuditLogQuery } from '@ursly/shared/types';

export const auditService = {
  async getLogs(params?: AuditLogQuery) {
    const query = new URLSearchParams();
    if (params?.eventType)
      query.append('eventType', params.eventType as string);
    if (params?.agentId) query.append('agentId', params.agentId);
    if (params?.taskId) query.append('taskId', params.taskId);
    if (params?.userId) query.append('userId', params.userId);
    if (params?.startDate)
      query.append('startDate', params.startDate.toISOString());
    if (params?.endDate) query.append('endDate', params.endDate.toISOString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());

    const response = await apiClient.get<{
      logs: AuditLog[];
      total: number;
      hasMore: boolean;
    }>(`/audit/logs?${query.toString()}`);
    return response.data;
  },

  async getStats(agentId?: string) {
    const query = agentId ? `?agentId=${agentId}` : '';
    const response = await apiClient.get<{
      totalEvents: number;
      eventsByType: Record<string, number>;
      avgDuration?: number;
    }>(`/audit/stats${query}`);
    return response.data;
  },
};
