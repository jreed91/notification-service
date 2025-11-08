import { Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { db } from '../database/client';
import { CreateUserRequest } from '@notification-service/shared';

const createUserSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  locale: z.string().default('en-US'),
  timezone: z.string().optional(),
  apnsDeviceToken: z.string().optional(),
  fcmDeviceToken: z.string().optional(),
});

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Invalid request', details: validation.error.errors });
      return;
    }

    const data = validation.data as CreateUserRequest;
    const id = uuidv4();

    await db.query(
      `INSERT INTO users (id, tenant_id, email, phone_number, locale, timezone, apns_device_token, fcm_device_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        req.tenant!.id,
        data.email || null,
        data.phoneNumber || null,
        data.locale,
        data.timezone || null,
        data.apnsDeviceToken || null,
        data.fcmDeviceToken || null,
      ]
    );

    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'User with this email or phone already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
}

export async function getUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await db.query(
      'SELECT * FROM users WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.tenant!.id, limit, offset]
    );

    res.json({ users: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function getUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 AND tenant_id = $2',
      [id, req.tenant!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const validation = createUserSchema.partial().safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ error: 'Invalid request', details: validation.error.errors });
      return;
    }

    const data = validation.data;
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      params.push(data.email);
      paramIndex++;
    }

    if (data.phoneNumber !== undefined) {
      updates.push(`phone_number = $${paramIndex}`);
      params.push(data.phoneNumber);
      paramIndex++;
    }

    if (data.locale) {
      updates.push(`locale = $${paramIndex}`);
      params.push(data.locale);
      paramIndex++;
    }

    if (data.timezone !== undefined) {
      updates.push(`timezone = $${paramIndex}`);
      params.push(data.timezone);
      paramIndex++;
    }

    if (data.apnsDeviceToken !== undefined) {
      updates.push(`apns_device_token = $${paramIndex}`);
      params.push(data.apnsDeviceToken);
      paramIndex++;
    }

    if (data.fcmDeviceToken !== undefined) {
      updates.push(`fcm_device_token = $${paramIndex}`);
      params.push(data.fcmDeviceToken);
      paramIndex++;
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    params.push(id, req.tenant!.id);
    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
}
