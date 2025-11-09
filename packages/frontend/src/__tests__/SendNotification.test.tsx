import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SendNotification } from '../pages/SendNotification';
import * as templateApi from '../api/templates';
import * as userApi from '../api/users';
import * as notificationApi from '../api/notifications';

// Mock the APIs
vi.mock('../api/templates');
vi.mock('../api/users');
vi.mock('../api/notifications');

describe('SendNotification', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderSendNotification = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SendNotification />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should render send notification page title', async () => {
    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({ templates: [] });
    vi.spyOn(userApi.userApi, 'list').mockResolvedValue({ users: [] });

    renderSendNotification();
    expect(screen.getByText('Send Notification')).toBeInTheDocument();
  });

  it('should render description text', async () => {
    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({ templates: [] });
    vi.spyOn(userApi.userApi, 'list').mockResolvedValue({ users: [] });

    renderSendNotification();
    expect(screen.getByText(/Send a notification to a user/)).toBeInTheDocument();
  });

  it('should display template select dropdown', async () => {
    const mockTemplates = [
      {
        id: '1',
        key: 'welcome',
        name: 'Welcome Message',
        channels: ['EMAIL'],
        translations: { 'en-US': { body: 'Hello' } },
      },
    ];

    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({
      templates: mockTemplates,
    });
    vi.spyOn(userApi.userApi, 'list').mockResolvedValue({ users: [] });

    renderSendNotification();

    await waitFor(() => {
      expect(screen.getByLabelText('Template')).toBeInTheDocument();
      expect(screen.getByText(/Welcome Message \(welcome\)/)).toBeInTheDocument();
    });
  });

  it('should display user select dropdown', async () => {
    const mockUsers = [
      {
        id: 'user-123',
        email: 'test@example.com',
        locale: 'en-US',
      },
    ];

    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({ templates: [] });
    vi.spyOn(userApi.userApi, 'list').mockResolvedValue({
      users: mockUsers,
    });

    renderSendNotification();

    await waitFor(() => {
      expect(screen.getByLabelText('User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('should display variables textarea', async () => {
    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({ templates: [] });
    vi.spyOn(userApi.userApi, 'list').mockResolvedValue({ users: [] });

    renderSendNotification();

    await waitFor(() => {
      expect(screen.getByLabelText(/Variables \(JSON\)/)).toBeInTheDocument();
    });
  });

  it('should have send button', async () => {
    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({ templates: [] });
    vi.spyOn(userApi.userApi, 'list').mockResolvedValue({ users: [] });

    renderSendNotification();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /send notification/i })).toBeInTheDocument();
    });
  });

  it('should show channels when template is selected', async () => {
    const user = userEvent.setup();
    const mockTemplates = [
      {
        id: '1',
        key: 'welcome',
        name: 'Welcome',
        channels: ['EMAIL', 'SMS', 'APPLE_PUSH'],
        translations: { 'en-US': { body: 'Test' } },
      },
    ];

    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({
      templates: mockTemplates,
    });
    vi.spyOn(userApi.userApi, 'list').mockResolvedValue({ users: [] });

    renderSendNotification();

    await waitFor(() => {
      expect(screen.getByLabelText('Template')).toBeInTheDocument();
    });

    const templateSelect = screen.getByLabelText('Template');
    await user.selectOptions(templateSelect, 'welcome');

    await waitFor(() => {
      expect(screen.getByText('Channels')).toBeInTheDocument();
      expect(screen.getByText('EMAIL')).toBeInTheDocument();
      expect(screen.getByText('SMS')).toBeInTheDocument();
      expect(screen.getByText('APPLE_PUSH')).toBeInTheDocument();
    });
  });

  it('should show alert on invalid JSON', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const mockTemplates = [
      {
        id: '1',
        key: 'welcome',
        name: 'Welcome',
        channels: ['EMAIL'],
        translations: { 'en-US': { body: 'Test' } },
      },
    ];

    const mockUsers = [
      {
        id: 'user-123',
        email: 'test@example.com',
        locale: 'en-US',
      },
    ];

    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({
      templates: mockTemplates,
    });
    vi.spyOn(userApi.userApi, 'list').mockResolvedValue({
      users: mockUsers,
    });

    renderSendNotification();

    await waitFor(() => {
      expect(screen.getByLabelText('Template')).toBeInTheDocument();
    });

    // Select template and user
    await user.selectOptions(screen.getByLabelText('Template'), 'welcome');
    await user.selectOptions(screen.getByLabelText('User'), 'user-123');

    // Enter invalid JSON
    const variablesTextarea = screen.getByLabelText(/Variables \(JSON\)/);
    await user.clear(variablesTextarea);
    await user.type(variablesTextarea, 'invalid json');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /send notification/i });
    await user.click(submitButton);

    expect(alertSpy).toHaveBeenCalledWith('Invalid JSON in variables field');
    alertSpy.mockRestore();
  });
});
