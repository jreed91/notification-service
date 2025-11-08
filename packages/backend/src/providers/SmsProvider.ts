import twilio from 'twilio';
import { DeliveryChannel } from '@notification-service/shared';
import { NotificationProvider, NotificationPayload, NotificationResult } from './NotificationProvider';

export class SmsProvider extends NotificationProvider {
  channel = DeliveryChannel.SMS;
  private client: twilio.Twilio | null = null;
  private fromNumber: string = '';

  constructor() {
    super();
    this.initialize();
  }

  private initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && phoneNumber) {
      try {
        this.client = twilio(accountSid, authToken);
        this.fromNumber = phoneNumber;
        console.log('SMS provider (Twilio) initialized');
      } catch (error) {
        console.error('Failed to initialize SMS provider:', error);
      }
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.client) {
      return {
        success: false,
        error: 'SMS provider not configured',
      };
    }

    try {
      const message = await this.client.messages.create({
        body: payload.body,
        from: this.fromNumber,
        to: payload.to,
      });

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
