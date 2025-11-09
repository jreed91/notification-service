import { HttpClient, HttpClientConfig } from './http-client';
import type {
  NotificationTemplate,
  User,
  UserSubscription,
  Notification,
  SendNotificationRequest,
  SendNotificationResponse,
} from '@notification-service/shared';

export interface NotificationClientConfig {
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

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface ListNotificationsParams extends PaginationParams {
  userId?: string;
  status?: string;
}

export interface ListUsersParams extends PaginationParams {
  // Add filters as needed
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

/**
 * Main client for interacting with the Notification Service
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
export class NotificationClient {
  private http: HttpClient;

  /**
   * Notification operations
   */
  public notifications: NotificationOperations;

  /**
   * Template operations
   */
  public templates: TemplateOperations;

  /**
   * User operations
   */
  public users: UserOperations;

  /**
   * Subscription operations
   */
  public subscriptions: SubscriptionOperations;

  constructor(config: NotificationClientConfig) {
    const httpConfig: HttpClientConfig = {
      baseUrl: config.baseUrl.endsWith('/api')
        ? config.baseUrl
        : `${config.baseUrl}/api`,
      apiKey: config.apiKey,
      timeout: config.timeout,
    };

    this.http = new HttpClient(httpConfig);

    this.notifications = new NotificationOperations(this.http);
    this.templates = new TemplateOperations(this.http);
    this.users = new UserOperations(this.http);
    this.subscriptions = new SubscriptionOperations(this.http);
  }
}

/**
 * Notification-related operations
 */
export class NotificationOperations {
  constructor(private http: HttpClient) {}

  /**
   * Send a notification to a user
   *
   * @param request - The notification request
   * @returns Response with notification IDs and any errors
   *
   * @example
   * ```typescript
   * const response = await client.notifications.send({
   *   userId: 'user-123',
   *   templateKey: 'welcome',
   *   variables: { name: 'John', appName: 'MyApp' },
   *   channels: ['EMAIL', 'APPLE_PUSH'] // Optional
   * });
   * ```
   */
  async send(request: SendNotificationRequest): Promise<SendNotificationResponse> {
    return this.http.post<SendNotificationResponse>('/notifications/send', request);
  }

  /**
   * List notifications with optional filtering
   *
   * @param params - Query parameters for filtering and pagination
   * @returns List of notifications and total count
   *
   * @example
   * ```typescript
   * const { notifications, total } = await client.notifications.list({
   *   userId: 'user-123',
   *   status: 'SENT',
   *   limit: 50,
   *   offset: 0
   * });
   * ```
   */
  async list(params?: ListNotificationsParams): Promise<{ notifications: Notification[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.http.get<{ notifications: Notification[]; total: number }>(
      `/notifications${query ? `?${query}` : ''}`
    );
  }
}

/**
 * Template-related operations
 */
export class TemplateOperations {
  constructor(private http: HttpClient) {}

  /**
   * Create a new notification template
   *
   * @param template - The template to create
   * @returns The created template
   *
   * @example
   * ```typescript
   * const template = await client.templates.create({
   *   key: 'welcome',
   *   name: 'Welcome Message',
   *   description: 'Sent to new users',
   *   channels: ['EMAIL', 'APPLE_PUSH'],
   *   translations: {
   *     'en-US': {
   *       subject: 'Welcome to {{appName}}!',
   *       title: 'Welcome!',
   *       body: 'Hi {{name}}, welcome to our app!'
   *     }
   *   }
   * });
   * ```
   */
  async create(template: Omit<NotificationTemplate, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    return this.http.post<NotificationTemplate>('/templates', template);
  }

  /**
   * List all templates
   *
   * @returns List of templates
   *
   * @example
   * ```typescript
   * const { templates } = await client.templates.list();
   * ```
   */
  async list(): Promise<{ templates: NotificationTemplate[] }> {
    return this.http.get<{ templates: NotificationTemplate[] }>('/templates');
  }

  /**
   * Get a specific template by key
   *
   * @param key - The template key
   * @returns The template
   *
   * @example
   * ```typescript
   * const template = await client.templates.get('welcome');
   * ```
   */
  async get(key: string): Promise<NotificationTemplate> {
    return this.http.get<NotificationTemplate>(`/templates/${key}`);
  }

