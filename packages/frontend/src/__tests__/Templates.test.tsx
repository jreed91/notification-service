import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Templates } from '../pages/Templates';

// Mock the template API
const mockTemplateApi = {
  list: vi.fn(),
  create: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock('../api/templates', () => ({
  templateApi: mockTemplateApi,
}));

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
    mockTemplateApi.list.mockResolvedValue({
      templates: [],
    });

    renderTemplates();

    await waitFor(() => {
      expect(screen.getByText('Notification Templates')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    mockTemplateApi.list.mockImplementation(
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

    mockTemplateApi.list.mockResolvedValue({
      templates: mockTemplates,
    });

    renderTemplates();

    await waitFor(() => {
      expect(screen.getByText('Welcome Message')).toBeInTheDocument();
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });
  });

  it('should have create template button', async () => {
    mockTemplateApi.list.mockResolvedValue({
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

    mockTemplateApi.list.mockResolvedValue({
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
    mockTemplateApi.list.mockResolvedValue({
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
        channels: ['EMAIL', 'APPLE_PUSH', 'SMS'],
        translations: {
          'en-US': { body: 'Hello' },
        },
      },
    ];

    mockTemplateApi.list.mockResolvedValue({
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
