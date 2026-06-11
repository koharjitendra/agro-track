import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';
import { EXPENSE_CATEGORIES } from '../../constants/expenseCategories.js';
import * as expensesController from './controller.js';

const router = Router();

const createSchema = z.object({
  cropCycleId: z.string().min(1, 'Crop cycle ID is required'),
  category: z.enum(EXPENSE_CATEGORIES, {
    errorMap: () => ({ message: `Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}` }),
  }),
  amount: z.number().min(0, 'Amount cannot be negative'),
  spentOnDate: z.string().min(1, 'Spent-on date is required'),
  note: z.string().optional(),
  description: z.string().optional(),
  vendor: z.string().optional(),
  quantity: z.number().min(0, 'Quantity cannot be negative').optional(),
  unit: z.string().optional(),
});

const updateSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES, {
    errorMap: () => ({ message: `Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}` }),
  }).optional(),
  amount: z.number().min(0, 'Amount cannot be negative').optional(),
  spentOnDate: z.string().optional(),
  note: z.string().optional(),
  description: z.string().optional(),
  vendor: z.string().optional(),
  quantity: z.number().min(0, 'Quantity cannot be negative').optional(),
  unit: z.string().optional(),
});

router.use(requireRole(ROLES.FARMER));

router.post('/', validate(createSchema), expensesController.create);
router.get('/crop-cycle/:cropCycleId', expensesController.listByCropCycle);
router.put('/:id', validate(updateSchema), expensesController.update);
router.delete('/:id', expensesController.remove);

export default router;
