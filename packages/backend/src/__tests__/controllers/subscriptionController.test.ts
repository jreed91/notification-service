import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as subscriptionController from '../../controllers/subscriptionController';
import { db } from '../../database/client';
import { DeliveryChannel } from '@notification-service/shared';

jest.mock('../../database/client');

describe('SubscriptionController', () => {
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
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    jest.clearAllMocks();
  });

  describe('updateSubscription', () => {
    it('should create new subscription successfully', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.body = {
        templateKey: 'welcome',
        channels: {
          [DeliveryChannel.EMAIL]: true,
          [DeliveryChannel.SMS]: false,
        },
      };

      // Mock check for existing subscription (not found)
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      // Mock insert
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 'subscription-123',
          userId: 'user-123',
          templateKey: 'welcome',
          channels: { EMAIL: true, SMS: false },
        }],
      });

      await subscriptionController.updateSubscription(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          templateKey: 'welcome',
        })
      );
    });

    it('should update existing subscription successfully', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.body = {
        templateKey: 'welcome',
        channels: {
          [DeliveryChannel.EMAIL]: false,
        },
      };

      // Mock check for existing subscription (found)
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'subscription-123' }],
      });

      // Mock update
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 'subscription-123',
          userId: 'user-123',
          templateKey: 'welcome',
          channels: { EMAIL: false },
        }],
      });

      await subscriptionController.updateSubscription(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          templateKey: 'welcome',
        })
      );
    });

    it('should return 400 for invalid request data', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.body = {
        // Missing required fields
        channels: {},
      };

      await subscriptionController.updateSubscription(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe('getSubscriptions', () => {
    it('should return all subscriptions for user', async () => {
      mockRequest.params = { userId: 'user-123' };

      const mockSubscriptions = [
        {
          templateKey: 'welcome',
          channels: { EMAIL: true, SMS: false },
        },
        {
          templateKey: 'password-reset',
          channels: { EMAIL: true },
        },
      ];

      // Mock subscriptions query
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockSubscriptions,
      });

      await subscriptionController.getSubscriptions(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith({
        subscriptions: mockSubscriptions,
      });
    });
  });
});
