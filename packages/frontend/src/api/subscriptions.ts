import { apiClient } from './client';
import { UserSubscription, UpdateSubscriptionRequest } from '@notification-service/shared';

export const subscriptionApi = {
  list: async (userId: string): Promise<{ subscriptions: UserSubscription[] }> => {
    const response = await apiClient.get(`/users/${userId}/subscriptions`);
    return response.data;
  },

  update: async (userId: string, data: UpdateSubscriptionRequest): Promise<UserSubscription> => {
    const response = await apiClient.put<UserSubscription>(`/users/${userId}/subscriptions`, data);
    return response.data;
  },

  delete: async (userId: string, templateKey: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/subscriptions/${templateKey}`);
  },
};
