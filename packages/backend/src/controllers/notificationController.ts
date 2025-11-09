import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/NotificationService';
import { DeliveryChannel, SendNotificationRequest } from '@notification-service/shared';
import { db } from '../database/client';

const notificationService = new NotificationService();

const sendNotificationSchema = z.object({
  userId: z.string().uuid(),
  templateKey: z.string(),
  variables: z.record(z.any()).optional(),
  channels: z.array(z.nativeEnum(DeliveryChannel)).optional(),
});

export async function sendNotification(req: AuthRequest, res: Response): Promise<void> {
  try {
    const validation = sendNotificationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Invalid request', details: validation.error.errors });
      return;
    }

    const result = await notificationService.sendNotification(
      req.tenant!.id,
      validation.data as SendNotificationRequest
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send notification',
    });
  }
}

export async function getNotifications(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { userId, status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM notifications WHERE tenant_id = $1';
    const params: any[] = [req.tenant!.id];
    let paramIndex = 2;

    if (userId) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      notifications: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}
