import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { UserController } from '../controllers/user.controller';
import { authorize } from '../middleware/authorize';

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

export const inviteSchema = z.object({
  email: z.email(),
  role_id: z.number().int().positive(),
});
export type InviteDTO = z.infer<typeof inviteSchema>;

export const acceptInviteSchema = z.object({
  email: z.email(),
  business_id: z.number().int().positive(),
  token: z.string().min(1, 'Token is required'),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Must be a valid E.164 phone number'),
  password: z.string().min(8),
});
export type AcceptInviteDTO = z.infer<typeof acceptInviteSchema>;

export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role_ids: z.array(z.number().int().positive()).optional(),
});
export type AdminUpdateUserDTO = z.infer<typeof adminUpdateUserSchema>;



// Public Routes
router.post('/accept-invite', validate(acceptInviteSchema), UserController.acceptInvite);

// Protected Routes
router.use(authenticate);

router.get('/me', UserController.getMe);
router.patch('/me', validate(updateMeSchema), UserController.updateMe);
router.patch('/me/password', validate(updateMyPasswordSchema), UserController.updateMyPassword);

// Require OWNER or ADMIN for inviting
router.post('/invite', authorize('OWNER', 'ADMIN'), validate(inviteSchema), UserController.invite);

// Admin Routes (Manage Users)
router.get('/', authorize('OWNER', 'ADMIN'), UserController.getUsers);
router.get('/:id', authorize('OWNER', 'ADMIN'), UserController.getUser);
router.patch('/:id', authorize('OWNER', 'ADMIN'), validate(adminUpdateUserSchema), UserController.adminUpdateUser);

// OWNER only
router.delete('/:id', authorize('OWNER'), UserController.removeUser);

export default router;
