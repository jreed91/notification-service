# Notification Service SDK

Official JavaScript/TypeScript SDK for the Notification Service. This SDK provides a simple and type-safe way to integrate multi-channel notifications (Email, SMS, Apple Push, Google Push) into your applications.

## Features

- 🎯 **Type-safe** - Full TypeScript support with comprehensive type definitions
- 🔐 **Secure** - Built-in API key authentication
- 📱 **Multi-channel** - Support for Email, SMS, Apple Push (APNs), and Google Push (FCM)
- 🌍 **Multi-language** - Built-in support for localized notifications
- 🎨 **Template-based** - Reusable notification templates with variable substitution
- ⚙️ **User preferences** - Granular control over notification channels per user
- 🚀 **Promise-based** - Modern async/await API
- 🔍 **Error handling** - Detailed error types for better debugging

## Installation

```bash
npm install @notification-service/sdk
```

or with yarn:

```bash
yarn add @notification-service/sdk
```

## Quick Start

```typescript
import { NotificationClient } from '@notification-service/sdk';

// Initialize the client
const client = new NotificationClient({
  baseUrl: 'https://api.yourservice.com',
  apiKey: 'your-api-key'
});

// Send a notification
const response = await client.notifications.send({
  userId: 'user-123',
  templateKey: 'welcome',
  variables: {
    name: 'John Doe',
    appName: 'MyApp'
  }
});

console.log(`Sent ${response.notificationIds.length} notifications`);
```

## Configuration

### Client Options

```typescript
interface NotificationClientConfig {
  /**
   * The base URL of the notification service API
   * @example "https://api.yourservice.com"
   */
  baseUrl: string;

  /**
   * Your API key for authentication
   */
  apiKey: string;

  /**
   * Request timeout in milliseconds (default: 30000)
   */
  timeout?: number;
}
```

## API Reference

### Notifications

#### Send a Notification

Send a notification to a user using a template.

```typescript
const response = await client.notifications.send({
  userId: 'user-123',
  templateKey: 'welcome',
  variables: {
    name: 'John Doe',
    appName: 'MyApp'
  },
  channels: ['EMAIL', 'APPLE_PUSH'] // Optional, defaults to user preferences
});
```

**Parameters:**
- `userId` (string, required) - The ID of the user to send the notification to
- `templateKey` (string, required) - The key of the notification template to use
- `variables` (object, optional) - Variables to substitute in the template
- `channels` (array, optional) - Specific channels to send to, overrides user preferences

**Returns:**
```typescript
{
  success: boolean;
  notificationIds: string[];
  errors: Array<{
    channel: DeliveryChannel;
    error: string;
  }>;
}
```

#### List Notifications

Retrieve a list of sent notifications with optional filtering.

```typescript
const { notifications, total } = await client.notifications.list({
  userId: 'user-123',
  status: 'SENT',
  limit: 50,
  offset: 0
});
```

**Parameters:**
- `userId` (string, optional) - Filter by user ID
- `status` (string, optional) - Filter by notification status (PENDING, SENT, DELIVERED, FAILED, BOUNCED)
- `limit` (number, optional) - Maximum number of results (default: 50)
- `offset` (number, optional) - Pagination offset (default: 0)

**Returns:**
```typescript
{
  notifications: Notification[];
  total: number;
}
```

### Templates

#### Create a Template

Create a new notification template.

```typescript
const template = await client.templates.create({
  key: 'welcome',
  name: 'Welcome Message',
  description: 'Sent to new users when they sign up',
  channels: ['EMAIL', 'APPLE_PUSH'],
  translations: {
    'en-US': {
      subject: 'Welcome to {{appName}}!',
      title: 'Welcome!',
      body: 'Hi {{name}}, welcome to our app!'
    },
    'es-ES': {
      subject: '¡Bienvenido a {{appName}}!',
      title: '¡Bienvenido!',
      body: 'Hola {{name}}, ¡bienvenido a nuestra aplicación!'
    }
  }
});
```

**Parameters:**
- `key` (string, required) - Unique identifier for the template
- `name` (string, required) - Human-readable name
- `description` (string, optional) - Description of the template
- `channels` (array, required) - Default channels to send to
- `translations` (object, required) - Localized content for the template

**Translation Object:**
```typescript
{
  [locale: string]: {
    subject?: string;  // For email
    title?: string;    // For push notifications
    body: string;      // Message body (required)
    variables?: string[];  // Expected variable names
  }
}
```

#### List Templates

Get all notification templates.

```typescript
const { templates } = await client.templates.list();
```

#### Get a Template

Retrieve a specific template by key.

```typescript
const template = await client.templates.get('welcome');
```

#### Update a Template

Update an existing template.

```typescript
const updated = await client.templates.update('welcome', {
  name: 'Updated Welcome Message',
  channels: ['EMAIL', 'APPLE_PUSH', 'GOOGLE_PUSH']
});
```

#### Delete a Template

Delete a template.

```typescript
await client.templates.delete('welcome');
```

### Users

#### Create a User

Register a new user in the notification system.

```typescript
const user = await client.users.create({
  id: 'user-123',
  email: 'user@example.com',
  phoneNumber: '+1234567890',
  locale: 'en-US',
  timezone: 'America/New_York',
  apnsDeviceToken: 'apns-device-token-here',
  fcmDeviceToken: 'fcm-device-token-here'
});
```

