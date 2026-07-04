import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.signup(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.verifyOtp(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.resendOtp(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.refresh(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
