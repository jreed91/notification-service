# Research Document: Add User Management Functionality

**Feature**: 001-add-user-functionality
**Date**: 2025-11-09
**Purpose**: Resolve technical unknowns and validate technology choices for user CRUD implementation

## 1. Email Validation Library

###Decision
Use **validator.js** (`validator` npm package) for RFC 5322 email validation.

### Rationale
- **RFC 5322 Compliance**: The `validator.isEmail()` function implements RFC 5322 standard email validation
- **Already in ecosystem**: Widely used in Express/Node.js applications with 8M+ weekly npm downloads
- **Zero additional dependencies**: Pure JavaScript implementation
- **TypeScript support**: Includes type definitions via `@types/validator`
- **Lightweight**: ~8KB minified, doesn't bloat bundle size
- **Battle-tested**: Mature library (10+ years) with extensive real-world usage

### Alternatives Considered

| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| **validator.js** | RFC 5322 compliant, lightweight, popular | None significant | ✅ **SELECTED** |
| email-validator | Very lightweight (2KB) | Less comprehensive validation, smaller community | ❌ Rejected - Less robust |
| Built-in regex | No dependencies | Regex for email is notoriously error-prone, doesn't handle edge cases | ❌ Rejected - Not RFC compliant |
| Zod email validation | Already using Zod for validation | Uses simple regex internally, not full RFC 5322 | ❌ Rejected - Not standards-compliant |

### Implementation Notes
```typescript
import validator from 'validator';

// Usage in validation layer
if (email && !validator.isEmail(email)) {
  throw new ValidationError('Invalid email format');
}
```

---

## 2. Phone Number Validation Library

### Decision
Use **libphonenumber-js** for E.164 international phone number validation.

### Rationale
- **E.164 Compliance**: Implements full E.164 international phone number standard
- **Country-aware validation**: Validates phone numbers with country-specific rules
- **Format normalization**: Can parse and format numbers to E.164 format (+[country][number])
- **Lightweight version available**: `libphonenumber-js/min` reduces bundle size (70KB vs 140KB for full version)
- **TypeScript native**: Written in TypeScript with first-class type support
- **Active maintenance**: Regular updates with latest phone number metadata
- **Google's libphonenumber port**: Based on Google's canonical libphonenumber library

### Alternatives Considered

| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| **libphonenumber-js** | E.164 compliant, country-aware, TypeScript | 70KB (min version) bundle size | ✅ **SELECTED** |
| google-libphonenumber | Official Google library, most accurate | 600KB+ bundle, requires C++ bindings in Node.js | ❌ Rejected - Too heavy |
| regex patterns | No dependencies | Can't handle international formats, country codes, validation | ❌ Rejected - Not E.164 compliant |
| validator.js isMobilePhone | Already considered validator.js | Less comprehensive than libphonenumber, limited country support | ❌ Rejected - Not full E.164 |

### Implementation Notes
```typescript
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js/min';

// Usage in validation layer
if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
  throw new ValidationError('Invalid phone number format (E.164 required)');
}

// Normalize to E.164 format
const normalized = parsePhoneNumber(phoneNumber)?.format('E.164');
```

---

## 3. Array Storage for Device Tokens

### Decision
Use **PostgreSQL TEXT[] array columns** for storing multiple device tokens per platform.

### Rationale
- **Native PostgreSQL support**: Arrays are first-class types in PostgreSQL
- **Type safety**: Column type enforces array structure at database level
- **Query performance**: Native array operators (`@>`, `&&`, `ANY`) are optimized
- **Drizzle ORM support**: Drizzle has excellent array column support via `text().array()`
- **Simple queries**: Can check for token presence with `WHERE apns_tokens @> ARRAY['token']`
- **Migration friendly**: Can migrate from existing TEXT columns to TEXT[] arrays
- **Index support**: GIN indexes can be created on array columns for fast lookups

### Alternatives Considered

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **TEXT[] arrays** | Native PG support, performant, type-safe | Migration complexity | ✅ **SELECTED** |
| JSONB column | Flexible, can store metadata with tokens | Slower queries, no type enforcement, harder to index | ❌ Rejected - Less performant |
| Separate `device_tokens` table | Fully normalized, traditional relational | More complex queries (JOIN required), overkill for simple list | ❌ Rejected - Over-engineered |
| Comma-separated TEXT | No migration needed | Must parse in application, no type safety, hard to query | ❌ Rejected - Not scalable |

