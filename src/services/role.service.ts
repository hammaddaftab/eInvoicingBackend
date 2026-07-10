import { AppDataSource } from '../data-source';
import { Role } from '../entities/Role';
import { UserRole } from '../entities/UserRole';
import { RolePermission } from '../entities/RolePermission';
import { Feature } from '../entities/Feature';
import { PermissionLevel } from '../entities/enums';
import { AppError } from '../utils/AppError';

export class RoleService {
  private static roleRepo = AppDataSource.getRepository(Role);

  static async createRole(businessId: number, data: { name: string; description?: string }) {
    const role = this.roleRepo.create({
      business: { id: businessId },
      name: data.name,
      description: data.description,
      is_system: false
    });

    try {
      await this.roleRepo.save(role);
      return role;
    } catch (err: any) {
      if (err.code === '23505') {
        throw new AppError(409, 'A role with this name already exists in this business');
      }
      throw err;
    }
  }

  static async getRoles(businessId: number) {
    const roles = await this.roleRepo.find({
      where: { business: { id: businessId } },
      order: { is_system: 'DESC', name: 'ASC' }
    });

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      is_system: role.is_system
    }));
  }

  static async getRole(businessId: number, roleId: number) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId, business: { id: businessId } },
      relations: { role_permissions: { feature: true } }
    });

    if (!role) throw new AppError(404, 'Role not found');

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      is_system: role.is_system,
      permissions: role.role_permissions.map(rp => ({
        feature_id: rp.feature.id,
        feature: rp.feature.name,
        permission: rp.permission
      }))
    };
  }

  static async updateRole(businessId: number, roleId: number, data: { name?: string; description?: string }) {
    const role = await this.roleRepo.findOne({ where: { id: roleId, business: { id: businessId } } });

    if (!role) throw new AppError(404, 'Role not found');
    if (role.is_system) throw new AppError(403, 'System roles cannot be modified');

    if (data.name) role.name = data.name;
    if (data.description !== undefined) role.description = data.description;

    try {
      await this.roleRepo.save(role);
      return role;
    } catch (err: any) {
      if (err.code === '23505') {
        throw new AppError(409, 'A role with this name already exists in this business');
      }
      throw err;
    }
  }

  static async deleteRole(businessId: number, roleId: number): Promise<void> {
    return await AppDataSource.manager.transaction(async (manager) => {
      const role = await manager.findOne(Role, { where: { id: roleId, business: { id: businessId } } });
      if (!role) throw new AppError(404, 'Role not found');
      if (role.is_system) throw new AppError(403, 'System roles cannot be deleted');

      const usersCount = await manager.count(UserRole, { where: { role: { id: roleId } } });
      if (usersCount > 0) {
        throw new AppError(400, `Cannot delete role: ${usersCount} user(s) are still assigned to it. Reassign them first.`);
      }

      await manager.delete(RolePermission, { role: { id: roleId } });
      await manager.delete(Role, { id: roleId });
    });
  }

  static async setPermissions(businessId: number, roleId: number, permissions: { feature_id: number; permission: PermissionLevel }[]) {
    return await AppDataSource.manager.transaction(async (manager) => {
      const role = await manager.findOne(Role, { where: { id: roleId, business: { id: businessId } } });
      if (!role) throw new AppError(404, 'Role not found');

      // Validate feature_ids
      const featureIds = permissions.map(p => p.feature_id);
      const uniqueFeatureIds = new Set(featureIds);
      if (featureIds.length !== uniqueFeatureIds.size) {
        throw new AppError(400, 'Duplicate feature_id detected in permissions array');
      }

      if (featureIds.length > 0) {
        const features = await manager.find(Feature, { where: featureIds.map(id => ({ id })) });
        if (features.length !== featureIds.length) {
           throw new AppError(400, 'One or more invalid feature_ids provided');
        }
      }

      // Replace strategy
      await manager.delete(RolePermission, { role: { id: roleId } });
      
      const newPermissions = permissions.map(p => manager.create(RolePermission, {
        role: { id: roleId },
        feature: { id: p.feature_id },
        permission: p.permission
      }));

      if (newPermissions.length > 0) {
        await manager.save(newPermissions);
      }

      const updatedRole = await manager.findOne(Role, {
        where: { id: roleId },
        relations: { role_permissions: { feature: true } }
      });

      if (!updatedRole) {
        throw new AppError(500, 'Role disappeared during permission update');
      }

      return {
        role_id: updatedRole.id,
        permissions: updatedRole.role_permissions.map(rp => ({
          feature_id: rp.feature.id,
          feature: rp.feature.name,
          permission: rp.permission
        }))
      };
    });
  }
}
