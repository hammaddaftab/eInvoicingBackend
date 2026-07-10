import { Request, Response, NextFunction } from 'express';
import { InvitationService } from '../services/invitation.service';

export class InvitationController {
  static async getInvitations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InvitationService.getInvitations(req.user!.business_id);
      res.status(200).json({ invitations: data });
    } catch (error) {
      next(error);
    }
  }

  static async deleteInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      await InvitationService.deleteInvitation(req.user!.business_id, parseInt(req.params.id as string));
      res.status(200).json({ message: 'Invitation cancelled successfully' });
    } catch (error) {
      next(error);
    }
  }
}
