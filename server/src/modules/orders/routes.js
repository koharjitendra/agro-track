import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';
import * as ordersController from './controller.js';

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────────────

const createOrderSchema = z.object({
  listingId: z.string().min(1, 'listingId is required'),
  quantity: z.number().positive('Quantity must be a positive number'),
  message: z.string().max(500).optional().default(''),
  isCartOrder: z.boolean().optional().default(false),
  deliveryAddress: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().min(1, 'Phone is required'),
    addressLine1: z.string().min(1, 'Address line 1 is required'),
    addressLine2: z.string().optional().default(''),
    village: z.string().optional().default(''),
    city: z.string().optional().default(''),
    district: z.string().optional().default(''),
    state: z.string().optional().default(''),
    country: z.string().optional().default('India'),
    postalCode: z.string().optional().default(''),
  }),
});

const rejectSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required').max(500),
});

const verifyCodeSchema = z.object({
  deliveryCode: z.string().length(6, 'Delivery code must be 6 digits'),
});

// ── Shared endpoints (buyer + farmer) ────────────────────────────────────────

// GET /api/orders - list orders (filtered by role on backend)
router.get('/', ordersController.getOrders);

// GET /api/orders/checkout-preview - preview checkout breakdown
router.get('/checkout-preview', requireRole(ROLES.BUYER), ordersController.previewCheckout);

// GET /api/orders/:id - get single order
router.get('/:id', ordersController.getOrderById);

// ── Buyer-only endpoints ──────────────────────────────────────────────────────

// POST /api/orders - place order
router.post('/', requireRole(ROLES.BUYER), validate(createOrderSchema), ordersController.createOrder);

// DELETE /api/orders/:id/cancel - cancel order (PENDING only)
router.post('/:id/cancel', requireRole(ROLES.BUYER), ordersController.cancelOrder);

// GET /api/orders/:id/delivery-code - buyer views their delivery code
router.get('/:id/delivery-code', requireRole(ROLES.BUYER), ordersController.getBuyerDeliveryCode);

// ── Farmer-only endpoints ─────────────────────────────────────────────────────

// POST /api/orders/:id/accept
router.post('/:id/accept', requireRole(ROLES.FARMER), ordersController.acceptOrder);

// POST /api/orders/:id/reject
router.post('/:id/reject', requireRole(ROLES.FARMER), validate(rejectSchema), ordersController.rejectOrder);

// POST /api/orders/:id/out-for-delivery
router.post('/:id/out-for-delivery', requireRole(ROLES.FARMER), ordersController.markOutForDelivery);

// POST /api/orders/:id/verify-delivery
router.post('/:id/verify-delivery', requireRole(ROLES.FARMER), validate(verifyCodeSchema), ordersController.verifyDeliveryCode);

export default router;
