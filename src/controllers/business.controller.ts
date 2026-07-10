import { Request, Response, NextFunction } from 'express';
import { BusinessService } from '../services/business.service';

export class BusinessController {
  static async getBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BusinessService.getBusiness(req.user!.business_id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BusinessService.updateBusiness(req.user!.business_id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
