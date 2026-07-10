import { Request, Response, NextFunction } from 'express';
import { BusinessService } from '../services/business.service';

export class BusinessController {
  static async getBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await BusinessService.getBusiness(req.user!.business_id);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async updateBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await BusinessService.updateBusiness(req.user!.business_id, req.body);
      res.status(200).json({ message: 'Business updated successfully', business: data });
    } catch (error) {
      next(error);
    }
  }
}
