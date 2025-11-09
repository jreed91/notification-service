import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Users from '../pages/Users';
import * as userHooks from '../hooks/useUsers';

// Mock the hooks
vi.mock('../hooks/useUsers');

describe('Users', () => {
  const renderUsers = () => {
    return render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    );
  };

  it('should render users page title', () => {
    vi.spyOn(userHooks, 'useUsers').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderUsers();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    vi.spyOn(userHooks, 'useUsers').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderUsers();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    vi.spyOn(userHooks, 'useUsers').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: vi.fn(),
    } as any);

    renderUsers();
    expect(screen.getByText(/Failed to load users/)).toBeInTheDocument();
  });

  it('should display users when loaded', () => {
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        phoneNumber: '+1234567890',
        locale: 'en-US',
      },
      {
        id: '2',
        email: 'user2@example.com',
        phoneNumber: '+0987654321',
        locale: 'es-ES',
      },
    ];

    vi.spyOn(userHooks, 'useUsers').mockReturnValue({
      data: { users: mockUsers },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderUsers();
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
  });

  it('should have create user button', () => {
    vi.spyOn(userHooks, 'useUsers').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderUsers();
    expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
  });

  it('should display user count when users are loaded', () => {
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        locale: 'en-US',
      },
      {
        id: '2',
        email: 'user2@example.com',
        locale: 'es-ES',
      },
    ];

    vi.spyOn(userHooks, 'useUsers').mockReturnValue({
      data: { users: mockUsers },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderUsers();
    expect(screen.getByText(/2.*users/i)).toBeInTheDocument();
  });
});
