/**
 * @notification-service/sdk
 *
 * Official JavaScript/TypeScript SDK for the Notification Service
 *
 * @example
 * ```typescript
 * import { NotificationClient } from '@notification-service/sdk';
 *
 * const client = new NotificationClient({
 *   baseUrl: 'https://api.yourservice.com',
 *   apiKey: 'your-api-key'
 * });
 *
 * // Send a notification
 * await client.notifications.send({
 *   userId: 'user-123',
 *   templateKey: 'welcome',
 *   variables: { name: 'John' }
 * });
 * ```
 */

// Export main client
export { NotificationClient } from './client';
export type { NotificationClientConfig } from './client';

// Export error classes
export {
  NotificationSDKError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  NetworkError,
} from './errors';

// Re-export types from shared package for convenience
export type {
  DeliveryChannel,
  NotificationStatus,
  Tenant,
  User,
  NotificationTemplate,
  TemplateTranslation,
  UserSubscription,
  Notification,
  SendNotificationRequest,
  SendNotificationResponse,
} from '@notification-service/shared';
