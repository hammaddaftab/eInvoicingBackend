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
      const { email, business_id, token, name, phone, password } = req.body;
      const result = await InvitationService.acceptInvite(email, business_id, token, name, phone, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // --- ADMIN ROUTES ---

  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await UserService.getUsers(req.user!.business_id, page, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getUser(req.user!.business_id, parseInt(req.params.id as string));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async adminUpdateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.adminUpdateUser(req.user!.business_id, parseInt(req.params.id as string), req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async removeUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.removeUser(req.user!.business_id, req.user!.user_id, parseInt(req.params.id as string));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
