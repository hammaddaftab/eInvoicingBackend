import { Router } from 'express';
import { z } from 'zod';
import { RoleController } from '../controllers/role.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

export const createRoleSchema = z.object({
  name: z.string().min(2).max(50).transform(v => v.toUpperCase()),
  description: z.string().max(255).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2).max(50).transform(v => v.toUpperCase()).optional(),
  description: z.string().max(255).optional(),
});

export const setPermissionsSchema = z.object({
  permissions: z.array(z.object({
    feature_id: z.number().int().positive(),
    permission: z.enum(['READ', 'WRITE', 'DELETE', 'ALL']),
  })),
});

router.use(authenticate);

router.post('/', authorize('OWNER'), validate(createRoleSchema), RoleController.createRole);
router.get('/', authorize('OWNER', 'ADMIN'), RoleController.getRoles);
router.get('/:id', authorize('OWNER', 'ADMIN'), RoleController.getRole);
router.patch('/:id', authorize('OWNER'), validate(updateRoleSchema), RoleController.updateRole);
router.delete('/:id', authorize('OWNER'), RoleController.deleteRole);
router.put('/:id/permissions', authorize('OWNER'), validate(setPermissionsSchema), RoleController.setPermissions);

export default router;
