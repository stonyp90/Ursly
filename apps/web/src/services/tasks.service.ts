import { apiClient } from './api';
import type { Task, CreateTaskDto } from '@ursly/shared/types';

export interface TaskAccessControl {
  allowedUserIds?: string[];
  allowedGroupIds?: string[];
  requiredPermissions?: string[];
}

export interface CreateTaskWithAccessDto extends CreateTaskDto {
  accessControl?: TaskAccessControl;
}

export const tasksService = {
  async list(params?: {
    agentId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.agentId) query.append('agentId', params.agentId);
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());

    const response = await apiClient.get<{
      tasks: Task[];
      total: number;
      hasMore: boolean;
    }>(`/tasks?${query.toString()}`);
    return response.data;
  },

  async get(id: string) {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  async create(data: CreateTaskWithAccessDto) {
    const response = await apiClient.post<Task>('/tasks', data);
    return response.data;
  },

  async cancel(id: string) {
    const response = await apiClient.post<Task>(`/tasks/${id}/cancel`, {});
    return response.data;
  },

  async delete(id: string) {
    await apiClient.delete(`/tasks/${id}`);
  },

  async updateAccessControl(id: string, accessControl: TaskAccessControl) {
    const response = await apiClient.put<Task>(
      `/tasks/${id}/access`,
      accessControl,
    );
    return response.data;
  },

  async getAccessControl(id: string) {
    const response = await apiClient.get<TaskAccessControl>(
      `/tasks/${id}/access`,
    );
    return response.data;
  },
};
