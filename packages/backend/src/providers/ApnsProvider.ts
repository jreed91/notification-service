import apn from '@apns/node-apns';
import { DeliveryChannel } from '@notification-service/shared';
import { NotificationProvider, NotificationPayload, NotificationResult } from './NotificationProvider';

export class ApnsProvider extends NotificationProvider {
  channel = DeliveryChannel.APPLE_PUSH;
  private provider: apn.Provider | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private initialize() {
    const keyId = process.env.APNS_KEY_ID;
    const teamId = process.env.APNS_TEAM_ID;
    const keyPath = process.env.APNS_KEY_PATH;
    const production = process.env.APNS_PRODUCTION === 'true';

    if (keyId && teamId && keyPath) {
      try {
        this.provider = new apn.Provider({
          token: {
            key: keyPath,
            keyId,
            teamId,
          },
          production,
        });
        console.log('APNs provider initialized');
      } catch (error) {
        console.error('Failed to initialize APNs provider:', error);
      }
    }
  }

  isConfigured(): boolean {
    return this.provider !== null;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.provider) {
      return {
        success: false,
        error: 'APNs provider not configured',
      };
    }

    try {
      const notification = new apn.Notification();
      notification.alert = {
        title: payload.title || '',
        body: payload.body,
      };
      notification.sound = 'default';
      notification.badge = 1;
      notification.payload = payload.data || {};

      const result = await this.provider.send(notification, payload.to);

      if (result.failed.length > 0) {
        return {
          success: false,
          error: result.failed[0].response?.reason || 'Unknown error',
        };
      }

      return {
        success: true,
        messageId: result.sent[0]?.device || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
