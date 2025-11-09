import { ApnsProvider } from '../../providers/ApnsProvider';
import { DeliveryChannel } from '@notification-service/shared';
import * as apn from 'apn';

// Mock the apn module
jest.mock('apn', () => {
  return {
    Provider: jest.fn(),
    Notification: jest.fn(),
  };
});

describe('ApnsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variables
    delete process.env.APNS_KEY_ID;
    delete process.env.APNS_TEAM_ID;
    delete process.env.APNS_KEY_PATH;
  });

  describe('initialization', () => {
    it('should have correct channel type', () => {
      const provider = new ApnsProvider();
      expect(provider.channel).toBe(DeliveryChannel.APPLE_PUSH);
    });

    it('should not be configured without environment variables', () => {
      const provider = new ApnsProvider();
      expect(provider.isConfigured()).toBe(false);
    });

    it('should be configured with valid environment variables', () => {
      process.env.APNS_KEY_ID = 'test-key-id';
      process.env.APNS_TEAM_ID = 'test-team-id';
      process.env.APNS_KEY_PATH = '/path/to/key.p8';

      (apn.Provider as unknown as jest.Mock).mockImplementation(() => ({}));

      const provider = new ApnsProvider();
      expect(provider.isConfigured()).toBe(true);
    });
  });

  describe('send', () => {
    it('should return error if not configured', async () => {
      const provider = new ApnsProvider();
      const result = await provider.send({
        to: 'device-token',
        title: 'Test',
        body: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('APNs provider not configured');
    });
  });
});
