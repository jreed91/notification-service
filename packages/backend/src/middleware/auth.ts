import { Request, Response, NextFunction } from 'express';
import { db } from '../database/client';
import { Tenant } from '@notification-service/shared';

export interface AuthRequest extends Request {
  tenant?: Tenant;
}

export async function authenticateTenant(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({ error: 'API key required' });
      return;
    }

    const result = await db.query<Tenant>(
      'SELECT * FROM tenants WHERE api_key = $1 AND active = true',
      [apiKey]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    req.tenant = result.rows[0];
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
}
