import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import * as usersController from './controller.js';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  phone: z.string().max(20).optional(),
  location: z.string().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  experienceYears: z.number().nonnegative().optional(),
  bio: z.string().max(500).optional(),
  // Delivery address fields
  fullName: z.string().max(100).optional(),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  village: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
});

router.get('/profile', usersController.getProfile);
router.get('/profile/:id', usersController.getProfileById);
router.put('/profile', validate(updateProfileSchema), usersController.updateProfile);
router.get('/search', usersController.searchUsers);

export default router;
