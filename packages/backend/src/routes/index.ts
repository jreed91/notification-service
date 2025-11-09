import { Router } from 'express';
import { authenticateTenant } from '../middleware/auth';
import * as notificationController from '../controllers/notificationController';
import * as templateController from '../controllers/templateController';
import * as userController from '../controllers/userController';
import * as subscriptionController from '../controllers/subscriptionController';

const router = Router();

// All routes require tenant authentication
router.use(authenticateTenant);

// Notification routes
router.post('/notifications/send', notificationController.sendNotification);
router.get('/notifications', notificationController.getNotifications);

// Template routes
router.post('/templates', templateController.createTemplate);
router.get('/templates', templateController.getTemplates);
router.get('/templates/:key', templateController.getTemplate);
router.put('/templates/:key', templateController.updateTemplate);
router.delete('/templates/:key', templateController.deleteTemplate);

// User routes
router.post('/users', userController.createUser);
router.get('/users', userController.getUsers);
router.get('/users/:id', userController.getUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

// Subscription routes
router.get('/users/:userId/subscriptions', subscriptionController.getSubscriptions);
router.put('/users/:userId/subscriptions', subscriptionController.updateSubscription);
router.delete('/users/:userId/subscriptions/:templateKey', subscriptionController.deleteSubscription);

export default router;
