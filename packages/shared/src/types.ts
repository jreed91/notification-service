// Delivery channels
export enum DeliveryChannel {
  APPLE_PUSH = 'APPLE_PUSH',
  GOOGLE_PUSH = 'GOOGLE_PUSH',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

// Notification status
export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

// Tenant/Consumer
export interface Tenant {
  id: string;
  name: string;
  apiKey: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User
export interface User {
  id: string;
  tenantId: string;
  email?: string;
  phoneNumber?: string;
  locale: string; // e.g., 'en-US', 'es-ES'
  timezone?: string;
  apnsTokens: string[]; // Array of Apple Push Notification tokens (multi-device support)
  fcmTokens: string[]; // Array of Firebase Cloud Messaging tokens (multi-device support)
  createdAt: Date;
  updatedAt: Date;
}

// Notification template
export interface NotificationTemplate {
  id: string;
  tenantId: string;
  key: string; // unique identifier for the template
  name: string;
  description?: string;
  channels: DeliveryChannel[];
  translations: Record<string, TemplateTranslation>; // locale -> translation
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateTranslation {
  subject?: string; // for email
  title?: string; // for push notifications
  body: string;
  variables?: string[]; // list of expected variables
}

// Subscription preferences
export interface UserSubscription {
  id: string;
  userId: string;
  tenantId: string;
  templateKey: string;
  channels: {
    [DeliveryChannel.APPLE_PUSH]?: boolean;
    [DeliveryChannel.GOOGLE_PUSH]?: boolean;
    [DeliveryChannel.SMS]?: boolean;
    [DeliveryChannel.EMAIL]?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Notification
export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  templateKey: string;
  channel: DeliveryChannel;
  status: NotificationStatus;
  variables?: Record<string, any>;
  renderedContent?: {
    subject?: string;
    title?: string;
    body: string;
  };
  error?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response types
export interface SendNotificationRequest {
  userId: string;
  templateKey: string;
  variables?: Record<string, any>;
  channels?: DeliveryChannel[]; // if not specified, use user's subscribed channels
}

export interface SendNotificationResponse {
  success: boolean;
  notificationIds: string[];
  errors?: Array<{
    channel: DeliveryChannel;
    error: string;
  }>;
}

export interface CreateTemplateRequest {
  key: string;
  name: string;
  description?: string;
  channels: DeliveryChannel[];
  translations: Record<string, TemplateTranslation>;
}

export interface UpdateSubscriptionRequest {
  templateKey: string;
  channels: {
    [key in DeliveryChannel]?: boolean;
  };
}

export interface CreateUserRequest {
  email?: string;
  phoneNumber?: string;
  locale?: string; // Default: 'en-US'
  timezone?: string;
  apnsTokens?: string[]; // Array of device tokens
  fcmTokens?: string[]; // Array of device tokens
}

export interface UpdateUserRequest {
  email?: string;
  phoneNumber?: string;
  locale?: string;
  timezone?: string;
  apnsTokens?: string[]; // Replaces entire array
  fcmTokens?: string[]; // Replaces entire array
}

export interface UserResponse {
  id: string;
  tenantId: string;
  email?: string;
  phoneNumber?: string;
  locale: string;
  timezone?: string;
  apnsTokens: string[];
  fcmTokens: string[];
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

export interface ListUsersResponse {
  users: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
