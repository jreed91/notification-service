import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Templates from '../pages/Templates';
import * as templateHooks from '../hooks/useTemplates';

// Mock the hooks
vi.mock('../hooks/useTemplates');

describe('Templates', () => {
  const renderTemplates = () => {
    return render(
      <BrowserRouter>
        <Templates />
      </BrowserRouter>
    );
  };

  it('should render templates page title', () => {
    vi.spyOn(templateHooks, 'useTemplates').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderTemplates();
    expect(screen.getByText('Notification Templates')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    vi.spyOn(templateHooks, 'useTemplates').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderTemplates();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    vi.spyOn(templateHooks, 'useTemplates').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: vi.fn(),
    } as any);

    renderTemplates();
    expect(screen.getByText(/Failed to load templates/)).toBeInTheDocument();
  });

  it('should display templates when loaded', () => {
    const mockTemplates = [
      {
        id: '1',
        key: 'welcome',
        name: 'Welcome Message',
        description: 'Sent when user signs up',
        channels: ['EMAIL', 'APPLE_PUSH'],
        translations: {
          'en-US': {
            subject: 'Welcome!',
            body: 'Hello {{name}}',
          },
        },
      },
      {
        id: '2',
        key: 'reset-password',
        name: 'Reset Password',
        description: 'Password reset email',
        channels: ['EMAIL'],
        translations: {
          'en-US': {
            subject: 'Reset your password',
            body: 'Click here to reset',
          },
        },
      },
    ];

    vi.spyOn(templateHooks, 'useTemplates').mockReturnValue({
      data: { templates: mockTemplates },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderTemplates();
    expect(screen.getByText('Welcome Message')).toBeInTheDocument();
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
  });

  it('should have create template button', () => {
    vi.spyOn(templateHooks, 'useTemplates').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderTemplates();
    expect(screen.getByRole('button', { name: /create template/i })).toBeInTheDocument();
  });

  it('should show alert when create button is clicked', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    vi.spyOn(templateHooks, 'useTemplates').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderTemplates();
    const createButton = screen.getByRole('button', { name: /create template/i });
    await user.click(createButton);

    expect(alertSpy).toHaveBeenCalledWith('Create template modal coming soon');
    alertSpy.mockRestore();
  });
});
