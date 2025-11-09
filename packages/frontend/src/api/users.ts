import { apiClient } from './client';
import { User, CreateUserRequest } from '@notification-service/shared';

export const userApi = {
  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  },

  list: async (params?: { limit?: number; offset?: number }): Promise<{ users: User[] }> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  get: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateUserRequest>): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}`, data);
    return response.data;
  },
};
