<!--
Sync Impact Report - Constitution Update

Version Change: N/A → 1.0.0 (Initial constitution)
Bump Rationale: MINOR - Initial constitution establishing core principles

Modified Principles: N/A (initial creation)

Added Sections:
- Core Principles (5 principles)
  - I. Multi-Tenant Isolation
  - II. Test-First Development
  - III. Type Safety
  - IV. Provider Pattern
  - V. Monorepo Discipline
- Development Standards
- Security & Data Protection
- Governance

Removed Sections: N/A (initial creation)

Templates Requiring Updates:
- ✅ plan-template.md - Constitution Check section aligns
- ✅ spec-template.md - Requirements and user stories align
- ✅ tasks-template.md - Test-first workflow and task organization align

Follow-up TODOs: None - all placeholders filled
-->

# Notification Service Constitution

## Core Principles

### I. Multi-Tenant Isolation (NON-NEGOTIABLE)

All database operations MUST include `tenant_id` for data isolation. Every API request MUST
be authenticated via `X-API-Key` header. Middleware validates the API key and attaches the
tenant context to each request. No shared data across tenants except system-level
configuration tables.

**Rationale**: SaaS multi-tenancy is foundational to the business model. Data leakage between
tenants would violate contractual obligations and regulatory requirements. Enforcement at the
database query level prevents accidental cross-tenant data access.

### II. Test-First Development

Tests MUST be written before implementation for all new features. Backend uses Jest with unit,
integration, and contract tests. Frontend uses Vitest with component tests. External APIs
(APNs, FCM, Twilio, SMTP) MUST be mocked in tests. Test coverage MUST be maintained above 80%
for critical paths (authentication, notification delivery, subscription management).

**Rationale**: Multi-channel notification delivery involves complex integrations with external
services. Test-first ensures contracts are validated before implementation and reduces
production incidents. Mocking external APIs prevents test flakiness and avoids hitting rate
limits or incurring costs.

### III. Type Safety

Full TypeScript coverage is mandatory across `shared`, `backend`, `frontend`, and `sdk`
packages. Shared types in `packages/shared/src/types.ts` MUST be the single source of truth
for data contracts. No `any` types except for truly dynamic third-party library integrations
that lack type definitions. The `shared` package MUST be built before other packages.

**Rationale**: Type safety prevents runtime errors caused by data contract mismatches between
frontend, backend, and SDK. Centralized types in `shared` ensure consistency across packages
and enable safe refactoring.

### IV. Provider Pattern

All notification channels (APNs, FCM, SMS, Email) MUST implement a common provider interface.
Providers register automatically if environment variables are configured. The
`NotificationService` routes to appropriate providers based on template channels and user
subscriptions. New channels MUST follow the established pattern in
`packages/backend/src/providers/`.

**Rationale**: The provider pattern decouples notification orchestration from channel-specific
implementations. This enables adding new channels without modifying core logic and allows
providers to be optional (environment-dependent). Consistency reduces cognitive load and
simplifies testing.

### V. Monorepo Discipline

Turborepo manages build order and caching. The `shared` package MUST be built before
`backend`, `frontend`, or `sdk` as they depend on it. Use `turbo run` commands for optimal
caching. Workspace commands (`npm run [script] -w packages/[name]`) target specific packages.
Never commit without running `npm run lint` and `npm test` successfully.

**Rationale**: Dependency order prevents cryptic build failures. Turborepo caching provides
10-100x faster rebuilds (~300ms vs ~15s). Enforcing lint and test gates maintains code
quality and prevents broken builds from reaching CI.

## Development Standards

### Code Organization

- **Backend**: Express routes → controllers → services → database
- **Frontend**: Pages → components → API clients → stores (Zustand)
- **Shared**: Types only - no implementation logic
- **SDK**: Client wrapper with TypeScript types from `shared`

### Template Engine

Templates use Handlebars with custom helpers (`uppercase`, `lowercase`, `formatDate`,
`formatDateTime`). Translations are stored as JSONB: `{ "en-US": {...}, "es-ES": {...} }`.
User locale determines which translation is selected. Variables are substituted at send time.

### Database Migrations

Schema changes MUST be added to `packages/backend/src/database/migrations.sql` and executed
via `npm run migrate -w packages/backend`. Never modify the database schema manually.
Migrations MUST be idempotent and tested against a clean database.

### Error Handling

Backend errors MUST use appropriate HTTP status codes (400, 401, 403, 404, 500). Frontend
MUST display user-friendly error messages. All errors MUST be logged with context (tenant,
user, operation). Provider errors (APNs, FCM, etc.) MUST be caught and recorded in the
`notifications` table with delivery status.

## Security & Data Protection

- **Authentication**: API key validation via middleware - no unauthenticated endpoints
- **Secrets Management**: All provider credentials (APNs keys, FCM service account, Twilio
  tokens, SMTP passwords) MUST be in environment variables, never committed to source control
- **Input Validation**: All API inputs MUST be validated before processing
- **SQL Injection**: Use parameterized queries - never concatenate user input into SQL
- **XSS Protection**: Frontend sanitizes all user-generated content before rendering
- **Rate Limiting**: API endpoints MUST implement rate limiting per tenant to prevent abuse

## Governance

### Amendment Process

Constitution changes require:

1. Documented rationale for the change
2. Impact analysis on existing features
3. Approval from project maintainers
4. Update to dependent templates and documentation
5. Version bump following semantic versioning

### Versioning Policy

- **MAJOR**: Backward incompatible changes (e.g., removing a principle, changing multi-tenant
  architecture)
- **MINOR**: New principle added or materially expanded guidance
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance Review

All pull requests MUST verify compliance with constitution principles. Code reviewers MUST
check:

- Multi-tenant isolation enforced
- Tests included and passing
- TypeScript types updated in `shared` if needed
- Provider pattern followed for new channels
- Shared package built before dependent packages

Any complexity additions (new abstraction layers, architectural patterns) MUST be justified
with specific technical requirements. Reference `.specify/memory/constitution.md` for runtime
development guidance.

**Version**: 1.0.0 | **Ratified**: 2025-11-09 | **Last Amended**: 2025-11-09
