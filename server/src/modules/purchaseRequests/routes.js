import { Router } from 'express';
import * as prController from './controller.js';
import { requireRole } from '../../middlewares/role.middleware.js';

const router = Router();

// Buyers can create requests
router.post('/', requireRole('BUYER'), prController.createPurchaseRequest);

// Both can get their requests
router.get('/', prController.getPurchaseRequests);

// Only Farmers can update status to accept/reject
router.patch('/:id/status', requireRole('FARMER'), prController.updatePurchaseRequestStatus);

export default router;
