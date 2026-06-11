import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';
import * as activitiesController from './controller.js';

const router = Router();

const activitySchema = z.object({
  activityType: z.enum(['IRRIGATION', 'FERTILIZER', 'PESTICIDE', 'HARVEST', 'OTHER']),
  date: z.string(),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
});

router.get('/crop-cycles/:cropCycleId/activities', requireRole(ROLES.FARMER), activitiesController.list);
router.post('/crop-cycles/:cropCycleId/activities', requireRole(ROLES.FARMER), validate(activitySchema), activitiesController.create);
router.put('/activities/:activityId', requireRole(ROLES.FARMER), validate(activitySchema.partial()), activitiesController.update);
router.delete('/activities/:activityId', requireRole(ROLES.FARMER), activitiesController.remove);

export default router;
