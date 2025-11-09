import { apiClient } from './client';
import {
  SendNotificationRequest,
  SendNotificationResponse,
  Notification,
} from '@notification-service/shared';

export const notificationApi = {
  send: async (data: SendNotificationRequest): Promise<SendNotificationResponse> => {
    const response = await apiClient.post<SendNotificationResponse>('/notifications/send', data);
    return response.data;
  },

  list: async (params?: {
    userId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ notifications: Notification[]; total: number }> => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },
};
