import { FcmProvider } from '../../providers/FcmProvider';
import { DeliveryChannel } from '@notification-service/shared';
import * as admin from 'firebase-admin';

// Mock the firebase-admin module
jest.mock('firebase-admin', () => {
  return {
    apps: [],
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
    messaging: jest.fn(() => ({
      send: jest.fn(),
    })),
  };
});

describe('FcmProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variables
    delete process.env.FCM_PROJECT_ID;
    delete process.env.FCM_CLIENT_EMAIL;
    delete process.env.FCM_PRIVATE_KEY;
  });

  describe('initialization', () => {
    it('should have correct channel type', () => {
      const provider = new FcmProvider();
      expect(provider.channel).toBe(DeliveryChannel.GOOGLE_PUSH);
    });

    it('should not be configured without environment variables', () => {
      const provider = new FcmProvider();
      expect(provider.isConfigured()).toBe(false);
    });

    it('should be configured with valid environment variables', () => {
      process.env.FCM_PROJECT_ID = 'test-project';
      process.env.FCM_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FCM_PRIVATE_KEY = 'test-private-key';

      (admin.credential.cert as jest.Mock).mockReturnValue({});
      (admin.initializeApp as jest.Mock).mockReturnValue({});

      const provider = new FcmProvider();
      expect(provider.isConfigured()).toBe(true);
    });
  });

  describe('send', () => {
    it('should return error if not configured', async () => {
      const provider = new FcmProvider();
      const result = await provider.send({
        to: 'device-token',
        title: 'Test',
        body: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('FCM provider not configured');
    });

    it('should send notification successfully when configured', async () => {
      process.env.FCM_PROJECT_ID = 'test-project';
      process.env.FCM_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FCM_PRIVATE_KEY = 'test-private-key';

      const mockSend = jest.fn().mockResolvedValue('message-id-123');
      (admin.credential.cert as jest.Mock).mockReturnValue({});
      (admin.initializeApp as jest.Mock).mockReturnValue({});
      (admin.messaging as jest.Mock).mockReturnValue({ send: mockSend });

      const provider = new FcmProvider();
      const result = await provider.send({
        to: 'device-token',
        title: 'Test Title',
        body: 'Test message body',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'device-token',
          notification: {
            title: 'Test Title',
            body: 'Test message body',
          },
        })
      );
    });

    it('should handle send errors', async () => {
      process.env.FCM_PROJECT_ID = 'test-project';
      process.env.FCM_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FCM_PRIVATE_KEY = 'test-private-key';

      const mockSend = jest.fn().mockRejectedValue(new Error('Network error'));
      (admin.credential.cert as jest.Mock).mockReturnValue({});
      (admin.initializeApp as jest.Mock).mockReturnValue({});
      (admin.messaging as jest.Mock).mockReturnValue({ send: mockSend });

      const provider = new FcmProvider();
      const result = await provider.send({
        to: 'device-token',
        title: 'Test',
        body: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });
});
