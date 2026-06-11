import { Router } from 'express';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as analyticsController from './controller.js';

const router = Router();

// Farmer analytics routes
router.get('/farmer/expense-breakdown', requireRole('FARMER'), analyticsController.getFarmerExpenseBreakdown);
router.get('/farmer/expenses-timeline', requireRole('FARMER'), analyticsController.getFarmerExpensesTimeline);
router.get('/farmer/sales-vs-expenses', requireRole('FARMER'), analyticsController.getFarmerSalesVsExpenses);
router.get('/farmer/profit-summary', requireRole('FARMER'), analyticsController.getFarmerProfitSummary);

// Buyer analytics routes
router.get('/buyer/purchases-timeline', requireRole('BUYER'), analyticsController.getBuyerPurchasesTimeline);
router.get('/buyer/due-summary', requireRole('BUYER'), analyticsController.getBuyerDueSummary);
router.get('/buyer/paid-vs-due', requireRole('BUYER'), analyticsController.getBuyerPaidVsDue);

export default router;
