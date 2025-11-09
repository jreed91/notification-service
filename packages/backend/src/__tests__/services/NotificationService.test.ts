import { NotificationService } from '../../services/NotificationService';
import { db } from '../../database/client';
import { DeliveryChannel, NotificationStatus } from '@notification-service/shared';

// Mock the database
jest.mock('../../database/client');

// Mock providers
jest.mock('../../providers/ApnsProvider');
jest.mock('../../providers/FcmProvider');
jest.mock('../../providers/SmsProvider');
jest.mock('../../providers/EmailProvider');

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService();
  });

  describe('sendNotification', () => {
    const mockTenantId = 'tenant-123';
    const mockUserId = 'user-123';
    const mockTemplateKey = 'welcome';

    beforeEach(() => {
      // Mock user query
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: mockUserId,
            tenantId: mockTenantId,
            email: 'test@example.com',
            phoneNumber: '+1234567890',
            locale: 'en-US',
            apnsDeviceToken: 'apns-token',
            fcmDeviceToken: 'fcm-token',
          },
        ],
      });

      // Mock template query
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: 'template-123',
            tenantId: mockTenantId,
            key: mockTemplateKey,
            name: 'Welcome Template',
            channels: [DeliveryChannel.EMAIL],
            translations: {
              'en-US': {
                subject: 'Welcome {{name}}!',
                body: 'Hello {{name}}, welcome to our service!',
              },
            },
          },
        ],
      });

      // Mock subscription query
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });
    });

    it('should throw error if user not found', async () => {
      (db.query as jest.Mock).mockReset();
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(
        service.sendNotification(mockTenantId, {
          userId: mockUserId,
          templateKey: mockTemplateKey,
        })
      ).rejects.toThrow('User not found');
    });

    it('should throw error if template not found', async () => {
      (db.query as jest.Mock).mockReset();
      // Mock user found
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: mockUserId, locale: 'en-US' }],
      });
      // Mock template not found
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(
        service.sendNotification(mockTenantId, {
          userId: mockUserId,
          templateKey: mockTemplateKey,
        })
      ).rejects.toThrow('Template not found');
    });

    it('should render template variables correctly', async () => {
      // Mock notification insert
      (db.query as jest.Mock).mockResolvedValue({ rows: [] });

      await service.sendNotification(mockTenantId, {
        userId: mockUserId,
        templateKey: mockTemplateKey,
        variables: {
          name: 'John Doe',
        },
      });

      // Check that notification was created with rendered content
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notifications'),
        expect.arrayContaining([
          expect.any(String), // id
          mockTenantId,
          mockUserId,
          mockTemplateKey,
          expect.any(String), // channel
          NotificationStatus.PENDING,
          expect.any(String), // variables JSON
          expect.stringContaining('John Doe'), // rendered content
        ])
      );
    });
  });
});
