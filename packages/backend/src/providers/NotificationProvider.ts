import { DeliveryChannel } from '@notification-service/shared';

export interface NotificationPayload {
  to: string;
  title?: string;
  body: string;
  subject?: string;
  data?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export abstract class NotificationProvider {
  abstract channel: DeliveryChannel;
  abstract send(payload: NotificationPayload): Promise<NotificationResult>;
  abstract isConfigured(): boolean;
}
