import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';
import * as cropCyclesController from './controller.js';

const router = Router();

const createSchema = z.object({
  cropName: z.string().min(1, 'Crop name is required').max(100),
  seasonYear: z.string().max(20).optional(),
  startDate: z.string().optional().or(z.null()),
  endDate: z.string().optional().or(z.null()),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  area: z.number().nonnegative().optional(),
  expectedHarvestDate: z.string().optional().or(z.null()),
  seedVariety: z.string().optional(),
  location: z.string().optional(),
  pricePerUnit: z.number().nonnegative().optional(),
  availableQuantity: z.number().nonnegative().optional(),
  cropStatus: z.enum(['GROWING', 'READY_FOR_HARVEST', 'AVAILABLE_FOR_SALE', 'RESERVED', 'SOLD']).optional(),
  cropImage: z.string().optional(),
  isListedOnMarketplace: z.boolean().optional(),
  investmentAmount: z.number().nonnegative().optional(),
  growthStage: z.enum(['SEEDLING', 'VEGETATIVE', 'FLOWERING', 'YIELDING', 'HARVESTED']).optional(),
});

const updateSchema = z.object({
  cropName: z.string().min(1).max(100).optional(),
  seasonYear: z.string().max(20).optional(),
  startDate: z.string().optional().or(z.null()),
  endDate: z.string().optional().or(z.null()),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  area: z.number().nonnegative().optional(),
  expectedHarvestDate: z.string().optional().or(z.null()),
  seedVariety: z.string().optional(),
  location: z.string().optional(),
  pricePerUnit: z.number().nonnegative().optional(),
  availableQuantity: z.number().nonnegative().optional(),
  cropStatus: z.enum(['GROWING', 'READY_FOR_HARVEST', 'AVAILABLE_FOR_SALE', 'RESERVED', 'SOLD']).optional(),
  cropImage: z.string().optional(),
  isListedOnMarketplace: z.boolean().optional(),
  investmentAmount: z.number().nonnegative().optional(),
  growthStage: z.enum(['SEEDLING', 'VEGETATIVE', 'FLOWERING', 'YIELDING', 'HARVESTED']).optional(),
});

const stageSchema = z.object({
  stage: z.enum(['SEEDLING', 'VEGETATIVE', 'FLOWERING', 'YIELDING', 'HARVESTED']),
  notes: z.string().optional(),
});

const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string(),
});

router.use(requireRole(ROLES.FARMER));

router.post('/', validate(createSchema), cropCyclesController.create);
router.get('/', cropCyclesController.list);
router.get('/:id', cropCyclesController.getById);
router.put('/:id', validate(updateSchema), cropCyclesController.update);
router.delete('/:id', cropCyclesController.remove);

router.put('/:id/stage', validate(stageSchema), cropCyclesController.updateStage);
router.post('/:id/reminders', validate(reminderSchema), cropCyclesController.addReminder);
router.put('/:id/reminders/:reminderId', cropCyclesController.toggleReminder);

export default router;
