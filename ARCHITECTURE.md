# Architecture Overview

## System Design

The Notification Service is designed as a multi-tenant SaaS application with the following key components:

### High-Level Architecture

```
┌─────────────┐
│   Clients   │
│  (Tenants)  │
└──────┬──────┘
       │ API Key
       ▼
┌─────────────────────────────────────┐
│         Load Balancer/Proxy         │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌──────────┐    ┌──────────┐
│ Frontend │    │ Backend  │
│  (React) │    │(Express) │
└──────────┘    └─────┬────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
    ┌──────────┐ ┌────────┐ ┌─────────┐
    │PostgreSQL│ │Provider│ │Provider │
    │ Database │ │  APIs  │ │Services │
    └──────────┘ └────────┘ └─────────┘
                    │              │
                ┌───┴────┐    ┌────┴────┐
                │  APNs  │    │   FCM   │
                │  SMS   │    │  Email  │
                └────────┘    └─────────┘
```

## Core Components

### 1. Multi-Tenant System

**Tenant Isolation:**
- Each tenant has a unique API key
- All database queries are scoped by `tenant_id`
- Middleware validates API key on every request
- Row-level isolation ensures data security

**Authentication Flow:**
```
Request → API Key Header → Middleware → Database Lookup → Attach Tenant → Route Handler
```

### 2. Notification Pipeline

**Sending Flow:**
```
1. API Request (userId, templateKey, variables)
2. Load User (with locale, device tokens, contact info)
3. Load Template (with translations)
4. Check Subscriptions (which channels are enabled)
5. Select Translation (based on user locale)
6. Render Template (substitute variables)
7. Send to Channels (parallel execution)
8. Update Status (store results)
```

### 3. Template Engine

Uses Handlebars for variable substitution:

**Template:**
```handlebars
Hi {{name}}, your order #{{orderNumber}} is {{status}}.
```

**Variables:**
```json
{
  "name": "John",
  "orderNumber": "12345",
  "status": "shipped"
}
```

**Result:**
```
Hi John, your order #12345 is shipped.
```

### 4. Translation System

Each template contains translations for multiple locales:

```typescript
{
  "en-US": {
    "title": "Welcome!",
    "body": "Welcome {{name}}"
  },
  "es-ES": {
    "title": "¡Bienvenido!",
    "body": "Bienvenido {{name}}"
  }
}
```

Selection is automatic based on user's `locale` field.

### 5. Subscription Management

**Granular Control:**
- Users can subscribe/unsubscribe per template
- Users can enable/disable specific channels per template
- Default: all template channels enabled

**Example:**
```typescript
{
  templateKey: "order-updates",
  channels: {
    EMAIL: true,
    APPLE_PUSH: true,
    SMS: false,
    GOOGLE_PUSH: false
  }
}
```

### 6. Provider System

**Abstract Provider Pattern:**
```typescript
abstract class NotificationProvider {
  abstract channel: DeliveryChannel;
  abstract send(payload): Promise<Result>;
  abstract isConfigured(): boolean;
}
```

**Implementations:**
- `ApnsProvider` - Apple Push Notifications
- `FcmProvider` - Firebase Cloud Messaging
- `SmsProvider` - Twilio SMS
- `EmailProvider` - SMTP/SendGrid

**Provider Selection:**
- Providers self-register if configured
- NotificationService routes to appropriate provider
- Failures are logged but don't block other channels

## Database Schema

### Entity Relationships

```
Tenants (1) ──< (N) Users
Tenants (1) ──< (N) Templates
Tenants (1) ──< (N) Notifications

Users (1) ──< (N) Subscriptions
Users (1) ──< (N) Notifications

Templates (1) ──< (N) Subscriptions
Templates (1) ──< (N) Notifications
```

### Key Tables

**tenants:**
- Stores tenant/customer information
- Contains API key for authentication
- Enables/disables tenant access

**users:**
- End users who receive notifications
- Contains device tokens (APNs, FCM)
- Contains contact info (email, phone)
- Stores locale preference

**notification_templates:**
- Reusable notification definitions
- JSONB columns for channels and translations
- Scoped by tenant

**user_subscriptions:**
- User preferences per template
- JSONB column for channel preferences
- Allows granular opt-in/opt-out

**notifications:**
- Audit log of all sent notifications
- Stores rendered content
- Tracks delivery status
- Useful for debugging and analytics

## Scalability Considerations

### Horizontal Scaling

**Backend:**
- Stateless API servers
- Connection pooling for database
- Can run multiple instances behind load balancer

**Database:**
- PostgreSQL supports read replicas
- Indexes on frequently queried columns
- Partitioning possible on `notifications` table by date

### Performance Optimization

**Caching Strategy:**
- Templates rarely change - can be cached
- User data can be cached with TTL
- Consider Redis for hot data

**Async Processing:**
- For high-volume scenarios, consider:
  - Message queue (RabbitMQ, SQS) for notifications
  - Worker processes to handle sends
  - Batch processing for bulk notifications

**Database Optimization:**
- Indexes on: tenant_id, user_id, template_key, status
- JSONB indexes for filtering translations
- Regular VACUUM and ANALYZE

## Security

### Authentication & Authorization

**API Key Security:**
- Store API keys hashed in production
- Rotate keys regularly
- Rate limiting per API key

**Data Isolation:**
- All queries filtered by tenant_id
- Prepared statements prevent SQL injection
- Input validation with Zod schemas

### Sensitive Data

**Credentials:**
- All provider credentials in environment variables
- Never commit secrets to version control
- Use secret management service in production

**PII Protection:**
- User emails and phone numbers are PII
- Consider encryption at rest
- GDPR compliance for EU users

## Monitoring & Observability

### Logging

**Application Logs:**
- Request/response logging
- Error tracking with stack traces
- Provider communication logs

**Metrics to Track:**
- Notifications sent per channel
- Success/failure rates
- API response times
- Database query performance

### Alerting

**Critical Alerts:**
- Provider API failures
- Database connection issues
- High error rates
- API key authentication failures

## Future Enhancements

1. **Webhooks** - Callback URLs for delivery status
2. **Scheduling** - Send notifications at specific times
3. **Batching** - Send same notification to multiple users
4. **A/B Testing** - Test different message variants
5. **Analytics Dashboard** - Delivery stats and insights
6. **Rich Content** - Images, buttons, action links
7. **Message Threading** - Conversation-style notifications
8. **Priority Levels** - High-priority vs normal messages
