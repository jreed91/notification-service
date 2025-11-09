import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Subscriptions } from '../pages/Subscriptions';
import * as subscriptionApi from '../api/subscriptions';
import * as templateApi from '../api/templates';
import { DeliveryChannel } from '@notification-service/shared';

// Mock the APIs
vi.mock('../api/subscriptions');
vi.mock('../api/templates');

describe('Subscriptions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderSubscriptions = (userId = 'user-123') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/users/${userId}/subscriptions`]} initialIndex={0}>
          <Routes>
            <Route path="/users/:userId/subscriptions" element={<Subscriptions />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('should render subscriptions page title', async () => {
    vi.spyOn(subscriptionApi.subscriptionApi, 'list').mockResolvedValue({
      subscriptions: [],
    });
    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({
      templates: [],
    });

    renderSubscriptions();

    await waitFor(() => {
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    });
  });

  it('should display user ID in description', async () => {
    vi.spyOn(subscriptionApi.subscriptionApi, 'list').mockResolvedValue({
      subscriptions: [],
    });
    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({
      templates: [],
    });

    renderSubscriptions();

    await waitFor(() => {
      expect(screen.getByText(/user-123/)).toBeInTheDocument();
    });
  });

  it('should display templates with subscription controls', async () => {
    const mockTemplates = [
      {
        id: '1',
        key: 'welcome',
        name: 'Welcome Message',
        channels: [DeliveryChannel.EMAIL, DeliveryChannel.SMS],
        translations: { 'en-US': { body: 'Hello' } },
        tenantId: 'tenant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockSubscriptions = [
      {
        id: 'sub-1',
        userId: 'user-123',
        templateKey: 'welcome',
        channels: { EMAIL: true, SMS: false },
        tenantId: 'tenant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.spyOn(subscriptionApi.subscriptionApi, 'list').mockResolvedValue({
      subscriptions: mockSubscriptions,
    });
    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({
      templates: mockTemplates,
    });

    renderSubscriptions();

    await waitFor(() => {
      expect(screen.getByText('Welcome Message')).toBeInTheDocument();
      expect(screen.getByText('EMAIL')).toBeInTheDocument();
      expect(screen.getByText('SMS')).toBeInTheDocument();
    });
  });

  it('should display checkboxes for channels', async () => {
    const mockTemplates = [
      {
        id: '1',
        key: 'welcome',
        name: 'Welcome',
        channels: [DeliveryChannel.EMAIL],
        translations: { 'en-US': { body: 'Test' } },
        tenantId: 'tenant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.spyOn(subscriptionApi.subscriptionApi, 'list').mockResolvedValue({
      subscriptions: [],
    });
    vi.spyOn(templateApi.templateApi, 'list').mockResolvedValue({
      templates: mockTemplates,
    });

    renderSubscriptions();

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });
});
