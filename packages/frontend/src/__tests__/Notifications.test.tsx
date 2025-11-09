import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Notifications } from '../pages/Notifications';
import * as notificationApi from '../api/notifications';
import { NotificationStatus } from '@notification-service/shared';

// Mock the API
vi.mock('../api/notifications');

describe('Notifications', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderNotifications = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Notifications />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should render notifications page title', async () => {
    vi.spyOn(notificationApi.notificationApi, 'list').mockResolvedValue({
      notifications: [],
      total: 0,
    });

    renderNotifications();

    await waitFor(() => {
      expect(screen.getByText('Notification History')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    vi.spyOn(notificationApi.notificationApi, 'list').mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderNotifications();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display notifications when loaded', async () => {
    const mockNotifications = [
      {
        id: '1',
        userId: 'user-1',
        templateKey: 'welcome',
        channel: 'EMAIL',
        status: NotificationStatus.SENT,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'user-2',
        templateKey: 'reset-password',
        channel: 'SMS',
        status: NotificationStatus.PENDING,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(notificationApi.notificationApi, 'list').mockResolvedValue({
      notifications: mockNotifications,
      total: 2,
    });

    renderNotifications();

    await waitFor(() => {
      expect(screen.getByText('welcome')).toBeInTheDocument();
      expect(screen.getByText('reset-password')).toBeInTheDocument();
      expect(screen.getByText('EMAIL')).toBeInTheDocument();
      expect(screen.getByText('SMS')).toBeInTheDocument();
      expect(screen.getByText('SENT')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });
  });

  it('should display empty state when no notifications', async () => {
    vi.spyOn(notificationApi.notificationApi, 'list').mockResolvedValue({
      notifications: [],
      total: 0,
    });

    renderNotifications();

    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument();
      expect(
        screen.getByText(/Notifications will appear here once you start sending them/)
      ).toBeInTheDocument();
    });
  });

  it('should display table headers', async () => {
    vi.spyOn(notificationApi.notificationApi, 'list').mockResolvedValue({
      notifications: [],
      total: 0,
    });

    renderNotifications();

    await waitFor(() => {
      expect(screen.getByText('Template')).toBeInTheDocument();
      expect(screen.getByText('Channel')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
    });
  });

  it('should display notification with correct status color', async () => {
    const mockNotifications = [
      {
        id: '1',
        userId: 'user-1',
        templateKey: 'test',
        channel: 'EMAIL',
        status: NotificationStatus.FAILED,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(notificationApi.notificationApi, 'list').mockResolvedValue({
      notifications: mockNotifications,
      total: 1,
    });

    renderNotifications();

    await waitFor(() => {
      const statusBadge = screen.getByText('FAILED');
      expect(statusBadge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });
});