  /**
   * Update a template
   *
   * @param key - The template key
   * @param updates - The fields to update
   * @returns The updated template
   *
   * @example
   * ```typescript
   * const updated = await client.templates.update('welcome', {
   *   name: 'Updated Welcome Message',
   *   channels: ['EMAIL', 'APPLE_PUSH', 'GOOGLE_PUSH']
   * });
   * ```
   */
  async update(
    key: string,
    updates: Partial<Omit<NotificationTemplate, 'id' | 'tenantId' | 'key' | 'createdAt' | 'updatedAt'>>
  ): Promise<NotificationTemplate> {
    return this.http.put<NotificationTemplate>(`/templates/${key}`, updates);
  }

  /**
   * Delete a template
   *
   * @param key - The template key
   *
   * @example
   * ```typescript
   * await client.templates.delete('welcome');
   * ```
   */
  async delete(key: string): Promise<void> {
    return this.http.delete<void>(`/templates/${key}`);
  }
}

/**
 * User-related operations
 */
export class UserOperations {
  constructor(private http: HttpClient) {}

  /**
   * Create a new user
   *
   * @param user - The user to create
   * @returns The created user
   *
   * @example
   * ```typescript
   * const user = await client.users.create({
   *   id: 'user-123',
   *   email: 'user@example.com',
   *   phoneNumber: '+1234567890',
   *   locale: 'en-US',
   *   apnsDeviceToken: 'device-token',
   *   fcmDeviceToken: 'fcm-token'
   * });
   * ```
   */
  async create(user: Omit<User, 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return this.http.post<User>('/users', user);
  }

  /**
   * List users with pagination
   *
   * @param params - Pagination parameters
   * @returns List of users
   *
   * @example
   * ```typescript
   * const { users } = await client.users.list({ limit: 50, offset: 0 });
   * ```
   */
  async list(params?: ListUsersParams): Promise<{ users: User[] }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.http.get<{ users: User[] }>(`/users${query ? `?${query}` : ''}`);
  }

  /**
   * Get a specific user by ID
   *
   * @param id - The user ID
   * @returns The user
   *
   * @example
   * ```typescript
   * const user = await client.users.get('user-123');
   * ```
   */
  async get(id: string): Promise<User> {
    return this.http.get<User>(`/users/${id}`);
  }

  /**
   * Update a user
   *
   * @param id - The user ID
   * @param updates - The fields to update
   * @returns The updated user
   *
   * @example
   * ```typescript
   * const updated = await client.users.update('user-123', {
   *   email: 'newemail@example.com',
   *   apnsDeviceToken: 'new-device-token'
   * });
   * ```
   */
  async update(
    id: string,
    updates: Partial<Omit<User, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>
  ): Promise<User> {
    return this.http.put<User>(`/users/${id}`, updates);
  }
}

/**
 * Subscription-related operations
 */
export class SubscriptionOperations {
  constructor(private http: HttpClient) {}

  /**
   * Get all subscriptions for a user
   *
   * @param userId - The user ID
   * @returns List of subscriptions
   *
   * @example
   * ```typescript
   * const { subscriptions } = await client.subscriptions.list('user-123');
   * ```
   */
  async list(userId: string): Promise<{ subscriptions: UserSubscription[] }> {
    return this.http.get<{ subscriptions: UserSubscription[] }>(`/users/${userId}/subscriptions`);
  }

  /**
   * Create or update a subscription for a user
   *
   * @param userId - The user ID
   * @param subscription - The subscription data
   * @returns The created/updated subscription
   *
   * @example
   * ```typescript
   * const subscription = await client.subscriptions.upsert('user-123', {
   *   templateKey: 'welcome',
   *   channels: {
   *     EMAIL: true,
   *     APPLE_PUSH: true,
   *     GOOGLE_PUSH: false,
   *     SMS: false
   *   }
   * });
   * ```
   */
  async upsert(
    userId: string,
    subscription: Omit<UserSubscription, 'id' | 'userId' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<UserSubscription> {
    return this.http.put<UserSubscription>(`/users/${userId}/subscriptions`, subscription);
  }

  /**
   * Delete a subscription
   *
   * @param userId - The user ID
   * @param templateKey - The template key
   *
   * @example
   * ```typescript
   * await client.subscriptions.delete('user-123', 'welcome');
   * ```
   */
  async delete(userId: string, templateKey: string): Promise<void> {
    return this.http.delete<void>(`/users/${userId}/subscriptions/${templateKey}`);
  }
}
