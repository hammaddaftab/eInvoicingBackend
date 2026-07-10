import { Request, Response, NextFunction } from 'express';
import { InvitationService } from '../services/invitation.service';

export class InvitationController {
  static async getInvitations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InvitationService.getInvitations(req.user!.business_id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InvitationService.deleteInvitation(req.user!.business_id, parseInt(req.params.id as string));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
