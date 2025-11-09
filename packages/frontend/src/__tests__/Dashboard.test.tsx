import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import * as notificationHooks from '../hooks/useNotifications';

// Mock the hooks
vi.mock('../hooks/useNotifications');

describe('Dashboard', () => {
  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  };

  it('should render dashboard title', () => {
    vi.spyOn(notificationHooks, 'useNotifications').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderDashboard();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    vi.spyOn(notificationHooks, 'useNotifications').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderDashboard();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    vi.spyOn(notificationHooks, 'useNotifications').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: vi.fn(),
    } as any);

    renderDashboard();
    expect(screen.getByText(/Failed to load notifications/)).toBeInTheDocument();
  });

  it('should display notifications when loaded', () => {
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
        templateKey: 'reset-password',
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

    renderDashboard();
    expect(screen.getByText('welcome')).toBeInTheDocument();
    expect(screen.getByText('reset-password')).toBeInTheDocument();
  });

  it('should display navigation links', () => {
    vi.spyOn(notificationHooks, 'useNotifications').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderDashboard();
    expect(screen.getByRole('link', { name: /templates/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /notifications/i })).toBeInTheDocument();
  });
});
