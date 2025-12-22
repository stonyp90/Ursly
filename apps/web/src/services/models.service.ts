import { apiClient } from './api';
import type { Model, PullModelDto } from '@ursly/shared/types';

export const modelsService = {
  async list() {
    const response = await apiClient.get<{ models: Model[] }>('/models');
    return response.data;
  },

  async pull(data: PullModelDto) {
    const response = await apiClient.post<{ status: string }>(
      '/models/pull',
      data,
    );
    return response.data;
  },

  async delete(name: string) {
    await apiClient.delete(`/models/${name}`);
  },

  async show(name: string) {
    const response = await apiClient.get<any>(`/models/${name}`);
    return response.data;
  },
};
