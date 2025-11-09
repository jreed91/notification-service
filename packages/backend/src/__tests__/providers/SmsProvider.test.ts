import { SmsProvider } from '../../providers/SmsProvider';
import { DeliveryChannel } from '@notification-service/shared';
import twilio from 'twilio';

// Mock the twilio module
jest.mock('twilio', () => {
  return jest.fn(() => ({
    messages: {
      create: jest.fn(),
    },
  }));
});

describe('SmsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variables
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
  });

  describe('initialization', () => {
    it('should have correct channel type', () => {
      const provider = new SmsProvider();
      expect(provider.channel).toBe(DeliveryChannel.SMS);
    });

    it('should not be configured without environment variables', () => {
      const provider = new SmsProvider();
      expect(provider.isConfigured()).toBe(false);
    });

    it('should be configured with valid environment variables', () => {
      process.env.TWILIO_ACCOUNT_SID = 'test-sid';
      process.env.TWILIO_AUTH_TOKEN = 'test-token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';

      const provider = new SmsProvider();
      expect(provider.isConfigured()).toBe(true);
    });
  });

  describe('send', () => {
    it('should return error if not configured', async () => {
      const provider = new SmsProvider();
      const result = await provider.send({
        to: '+1234567890',
        body: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMS provider not configured');
    });

    it('should send SMS successfully when configured', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test-sid';
      process.env.TWILIO_AUTH_TOKEN = 'test-token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';

      const mockCreate = jest.fn().mockResolvedValue({
        sid: 'sms-123',
        status: 'sent',
      });
      (twilio as unknown as jest.Mock).mockReturnValue({
        messages: { create: mockCreate },
      });

      const provider = new SmsProvider();
      const result = await provider.send({
        to: '+19876543210',
        body: 'Test SMS message',
      });

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith({
        body: 'Test SMS message',
        from: '+1234567890',
        to: '+19876543210',
      });
    });

    it('should handle send errors', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test-sid';
      process.env.TWILIO_AUTH_TOKEN = 'test-token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';

      const mockCreate = jest.fn().mockRejectedValue(new Error('Invalid phone number'));
      (twilio as unknown as jest.Mock).mockReturnValue({
        messages: { create: mockCreate },
      });

      const provider = new SmsProvider();
      const result = await provider.send({
        to: 'invalid-number',
        body: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number');
    });
  });
});
