import nodemailer from 'nodemailer';
import { DeliveryChannel } from '@notification-service/shared';
import { NotificationProvider, NotificationPayload, NotificationResult } from './NotificationProvider';

export class EmailProvider extends NotificationProvider {
  channel = DeliveryChannel.EMAIL;
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string = '';
  private fromName: string = '';

  constructor() {
    super();
    this.initialize();
  }

  private initialize() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    const fromEmail = process.env.SMTP_FROM_EMAIL;
    const fromName = process.env.SMTP_FROM_NAME;

    if (host && port && user && password && fromEmail && fromName) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port: parseInt(port, 10),
          secure: parseInt(port, 10) === 465,
          auth: {
            user,
            pass: password,
          },
        });
        this.fromEmail = fromEmail;
        this.fromName = fromName;
        console.log('Email provider (SMTP) initialized');
      } catch (error) {
        console.error('Failed to initialize Email provider:', error);
      }
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.transporter) {
      return {
        success: false,
        error: 'Email provider not configured',
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: payload.to,
        subject: payload.subject || 'Notification',
        text: payload.body,
        html: payload.body.replace(/\n/g, '<br>'),
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
