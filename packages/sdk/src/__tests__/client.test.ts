import { NotificationClient } from '../client';
import { DeliveryChannel } from '@notification-service/shared';
import axios, { AxiosInstance } from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NotificationClient', () => {
  let client: NotificationClient;
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as unknown as AxiosInstance);

    client = new NotificationClient({
      baseUrl: 'https://api.test.com',
      apiKey: 'test-api-key',
    });
  });

  describe('constructor', () => {
    it('should create client with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.test.com/api',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key',
        },
      });
    });

    it('should handle baseUrl with /api suffix', () => {
      new NotificationClient({
        baseUrl: 'https://api.test.com/api',
        apiKey: 'test-api-key',
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.test.com/api',
        })
      );
    });

    it('should use custom timeout if provided', () => {
      new NotificationClient({
        baseUrl: 'https://api.test.com',
        apiKey: 'test-api-key',
        timeout: 60000,
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 60000,
        })
      );
    });
  });

  describe('notifications', () => {
    describe('send', () => {
      it('should send notification successfully', async () => {
        const mockResponse = {
          data: {
            success: true,
            notificationIds: ['id-1', 'id-2'],
            errors: [],
          },
        };
        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await client.notifications.send({
          userId: 'user-123',
          templateKey: 'welcome',
          variables: { name: 'John' },
        });

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/notifications/send',
          {
            userId: 'user-123',
            templateKey: 'welcome',
            variables: { name: 'John' },
          },
          undefined
        );
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('list', () => {
      it('should list notifications without filters', async () => {
        const mockResponse = {
          data: {
            notifications: [],
            total: 0,
          },
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await client.notifications.list();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/notifications', undefined);
        expect(result).toEqual(mockResponse.data);
      });

      it('should list notifications with filters', async () => {
        const mockResponse = {
          data: {
            notifications: [],
            total: 0,
          },
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        await client.notifications.list({
          userId: 'user-123',
          status: 'SENT',
          limit: 50,
          offset: 10,
        });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          '/notifications?userId=user-123&status=SENT&limit=50&offset=10',
          undefined
        );
      });
    });
  });

  describe('templates', () => {
    describe('create', () => {
      it('should create template successfully', async () => {
        const mockTemplate = {
          key: 'welcome',
          name: 'Welcome',
          description: 'Welcome message',
          channels: [DeliveryChannel.EMAIL],
          translations: {
            'en-US': { body: 'Welcome!' },
          },
        };
        const mockResponse = { data: { ...mockTemplate, id: 'template-1' } };
        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await client.templates.create(mockTemplate);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/templates', mockTemplate, undefined);
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('list', () => {
      it('should list templates', async () => {
        const mockResponse = { data: { templates: [] } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await client.templates.list();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/templates', undefined);
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('get', () => {
      it('should get template by key', async () => {
        const mockResponse = { data: { key: 'welcome' } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await client.templates.get('welcome');

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/templates/welcome', undefined);
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('update', () => {
      it('should update template', async () => {
        const updates = { name: 'Updated Welcome' };
        const mockResponse = { data: { key: 'welcome', ...updates } };
        mockAxiosInstance.put.mockResolvedValue(mockResponse);

        const result = await client.templates.update('welcome', updates);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/templates/welcome', updates, undefined);
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('delete', () => {
      it('should delete template', async () => {
        mockAxiosInstance.delete.mockResolvedValue({ data: undefined });

        await client.templates.delete('welcome');

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/templates/welcome', undefined);
      });
    });
  });

  describe('users', () => {
    describe('create', () => {
      it('should create user successfully', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          locale: 'en-US',
        };
        const mockResponse = { data: mockUser };
        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await client.users.create(mockUser);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users', mockUser, undefined);
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('list', () => {
      it('should list users with pagination', async () => {
        const mockResponse = { data: { users: [] } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        await client.users.list({ limit: 50, offset: 10 });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users?limit=50&offset=10', undefined);
      });
    });

    describe('get', () => {
      it('should get user by id', async () => {
        const mockResponse = { data: { id: 'user-123' } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await client.users.get('user-123');

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/user-123', undefined);
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('update', () => {
      it('should update user', async () => {
        const updates = { email: 'new@example.com' };
        const mockResponse = { data: { id: 'user-123', ...updates } };
        mockAxiosInstance.put.mockResolvedValue(mockResponse);

        const result = await client.users.update('user-123', updates);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/users/user-123', updates, undefined);
        expect(result).toEqual(mockResponse.data);
      });
    });
  });

  describe('subscriptions', () => {
    describe('list', () => {
      it('should list user subscriptions', async () => {
        const mockResponse = { data: { subscriptions: [] } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await client.subscriptions.list('user-123');

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/user-123/subscriptions', undefined);
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('upsert', () => {
      it('should create or update subscription', async () => {
        const subscription = {
          templateKey: 'welcome',
          channels: { EMAIL: true, APPLE_PUSH: false },
        };
        const mockResponse = { data: { ...subscription, id: 'sub-1' } };
        mockAxiosInstance.put.mockResolvedValue(mockResponse);

        const result = await client.subscriptions.upsert('user-123', subscription);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith(
          '/users/user-123/subscriptions',
          subscription,
          undefined
        );
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('delete', () => {
      it('should delete subscription', async () => {
        mockAxiosInstance.delete.mockResolvedValue({ data: undefined });

        await client.subscriptions.delete('user-123', 'welcome');

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
          '/users/user-123/subscriptions/welcome',
          undefined
        );
      });
    });
  });
});
