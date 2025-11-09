# Data Model: User Management

**Feature**: 001-add-user-functionality
**Date**: 2025-11-09
**Purpose**: Define data entities, relationships, validation rules, and database schema for user management

## Entity: User

### Description
Represents an end user who can receive notifications through various channels (email, SMS, push notifications). Users belong to a specific tenant (multi-tenant isolation) and can have multiple devices registered for push notifications.

### Fields

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | `uuid_generate_v4()` | Unique identifier for the user |
| `tenant_id` | UUID | FOREIGN KEY → tenants(id), NOT NULL | - | Tenant this user belongs to (multi-tenant isolation) |
| `email` | VARCHAR(255) | UNIQUE per tenant, NULLABLE | NULL | User's email address (RFC 5322 validated) |
| `phone_number` | VARCHAR(50) | UNIQUE per tenant, NULLABLE | NULL | User's phone number (E.164 format validated) |
| `locale` | VARCHAR(10) | NOT NULL | `'en-US'` | User's preferred locale for notifications (e.g., 'en-US', 'es-ES') |
| `timezone` | VARCHAR(50) | NULLABLE | NULL | User's timezone (IANA timezone database format, e.g., 'America/New_York') |
| `apns_tokens` | TEXT[] | NULLABLE | NULL | Array of Apple Push Notification tokens for iOS/macOS devices |
| `fcm_tokens` | TEXT[] | NULLABLE | NULL | Array of Firebase Cloud Messaging tokens for Android devices |
| `created_at` | TIMESTAMP | NOT NULL | `CURRENT_TIMESTAMP` | UTC timestamp when user was created |
| `updated_at` | TIMESTAMP | NOT NULL | `CURRENT_TIMESTAMP` | UTC timestamp when user was last updated |

### Validation Rules

1. **Email Validation** (FR-002)
   - Format: Must conform to RFC 5322 standard
   - Uniqueness: Unique within tenant scope (`UNIQUE(tenant_id, email)`)
   - Validation library: `validator.isEmail()` from validator.js
   - Example valid: `user@example.com`, `user+tag@domain.co.uk`
   - Example invalid: `user@`, `@domain.com`, `user @domain.com`

2. **Phone Number Validation** (FR-003)
   - Format: Must conform to E.164 international format
   - Uniqueness: Unique within tenant scope (`UNIQUE(tenant_id, phone_number)`)
   - Validation library: `isValidPhoneNumber()` from libphonenumber-js
   - Normalization: Store in E.164 format with country code
   - Example valid: `+14155552671`, `+442071838750`
   - Example invalid: `(415) 555-2671`, `4155552671` (missing +)

3. **At Least One Contact Method** (FR-001)
   - Business rule: User MUST have at least one of: email, phone_number, apns_tokens, or fcm_tokens
   - Validation: Enforced at application layer before INSERT/UPDATE
   - Error message: "User must have at least one contact method (email, phone, or device token)"

4. **Locale Validation** (FR-008)
   - Format: BCP 47 language tags (e.g., `en-US`, `es-ES`, `fr-FR`)
   - Default: `en-US` if not specified
   - Validation: Must match pattern `[a-z]{2}-[A-Z]{2}`
   - Used for: Selecting notification template translations

5. **Timezone Validation**
   - Format: IANA timezone database names (e.g., `America/New_York`, `Europe/London`)
   - Optional field: Can be NULL
   - Validation: Check against IANA timezone list (if provided)
   - Used for: Scheduling notifications at user's local time

6. **Device Token Arrays** (FR-017)
   - Multiple tokens per platform supported
   - Arrays can be empty `[]` or NULL
   - No duplicate tokens within same array
   - Token format validated by notification providers (APNs, FCM)

### Relationships

```
User (many) → (one) Tenant
  - Foreign key: user.tenant_id → tenant.id
  - Cascade: ON DELETE CASCADE (delete user when tenant deleted)
  - Purpose: Multi-tenant isolation

User (one) → (many) Notification
  - Foreign key: notification.user_id → user.id
  - Cascade: ON DELETE CASCADE (delete notifications when user deleted - FR-019)
  - Purpose: GDPR compliance - "right to be forgotten"

User (one) → (many) UserSubscription
  - Foreign key: user_subscription.user_id → user.id
  - Cascade: ON DELETE CASCADE (delete subscriptions when user deleted)
  - Purpose: Track user's notification preferences per template/channel
```

### Indexes

```sql
-- Primary key index (automatic)
PRIMARY KEY (id)

-- Multi-tenant queries (most common access pattern)
CREATE INDEX idx_users_tenant_id ON users(tenant_id);

-- Email lookups within tenant
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email) WHERE email IS NOT NULL;

-- Phone lookups within tenant
CREATE INDEX idx_users_tenant_phone ON users(tenant_id, phone_number) WHERE phone_number IS NOT NULL;

-- Pagination queries (order by created_at)
CREATE INDEX idx_users_tenant_created ON users(tenant_id, created_at DESC);

-- Optional: Device token lookups (GIN index for array containment)
CREATE INDEX idx_users_apns_tokens ON users USING GIN (apns_tokens) WHERE apns_tokens IS NOT NULL;
CREATE INDEX idx_users_fcm_tokens ON users USING GIN (fcm_tokens) WHERE fcm_tokens IS NOT NULL;
```

## Database Migration

### Changes Required

