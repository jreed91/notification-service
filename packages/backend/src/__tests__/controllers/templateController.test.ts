import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as templateController from '../../controllers/templateController';
import { db } from '../../database/client';
import { DeliveryChannel } from '@notification-service/shared';

jest.mock('../../database/client');

describe('TemplateController', () => {
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

  describe('createTemplate', () => {
    it('should create a new template successfully', async () => {
      const templateData = {
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
      };

      mockRequest.body = templateData;

      // Mock successful insert
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      // Mock select after insert
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'template-123', ...templateData }],
      });

      await templateController.createTemplate(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'welcome',
          name: 'Welcome Message',
        })
      );
    });

    it('should return 400 for invalid request data', async () => {
      mockRequest.body = {
        // Missing required fields
        name: 'Test',
      };

      await templateController.createTemplate(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid request',
        })
      );
    });

    it('should return 409 for duplicate template key', async () => {
      mockRequest.body = {
        key: 'welcome',
        name: 'Welcome',
        channels: [DeliveryChannel.EMAIL],
        translations: { 'en-US': { body: 'Hello' } },
      };

      // Mock unique constraint violation
      const error: any = new Error('Duplicate key');
      error.code = '23505';
      (db.query as jest.Mock).mockRejectedValueOnce(error);

      await templateController.createTemplate(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Template with this key already exists',
      });
    });
  });

  describe('getTemplates', () => {
    it('should return all templates for tenant', async () => {
      const mockTemplates = [
        {
          id: '1',
          key: 'welcome',
          name: 'Welcome',
          tenantId: 'tenant-123',
        },
        {
          id: '2',
          key: 'reset-password',
          name: 'Reset Password',
          tenantId: 'tenant-123',
        },
      ];

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockTemplates,
      });

      await templateController.getTemplates(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith({
        templates: mockTemplates,
      });
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template successfully', async () => {
      mockRequest.params = { key: 'welcome' };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'template-123' }],
      });

      await templateController.deleteTemplate(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(204);
    });

    it('should return 404 if template not found', async () => {
      mockRequest.params = { key: 'nonexistent' };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      await templateController.deleteTemplate(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Template not found',
      });
    });
  });
});
