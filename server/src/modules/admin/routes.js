import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as adminController from './controller.js';

const router = Router();

// Lock down all admin routes to ADMIN role only
router.use(requireRole('ADMIN'));

const respondReportSchema = z.object({
  adminResponse: z.string().min(1, 'Response must not be empty').max(2000),
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED']).optional(),
});

const editReportSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(20).max(2000).optional(),
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED']).optional(),
  category: z.enum([
    'BUG',
    'ORDER_ISSUE',
    'DELIVERY_ISSUE',
    'PAYMENT_ISSUE',
    'MARKETPLACE_ISSUE',
    'FEATURE_REQUEST',
    'SUGGESTION',
    'OTHER',
  ]).optional(),
});

const updateUserProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  location: z.string().max(200).optional(),
  accountStatus: z.enum(['ACTIVE', 'BLOCKED', 'SUSPENDED']).optional(),
});

// Stats
router.get('/stats', adminController.getStats);

// User Management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserProfileDetails);
router.put('/users/:id', validate(updateUserProfileSchema), adminController.updateUserProfile);
router.post('/users/:id/block', adminController.blockUser);
router.post('/users/:id/unblock', adminController.unblockUser);
router.delete('/users/:id', adminController.deleteUser);

// Bug Report Management
router.get('/reports', adminController.getReports);
router.post('/reports/:id/respond', validate(respondReportSchema), adminController.respondToReport);
router.put('/reports/:id', validate(editReportSchema), adminController.editReport);
router.delete('/reports/:id', adminController.deleteReport);

// Audit Logs (Read-only, no write/update/delete endpoints exist)
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
