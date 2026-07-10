import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { InvitationService } from '../services/invitation.service';

export class UserController {
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UserService.getMe(req.user!.user_id);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UserService.updateMe(req.user!.user_id, req.body);
      res.status(200).json({ message: 'Profile updated successfully', ...data });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await UserService.changePassword(req.user!.user_id, req.body);
      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async inviteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, role_id } = req.body;
      const data = await InvitationService.inviteUser(req.user!.business_id, req.user!.user_id, email, role_id);
      res.status(201).json({ message: `Invitation sent to ${email}`, ...data });
    } catch (error) {
      next(error);
    }
  }

  static async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, business_id, token, name, phone, password } = req.body;
      const data = await InvitationService.acceptInvite(email, business_id, token, name, phone, password);
      res.status(200).json({ message: 'Invitation accepted successfully', ...data });
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await UserService.getUsers(req.user!.business_id, page, limit);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UserService.getUser(req.user!.business_id, parseInt(req.params.id as string));
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async adminUpdateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UserService.adminUpdateUser(req.user!.business_id, parseInt(req.params.id as string), req.body);
      res.status(200).json({ message: 'User updated successfully', user: data });
    } catch (error) {
      next(error);
    }
  }

  static async removeUser(req: Request, res: Response, next: NextFunction) {
    try {
      await UserService.removeUser(req.user!.business_id, req.user!.user_id, parseInt(req.params.id as string));
      res.status(200).json({ message: 'User removed successfully' });
    } catch (error) {
      next(error);
    }
  }
}
