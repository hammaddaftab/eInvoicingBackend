import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { InvitationService } from '../services/invitation.service';

export class UserController {
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getMe(req.user!.user_id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.updateMe(req.user!.user_id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateMyPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.updateMyPassword(req.user!.user_id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async invite(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, role_id } = req.body;
      const result = await InvitationService.invite(req.user!.business_id, req.user!.user_id, email, role_id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, name, phone, password } = req.body;
      const result = await InvitationService.acceptInvite(token, name, phone, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
