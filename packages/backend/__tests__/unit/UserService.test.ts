import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UserService } from '../../src/services/UserService';
import type { CreateUserRequest } from '@notification-service/shared';
import type { DatabaseClient } from '../../src/database/client';

// Mock database client
const mockDb = {
  insert: jest.fn(),
  select: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as DatabaseClient;

describe('UserService', () => {
  let userService: UserService;
  const mockTenantId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService(mockDb);
  });

  describe('createUser', () => {
    // T015: Test for creating user with valid email
    it('should create a user with valid email', async () => {
      const request: CreateUserRequest = {
        email: 'test@example.com',
        locale: 'en-US',
      };

      const mockInsertResult = {
        values: jest.fn().mockResolvedValue([{
          id: '123e4567-e89b-12d3-a456-426614174000',
          tenantId: mockTenantId,
          email: 'test@example.com',
          phoneNumber: null,
          locale: 'en-US',
          timezone: null,
          apnsTokens: [],
          fcmTokens: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      };

      (mockDb.insert as jest.Mock).mockReturnValue(mockInsertResult);

      const result = await userService.createUser(mockTenantId, request);

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result.tenantId).toBe(mockTenantId);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    // T016: Test for creating user with valid phone
    it('should create a user with valid phone number', async () => {
      const request: CreateUserRequest = {
        phoneNumber: '+14155552671',
        locale: 'en-US',
      };

      const mockInsertResult = {
        values: jest.fn().mockResolvedValue([{
          id: '123e4567-e89b-12d3-a456-426614174001',
          tenantId: mockTenantId,
          email: null,
          phoneNumber: '+14155552671',
          locale: 'en-US',
          timezone: null,
          apnsTokens: [],
          fcmTokens: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      };

      (mockDb.insert as jest.Mock).mockReturnValue(mockInsertResult);

      const result = await userService.createUser(mockTenantId, request);

      expect(result).toBeDefined();
      expect(result.phoneNumber).toBe('+14155552671');
      expect(result.tenantId).toBe(mockTenantId);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    // T017: Test for creating user with device tokens
    it('should create a user with device tokens', async () => {
      const request: CreateUserRequest = {
        email: 'user@example.com',
        apnsTokens: ['apns-token-1', 'apns-token-2'],
        fcmTokens: ['fcm-token-1'],
        locale: 'en-US',
      };

      const mockInsertResult = {
        values: jest.fn().mockResolvedValue([{
          id: '123e4567-e89b-12d3-a456-426614174002',
          tenantId: mockTenantId,
          email: 'user@example.com',
          phoneNumber: null,
          locale: 'en-US',
          timezone: null,
          apnsTokens: ['apns-token-1', 'apns-token-2'],
          fcmTokens: ['fcm-token-1'],
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      };

      (mockDb.insert as jest.Mock).mockReturnValue(mockInsertResult);

      const result = await userService.createUser(mockTenantId, request);

      expect(result).toBeDefined();
      expect(result.apnsTokens).toEqual(['apns-token-1', 'apns-token-2']);
      expect(result.fcmTokens).toEqual(['fcm-token-1']);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    // T018: Test for rejecting invalid email format
    it('should reject invalid email format', async () => {
      const request: CreateUserRequest = {
        email: 'invalid-email',
        locale: 'en-US',
      };

      await expect(userService.createUser(mockTenantId, request))
        .rejects
        .toThrow('Invalid email format');
    });

    // T019: Test for rejecting invalid phone format
    it('should reject invalid phone format', async () => {
      const request: CreateUserRequest = {
        phoneNumber: '415-555-2671', // Invalid format - not E.164
        locale: 'en-US',
      };

      await expect(userService.createUser(mockTenantId, request))
        .rejects
        .toThrow('Invalid phone number format');
    });

    // T020: Test for rejecting duplicate email within tenant
    it('should reject duplicate email within tenant', async () => {
      const request: CreateUserRequest = {
        email: 'duplicate@example.com',
        locale: 'en-US',
      };

      // Mock the select to return an existing user
      const mockSelectResult = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{
          id: 'existing-user-id',
          email: 'duplicate@example.com',
        }]),
      };

      (mockDb.select as jest.Mock).mockReturnValue(mockSelectResult);

      await expect(userService.createUser(mockTenantId, request))
        .rejects
        .toThrow('User with this email already exists');
    });

    // T021: Test for allowing duplicate email across tenants
    it('should allow duplicate email across different tenants', async () => {
      const request: CreateUserRequest = {
        email: 'shared@example.com',
        locale: 'en-US',
      };

      const otherTenantId = '660e8400-e29b-41d4-a716-446655440000';

      // Mock select to return no users for this tenant
      const mockSelectResult = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]), // No existing user for this tenant
      };

      (mockDb.select as jest.Mock).mockReturnValue(mockSelectResult);

      const mockInsertResult = {
        values: jest.fn().mockResolvedValue([{
          id: '123e4567-e89b-12d3-a456-426614174003',
          tenantId: mockTenantId,
          email: 'shared@example.com',
          phoneNumber: null,
          locale: 'en-US',
          timezone: null,
          apnsTokens: [],
          fcmTokens: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      };

      (mockDb.insert as jest.Mock).mockReturnValue(mockInsertResult);

      const result = await userService.createUser(mockTenantId, request);

      expect(result).toBeDefined();
      expect(result.email).toBe('shared@example.com');
      expect(result.tenantId).toBe(mockTenantId);
    });

    // T022: Test for rejecting user with no contact method
    it('should reject user with no contact method', async () => {
      const request: CreateUserRequest = {
        locale: 'en-US',
        // No email, phone, or device tokens
      };

      await expect(userService.createUser(mockTenantId, request))
        .rejects
        .toThrow('User must have at least one contact method');
    });
  });
});
