import { apiClient } from './client';
import type {
  UserResponse,
  ListUsersResponse,
  CreateUserRequest,
  UpdateUserRequest
} from '@notification-service/shared';

export const userApi = {
  create: async (data: CreateUserRequest): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>('/users', data);
    return response.data;
  },

  list: async (params?: { page?: number; limit?: number; email?: string; phone?: string }): Promise<ListUsersResponse> => {
    const response = await apiClient.get<ListUsersResponse>('/users', { params });
    return response.data;
  },

  get: async (id: string): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>(`/users/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateUserRequest): Promise<UserResponse> => {
    const response = await apiClient.put<UserResponse>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