### Database Schema Changes

**Migration Strategy**:
1. Add new array columns: `apns_tokens TEXT[]`, `fcm_tokens TEXT[]`
2. Migrate existing data: Copy single token to array if present
3. Drop old columns: `apns_device_token`, `fcm_device_token`
4. Update indexes: Create GIN indexes on array columns if needed

**Drizzle Schema**:
```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  email: varchar('email', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 50 }),
  locale: varchar('locale', { length: 10 }).notNull().default('en-US'),
  timezone: varchar('timezone', { length: 50 }),
  apnsTokens: text('apns_tokens').array(), // NEW: Array of APNs tokens
  fcmTokens: text('fcm_tokens').array(),   // NEW: Array of FCM tokens
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

**Query Examples**:
```typescript
// Check if user has specific token
const hasToken = await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.tenantId, tenantId),
      sql`${users.apnsTokens} @> ARRAY[${token}]::text[]`
    )
  );

// Add token to array (if not exists)
await db
  .update(users)
  .set({
    apnsTokens: sql`array_append(${users.apnsTokens}, ${newToken})`,
  })
  .where(eq(users.id, userId));
```

---

## 4. Pagination Best Practices

### Decision
Use **offset-based pagination** for initial implementation with page size of 50.

### Rationale
- **Simpler implementation**: Standard `LIMIT` and `OFFSET` SQL clauses
- **UI friendly**: Page numbers are intuitive for users (Page 1, 2, 3...)
- **Drizzle ORM support**: Built-in `.limit()` and `.offset()` methods
- **Sufficient for scale**: Works well for 100,000 users with proper indexing
- **Stateless**: No cursor state to maintain between requests
- **Random access**: Can jump to any page directly

### Performance Considerations
- **Index optimization**: Composite index on `(tenant_id, created_at)` for fast pagination
- **Offset performance**: For large offsets (page 1000+), performance degrades slightly
- **Trade-off**: Accepted for simplicity - cursor pagination can be added later if needed

### Alternatives Considered

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Offset-based** | Simple, UI-friendly, stateless | Slower for large offsets | ✅ **SELECTED** |
| Cursor-based (keyset) | Fast for large datasets, stable ordering | More complex API, can't jump to arbitrary page | ❌ Rejected - Overkill for MVP |
| GraphQL Relay style | Standard cursor format, widely adopted | Requires GraphQL, more complex than needed | ❌ Rejected - Not using GraphQL |

### API Design

**Request**:
```
GET /api/users?page=1&limit=50&sort=created_at&order=desc
```

**Response**:
```json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "totalPages": 25,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Implementation Notes**:
```typescript
// Drizzle query with pagination
const page = req.query.page || 1;
const limit = req.query.limit || 50;
const offset = (page - 1) * limit;

const users = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.tenantId, tenantId))
  .orderBy(desc(usersTable.createdAt))
  .limit(limit)
  .offset(offset);

const total = await db
  .select({ count: count() })
  .from(usersTable)
  .where(eq(usersTable.tenantId, tenantId));
```

---

## Summary

All research tasks have been resolved with concrete technical decisions:

1. ✅ **Email Validation**: validator.js (RFC 5322 compliant)
2. ✅ **Phone Validation**: libphonenumber-js/min (E.164 compliant)
3. ✅ **Device Token Storage**: PostgreSQL TEXT[] arrays (native, performant)
4. ✅ **Pagination**: Offset-based with 50 records per page (simple, sufficient)

### Dependencies to Add

**Backend**:
```bash
npm install validator libphonenumber-js -w packages/backend
npm install @types/validator -D -w packages/backend
```

**Database Migration**:
- Alter `users` table to add `apns_tokens TEXT[]` and `fcm_tokens TEXT[]`
- Migrate existing single token data to arrays
- Drop old `apns_device_token` and `fcm_device_token` columns

### Next Phase

Proceed to **Phase 1: Design & Contracts** to generate:
- `data-model.md` - User entity with array fields
- `contracts/users-api.yaml` - OpenAPI specification
- `quickstart.md` - Implementation guide
