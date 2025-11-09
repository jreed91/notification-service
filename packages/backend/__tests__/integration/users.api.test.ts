import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { type Express } from 'express';
import { db } from '../../src/database/client';
import { tenants, users } from '../../src/database/schema';
import { eq, and } from 'drizzle-orm';
import type { CreateUserRequest } from '@notification-service/shared';
import routes from '../../src/routes/index';

let app: Express;
let testApiKey: string;
let testTenantId: string;

describe('Users API Integration Tests', () => {
  beforeAll(async () => {
    // Create test tenant
    const [tenant] = await db.insert(tenants).values({
      name: 'Test Tenant',
      apiKey: 'test-api-key-users-integration',
      active: true,
    }).returning();

    testTenantId = tenant.id;
    testApiKey = tenant.apiKey;

    // Set up Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api', routes);
  });

  afterAll(async () => {
    // Clean up test data
    if (testTenantId) {
      await db.delete(users).where(eq(users.tenantId, testTenantId));
      await db.delete(tenants).where(eq(tenants.id, testTenantId));
    }
  });

  beforeEach(async () => {
    // Clean up users before each test
    if (testTenantId) {
      await db.delete(users).where(eq(users.tenantId, testTenantId));
    }
  });

  // T024: Test for POST /api/users creates user (201)
  describe('POST /api/users', () => {
    it('should create a user and return 201', async () => {
      const createRequest: CreateUserRequest = {
        email: 'newuser@example.com',
        phoneNumber: '+14155552671',
        locale: 'en-US',
        timezone: 'America/Los_Angeles',
      };

      const response = await request(app)
        .post('/api/users')
        .set('X-API-Key', testApiKey)
        .send(createRequest)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('newuser@example.com');
      expect(response.body.phoneNumber).toBe('+14155552671');
      expect(response.body.locale).toBe('en-US');
      expect(response.body.tenantId).toBe(testTenantId);

      // Verify user was created in database
      const [createdUser] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.tenantId, testTenantId),
            eq(users.email, 'newuser@example.com')
          )
        )
        .limit(1);

      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe('newuser@example.com');
    });

    // T025: Test for POST /api/users rejects invalid email (400)
    it('should reject invalid email with 400', async () => {
      const createRequest: CreateUserRequest = {
        email: 'invalid-email-format',
        locale: 'en-US',
      };

      const response = await request(app)
        .post('/api/users')
        .set('X-API-Key', testApiKey)
        .send(createRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid email');
    });

    // T026: Test for POST /api/users rejects duplicate email (409)
    it('should reject duplicate email with 409', async () => {
      // Create first user
      await db.insert(users).values({
        tenantId: testTenantId,
        email: 'existing@example.com',
        locale: 'en-US',
        apnsTokens: [],
        fcmTokens: [],
      });

      // Try to create another user with same email
      const createRequest: CreateUserRequest = {
        email: 'existing@example.com',
        locale: 'en-US',
      };

      const response = await request(app)
        .post('/api/users')
        .set('X-API-Key', testApiKey)
        .send(createRequest)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });

    // T027: Test for POST /api/users requires X-API-Key (401)
    it('should require X-API-Key header and return 401', async () => {
      const createRequest: CreateUserRequest = {
        email: 'test@example.com',
        locale: 'en-US',
      };

      const response = await request(app)
        .post('/api/users')
        // No X-API-Key header
        .send(createRequest)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('API key');
    });

    it('should reject invalid phone number format with 400', async () => {
      const createRequest: CreateUserRequest = {
        phoneNumber: '415-555-2671', // Invalid format
        locale: 'en-US',
      };

      const response = await request(app)
        .post('/api/users')
        .set('X-API-Key', testApiKey)
        .send(createRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid phone');
    });

    it('should reject user with no contact method with 400', async () => {
      const createRequest: CreateUserRequest = {
        locale: 'en-US',
        // No email, phone, or device tokens
      };

      const response = await request(app)
        .post('/api/users')
        .set('X-API-Key', testApiKey)
        .send(createRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('contact method');
    });

    it('should create user with device tokens', async () => {
      const createRequest: CreateUserRequest = {
        email: 'deviceuser@example.com',
        apnsTokens: ['apns-token-123'],
        fcmTokens: ['fcm-token-456', 'fcm-token-789'],
        locale: 'en-US',
      };

      const response = await request(app)
        .post('/api/users')
        .set('X-API-Key', testApiKey)
        .send(createRequest)
        .expect(201);

      expect(response.body.apnsTokens).toEqual(['apns-token-123']);
      expect(response.body.fcmTokens).toEqual(['fcm-token-456', 'fcm-token-789']);
    });
  });
});
