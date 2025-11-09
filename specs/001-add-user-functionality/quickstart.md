# Implementation Quickstart: Add User Management Functionality

**Feature**: 001-add-user-functionality
**Date**: 2025-11-09
**Purpose**: Step-by-step guide for implementing user CRUD functionality

## Overview

This guide walks through implementing complete user management (Create, Read, Update, Delete, List) for the notification service. Implementation follows test-first development principles and maintains strict multi-tenant isolation.

## Prerequisites

- Branch `001-add-user-functionality` checked out
- Backend and frontend dev environments running (`npm run dev`)
- PostgreSQL database running (`npm run db:up`)
- Dependencies installed (`npm install`)

## Implementation Sequence

**Strategy**: Backend first, then frontend. Each step includes tests before implementation.

### Phase 1: Database & Types (1-2 hours)

#### 1.1 Install Dependencies
```bash
# Backend validation libraries
npm install validator libphonenumber-js -w packages/backend
npm install @types/validator -D -w packages/backend
```

#### 1.2 Database Migration
```bash
# Run migration to add array columns
npm run db:migrate -w packages/backend
```

**Migration SQL** (add to `packages/backend/src/database/migrations.sql`):
```sql
-- Add new array columns for device tokens
ALTER TABLE users ADD COLUMN apns_tokens TEXT[];
ALTER TABLE users ADD COLUMN fcm_tokens TEXT[];

-- Migrate existing single token data to arrays
UPDATE users
SET apns_tokens = ARRAY[apns_device_token]::TEXT[]
WHERE apns_device_token IS NOT NULL;

UPDATE users
SET fcm_tokens = ARRAY[fcm_device_token]::TEXT[]
WHERE fcm_device_token IS NOT NULL;

-- Drop old single token columns
ALTER TABLE users DROP COLUMN IF EXISTS apns_device_token;
ALTER TABLE users DROP COLUMN IF EXISTS fcm_device_token;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_tenant_phone ON users(tenant_id, phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_tenant_created ON users(tenant_id, created_at DESC);

-- Add unique constraints
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS unique_tenant_email UNIQUE (tenant_id, email);
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS unique_tenant_phone UNIQUE (tenant_id, phone_number);
```

#### 1.3 Update Shared Types
**File**: `packages/shared/src/types.ts`

Add these type definitions:
```typescript
export interface CreateUserRequest {
  email?: string;
  phoneNumber?: string;
  locale?: string;
  timezone?: string;
  apnsTokens?: string[];
  fcmTokens?: string[];
}

export interface UpdateUserRequest {
  email?: string;
  phoneNumber?: string;
  locale?: string;
  timezone?: string;
  apnsTokens?: string[];
  fcmTokens?: string[];
}

export interface UserResponse {
  id: string;
  tenantId: string;
  email?: string;
  phoneNumber?: string;
  locale: string;
  timezone?: string;
  apnsTokens: string[];
  fcmTokens: string[];
  createdAt: string;
  updatedAt: string;
}

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

#### 1.4 Update Drizzle Schema
**File**: `packages/backend/src/database/schema.ts`

Update the users table definition:
```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 50 }),
  locale: varchar('locale', { length: 10 }).notNull().default('en-US'),
  timezone: varchar('timezone', { length: 50 }),
  apnsTokens: text('apns_tokens').array(),  // Changed from single token
  fcmTokens: text('fcm_tokens').array(),    // Changed from single token
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

#### 1.5 Build Shared Package
```bash
npm run build -w packages/shared
```

### Phase 2: Backend Service Layer (2-3 hours)

#### 2.1 Write Service Tests FIRST
**File**: `packages/backend/__tests__/unit/UserService.test.ts`

Key test cases:
- ✅ Create user with valid email
- ✅ Create user with valid phone
- ✅ Create user with device tokens
- ✅ Reject invalid email format
- ✅ Reject invalid phone format
- ✅ Reject duplicate email within tenant
- ✅ Allow duplicate email across tenants
- ✅ Reject user with no contact method
- ✅ Update user email
- ✅ Update device tokens (replace array)
- ✅ Delete user (verify cascade)
- ✅ List users with pagination
- ✅ Filter users by email

#### 2.2 Implement UserService
**File**: `packages/backend/src/services/UserService.ts`

Key methods:
```typescript
class UserService {
  async createUser(tenantId: string, data: CreateUserRequest): Promise<UserResponse>
  async getUserById(tenantId: string, userId: string): Promise<UserResponse | null>
  async listUsers(tenantId: string, page: number, limit: number, filters?: { email?: string; phone?: string }): Promise<ListUsersResponse>
  async updateUser(tenantId: string, userId: string, data: UpdateUserRequest): Promise<UserResponse | null>
  async deleteUser(tenantId: string, userId: string): Promise<boolean>

  // Private validation methods
  private validateEmail(email: string): boolean
  private validatePhone(phone: string): string  // Returns normalized E.164 format
  private validateAtLeastOneContact(data: CreateUserRequest | UpdateUserRequest): void
}
```

