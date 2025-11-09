import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as userController from '../../controllers/userController';
import { db } from '../../database/client';

jest.mock('../../database/client');

describe('UserController', () => {
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
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        locale: 'en-US',
      };

      mockRequest.body = userData;

      // Mock successful insert
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      // Mock select after insert
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'user-123', ...userData, tenantId: 'tenant-123' }],
      });

      await userController.createUser(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        })
      );
    });

    it('should return 400 for invalid request data', async () => {
      mockRequest.body = {
        email: 'invalid-email', // Invalid email format
      };

      await userController.createUser(
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

    it('should return 409 for duplicate email or phone', async () => {
      mockRequest.body = {
        email: 'existing@example.com',
      };

      // Mock unique constraint violation
      const error: any = new Error('Duplicate key');
      error.code = '23505';
      (db.query as jest.Mock).mockRejectedValueOnce(error);

      await userController.createUser(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'User with this email or phone already exists',
      });
    });
  });

  describe('getUsers', () => {
    it('should return all users for tenant', async () => {
      const mockUsers = [
        {
          id: '1',
          externalId: 'user-1',
          email: 'user1@example.com',
          tenantId: 'tenant-123',
        },
        {
          id: '2',
          externalId: 'user-2',
          email: 'user2@example.com',
          tenantId: 'tenant-123',
        },
      ];

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockUsers,
      });

      await userController.getUsers(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith({
        users: mockUsers,
      });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      mockRequest.params = { id: 'user-123' };
      mockRequest.body = {
        email: 'updated@example.com',
        locale: 'es-ES',
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          email: 'updated@example.com',
          locale: 'es-ES',
        }],
      });

      await userController.updateUser(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'updated@example.com',
          locale: 'es-ES',
        })
      );
    });

    it('should return 404 if user not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { email: 'test@example.com' };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      await userController.updateUser(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'User not found',
      });
    });
  });

  describe('getUser', () => {
    it('should get user by ID successfully', async () => {
      mockRequest.params = { id: 'user-123' };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          externalId: 'user-ext-123',
          email: 'test@example.com',
          tenantId: 'tenant-123',
        }],
      });

      await userController.getUser(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
        })
      );
    });

    it('should return 404 if user not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      await userController.getUser(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'User not found',
      });
    });
  });
});
