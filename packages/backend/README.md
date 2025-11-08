# Notification Service Backend

Node.js/Express backend API for the multi-tenant notification service.

## Features

- RESTful API with Express
- Multi-tenant authentication via API keys
- PostgreSQL database with connection pooling
- Notification providers for APNs, FCM, SMS, and Email
- Handlebars template engine with variable substitution
- Automatic locale-based translation selection
- Comprehensive error handling and logging

## Project Structure

```
src/
├── controllers/        # Request handlers
├── database/          # Database client and schema
├── middleware/        # Authentication and other middleware
├── providers/         # Notification channel providers
├── routes/           # API route definitions
├── services/         # Business logic
├── utils/            # Utilities (template engine, etc.)
└── index.ts          # Application entry point
```

## API Endpoints

All endpoints require `X-API-Key` header.

### Users
- `POST /api/users` - Create user
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user

### Templates
- `POST /api/templates` - Create template
- `GET /api/templates` - List templates
- `GET /api/templates/:key` - Get template
- `PUT /api/templates/:key` - Update template
- `DELETE /api/templates/:key` - Delete template

### Subscriptions
- `GET /api/users/:userId/subscriptions` - Get subscriptions
- `PUT /api/users/:userId/subscriptions` - Update subscription
- `DELETE /api/users/:userId/subscriptions/:templateKey` - Delete subscription

### Notifications
- `POST /api/notifications/send` - Send notification
- `GET /api/notifications` - List notifications

## Development

```bash
# Install dependencies
npm install

# Run migrations
npm run migrate

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

See `.env.example` for all required configuration options.

## Database Migrations

To run database migrations:

```bash
npm run migrate
```

This will create all necessary tables and indexes.

## Adding New Notification Providers

1. Create a new provider class extending `NotificationProvider` in `src/providers/`
2. Implement the `send()` method
3. Add configuration to `.env.example`
4. Register the provider in `NotificationService`

Example:

```typescript
import { NotificationProvider } from './NotificationProvider';

export class CustomProvider extends NotificationProvider {
  channel = DeliveryChannel.CUSTOM;

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // Implementation
  }

  isConfigured(): boolean {
    return !!process.env.CUSTOM_API_KEY;
  }
}
```
