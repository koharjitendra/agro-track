import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';
import * as listingsController from './controller.js';

const router = Router();

const mapPriceToBasePrice = (req, res, next) => {
  if (req.body.price !== undefined && req.body.basePrice === undefined) {
    req.body.basePrice = req.body.price;
  }
  next();
};

const createSchema = z.object({
  cropName: z.string().optional(),
  productName: z.string().min(1, 'Product name is required').max(100),
  description: z.string().max(1000).optional(),
  category: z.string().optional(),
  quantity: z.number().nonnegative('Quantity must be non-negative'),
  unit: z.string().optional(),
  minimumOrderQuantity: z.number().positive().optional(),
  maximumOrderQuantity: z.number().positive().nullable().optional(),
  lowStockThreshold: z.number().nonnegative().optional(),
  basePrice: z.number().nonnegative('Base price must be non-negative'),
  price: z.number().nonnegative('Price must be non-negative').optional(),
  discountPercentage: z.number().min(0).max(100).optional().default(0),
  harvestDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
  location: z.string().optional(),
  availability: z.boolean().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'SOLD_OUT']).optional(),
  cropCycleId: z.string().optional().nullable(),
});

const updateSchema = createSchema.partial();

// Farmer: manage their own listings
router.post('/', requireRole(ROLES.FARMER), mapPriceToBasePrice, validate(createSchema), listingsController.create);
router.get('/', requireRole(ROLES.FARMER), listingsController.list);
router.get('/:id', requireRole(ROLES.FARMER, ROLES.BUYER), listingsController.getById);
router.put('/:id', requireRole(ROLES.FARMER), mapPriceToBasePrice, validate(updateSchema), listingsController.update);
router.post('/:id/publish', requireRole(ROLES.FARMER), listingsController.publish);
router.post('/:id/unpublish', requireRole(ROLES.FARMER), listingsController.unpublish);
router.delete('/:id', requireRole(ROLES.FARMER), listingsController.remove);

export default router;