**Validation logic**:
- Use `validator.isEmail()` for RFC 5322 compliance
- Use `isValidPhoneNumber()` from libphonenumber-js for E.164 validation
- Enforce at least one contact method (email OR phone OR tokens)
- Normalize phone numbers to E.164 format before storage

#### 2.3 Run Service Tests
```bash
npm run test -w packages/backend -- UserService.test.ts
```

### Phase 3: Backend API Layer (2-3 hours)

#### 3.1 Write API Integration Tests FIRST
**File**: `packages/backend/__tests__/integration/users.api.test.ts`

Key test cases:
- ✅ POST /api/users creates user (201)
- ✅ POST /api/users rejects invalid email (400)
- ✅ POST /api/users rejects duplicate email (409)
- ✅ POST /api/users requires X-API-Key (401)
- ✅ GET /api/users/:id returns user (200)
- ✅ GET /api/users/:id returns 404 for non-existent
- ✅ GET /api/users/:id enforces tenant isolation
- ✅ GET /api/users lists users with pagination (200)
- ✅ PUT /api/users/:id updates user (200)
- ✅ DELETE /api/users/:id deletes user (204)
- ✅ DELETE /api/users/:id cascades to notifications

#### 3.2 Implement Users Controller
**File**: `packages/backend/src/controllers/users.ts`

Routes:
- `POST /api/users` → createUser()
- `GET /api/users/:id` → getUserById()
- `GET /api/users` → listUsers()
- `PUT /api/users/:id` → updateUser()
- `DELETE /api/users/:id` → deleteUser()

**Error handling**:
- 400: Validation errors (invalid email, phone, no contact method)
- 401: Missing or invalid X-API-Key
- 404: User not found or wrong tenant
- 409: Duplicate email/phone within tenant
- 500: Internal server error

#### 3.3 Register Routes
**File**: `packages/backend/src/routes/index.ts`

Add users routes:
```typescript
import usersRouter from './users';

router.use('/users', authMiddleware, usersRouter);
```

#### 3.4 Run API Tests
```bash
npm run test -w packages/backend -- users.api.test.ts
```

### Phase 4: Frontend Components (3-4 hours)

#### 4.1 Create API Client
**File**: `packages/frontend/src/api/users.ts`

```typescript
export const userApi = {
  create: async (data: CreateUserRequest): Promise<UserResponse> => { ... },
  list: async (page: number, limit: number): Promise<ListUsersResponse> => { ... },
  get: async (id: string): Promise<UserResponse> => { ... },
  update: async (id: string, data: UpdateUserRequest): Promise<UserResponse> => { ... },
  delete: async (id: string): Promise<void> => { ... },
};
```

#### 4.2 Write Component Tests FIRST
**File**: `packages/frontend/__tests__/components/UserList.test.tsx`

Key test cases:
- ✅ Renders user list
- ✅ Shows pagination controls
- ✅ Handles page navigation
- ✅ Opens create modal
- ✅ Opens edit modal
- ✅ Confirms delete action

#### 4.3 Implement Components

**File**: `packages/frontend/src/components/UserList.tsx`
- Table with columns: email, phone, locale, tokens, created date
- Pagination controls
- Action buttons: Edit, Delete
- "Create User" button

**File**: `packages/frontend/src/components/CreateUserModal.tsx`
- Form with React Hook Form + Zod validation
- Fields: email, phoneNumber, locale, timezone, tokens
- Validates email format client-side
- Validates phone format client-side
- Enforces at least one contact method

**File**: `packages/frontend/src/components/EditUserModal.tsx`
- Similar to CreateUserModal but pre-populated
- Allows partial updates

#### 4.4 Create Users Page
**File**: `packages/frontend/src/pages/Users.tsx`

Integrates:
- UserList component
- CreateUserModal (controlled by state)
- EditUserModal (controlled by state)
- TanStack Query for data fetching

#### 4.5 Add Route
**File**: `packages/frontend/src/App.tsx`

```typescript
<Route path="/users" element={<Users />} />
```

#### 4.6 Run Frontend Tests
```bash
npm run test -w packages/frontend
```

### Phase 5: Integration & E2E Testing (1-2 hours)

#### 5.1 Manual Testing Checklist
- [ ] Create user with email only
- [ ] Create user with phone only
- [ ] Create user with device tokens only
- [ ] Create user with all fields
- [ ] Attempt to create duplicate email (should fail)
- [ ] Update user email
- [ ] Update device tokens
- [ ] Delete user
- [ ] Verify cascade deletion (check notifications table)
- [ ] Pagination works with 50+ users
- [ ] Multi-tenant isolation (create test tenant, verify can't see other tenant's users)

