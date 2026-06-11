import { Router } from 'express';
import * as notifController from './controller.js';

const router = Router();

router.get('/', notifController.getNotifications);
router.get('/unread-count', notifController.getUnreadCount);
router.put('/read-all', notifController.markAllAsRead);
router.patch('/mark-all-read', notifController.markAllAsRead); // backwards compat
router.put('/:id/read', notifController.markAsRead);
router.patch('/:id/read', notifController.markAsRead); // backwards compat

export default router;
