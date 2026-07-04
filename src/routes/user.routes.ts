import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { UserController } from '../controllers/user.controller';

const router = Router();

// Zod Schemas
export const updateMeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Must be a valid E.164 phone number').optional(),
});
export type UpdateMeDTO = z.infer<typeof updateMeSchema>;

export const updateMyPasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
});
export type UpdateMyPasswordDTO = z.infer<typeof updateMyPasswordSchema>;


// Routes (All protected by authenticate middleware)
router.use(authenticate);

router.get('/me', UserController.getMe);
router.patch('/me', validate(updateMeSchema), UserController.updateMe);
router.patch('/me/password', validate(updateMyPasswordSchema), UserController.updateMyPassword);

export default router;
