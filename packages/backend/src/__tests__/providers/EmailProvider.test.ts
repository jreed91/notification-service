import { EmailProvider } from '../../providers/EmailProvider';
import { DeliveryChannel } from '@notification-service/shared';
import * as nodemailer from 'nodemailer';

// Mock the nodemailer module
jest.mock('nodemailer', () => {
  return {
    createTransport: jest.fn(() => ({
      sendMail: jest.fn(),
      verify: jest.fn(),
    })),
  };
});

describe('EmailProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variables
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    delete process.env.SMTP_FROM_EMAIL;
    delete process.env.SMTP_FROM_NAME;
  });

  describe('initialization', () => {
    it('should have correct channel type', () => {
      const provider = new EmailProvider();
      expect(provider.channel).toBe(DeliveryChannel.EMAIL);
    });

    it('should not be configured without environment variables', () => {
      const provider = new EmailProvider();
      expect(provider.isConfigured()).toBe(false);
    });

    it('should be configured with valid environment variables', () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASSWORD = 'password';
      process.env.SMTP_FROM_EMAIL = 'noreply@example.com';
      process.env.SMTP_FROM_NAME = 'Test Service';

      (nodemailer.createTransport as jest.Mock).mockReturnValue({
        sendMail: jest.fn(),
        verify: jest.fn(),
      });

      const provider = new EmailProvider();
      expect(provider.isConfigured()).toBe(true);
    });
  });

  describe('send', () => {
    it('should return error if not configured', async () => {
      const provider = new EmailProvider();
      const result = await provider.send({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email provider not configured');
    });

    it('should send email successfully when configured', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASSWORD = 'password';
      process.env.SMTP_FROM_EMAIL = 'noreply@example.com';
      process.env.SMTP_FROM_NAME = 'Test Service';

      const mockSendMail = jest.fn().mockResolvedValue({
        messageId: 'email-123',
        accepted: ['test@example.com'],
      });
      (nodemailer.createTransport as jest.Mock).mockReturnValue({
        sendMail: mockSendMail,
        verify: jest.fn(),
      });

      const provider = new EmailProvider();
      const result = await provider.send({
        to: 'test@example.com',
        subject: 'Test Subject',
        body: '<p>Test email body</p>',
      });

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Test Service" <noreply@example.com>',
        to: 'test@example.com',
        subject: 'Test Subject',
        text: '<p>Test email body</p>',
        html: '<p>Test email body</p>',
      });
    });

    it('should handle send errors', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASSWORD = 'password';
      process.env.SMTP_FROM_EMAIL = 'noreply@example.com';
      process.env.SMTP_FROM_NAME = 'Test Service';

      const mockSendMail = jest.fn().mockRejectedValue(new Error('SMTP connection failed'));
      (nodemailer.createTransport as jest.Mock).mockReturnValue({
        sendMail: mockSendMail,
        verify: jest.fn(),
      });

      const provider = new EmailProvider();
      const result = await provider.send({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('SMTP connection failed');
    });
  });
});
