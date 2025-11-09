# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant notification service supporting Apple Push (APNs), Google Push (FCM), SMS (Twilio), and Email (SMTP). Built as a TypeScript monorepo using Turborepo with a React frontend and Node.js backend.

## Monorepo Structure

This is a Turborepo-managed monorepo with npm workspaces:

```
packages/
├── shared/          # Shared TypeScript types and utilities
├── backend/         # Express API server
├── frontend/        # React dashboard (Vite)
└── sdk/             # JavaScript/TypeScript SDK for clients
```

**Important:** The `shared` package must be built before `backend`, `frontend`, or `sdk` as they depend on it.

## Common Commands

### Development
```bash
# Run all packages in dev mode
npm run dev

# Run backend only
npm run backend:dev

# Run frontend only
npm run frontend:dev

# Run specific package
turbo run dev --filter=@notification-service/backend
```

### Building
```bash
# Build all packages (respects dependency order)
npm run build

# Build specific workspace
npm run build -w packages/backend
npm run build -w packages/frontend
npm run build -w packages/shared
npm run build -w packages/sdk
```

### Testing
```bash
# Run all tests
npm test

# Backend tests (Jest)
npm run test -w packages/backend
npm run test:watch -w packages/backend
npm run test:coverage -w packages/backend

# Frontend tests (Vitest)
npm run test -w packages/frontend
npm run test:watch -w packages/frontend
npm run test:coverage -w packages/frontend

# SDK tests (Jest)
npm run test -w packages/sdk
```

### Linting
```bash
# Lint all packages
npm run lint

# Lint specific package
npm run lint -w packages/backend
npm run lint -w packages/frontend

# Auto-fix linting issues
npm run lint:fix -w packages/backend
```

### Database
```bash
# Start local PostgreSQL database (requires Docker)
npm run db:up

# Stop local database
npm run db:down

# Run migrations (uses existing SQL migration system)
npm run db:migrate

# Alternative: Use Drizzle migrations
npm run db:migrate -w packages/backend

# Open Drizzle Studio (database GUI)
npm run db:studio

# Generate Drizzle migrations from schema
npm run db:generate -w packages/backend

# Push schema changes directly to database (development only)
npm run db:push -w packages/backend
```

## Architecture

### Multi-Tenant System
- All requests require `X-API-Key` header for authentication
- Middleware (`packages/backend/src/middleware/`) validates API key and attaches tenant to request
- All database queries are scoped by `tenant_id` for data isolation
- Tenants table stores API keys and configuration

### Notification Pipeline
1. API receives request with `userId`, `templateKey`, and `variables`
2. Load user data (locale, device tokens, contact info)
3. Load notification template with translations
4. Check user's subscription preferences for each channel
5. Select translation based on user's locale
6. Render template with Handlebars, substituting variables
7. Send to enabled channels in parallel (APNs, FCM, SMS, Email)
8. Store notification record with delivery status

### Provider Pattern
All notification providers (`packages/backend/src/providers/`) implement a common interface:
- `ApnsProvider` - Apple Push Notifications
- `FcmProvider` - Firebase Cloud Messaging
- `SmsProvider` - Twilio SMS
- `EmailProvider` - Nodemailer/SMTP

Providers are automatically registered if environment variables are configured. The `NotificationService` routes to appropriate providers based on template channels and user subscriptions.

### Template System
- Templates support multiple channels and multiple languages
- Translations stored as JSONB: `{ "en-US": {...}, "es-ES": {...} }`
- Handlebars template engine with custom helpers (uppercase, lowercase, formatDate, formatDateTime)
- Variables are substituted at send time: `Hi {{name}}` → `Hi John`

### Database Schema
Key tables in PostgreSQL:
- `tenants` - Multi-tenant isolation with API keys
- `users` - End users with device tokens and contact info
- `notification_templates` - Reusable templates with channels and translations (JSONB)
- `user_subscriptions` - User preferences per template and channel (JSONB)
- `notifications` - Delivery history and status

**Database Management:**
- Schema is defined in both SQL (`packages/backend/src/database/schema.sql`) and Drizzle ORM (`packages/backend/src/database/schema.ts`)
- Drizzle ORM is integrated for type-safe database queries and migrations
- Legacy SQL migrations still supported via `npm run migrate`
- Drizzle Studio provides a web-based database GUI accessible via `npm run db:studio`
- Local development uses Docker Compose to run PostgreSQL (see `docker-compose.yml`)

