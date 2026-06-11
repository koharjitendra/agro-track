import { Router } from 'express';
import * as marketplaceController from './controller.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

// Allow both buyers and farmers to view marketplace (if farmer wants to see others)
// Wait, AgroTrack has authorizeRole or requireRole. Let's just use authenticate from index.
router.get('/', marketplaceController.listCrops);

export default router;
