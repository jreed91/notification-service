import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as notificationController from '../../controllers/notificationController';
import { db } from '../../database/client';
import { NotificationStatus } from '@notification-service/shared';

jest.mock('../../database/client');
jest.mock('../../services/NotificationService', () => {
  const mockSendNotificationFn = jest.fn();
  return {
    NotificationService: jest.fn().mockImplementation(() => {
      return {
        sendNotification: mockSendNotificationFn,
      };
    }),
    mockSendNotificationFn,
  };
});

const { mockSendNotificationFn } = jest.requireMock('../../services/NotificationService');

describe('NotificationController', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();

    mockRequest = {
      tenant: {
        id: 'tenant-123',
        name: 'Test Tenant',
        apiKey: 'test-key',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    jest.clearAllMocks();
    (db.query as jest.Mock).mockReset();
    mockSendNotificationFn.mockReset();
  });

  describe('sendNotification', () => {
    it('should send notification successfully', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
      mockRequest.body = {
        userId,
        templateKey: 'welcome',
        variables: { name: 'John' },
      };

      mockSendNotificationFn.mockResolvedValue({
        id: 'notification-123',
        status: NotificationStatus.PENDING,
      });

      await notificationController.sendNotification(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'notification-123',
          status: NotificationStatus.PENDING,
        })
      );
    });

    it('should return 400 for invalid request data', async () => {
      mockRequest.body = {
        // Missing required userId
        templateKey: 'welcome',
      };

      await notificationController.sendNotification(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should handle service errors', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
      mockRequest.body = {
        userId,
        templateKey: 'nonexistent',
      };

      mockSendNotificationFn.mockRejectedValue(
        new Error('Template not found')
      );

      await notificationController.sendNotification(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });
  });

  describe('getNotifications', () => {
    it('should return notifications for tenant', async () => {
      const mockNotifications = [
        {
          id: '1',
          userId: 'user-1',
          templateKey: 'welcome',
          status: NotificationStatus.SENT,
        },
        {
          id: '2',
          userId: 'user-2',
          templateKey: 'reset-password',
          status: NotificationStatus.PENDING,
        },
      ];

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockNotifications,
      });

      await notificationController.getNotifications(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith({
        notifications: mockNotifications,
      });
    });

    it('should filter by user ID when provided', async () => {
      mockRequest.query = { userId: 'user-123' };

      const mockNotifications = [
        {
          id: '1',
          userId: 'user-123',
          templateKey: 'welcome',
          status: NotificationStatus.SENT,
        },
      ];

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockNotifications,
      });

      await notificationController.getNotifications(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['tenant-123', 'user-123'])
      );
    });

    it('should filter by status when provided', async () => {
      mockRequest.query = { status: NotificationStatus.FAILED };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      await notificationController.getNotifications(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['tenant-123', NotificationStatus.FAILED])
      );
    });
  });

});
