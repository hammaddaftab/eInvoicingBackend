import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/role.service';
import { PermissionLevel } from '../entities/enums';

export class RoleController {
  static async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RoleService.createRole(req.user!.business_id, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RoleService.getRoles(req.user!.business_id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RoleService.getRole(req.user!.business_id, parseInt(req.params.id as string));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RoleService.updateRole(req.user!.business_id, parseInt(req.params.id as string), req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RoleService.deleteRole(req.user!.business_id, parseInt(req.params.id as string));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async setPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { permissions } = req.body;
      const result = await RoleService.setPermissions(req.user!.business_id, parseInt(req.params.id as string), permissions);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
