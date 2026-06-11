import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import * as reportsController from './controller.js';

const router = Router();

const reportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  category: z.enum([
    'BUG',
    'ORDER_ISSUE',
    'DELIVERY_ISSUE',
    'PAYMENT_ISSUE',
    'MARKETPLACE_ISSUE',
    'FEATURE_REQUEST',
    'SUGGESTION',
    'OTHER',
  ]),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
});

router.post('/', validate(reportSchema), reportsController.createReport);
router.get('/mine', reportsController.getMyReports);
router.get('/:id', reportsController.getReportById);

export default router;
