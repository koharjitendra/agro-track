import { Router } from 'express';
import * as approvalsController from './controller.js';

const router = Router();

router.get('/pending', approvalsController.getPending);
router.get('/transaction/:transactionId', approvalsController.getHistory);

export default router;
