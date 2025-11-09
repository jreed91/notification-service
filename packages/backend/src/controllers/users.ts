import { Response } from 'express';
import { UserService } from '../services/UserService';
import { AuthRequest } from '../middleware/auth';
import type { CreateUserRequest, UpdateUserRequest } from '@notification-service/shared';

const userService = new UserService();

/**
 * T034: POST /api/users - Create a new user
 */
export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const request: CreateUserRequest = req.body;

    const user = await userService.createUser(req.tenant.id, request);

    res.status(201).json(user);
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
    } else if (
      error.message.includes('Invalid') ||
      error.message.includes('contact method')
    ) {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
}

/**
 * GET /api/users/:id - Get user by ID
 */
export async function getUserById(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const user = await userService.getUserById(req.tenant.id, id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
}

/**
 * GET /api/users - List users with pagination
 */
export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 100); // Max 100 per page

    const filters: { email?: string; phoneNumber?: string } = {};
    if (req.query.email) {
      filters.email = req.query.email as string;
    }
    if (req.query.phone) {
      filters.phoneNumber = req.query.phone as string;
    }

    const result = await userService.listUsers(req.tenant.id, page, limit, filters);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
}

/**
 * PUT /api/users/:id - Update user
 */
export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const request: UpdateUserRequest = req.body;

    const user = await userService.updateUser(req.tenant.id, id, request);

    res.status(200).json(user);
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
    } else if (error.message.includes('Invalid')) {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
}

/**
 * DELETE /api/users/:id - Delete user
 */
export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    await userService.deleteUser(req.tenant.id, id);

    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
}
