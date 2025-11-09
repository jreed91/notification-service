import { Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { db } from '../database/client';
import { DeliveryChannel, UpdateSubscriptionRequest } from '@notification-service/shared';

const updateSubscriptionSchema = z.object({
  templateKey: z.string(),
  channels: z.record(z.nativeEnum(DeliveryChannel), z.boolean()),
});

export async function updateSubscription(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const validation = updateSubscriptionSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ error: 'Invalid request', details: validation.error.errors });
      return;
    }

    const data = validation.data as UpdateSubscriptionRequest;

    // Check if subscription exists
    const existingResult = await db.query(
      'SELECT id FROM user_subscriptions WHERE user_id = $1 AND template_key = $2',
      [userId, data.templateKey]
    );

    if (existingResult.rows.length > 0) {
      // Update existing subscription
      const result = await db.query(
        `UPDATE user_subscriptions SET channels = $1
         WHERE user_id = $2 AND template_key = $3
         RETURNING *`,
        [JSON.stringify(data.channels), userId, data.templateKey]
      );
      res.json(result.rows[0]);
    } else {
      // Create new subscription
      const id = uuidv4();
      const result = await db.query(
        `INSERT INTO user_subscriptions (id, user_id, tenant_id, template_key, channels)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, userId, req.tenant!.id, data.templateKey, JSON.stringify(data.channels)]
      );
      res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subscription' });
  }
}

export async function getSubscriptions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    const result = await db.query(
      'SELECT * FROM user_subscriptions WHERE user_id = $1 AND tenant_id = $2',
      [userId, req.tenant!.id]
    );

    res.json({ subscriptions: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
}

export async function deleteSubscription(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { userId, templateKey } = req.params;

    const result = await db.query(
      'DELETE FROM user_subscriptions WHERE user_id = $1 AND template_key = $2 AND tenant_id = $3 RETURNING id',
      [userId, templateKey, req.tenant!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
}
