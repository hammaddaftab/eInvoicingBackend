import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { UserController } from '../controllers/user.controller';
import { authorize } from '../middleware/authorize';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;
const passwordMessage = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';

const router = Router();

export const updateMeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().regex(/^\+?[1-9]\d{1,14}$/, 'Must be a valid E.164 phone number').optional(),
  }).strict().refine(data => Object.keys(data).length > 0, 'At least one field must be provided'),
});
export type UpdateMeDTO = z.infer<typeof updateMeSchema>['body'];

export const updateMyPasswordSchema = z.object({
  body: z.object({
    current_password: z.string().trim().min(1, 'Current password is required'),
    new_password: z.string().trim().min(8, 'New password must be at least 8 characters').regex(passwordRegex, passwordMessage),
  }).strict().refine(data => data.current_password !== data.new_password, 'New password must be different from current password'),
});
export type UpdateMyPasswordDTO = z.infer<typeof updateMyPasswordSchema>['body'];

export const inviteSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    role_id: z.number().int().positive(),
  }).strict(),
});
export type InviteDTO = z.infer<typeof inviteSchema>['body'];

export const acceptInviteSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    business_id: z.number().int().positive(),
    token: z.string().trim().min(1, 'Token is required'),
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().regex(/^\+?[1-9]\d{1,14}$/, 'Must be a valid E.164 phone number'),
    password: z.string().trim().min(8).regex(passwordRegex, passwordMessage),
  }).strict(),
});
export type AcceptInviteDTO = z.infer<typeof acceptInviteSchema>['body'];

export const adminUpdateUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    role_ids: z.array(z.number().int().positive()).optional(),
  }).strict().refine(data => Object.keys(data).length > 0, 'At least one field must be provided'),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }).strict(),
});
export type AdminUpdateUserDTO = z.infer<typeof adminUpdateUserSchema>['body'];

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }).strict(),
});

// Public Routes
router.post('/accept-invite', validate(acceptInviteSchema), UserController.acceptInvite);

// Protected Routes
router.use(authenticate);

router.get('/me', UserController.getMe);
router.patch('/me', validate(updateMeSchema), UserController.updateMe);
router.patch('/me/password', validate(updateMyPasswordSchema), UserController.changePassword);

// Require OWNER or ADMIN for inviting
router.post('/invite', authorize('OWNER', 'ADMIN'), validate(inviteSchema), UserController.inviteUser);

// Admin Routes (Manage Users)
router.get('/', authorize('OWNER', 'ADMIN'), UserController.getUsers);
router.get('/:id', authorize('OWNER', 'ADMIN'), validate(userIdParamSchema), UserController.getUser);
router.patch('/:id', authorize('OWNER', 'ADMIN'), validate(adminUpdateUserSchema), UserController.adminUpdateUser);

// OWNER only
router.delete('/:id', authorize('OWNER'), validate(userIdParamSchema), UserController.removeUser);

export default router;
