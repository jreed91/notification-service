import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Templates } from '../pages/Templates';
import * as templateApi from '../api/templates';
import { DeliveryChannel } from '@notification-service/shared';

// Mock the template API
vi.mock('../api/templates');

describe('Templates', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderTemplates = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Templates />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should render templates page title', async () => {
    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({
      templates: [],
    });

    renderTemplates();

    await waitFor(() => {
      expect(screen.getByText('Notification Templates')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    vi.spyOn(templateApi.templateApi, 'list').mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderTemplates();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display templates when loaded', async () => {
    const mockTemplates = [
      {
        id: '1',
        key: 'welcome',
        name: 'Welcome Message',
        description: 'Sent when user signs up',
        channels: [DeliveryChannel.EMAIL, DeliveryChannel.APPLE_PUSH],
        translations: {
          'en-US': {
            subject: 'Welcome!',
            body: 'Hello {{name}}',
          },
        },
        tenantId: 'tenant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        key: 'reset-password',
        name: 'Reset Password',
        description: 'Password reset email',
        channels: [DeliveryChannel.EMAIL],
        translations: {
          'en-US': {
            subject: 'Reset your password',
            body: 'Click here to reset',
          },
        },
        tenantId: 'tenant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({
      templates: mockTemplates,
    });

    renderTemplates();

    await waitFor(() => {
      expect(screen.getByText('Welcome Message')).toBeInTheDocument();
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });
  });

  it('should have create template button', async () => {
    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({
      templates: [],
    });

    renderTemplates();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create template/i })).toBeInTheDocument();
    });
  });

  it('should show alert when create button is clicked', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({
      templates: [],
    });

    renderTemplates();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create template/i })).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create template/i });
    await user.click(createButton);

    expect(alertSpy).toHaveBeenCalledWith('Create template modal coming soon');
    alertSpy.mockRestore();
  });

  it('should display empty state when no templates', async () => {
    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({
      templates: [],
    });

    renderTemplates();

    await waitFor(() => {
      expect(screen.getByText('No templates')).toBeInTheDocument();
      expect(screen.getByText(/Get started by creating a new template/)).toBeInTheDocument();
    });
  });

  it('should display template channels', async () => {
    const mockTemplates = [
      {
        id: '1',
        key: 'welcome',
        name: 'Welcome Message',
        channels: [DeliveryChannel.EMAIL, DeliveryChannel.APPLE_PUSH, DeliveryChannel.SMS],
        translations: {
          'en-US': { body: 'Hello' },
        },
        tenantId: 'tenant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({
      templates: mockTemplates,
    });

    renderTemplates();

    await waitFor(() => {
      expect(screen.getByText('EMAIL')).toBeInTheDocument();
      expect(screen.getByText('APPLE_PUSH')).toBeInTheDocument();
      expect(screen.getByText('SMS')).toBeInTheDocument();
    });
  });
});
