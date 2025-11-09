import { Router } from 'express';
import { authenticateTenant } from '../middleware/auth';
import {
  createUser,
  getUserById,
  listUsers,
  updateUser,
  deleteUser,
} from '../controllers/users';

const router = Router();

// All user routes require authentication
router.use(authenticateTenant);

// T035: User routes
router.post('/users', createUser);
router.get('/users/:id', getUserById);
router.get('/users', listUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;
