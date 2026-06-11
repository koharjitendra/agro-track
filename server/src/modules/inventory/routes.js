import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';
import * as inventoryController from './controller.js';

const router = Router();

const inventorySchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category: z.enum(['SEEDS', 'FERTILIZERS', 'PESTICIDES', 'EQUIPMENT', 'OTHER']),
  quantity: z.number().nonnegative(),
  unit: z.string().min(1, 'Unit is required'),
  lowStockThreshold: z.number().nonnegative().optional(),
  pricePerUnit: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

router.use(requireRole(ROLES.FARMER));

router.get('/', inventoryController.list);
router.post('/', validate(inventorySchema), inventoryController.create);
router.put('/:id', validate(inventorySchema.partial()), inventoryController.update);
router.delete('/:id', inventoryController.remove);

export default router;
