import { Router } from 'express';
import { z } from 'zod';
import { RoleController } from '../controllers/role.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { PermissionLevel } from '../entities/enums';

const router = Router();

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(50).toUpperCase(),
    description: z.string().trim().max(255).optional(),
  }).strict(),
});

export const updateRoleSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(50).toUpperCase().optional(),
    description: z.string().trim().max(255).optional(),
  }).strict().refine(data => Object.keys(data).length > 0, 'At least one field must be provided'),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }).strict(),
});

export const setPermissionsSchema = z.object({
  body: z.object({
    permissions: z.array(z.object({
      feature_id: z.number().int().positive(),
      permission: z.nativeEnum(PermissionLevel),
    }).strict()),
  }).strict(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }).strict(),
});

export const roleIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }).strict(),
});

router.use(authenticate);

router.post('/', authorize('OWNER'), validate(createRoleSchema), RoleController.createRole);
router.get('/', authorize('OWNER', 'ADMIN'), RoleController.getRoles);
router.get('/:id', authorize('OWNER', 'ADMIN'), validate(roleIdParamSchema), RoleController.getRole);
router.patch('/:id', authorize('OWNER'), validate(updateRoleSchema), RoleController.updateRole);
router.delete('/:id', authorize('OWNER'), validate(roleIdParamSchema), RoleController.deleteRole);
router.put('/:id/permissions', authorize('OWNER'), validate(setPermissionsSchema), RoleController.setPermissions);

export default router;
