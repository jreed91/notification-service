import { apiClient } from './client';
import { NotificationTemplate, CreateTemplateRequest } from '@notification-service/shared';

export const templateApi = {
  create: async (data: CreateTemplateRequest): Promise<NotificationTemplate> => {
    const response = await apiClient.post<NotificationTemplate>('/templates', data);
    return response.data;
  },

  list: async (): Promise<{ templates: NotificationTemplate[] }> => {
    const response = await apiClient.get('/templates');
    return response.data;
  },

  get: async (key: string): Promise<NotificationTemplate> => {
    const response = await apiClient.get<NotificationTemplate>(`/templates/${key}`);
    return response.data;
  },

  update: async (key: string, data: Partial<CreateTemplateRequest>): Promise<NotificationTemplate> => {
    const response = await apiClient.put<NotificationTemplate>(`/templates/${key}`, data);
    return response.data;
  },

  delete: async (key: string): Promise<void> => {
    await apiClient.delete(`/templates/${key}`);
  },
};
