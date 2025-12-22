import { apiClient } from './api';
import type {
  Agent,
  CreateAgentDto,
  UpdateAgentDto,
} from '@ursly/shared/types';

export const agentsService = {
  async list(params?: { status?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());

    const response = await apiClient.get<{
      agents: Agent[];
      total: number;
      hasMore: boolean;
    }>(`/agents?${query.toString()}`);
    return response.data;
  },

  async get(id: string) {
    const response = await apiClient.get<Agent>(`/agents/${id}`);
    return response.data;
  },

  async create(data: CreateAgentDto) {
    const response = await apiClient.post<Agent>('/agents', data);
    return response.data;
  },

  async update(id: string, data: UpdateAgentDto) {
    const response = await apiClient.put<Agent>(`/agents/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    await apiClient.delete(`/agents/${id}`);
  },

  async changeStatus(id: string, action: 'start' | 'stop' | 'suspend') {
    const response = await apiClient.post<Agent>(`/agents/${id}/${action}`, {});
    return response.data;
  },
};
