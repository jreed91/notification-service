import { v4 as uuidv4 } from 'uuid';
import {
  DeliveryChannel,
  NotificationStatus,
  NotificationTemplate,
  User,
  Notification,
  SendNotificationRequest,
  SendNotificationResponse,
} from '@notification-service/shared';
import { db } from '../database/client';
import { NotificationProvider } from '../providers/NotificationProvider';
import { ApnsProvider } from '../providers/ApnsProvider';
import { FcmProvider } from '../providers/FcmProvider';
import { SmsProvider } from '../providers/SmsProvider';
import { EmailProvider } from '../providers/EmailProvider';
import { templateEngine } from '../utils/templateEngine';

export class NotificationService {
  private providers: Map<DeliveryChannel, NotificationProvider>;

  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  private initializeProviders() {
    const apnsProvider = new ApnsProvider();
    const fcmProvider = new FcmProvider();
    const smsProvider = new SmsProvider();
    const emailProvider = new EmailProvider();

    if (apnsProvider.isConfigured()) {
      this.providers.set(DeliveryChannel.APPLE_PUSH, apnsProvider);
    }
    if (fcmProvider.isConfigured()) {
      this.providers.set(DeliveryChannel.GOOGLE_PUSH, fcmProvider);
    }
    if (smsProvider.isConfigured()) {
      this.providers.set(DeliveryChannel.SMS, smsProvider);
    }
    if (emailProvider.isConfigured()) {
      this.providers.set(DeliveryChannel.EMAIL, emailProvider);
    }

    console.log(`Initialized ${this.providers.size} notification providers`);
  }

  async sendNotification(
    tenantId: string,
    request: SendNotificationRequest
  ): Promise<SendNotificationResponse> {
    try {
      // Get user
      const userResult = await db.query<User>(
        'SELECT * FROM users WHERE id = $1 AND tenant_id = $2',
        [request.userId, tenantId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Get template
      const templateResult = await db.query<NotificationTemplate>(
        'SELECT * FROM notification_templates WHERE tenant_id = $1 AND key = $2',
        [tenantId, request.templateKey]
      );

      if (templateResult.rows.length === 0) {
        throw new Error('Template not found');
      }

      const template = templateResult.rows[0];

      // Get user's subscriptions for this template
      const subscriptionResult = await db.query(
        'SELECT channels FROM user_subscriptions WHERE user_id = $1 AND template_key = $2',
        [user.id, request.templateKey]
      );

      // Determine which channels to use
      let channels: DeliveryChannel[];
      if (request.channels && request.channels.length > 0) {
        // Use specified channels
        channels = request.channels;
      } else if (subscriptionResult.rows.length > 0) {
        // Use subscribed channels
        const subscribedChannels = subscriptionResult.rows[0].channels;
        channels = Object.entries(subscribedChannels)
          .filter(([_, enabled]) => enabled)
          .map(([channel]) => channel as DeliveryChannel);
      } else {
        // Use all template channels by default
        channels = template.channels as DeliveryChannel[];
      }

      // Get translation for user's locale
      const translation = template.translations[user.locale] || template.translations['en-US'];
      if (!translation) {
        throw new Error('No translation available for user locale');
      }

      // Render template with variables
      const renderedContent = {
        subject: translation.subject ? templateEngine.render(translation.subject, request.variables || {}) : undefined,
        title: translation.title ? templateEngine.render(translation.title, request.variables || {}) : undefined,
        body: templateEngine.render(translation.body, request.variables || {}),
      };

      // Send notifications for each channel
      const notificationIds: string[] = [];
      const errors: Array<{ channel: DeliveryChannel; error: string }> = [];

      for (const channel of channels) {
        const notificationId = await this.sendToChannel(
          tenantId,
          user,
          channel,
          template.key,
          renderedContent,
          request.variables
        );

        if (notificationId) {
          notificationIds.push(notificationId);
        } else {
          errors.push({
            channel,
            error: 'Failed to send notification',
          });
        }
      }

      return {
        success: notificationIds.length > 0,
        notificationIds,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      throw new Error(`Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async sendToChannel(
    tenantId: string,
    user: User,
    channel: DeliveryChannel,
    templateKey: string,
    renderedContent: { subject?: string; title?: string; body: string },
    variables?: Record<string, any>
  ): Promise<string | null> {
    const notificationId = uuidv4();

    try {
      // Create notification record
      await db.query(
        `INSERT INTO notifications (id, tenant_id, user_id, template_key, channel, status, variables, rendered_content)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          notificationId,
          tenantId,
          user.id,
          templateKey,
          channel,
          NotificationStatus.PENDING,
          JSON.stringify(variables || {}),
          JSON.stringify(renderedContent),
        ]
      );

      // Get provider
      const provider = this.providers.get(channel);
      if (!provider) {
        await this.updateNotificationStatus(
          notificationId,
          NotificationStatus.FAILED,
          `Provider not configured for channel ${channel}`
        );
        return null;
      }

      // Determine recipient
      let recipient: string | undefined;
      switch (channel) {
        case DeliveryChannel.APPLE_PUSH:
          recipient = user.apns_device_token;
          break;
        case DeliveryChannel.GOOGLE_PUSH:
          recipient = user.fcm_device_token;
          break;
        case DeliveryChannel.SMS:
          recipient = user.phone_number;
          break;
        case DeliveryChannel.EMAIL:
          recipient = user.email;
          break;
      }

      if (!recipient) {
        await this.updateNotificationStatus(
          notificationId,
          NotificationStatus.FAILED,
          `No recipient configured for channel ${channel}`
        );
        return null;
      }

      // Send notification
      const result = await provider.send({
        to: recipient,
        title: renderedContent.title,
        body: renderedContent.body,
        subject: renderedContent.subject,
        data: variables,
      });

      if (result.success) {
        await this.updateNotificationStatus(notificationId, NotificationStatus.SENT);
      } else {
        await this.updateNotificationStatus(notificationId, NotificationStatus.FAILED, result.error);
        return null;
      }

      return notificationId;
    } catch (error) {
      await this.updateNotificationStatus(
        notificationId,
        NotificationStatus.FAILED,
        error instanceof Error ? error.message : 'Unknown error'
      );
      return null;
    }
  }

  private async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    error?: string
  ): Promise<void> {
    const sentAt = status === NotificationStatus.SENT ? new Date() : null;
    await db.query(
      'UPDATE notifications SET status = $1, error = $2, sent_at = $3 WHERE id = $4',
      [status, error || null, sentAt, notificationId]
    );
  }
}