**Parameters:**
- `id` (string, required) - Unique user identifier
- `email` (string, optional) - User's email address
- `phoneNumber` (string, optional) - User's phone number (E.164 format)
- `locale` (string, optional) - User's locale (default: 'en-US')
- `timezone` (string, optional) - User's timezone
- `apnsDeviceToken` (string, optional) - Apple Push Notification device token
- `fcmDeviceToken` (string, optional) - Firebase Cloud Messaging device token

#### List Users

Get a paginated list of users.

```typescript
const { users } = await client.users.list({
  limit: 50,
  offset: 0
});
```

#### Get a User

Retrieve a specific user by ID.

```typescript
const user = await client.users.get('user-123');
```

#### Update a User

Update user information or device tokens.

```typescript
const updated = await client.users.update('user-123', {
  email: 'newemail@example.com',
  apnsDeviceToken: 'new-device-token',
  locale: 'es-ES'
});
```

### Subscriptions

Manage user notification preferences on a per-template, per-channel basis.

#### List User Subscriptions

Get all subscriptions for a user.

```typescript
const { subscriptions } = await client.subscriptions.list('user-123');
```

#### Create or Update a Subscription

Set user preferences for a specific template.

```typescript
const subscription = await client.subscriptions.upsert('user-123', {
  templateKey: 'welcome',
  channels: {
    EMAIL: true,
    APPLE_PUSH: true,
    GOOGLE_PUSH: false,
    SMS: false
  }
});
```

**Parameters:**
- `templateKey` (string, required) - The template key
- `channels` (object, required) - Channel preferences (true = subscribed, false = unsubscribed)

#### Delete a Subscription

Remove a user's subscription to a template.

```typescript
await client.subscriptions.delete('user-123', 'welcome');
```

## Error Handling

The SDK provides specific error types for different scenarios:

```typescript
import {
  NotificationSDKError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  NetworkError,
} from '@notification-service/sdk';

try {
  await client.notifications.send({ ... });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof ValidationError) {
    console.error('Validation errors:', error.errors);
  } else if (error instanceof NotFoundError) {
    console.error('Resource not found');
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof NetworkError) {
    console.error('Network request failed');
  } else if (error instanceof NotificationSDKError) {
    console.error('SDK error:', error.message);
  }
}
```

### Error Types

- **`NotificationSDKError`** - Base error class for all SDK errors
- **`AuthenticationError`** - Invalid or missing API key (401)
- **`NotFoundError`** - Requested resource not found (404)
- **`ValidationError`** - Request validation failed (400/422)
  - Includes `errors` property with field-specific validation errors
- **`RateLimitError`** - Too many requests (429)
  - Includes optional `retryAfter` property (seconds)
- **`NetworkError`** - Network request failed (no response)

## Advanced Usage

### Custom Timeout

```typescript
const client = new NotificationClient({
  baseUrl: 'https://api.yourservice.com',
  apiKey: 'your-api-key',
  timeout: 60000 // 60 seconds
});
```

### Batch Notifications

Send notifications to multiple users:

```typescript
const userIds = ['user-1', 'user-2', 'user-3'];

const results = await Promise.allSettled(
  userIds.map(userId =>
    client.notifications.send({
      userId,
      templateKey: 'announcement',
      variables: { message: 'Important update!' }
    })
  )
);

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`✓ Sent to ${userIds[index]}`);
  } else {
    console.error(`✗ Failed for ${userIds[index]}:`, result.reason);
  }
});
```

### Template Variables with Handlebars

The SDK supports Handlebars template syntax for dynamic content:

```typescript
// Create a template with variables
await client.templates.create({
  key: 'order-confirmation',
  name: 'Order Confirmation',
  channels: ['EMAIL'],
  translations: {
    'en-US': {
      subject: 'Order #{{orderNumber}} confirmed',
      body: `
        Hi {{customer.name}},

        Your order #{{orderNumber}} has been confirmed!

        Total: ${{formatCurrency amount}}
        Expected delivery: {{formatDate deliveryDate}}

        Items:
        {{#each items}}
        - {{this.name}} ({{this.quantity}}x)
        {{/each}}
      `
    }
  }
});

// Send with complex variables
await client.notifications.send({
  userId: 'user-123',
  templateKey: 'order-confirmation',
  variables: {
    customer: { name: 'John Doe' },
    orderNumber: '12345',
    amount: 99.99,
    deliveryDate: new Date(),
    items: [
      { name: 'Product A', quantity: 2 },
      { name: 'Product B', quantity: 1 }
    ]
  }
});
```

## TypeScript Support

The SDK is written in TypeScript and includes comprehensive type definitions:

```typescript
import type {
  NotificationClient,
  DeliveryChannel,
  NotificationStatus,
  User,
  NotificationTemplate,
  SendNotificationRequest,
  SendNotificationResponse,
} from '@notification-service/sdk';

// Full IntelliSense and type checking
const request: SendNotificationRequest = {
  userId: 'user-123',
  templateKey: 'welcome',
  variables: { name: 'John' }
};
```

## Examples

See the [examples directory](./examples) for complete working examples:

- [Basic notification sending](./examples/basic-send.ts)
- [Template management](./examples/template-management.ts)
- [User management](./examples/user-management.ts)
- [Subscription management](./examples/subscription-management.ts)
- [Error handling](./examples/error-handling.ts)
- [Batch operations](./examples/batch-operations.ts)

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

## License

MIT

## Support

For issues and questions, please open an issue on the [GitHub repository](https://github.com/yourorg/notification-service).
