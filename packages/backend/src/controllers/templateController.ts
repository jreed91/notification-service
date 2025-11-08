import { Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { db } from '../database/client';
import { DeliveryChannel, CreateTemplateRequest } from '@notification-service/shared';

const templateTranslationSchema = z.object({
  subject: z.string().optional(),
  title: z.string().optional(),
  body: z.string(),
  variables: z.array(z.string()).optional(),
});

const createTemplateSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  channels: z.array(z.nativeEnum(DeliveryChannel)),
  translations: z.record(templateTranslationSchema),
});

export async function createTemplate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const validation = createTemplateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Invalid request', details: validation.error.errors });
      return;
    }

    const data = validation.data as CreateTemplateRequest;
    const id = uuidv4();

    await db.query(
      `INSERT INTO notification_templates (id, tenant_id, key, name, description, channels, translations)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        req.tenant!.id,
        data.key,
        data.name,
        data.description || null,
        JSON.stringify(data.channels),
        JSON.stringify(data.translations),
      ]
    );

    const result = await db.query('SELECT * FROM notification_templates WHERE id = $1', [id]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Template with this key already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create template' });
    }
  }
}

export async function getTemplates(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await db.query(
      'SELECT * FROM notification_templates WHERE tenant_id = $1 ORDER BY created_at DESC',
      [req.tenant!.id]
    );

    res.json({ templates: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
}

export async function getTemplate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { key } = req.params;

    const result = await db.query(
      'SELECT * FROM notification_templates WHERE tenant_id = $1 AND key = $2',
      [req.tenant!.id, key]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
}

export async function updateTemplate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { key } = req.params;
    const validation = createTemplateSchema.partial().safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ error: 'Invalid request', details: validation.error.errors });
      return;
    }

    const data = validation.data;
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name) {
      updates.push(`name = $${paramIndex}`);
      params.push(data.name);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(data.description);
      paramIndex++;
    }

    if (data.channels) {
      updates.push(`channels = $${paramIndex}`);
      params.push(JSON.stringify(data.channels));
      paramIndex++;
    }

    if (data.translations) {
      updates.push(`translations = $${paramIndex}`);
      params.push(JSON.stringify(data.translations));
      paramIndex++;
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    params.push(req.tenant!.id, key);
    const result = await db.query(
      `UPDATE notification_templates SET ${updates.join(', ')}
       WHERE tenant_id = $${paramIndex} AND key = $${paramIndex + 1}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update template' });
  }
}

export async function deleteTemplate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { key } = req.params;

    const result = await db.query(
      'DELETE FROM notification_templates WHERE tenant_id = $1 AND key = $2 RETURNING id',
      [req.tenant!.id, key]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
}
