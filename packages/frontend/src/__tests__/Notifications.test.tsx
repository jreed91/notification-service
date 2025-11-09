import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Notifications from '../pages/Notifications';
import * as notificationHooks from '../hooks/useNotifications';

// Mock the hooks
vi.mock('../hooks/useNotifications');

describe('Notifications', () => {
  const renderNotifications = () => {
    return render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>
    );
  };

  it('should render notifications page title', () => {
    vi.spyOn(notificationHooks, 'useNotifications').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderNotifications();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    vi.spyOn(notificationHooks, 'useNotifications').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderNotifications();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    vi.spyOn(notificationHooks, 'useNotifications').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: vi.fn(),
    } as any);

    renderNotifications();
    expect(screen.getByText(/Failed to load notifications/)).toBeInTheDocument();
  });

  it('should display notifications when loaded', () => {
    const mockNotifications = [
      {
        id: '1',
        userId: 'user-1',
        templateKey: 'welcome',
        channel: 'EMAIL',
        status: 'SENT' as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'user-2',
        templateKey: 'reset-password',
        channel: 'SMS',
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(notificationHooks, 'useNotifications').mockReturnValue({
      data: { notifications: mockNotifications, total: 2 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderNotifications();
    expect(screen.getByText('welcome')).toBeInTheDocument();
    expect(screen.getByText('reset-password')).toBeInTheDocument();
    expect(screen.getByText('SENT')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('should have send notification button', () => {
    vi.spyOn(notificationHooks, 'useNotifications').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderNotifications();
    expect(screen.getByRole('link', { name: /send notification/i })).toBeInTheDocument();
  });

  it('should display notification count', () => {
    const mockNotifications = [
      {
        id: '1',
        userId: 'user-1',
        templateKey: 'welcome',
        status: 'SENT' as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'user-2',
        templateKey: 'reset',
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(notificationHooks, 'useNotifications').mockReturnValue({
      data: { notifications: mockNotifications, total: 2 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderNotifications();
    expect(screen.getByText(/2.*total/i)).toBeInTheDocument();
  });
});
