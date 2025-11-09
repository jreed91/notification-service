import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Users } from '../pages/Users';
import * as userApi from '../api/users';

// Mock the API
vi.mock('../api/users');

describe('Users', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderUsers = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Users />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should render users page title', async () => {
    vi.spyOn(userApi.userApi, 'list').mockResolvedValue({
      users: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    vi.spyOn(userApi.userApi, 'list').mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderUsers();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display users when loaded', async () => {
    const mockUsers = [
      {
        id: 'user-123',
        email: 'user1@example.com',
        phoneNumber: '+1234567890',
        locale: 'en-US',
        tenantId: 'tenant-1',
        apnsTokens: [],
        fcmTokens: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user-456',
        email: 'user2@example.com',
        phoneNumber: '+0987654321',
        locale: 'es-ES',
        tenantId: 'tenant-1',
        apnsTokens: [],
        fcmTokens: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(userApi.userApi, 'list').mockResolvedValue({
      users: mockUsers,
      pagination: {
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
      expect(screen.getByText('en-US')).toBeInTheDocument();
      expect(screen.getByText('es-ES')).toBeInTheDocument();
    });
  });

  it('should have add user button', async () => {
    vi.spyOn(userApi.userApi, 'list').mockResolvedValue({
      users: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument();
    });
  });

  it('should display empty state when no users', async () => {
    vi.spyOn(userApi.userApi, 'list').mockResolvedValue({
      users: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('No users')).toBeInTheDocument();
      expect(screen.getByText(/Get started by creating a new user/)).toBeInTheDocument();
    });
  });

  it('should display device tokens when available', async () => {
    const mockUsers = [
      {
        id: 'user-123',
        email: 'user@example.com',
        locale: 'en-US',
        apnsTokens: ['apns-token'],
        fcmTokens: ['fcm-token'],
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(userApi.userApi, 'list').mockResolvedValue({
      users: mockUsers,
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('Apple: 1')).toBeInTheDocument();
      expect(screen.getByText('Google: 1')).toBeInTheDocument();
    });
  });

  it('should display table headers', async () => {
    vi.spyOn(userApi.userApi, 'list').mockResolvedValue({
      users: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Locale')).toBeInTheDocument();
      expect(screen.getByText('Devices')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });
});
