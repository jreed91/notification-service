# Implementation Plan: Add User Management Functionality

**Branch**: `001-add-user-functionality` | **Date**: 2025-11-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-add-user-functionality/spec.md`

## Summary

This feature adds complete CRUD (Create, Read, Update, Delete, List) functionality for managing end users who receive notifications through the multi-tenant notification service. The implementation will provide both REST API endpoints and a React-based UI for tenant administrators to manage their notification recipient base. The system will support multi-device scenarios with array-based device token storage and full GDPR compliance with cascade deletion.

## Technical Context

**Language/Version**: TypeScript 5.3.3 + Node.js (backend), TypeScript 5.3.3 + React 18 (frontend)
**Primary Dependencies**: Express 4.x (backend), React 18 + Vite 5.x (frontend), PostgreSQL 14 (database), Drizzle ORM 0.44.x
**Storage**: PostgreSQL with existing `users` table schema
**Testing**: Jest (backend), Vitest (frontend)
**Target Platform**: Web application (backend API + React dashboard)
**Project Type**: Monorepo (Turborepo) with separate backend and frontend packages
**Performance Goals**: <500ms user creation, <200ms retrieval, 100 concurrent requests
**Constraints**: Multi-tenant isolation (mandatory), GDPR compliance (cascade delete), RFC 5322 email validation, E.164 phone validation
**Scale/Scope**: Support 100,000+ users per tenant with pagination

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Multi-Tenant Isolation (NON-NEGOTIABLE)
✅ **PASS** - All user operations will be scoped to `tenant_id`. API authentication via `X-API-Key` header is already implemented. Middleware attaches tenant context to requests. Database queries will include `tenant_id` in WHERE clauses.

### Test-First Development
✅ **PASS** - Backend tests (Jest) and frontend tests (Vitest) will be written before implementation. User CRUD operations will have unit tests, integration tests with PostgreSQL test database, and frontend component tests. External dependencies already mocked in existing tests.

### Type Safety
✅ **PASS** - TypeScript types will be added to `packages/shared/src/types.ts` for user-related request/response DTOs. Existing User interface will be extended with multi-device token support (arrays). Shared package will be built before backend/frontend.

### Provider Pattern
✅ **PASS** - Not applicable - this feature doesn't add new notification channels. Uses existing database and API patterns.

### Monorepo Discipline
✅ **PASS** - Will use Turborepo commands and workspace-specific npm scripts. Shared types will be updated and built first. Lint and test gates will be enforced before commits.

**Verdict**: ✅ All gates PASS - No constitution violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-add-user-functionality/
├── plan.md              # This file
├── research.md          # Phase 0 output (validation libraries, best practices)
├── data-model.md        # Phase 1 output (User entity with device token arrays)
├── quickstart.md        # Phase 1 output (implementation guide)
├── contracts/           # Phase 1 output (OpenAPI specs for user API)
│   └── users-api.yaml
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/
├── shared/
│   └── src/
│       └── types.ts              # Add CreateUserRequest, UpdateUserRequest, UserResponse types
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── users.ts          # New: User CRUD controller
│   │   ├── services/
│   │   │   └── UserService.ts    # New: User business logic
│   │   ├── middleware/
│   │   │   └── auth.ts           # Existing: Tenant authentication
│   │   ├── routes/
│   │   │   └── index.ts          # Update: Add /users routes
│   │   └── database/
│   │       ├── client.ts         # Existing: Database connection
│   │       └── schema.ts         # Update: Add Drizzle schema for users table
│   └── __tests__/
│       ├── unit/
│       │   └── UserService.test.ts    # New: Service tests
│       └── integration/
│           └── users.api.test.ts      # New: API endpoint tests
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   └── Users.tsx         # New: User management page
    │   ├── components/
    │   │   ├── CreateUserModal.tsx    # New: User creation form
    │   │   ├── EditUserModal.tsx      # New: User edit form
    │   │   └── UserList.tsx           # New: User list with pagination
    │   ├── api/
    │   │   └── users.ts          # New: User API client functions
    │   └── App.tsx               # Update: Add /users route
    └── __tests__/
        └── components/
            └── UserList.test.tsx      # New: Component tests
```

**Structure Decision**: Using existing Turborepo monorepo structure with `packages/backend` and `packages/frontend`. The `users` table already exists in the database schema. Implementation will add new controller, service layer, and React components following established patterns.

## Complexity Tracking

> **Not applicable** - No constitution violations to justify.

## Phase 0: Research & Technology Selection

**Objective**: Resolve technical unknowns and validate technology choices.

### Research Tasks

1. **Email Validation Library** (for FR-002)
   - Need: RFC 5322 compliant email validation
   - Options: validator.js, email-validator, built-in regex
   - Research: Library comparison for RFC 5322 compliance

2. **Phone Number Validation Library** (for FR-003)
   - Need: E.164 international format validation
   - Options: libphonenumber-js, google-libphonenumber, regex patterns
   - Research: Library comparison for E.164 validation

3. **Array Storage for Device Tokens** (for FR-017)
   - Need: Store multiple tokens per platform
   - Current schema: Single TEXT fields (`apns_device_token`, `fcm_device_token`)
   - Research: PostgreSQL array columns vs JSONB vs separate table
   - Considerations: Query performance, migration strategy, Drizzle ORM support

4. **Pagination Best Practices** (for FR-012)
   - Need: Handle 100,000+ users per tenant
   - Research: Cursor-based vs offset-based pagination
   - Considerations: Performance, bookmark support, Drizzle ORM patterns

**Output**: `research.md` with decisions and rationale for each research task.

## Phase 1: Design Artifacts

**Objective**: Generate data models, API contracts, and implementation guidance.

### Deliverables

1. **data-model.md**
   - User entity with updated device token fields (arrays)
   - Validation rules (email RFC 5322, phone E.164)
   - Relationships: User → Tenant (many-to-one), User → Notifications (one-to-many, cascade delete)
   - Indexes: tenant_id, email, phone_number

2. **contracts/users-api.yaml**
   - OpenAPI 3.0 specification
   - Endpoints: POST /api/users, GET /api/users/:id, GET /api/users, PUT /api/users/:id, DELETE /api/users/:id
   - Request/response schemas
   - Error responses (400, 401, 404, 409, 500)

3. **quickstart.md**
   - Implementation sequence (backend first, then frontend)
   - Database migration steps (if schema changes needed)
   - Testing strategy (unit → integration → E2E)
   - Deployment considerations

### Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh claude` to update CLAUDE.md with:
- User management API endpoints
- Device token array storage pattern
- GDPR cascade deletion behavior

## Next Steps

After Phase 1 completion:

1. Review generated artifacts (research.md, data-model.md, contracts/, quickstart.md)
2. Run `/speckit.tasks` to generate implementation task list
3. Begin implementation following task order in tasks.md
4. Write tests first for each task (test-first development)
5. Verify multi-tenant isolation in all queries
