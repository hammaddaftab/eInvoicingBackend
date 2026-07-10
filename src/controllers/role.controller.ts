import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/role.service';

export class RoleController {
  static async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await RoleService.createRole(req.user!.business_id, req.body);
      res.status(201).json({ message: 'Role created successfully', role: data });
    } catch (error) {
      next(error);
    }
  }

  static async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await RoleService.getRoles(req.user!.business_id);
      res.status(200).json({ roles: data });
    } catch (error) {
      next(error);
    }
  }

  static async getRole(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await RoleService.getRole(req.user!.business_id, parseInt(req.params.id as string));
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await RoleService.updateRole(req.user!.business_id, parseInt(req.params.id as string), req.body);
      res.status(200).json({ message: 'Role updated successfully', role: data });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      await RoleService.deleteRole(req.user!.business_id, parseInt(req.params.id as string));
      res.status(200).json({ message: 'Role deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async setPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { permissions } = req.body;
      const data = await RoleService.setPermissions(req.user!.business_id, parseInt(req.params.id as string), permissions);
      res.status(200).json({ message: 'Permissions updated successfully', ...data });
    } catch (error) {
      next(error);
    }
  }
}
