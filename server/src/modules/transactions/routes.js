import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import * as transactionsController from './controller.js';

const router = Router();

const createSchema = z.object({
  farmerId: z.string().optional(),
  buyerId: z.string().optional(),
  cropCycleId: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().optional(),
  pricePerUnit: z.number().min(0, 'Price per unit cannot be negative'),
  transactionDate: z.string().min(1, 'Transaction date is required'),
  amountPaid: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  cropCycleId: z.string().optional().nullable(),
  quantity: z.number().positive('Quantity must be positive').optional(),
  unit: z.string().optional(),
  pricePerUnit: z.number().min(0, 'Price per unit cannot be negative').optional(),
  transactionDate: z.string().optional(),
  amountPaid: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const commentSchema = z.object({
  comment: z.string().optional(),
});

const requestChangesSchema = z.object({
  comment: z.string().min(1, 'Comment is required when requesting changes'),
});

const reviseSchema = z.object({
  quantity: z.number().positive('Quantity must be positive').optional(),
  unit: z.string().optional(),
  pricePerUnit: z.number().min(0).optional(),
  transactionDate: z.string().optional(),
  amountPaid: z.number().min(0).optional(),
  notes: z.string().optional(),
  cropCycleId: z.string().optional().nullable(),
  changeNote: z.string().optional(),
});

router.post('/', validate(createSchema), transactionsController.create);
router.get('/', transactionsController.list);
router.get('/:id/revisions', transactionsController.getRevisions);
router.get('/:id', transactionsController.getById);
router.put('/:id', validate(updateSchema), transactionsController.update);
const rateSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().optional(),
});

router.post('/:id/approve', transactionsController.approve);
router.post('/:id/reject', validate(commentSchema), transactionsController.reject);
router.post('/:id/request-changes', validate(requestChangesSchema), transactionsController.requestChanges);
router.post('/:id/revise', validate(reviseSchema), transactionsController.revise);
router.post('/:id/rate', validate(rateSchema), transactionsController.rate);
router.post('/:id/remind', transactionsController.remind);

export default router;
