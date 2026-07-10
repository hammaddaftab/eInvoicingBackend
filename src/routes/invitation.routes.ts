import { Router } from 'express';
import { z } from 'zod';
import { InvitationController } from '../controllers/invitation.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

export const invitationIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }).strict(),
});

router.use(authenticate);

router.get('/', authorize('OWNER', 'ADMIN'), InvitationController.getInvitations);
router.delete('/:id', authorize('OWNER', 'ADMIN'), validate(invitationIdParamSchema), InvitationController.deleteInvitation);

export default router;