#### 5.2 Performance Testing
```bash
# Load test user creation endpoint
npm run test:load -w packages/backend
```

Verify:
- User creation < 500ms (P95)
- User retrieval < 200ms (P95)
- List operation < 300ms with 10,000 users

### Phase 6: Deployment (1 hour)

#### 6.1 Run Full Test Suite
```bash
npm run lint
npm run build
npm test
```

#### 6.2 Create Pull Request
```bash
git add .
git commit -m "feat: add user management functionality

- Add user CRUD API endpoints
- Add React UI for user management
- Migrate device tokens to array storage
- Implement GDPR-compliant cascade deletion
- Add pagination for large user lists

Closes #001"

git push origin 001-add-user-functionality
gh pr create --title "Add User Management Functionality" --body "$(cat <<'EOF'
## Summary
Implements complete CRUD functionality for managing notification service end users.

## Changes
- Backend: User CRUD controller, service layer, validation
- Frontend: User list, create/edit modals, pagination
- Database: Migrate device tokens to array columns
- Tests: Unit, integration, and component tests

## Testing
- ✅ All tests passing
- ✅ Multi-tenant isolation verified
- ✅ GDPR cascade deletion tested
- ✅ Performance targets met (<500ms create, <200ms retrieve)

## Deployment Notes
- Run database migration before deploying
- No breaking changes to existing APIs

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Common Pitfalls & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Shared types not found | TypeScript errors in backend/frontend | Build shared package first: `npm run build -w packages/shared` |
| Multi-tenant leak | Users see other tenants' data | Always filter by `tenant_id` in WHERE clause |
| Invalid email accepted | Non-RFC 5322 emails stored | Use `validator.isEmail()`, not regex |
| Phone validation fails | International numbers rejected | Use `libphonenumber-js` with country code |
| Pagination slow | Queries timeout with many users | Ensure index on `(tenant_id, created_at)` exists |
| Device tokens not updating | Old tokens still present | Replace entire array, don't append |
| Delete doesn't cascade | Orphaned notifications remain | Verify `ON DELETE CASCADE` in foreign keys |

## Testing Strategy

### Unit Tests (Backend)
- Test UserService methods in isolation
- Mock database calls
- Focus on business logic and validation

### Integration Tests (Backend)
- Test full API endpoints with real database
- Use test database (separate from dev)
- Verify multi-tenant isolation
- Test cascade deletion

### Component Tests (Frontend)
- Test React components with Testing Library
- Mock API calls with MSW
- Verify user interactions (form submission, pagination)

### E2E Tests (Optional)
- Use Playwright or Cypress
- Test complete user journeys
- Verify frontend → backend → database flow

## Performance Optimization

1. **Database Indexes**: Ensure indexes on frequently queried columns
2. **Query Optimization**: Use Drizzle's query builder efficiently
3. **Pagination**: Limit results to 50 per page
4. **Caching** (future): Consider Redis cache for frequently accessed users
5. **Connection Pooling**: PostgreSQL connection pool already configured

## Security Checklist

- [x] All queries include `tenant_id` filter
- [x] X-API-Key authentication enforced
- [x] Email validation (RFC 5322)
- [x] Phone validation (E.164)
- [x] No PII in logs
- [x] GDPR cascade deletion implemented
- [x] Parameterized queries (SQL injection prevention)
- [x] Input sanitization on all fields

## Rollback Plan

If issues arise post-deployment:

1. **Revert database migration**:
   ```sql
   ALTER TABLE users ADD COLUMN apns_device_token TEXT;
   ALTER TABLE users ADD COLUMN fcm_device_token TEXT;
   UPDATE users SET apns_device_token = apns_tokens[1] WHERE array_length(apns_tokens, 1) > 0;
   UPDATE users SET fcm_device_token = fcm_tokens[1] WHERE array_length(fcm_tokens, 1) > 0;
   ALTER TABLE users DROP COLUMN apns_tokens;
   ALTER TABLE users DROP COLUMN fcm_tokens;
   ```

2. **Revert code**: Merge revert PR to main

3. **Redeploy**: Previous version

## Next Steps

After this feature is deployed:

1. **Analytics**: Track user creation/deletion rates
2. **Monitoring**: Set up alerts for API errors
3. **Documentation**: Update API docs with user endpoints
4. **Future enhancements**:
   - Bulk user import (CSV)
   - User groups/segments
   - Advanced filtering (by locale, timezone)
   - User activity audit log

## Resources

- [Spec Document](./spec.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/users-api.yaml)
- [Research Decisions](./research.md)
- [Implementation Plan](./plan.md)
