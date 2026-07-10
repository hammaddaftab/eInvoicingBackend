import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.signup(req.body);
      res.status(201).json({ message: 'Account created. Please verify your email and phone number.', ...data });
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.verifyOtp(req.body);
      const msg = data.is_complete === false 
        ? 'Channel verified successfully. Please verify your other channel to complete signup.'
        : 'Verification successful.';
      res.status(200).json({ message: msg, ...data });
    } catch (error) {
      next(error);
    }
  }

  static async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.resendOtp(req.body);
      res.status(200).json({ message: 'A new OTP has been sent.' });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.login(req.body);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;
      const data = await AuthService.refresh(refresh_token);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await AuthService.forgotPassword(email);
      res.status(200).json({ message: 'If an account exists, a reset code has been sent.' });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code, new_password } = req.body;
      await AuthService.resetPassword(email, code, new_password);
      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }
}
