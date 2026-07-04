import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

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
}