### Frontend Architecture
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Router for navigation
- TanStack Query for server state management
- Zustand for client state (auth store)
- React Hook Form with Zod validation

## Key Files

### Backend Entry Point
- `packages/backend/src/index.ts` - Express app setup, middleware, routes

### Controllers
- `packages/backend/src/controllers/` - Request handlers for users, templates, notifications, subscriptions

### Database
- `packages/backend/src/database/client.ts` - PostgreSQL connection pooling and Drizzle client
- `packages/backend/src/database/schema.ts` - Drizzle ORM schema definitions
- `packages/backend/src/database/schema.sql` - Legacy SQL schema definitions
- `packages/backend/src/database/migrate.ts` - Legacy SQL migration script
- `packages/backend/src/database/drizzle-migrate.ts` - Drizzle migration runner
- `packages/backend/drizzle.config.ts` - Drizzle Kit configuration

### Services
- `packages/backend/src/services/NotificationService.ts` - Core notification orchestration logic

### Shared Types
- `packages/shared/src/types.ts` - TypeScript types shared across backend, frontend, and SDK

### Frontend
- `packages/frontend/src/App.tsx` - Main app component with routing
- `packages/frontend/src/stores/authStore.ts` - Authentication state management
- `packages/frontend/src/api/` - API client functions for backend communication

## Turborepo Configuration

Defined in `turbo.json`:
- **build**: Builds in dependency order, caches `dist/` outputs
- **lint**: Runs linting, no caching
- **test**: Runs after build, caches `coverage/`
- **dev**: No caching (persistent processes)

Turborepo provides intelligent caching - cached rebuilds are ~100x faster (~300ms vs ~15s).

## Environment Configuration

Backend requires `packages/backend/.env`:
- Database: `DATABASE_URL`
- APNs: `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_KEY_PATH`, `APNS_PRODUCTION`
- FCM: `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`

## Testing Strategy

### Backend (Jest)
- Unit tests for controllers, services, and providers
- Integration tests with PostgreSQL test database
- Mocked external APIs (APNs, FCM, Twilio, SMTP)
- Located in `packages/backend/src/__tests__/`

### Frontend (Vitest)
- Component tests with Testing Library
- Mock API responses using MSW patterns
- Located in `packages/frontend/src/__tests__/`

### SDK (Jest)
- Unit tests for SDK client methods
- Mock axios responses

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):
1. Lint all packages
2. Build all packages (using Turborepo)
3. Run all tests against PostgreSQL 14
4. Test on Node.js 18.x and 20.x
5. Build Docker image (multi-stage)

## Development Workflow

### Getting Started with Local Development
1. Start local database: `npm run db:up`
2. Run migrations: `npm run db:migrate`
3. Start backend: `npm run backend:dev`
4. Start frontend: `npm run frontend:dev`
5. Access Drizzle Studio (optional): `npm run db:studio`

### Adding Features
1. Update shared types in `packages/shared/src/types.ts` if needed
2. Add database changes:
   - Update Drizzle schema in `packages/backend/src/database/schema.ts`
   - OR add SQL migrations in `packages/backend/src/database/schema.sql`
3. Implement backend logic in controllers/services
4. Add backend tests
5. Update frontend components and API clients
6. Add frontend tests
7. Run `npm run lint` and `npm test` before committing

### Creating Templates
The frontend now includes a template creation UI:
- Navigate to Templates page
- Click "Create Template" button
- Fill out the form with:
  - Template key (unique identifier)
  - Display name
  - Description (optional)
  - Delivery channels (Email, Push, SMS)
  - Locale-specific content (subject, title, body)
  - Variables using Handlebars syntax: `{{variableName}}`
- Templates are saved and immediately available for sending notifications

## Important Notes

- Always build `shared` package first when working with types
- All database queries must include `tenant_id` for multi-tenant isolation
- Provider environment variables are optional - providers only register if configured
- Template translations are JSONB fields - use PostgreSQL JSONB operators for querying
- Frontend expects backend at `http://localhost:3000` in development
- Use `turbo run` commands for optimal caching and performance
