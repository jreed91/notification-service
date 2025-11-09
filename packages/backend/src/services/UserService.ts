import { eq, and, or, desc, count } from 'drizzle-orm';
import validator from 'validator';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { drizzleDb } from '../database/client';
import { users } from '../database/schema';
import type { CreateUserRequest, UpdateUserRequest, UserResponse, ListUsersResponse } from '@notification-service/shared';

export class UserService {
  private db: typeof drizzleDb;

  constructor(database = drizzleDb) {
    this.db = database;
  }

  /**
   * Create a new user for the specified tenant
   * T029-T032: Email validation, phone validation, contact method validation, duplicate detection
   */
  async createUser(tenantId: string, request: CreateUserRequest): Promise<UserResponse> {
    // T031: Validate at least one contact method exists
    const hasContactMethod =
      request.email ||
      request.phoneNumber ||
      (request.apnsTokens && request.apnsTokens.length > 0) ||
      (request.fcmTokens && request.fcmTokens.length > 0);

    if (!hasContactMethod) {
      throw new Error('User must have at least one contact method (email, phone, or device token)');
    }

    // T029: Validate email format if provided (RFC 5322)
    if (request.email && !validator.isEmail(request.email)) {
      throw new Error('Invalid email format');
    }

    // T030: Validate phone number format if provided (E.164)
    let normalizedPhone: string | undefined;
    if (request.phoneNumber) {
      if (!isValidPhoneNumber(request.phoneNumber)) {
        throw new Error('Invalid phone number format. Phone must be in E.164 format (e.g., +14155552671)');
      }
      // Normalize to E.164 format
      const parsed = parsePhoneNumber(request.phoneNumber);
      normalizedPhone = parsed.number;
    }

    // T032: Check for duplicate email or phone within tenant
    if (request.email || normalizedPhone) {
      const conditions = [];
      if (request.email) {
        conditions.push(eq(users.email, request.email));
      }
      if (normalizedPhone) {
        conditions.push(eq(users.phoneNumber, normalizedPhone));
      }

      const existingUser = await this.db
        .select()
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            or(...conditions)
          )
        )
        .limit(1);

      if (existingUser.length > 0) {
        if (existingUser[0].email === request.email) {
          throw new Error('User with this email already exists');
        }
        if (existingUser[0].phoneNumber === normalizedPhone) {
          throw new Error('User with this phone number already exists');
        }
      }
    }

    // Validate locale format if provided
    if (request.locale && !/^[a-z]{2}-[A-Z]{2}$/.test(request.locale)) {
      throw new Error('Invalid locale format. Expected format: en-US, es-ES, etc.');
    }

    // Create user
    const [createdUser] = await this.db
      .insert(users)
      .values({
        tenantId,
        email: request.email || null,
        phoneNumber: normalizedPhone || null,
        locale: request.locale || 'en-US',
        timezone: request.timezone || null,
        apnsTokens: request.apnsTokens || [],
        fcmTokens: request.fcmTokens || [],
      })
      .returning();

    return this.mapUserToResponse(createdUser);
  }

  /**
   * Get user by ID (tenant-scoped)
   */
  async getUserById(tenantId: string, userId: string): Promise<UserResponse | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.tenantId, tenantId)
        )
      )
      .limit(1);

    return user ? this.mapUserToResponse(user) : null;
  }

  /**
   * List users with pagination and optional filters
   */
  async listUsers(
    tenantId: string,
    page: number = 1,
    limit: number = 50,
    filters?: { email?: string; phoneNumber?: string }
  ): Promise<ListUsersResponse> {
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(users.tenantId, tenantId)];
    if (filters?.email) {
      conditions.push(eq(users.email, filters.email));
    }
    if (filters?.phoneNumber) {
      conditions.push(eq(users.phoneNumber, filters.phoneNumber));
    }

    // Get users with pagination
    const userList = await this.db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await this.db
      .select({ count: count() })
      .from(users)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    return {
      users: userList.map(user => this.mapUserToResponse(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Update user
   */
  async updateUser(
    tenantId: string,
    userId: string,
    request: UpdateUserRequest
  ): Promise<UserResponse> {
    // Validate email if provided
    if (request.email && !validator.isEmail(request.email)) {
      throw new Error('Invalid email format');
    }

    // Validate phone if provided
    let normalizedPhone: string | undefined;
    if (request.phoneNumber) {
      if (!isValidPhoneNumber(request.phoneNumber)) {
        throw new Error('Invalid phone number format. Phone must be in E.164 format (e.g., +14155552671)');
      }
      const parsed = parsePhoneNumber(request.phoneNumber);
      normalizedPhone = parsed.number;
    }

    // Validate locale format if provided
    if (request.locale && !/^[a-z]{2}-[A-Z]{2}$/.test(request.locale)) {
      throw new Error('Invalid locale format. Expected format: en-US, es-ES, etc.');
    }

    // Check for duplicates (excluding current user)
    if (request.email || normalizedPhone) {
      const conditions = [];
      if (request.email) {
        conditions.push(eq(users.email, request.email));
      }
      if (normalizedPhone) {
        conditions.push(eq(users.phoneNumber, normalizedPhone));
      }

      const existingUser = await this.db
        .select()
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            or(...conditions)
          )
        )
        .limit(1);

      if (existingUser.length > 0 && existingUser[0].id !== userId) {
        if (existingUser[0].email === request.email) {
          throw new Error('User with this email already exists');
        }
        if (existingUser[0].phoneNumber === normalizedPhone) {
          throw new Error('User with this phone number already exists');
        }
      }
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (request.email !== undefined) updateData.email = request.email || null;
    if (normalizedPhone !== undefined) updateData.phoneNumber = normalizedPhone;
    if (request.locale !== undefined) updateData.locale = request.locale;
    if (request.timezone !== undefined) updateData.timezone = request.timezone || null;
    if (request.apnsTokens !== undefined) updateData.apnsTokens = request.apnsTokens;
    if (request.fcmTokens !== undefined) updateData.fcmTokens = request.fcmTokens;

    const [updatedUser] = await this.db
      .update(users)
      .set(updateData)
      .where(
        and(
          eq(users.id, userId),
          eq(users.tenantId, tenantId)
        )
      )
      .returning();

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return this.mapUserToResponse(updatedUser);
  }

  /**
   * Delete user (CASCADE to notifications and subscriptions per FR-019)
   */
  async deleteUser(tenantId: string, userId: string): Promise<void> {
    const result = await this.db
      .delete(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.tenantId, tenantId)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new Error('User not found');
    }
  }

  /**
   * Map database user to response DTO
   */
  private mapUserToResponse(user: any): UserResponse {
    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber || undefined,
      locale: user.locale,
      timezone: user.timezone || undefined,
      apnsTokens: user.apnsTokens || [],
      fcmTokens: user.fcmTokens || [],
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
