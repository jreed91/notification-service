import admin from 'firebase-admin';
import { DeliveryChannel } from '@notification-service/shared';
import { NotificationProvider, NotificationPayload, NotificationResult } from './NotificationProvider';

export class FcmProvider extends NotificationProvider {
  channel = DeliveryChannel.GOOGLE_PUSH;
  private initialized = false;

  constructor() {
    super();
    this.initialize();
  }

  private initialize() {
    const projectId = process.env.FCM_PROJECT_ID;
    const clientEmail = process.env.FCM_CLIENT_EMAIL;
    const privateKey = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      try {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
        }
        this.initialized = true;
        console.log('FCM provider initialized');
      } catch (error) {
        console.error('Failed to initialize FCM provider:', error);
      }
    }
  }

  isConfigured(): boolean {
    return this.initialized;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.initialized) {
      return {
        success: false,
        error: 'FCM provider not configured',
      };
    }

    try {
      const message: admin.messaging.Message = {
        token: payload.to,
        notification: {
          title: payload.title || '',
          body: payload.body,
        },
        data: payload.data || {},
        android: {
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
            },
          },
        },
      };

      const messageId = await admin.messaging().send(message);

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
