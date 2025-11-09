# Notification Service

![CI](https://github.com/jreed91/notification-service/workflows/CI/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive multi-tenant notification service built as a TypeScript monorepo with a React frontend and Node.js backend. Supports Apple Push Notifications (APNs), Google Push Notifications (FCM), SMS, and Email with full customization, variable substitution, translations, and subscription management.

## Features

- **Multi-Channel Delivery**: Send notifications via Apple Push (APNs), Google Push (FCM), SMS (Twilio), and Email (SMTP)
- **Template Engine**: Create reusable notification templates with Handlebars variable substitution
- **Multi-Language Support**: Define translations for each template supporting multiple locales
- **Subscription Management**: Users can subscribe/unsubscribe from specific notification types and delivery channels
- **Multi-Tenant Architecture**: Full SaaS support with API key-based tenant isolation
- **React Dashboard**: Comprehensive UI for managing templates, users, and notifications
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Modern Stack**: Built with Express, React, PostgreSQL, and modern tooling

## Architecture

This is a monorepo managed by **Turborepo** with three main packages:

```
notification-service/
├── packages/
│   ├── shared/          # Shared types and utilities
│   ├── backend/         # Node.js/Express API server
│   └── frontend/        # React/Vite dashboard
├── turbo.json          # Turborepo configuration
└── package.json        # Monorepo root configuration
```

**Benefits of Turborepo:**
- Intelligent build caching (10-100x faster rebuilds)
- Parallel task execution across packages
- Automatic dependency graph resolution
- Remote caching support (optional)

### Technology Stack

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL
- Firebase Admin SDK (FCM)
- node-apns (APNs)
- Twilio (SMS)
- Nodemailer (Email)
- Handlebars (templating)

**Frontend:**
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router
- TanStack Query
- Zustand (state management)

**Build System:**
- Turborepo for monorepo management
- npm workspaces for package linking
- TypeScript project references

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- API credentials for notification providers (APNs, FCM, Twilio, SMTP)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd notification-service
```

2. Install dependencies:
```bash
npm install
```

3. Set up the backend:
```bash
cd packages/backend
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Create PostgreSQL database
createdb notification_service

# Run migrations
npm run migrate -w packages/backend
```

5. Create a tenant (insert directly into database):
```sql
INSERT INTO tenants (name, api_key, active)
VALUES ('My Company', 'your-secure-api-key-here', true);
```

### Running the Application

**Development mode (all packages):**
```bash
npm run dev
```

**Or run individually:**

Backend:
```bash
npm run backend:dev
```

Frontend:
```bash
npm run frontend:dev
```

The backend will run on `http://localhost:3000` and the frontend on `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

## Configuration

### Backend Environment Variables

Create `packages/backend/.env` from `.env.example`:

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/notification_service

# Apple Push Notifications (APNs)
APNS_KEY_ID=your-key-id
APNS_TEAM_ID=your-team-id
APNS_KEY_PATH=/path/to/AuthKey.p8
APNS_PRODUCTION=false

# Firebase Cloud Messaging (FCM)
FCM_PROJECT_ID=your-project-id
FCM_CLIENT_EMAIL=your-client-email
FCM_PRIVATE_KEY=your-private-key

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# SMTP (Email)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@yourapp.com
SMTP_FROM_NAME=Your App Name
```

## API Documentation

### Authentication

All API requests require an API key in the header:

```
X-API-Key: your-api-key
```

### Endpoints

#### Users

- `POST /api/users` - Create a new user
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

#### Templates

- `POST /api/templates` - Create notification template
- `GET /api/templates` - List all templates
- `GET /api/templates/:key` - Get template by key
- `PUT /api/templates/:key` - Update template
- `DELETE /api/templates/:key` - Delete template

#### Subscriptions

- `GET /api/users/:userId/subscriptions` - Get user's subscriptions
- `PUT /api/users/:userId/subscriptions` - Update subscription
- `DELETE /api/users/:userId/subscriptions/:templateKey` - Delete subscription

#### Notifications

- `POST /api/notifications/send` - Send notification
- `GET /api/notifications` - List notifications

### Example: Create a Template

```bash
curl -X POST http://localhost:3000/api/templates \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "welcome",
    "name": "Welcome Message",
    "description": "Sent when a user signs up",
    "channels": ["EMAIL", "APPLE_PUSH", "GOOGLE_PUSH"],
    "translations": {
      "en-US": {
        "subject": "Welcome to {{appName}}!",
        "title": "Welcome!",
        "body": "Hi {{name}}, welcome to {{appName}}. We'\''re excited to have you!"
      },
      "es-ES": {
        "subject": "¡Bienvenido a {{appName}}!",
        "title": "¡Bienvenido!",
        "body": "Hola {{name}}, bienvenido a {{appName}}. ¡Estamos emocionados de tenerte!"
      }
    }
  }'
```

### Example: Send a Notification

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "templateKey": "welcome",
    "variables": {
      "name": "John Doe",
      "appName": "MyApp"
    }
  }'
```

## Template Variables

Templates use Handlebars syntax for variable substitution:

```handlebars
Hi {{name}}, your order #{{orderNumber}} has been {{status}}.
Total: ${{amount}}
```

Built-in helpers:
- `{{uppercase value}}` - Convert to uppercase
- `{{lowercase value}}` - Convert to lowercase
- `{{formatDate date}}` - Format date
- `{{formatDateTime date}}` - Format date and time

## Database Schema

The service uses PostgreSQL with the following main tables:

- `tenants` - Multi-tenant isolation
- `users` - End users with contact info and device tokens
- `notification_templates` - Reusable message templates with translations
- `user_subscriptions` - User preferences per template and channel
- `notifications` - Notification delivery history and status

## Deployment

### Docker

Create a `Dockerfile` in the root:

```dockerfile
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/
RUN npm install

# Copy source
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend
COPY tsconfig.json ./

# Build
RUN npm run build -w packages/shared
RUN npm run build -w packages/backend

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=base /app/packages/backend/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/backend/package.json ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Environment Variables for Production

Ensure all sensitive credentials are properly configured through environment variables, not committed to source control.

## Testing

The project includes comprehensive test suites for both backend and frontend.

### Running Tests

```bash
# Run all tests
npm test

# Run backend tests
npm run test -w packages/backend

# Run frontend tests
npm run test -w packages/frontend

# Run with coverage
npm run test:coverage -w packages/backend
npm run test:coverage -w packages/frontend
```

### Linting

```bash
# Lint all packages
npm run lint

# Auto-fix linting issues
npm run lint:fix -w packages/backend
npm run lint:fix -w packages/frontend
```

## CI/CD

This project uses GitHub Actions for continuous integration. The CI pipeline:

- Runs linting on all packages
- Builds all TypeScript packages
- Runs unit tests with Jest (backend) and Vitest (frontend)
- Tests against multiple Node.js versions (18.x, 20.x)
- Builds a Docker image for deployment

See [CI/CD Documentation](docs/CI-CD.md) for more details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
