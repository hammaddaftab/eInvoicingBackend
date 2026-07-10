import { Router } from 'express';
import { InvitationController } from '../controllers/invitation.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/', authorize('OWNER', 'ADMIN'), InvitationController.getInvitations);
router.delete('/:id', authorize('OWNER', 'ADMIN'), InvitationController.deleteInvitation);

export default router;