1. **Alter users table**: Convert single token fields to arrays
   ```sql
   -- Add new array columns
   ALTER TABLE users ADD COLUMN apns_tokens TEXT[];
   ALTER TABLE users ADD COLUMN fcm_tokens TEXT[];

   -- Migrate existing data
   UPDATE users
   SET apns_tokens = ARRAY[apns_device_token]::TEXT[]
   WHERE apns_device_token IS NOT NULL;

   UPDATE users
   SET fcm_tokens = ARRAY[fcm_device_token]::TEXT[]
   WHERE fcm_device_token IS NOT NULL;

   -- Drop old columns
   ALTER TABLE users DROP COLUMN apns_device_token;
   ALTER TABLE users DROP COLUMN fcm_device_token;

   -- Add indexes
   CREATE INDEX idx_users_tenant_email ON users(tenant_id, email) WHERE email IS NOT NULL;
   CREATE INDEX idx_users_tenant_phone ON users(tenant_id, phone_number) WHERE phone_number IS NOT NULL;
   CREATE INDEX idx_users_tenant_created ON users(tenant_id, created_at DESC);
   ```

2. **Update unique constraints**
   ```sql
   -- Ensure email uniqueness within tenant
   ALTER TABLE users ADD CONSTRAINT unique_tenant_email UNIQUE (tenant_id, email);

   -- Ensure phone uniqueness within tenant
   ALTER TABLE users ADD CONSTRAINT unique_tenant_phone UNIQUE (tenant_id, phone_number);
   ```

## Drizzle ORM Schema

```typescript
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 50 }),
  locale: varchar('locale', { length: 10 }).notNull().default('en-US'),
  timezone: varchar('timezone', { length: 50 }),
  apnsTokens: text('apns_tokens').array(),
  fcmTokens: text('fcm_tokens').array(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Unique constraints
  uniqueTenantEmail: uniqueIndex('unique_tenant_email')
    .on(table.tenantId, table.email),
  uniqueTenantPhone: uniqueIndex('unique_tenant_phone')
    .on(table.tenantId, table.phoneNumber),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  notifications: many(notifications),
  subscriptions: many(userSubscriptions),
}));
```

## TypeScript Types (packages/shared/src/types.ts)

```typescript
// Request DTOs
export interface CreateUserRequest {
  email?: string;
  phoneNumber?: string;
  locale?: string; // Default: 'en-US'
  timezone?: string;
  apnsTokens?: string[]; // Array of device tokens
  fcmTokens?: string[]; // Array of device tokens
}

export interface UpdateUserRequest {
  email?: string;
  phoneNumber?: string;
  locale?: string;
  timezone?: string;
  apnsTokens?: string[]; // Replaces entire array
  fcmTokens?: string[]; // Replaces entire array
}

// Response DTO
export interface UserResponse {
  id: string;
  tenantId: string;
  email?: string;
  phoneNumber?: string;
  locale: string;
  timezone?: string;
  apnsTokens: string[];
  fcmTokens: string[];
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

// List response with pagination
export interface ListUsersResponse {
  users: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
```

## Query Patterns

### Create User
```typescript
await db.insert(users).values({
  tenantId: req.tenant.id,
  email: validatedEmail,
  phoneNumber: normalizedPhone,
  locale: req.body.locale || 'en-US',
  apnsTokens: req.body.apnsTokens || [],
  fcmTokens: req.body.fcmTokens || [],
});
```

### Get User by ID (tenant-scoped)
```typescript
const user = await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.id, userId),
      eq(users.tenantId, req.tenant.id)
    )
  )
  .limit(1);
```

### List Users with Pagination
```typescript
const page = Number(req.query.page) || 1;
const limit = Number(req.query.limit) || 50;
const offset = (page - 1) * limit;

const userList = await db
  .select()
  .from(users)
  .where(eq(users.tenantId, req.tenant.id))
  .orderBy(desc(users.createdAt))
  .limit(limit)
  .offset(offset);

const [{ count }] = await db
  .select({ count: count() })
  .from(users)
  .where(eq(users.tenantId, req.tenant.id));
```

### Update User
```typescript
await db
  .update(users)
  .set({
    email: validatedEmail,
    apnsTokens: req.body.apnsTokens,
    updatedAt: new Date(),
  })
  .where(
    and(
      eq(users.id, userId),
      eq(users.tenantId, req.tenant.id)
    )
  );
```

### Delete User (CASCADE to notifications)
```typescript
await db
  .delete(users)
  .where(
    and(
      eq(users.id, userId),
      eq(users.tenantId, req.tenant.id)
    )
  );
// CASCADE will automatically delete related notifications and subscriptions
```

## State Transitions

Users don't have explicit state fields, but follow these lifecycle events:

1. **Created** → `created_at` timestamp set
2. **Updated** → `updated_at` timestamp updated
3. **Deleted** → Record removed, related data CASCADE deleted (GDPR compliance)

No soft-delete or "archived" state - full deletion per FR-019 (GDPR right to be forgotten).

## Performance Considerations

1. **Tenant-scoped queries**: Always include `tenant_id` in WHERE clause (multi-tenant isolation)
2. **Index coverage**: Composite indexes on `(tenant_id, email)` and `(tenant_id, phone_number)` enable efficient lookups
3. **Pagination**: Offset-based pagination works well up to 100,000 users per tenant
4. **Array operations**: GIN indexes on token arrays enable fast containment checks
5. **Foreign key cascades**: ON DELETE CASCADE prevents orphaned records and ensures GDPR compliance

## Security Considerations

1. **Input validation**: Always validate email (RFC 5322) and phone (E.164) before database operations
2. **Tenant isolation**: Every query MUST filter by `tenant_id` to prevent cross-tenant data access
3. **SQL injection**: Use parameterized queries (Drizzle ORM handles this automatically)
4. **PII protection**: Email and phone are personally identifiable information - handle with GDPR compliance
5. **Device tokens**: Store securely, never log in plaintext, rotate when compromised
