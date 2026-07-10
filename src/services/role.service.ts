import { AppDataSource } from '../data-source';
import { Role } from '../entities/Role';
import { UserRole } from '../entities/UserRole';
import { RolePermission } from '../entities/RolePermission';
import { Feature } from '../entities/Feature';
import { PermissionLevel } from '../entities/enums';

export class RoleService {
  static async createRole(businessId: number, data: { name: string; description?: string }) {
    const roleRepo = AppDataSource.getRepository(Role);
    
    const existing = await roleRepo.findOne({ where: { business: { id: businessId }, name: data.name } });
    if (existing) throw { status: 409, message: 'A role with this name already exists' };

    const role = roleRepo.create({
      business: { id: businessId },
      name: data.name,
      description: data.description,
      is_system: false
    });

    await roleRepo.save(role);
    return role;
  }

  static async getRoles(businessId: number) {
    const roleRepo = AppDataSource.getRepository(Role);
    const roles = await roleRepo.find({
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
    const roleRepo = AppDataSource.getRepository(Role);
    const role = await roleRepo.findOne({
      where: { id: roleId, business: { id: businessId } },
      relations: { role_permissions: { feature: true } }
    });

    if (!role) throw { status: 404, message: 'Role not found' };

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
    const roleRepo = AppDataSource.getRepository(Role);
    const role = await roleRepo.findOne({ where: { id: roleId, business: { id: businessId } } });

    if (!role) throw { status: 404, message: 'Role not found' };
    if (role.is_system) throw { status: 403, message: 'System roles cannot be modified' };

    if (data.name && data.name !== role.name) {
      const existing = await roleRepo.findOne({ where: { business: { id: businessId }, name: data.name } });
      if (existing) throw { status: 409, message: 'A role with this name already exists' };
      role.name = data.name;
    }

    if (data.description !== undefined) {
      role.description = data.description;
    }

    await roleRepo.save(role);
    return { message: 'Role updated successfully', role };
  }

  static async deleteRole(businessId: number, roleId: number) {
    const roleRepo = AppDataSource.getRepository(Role);
    const userRoleRepo = AppDataSource.getRepository(UserRole);

    const role = await roleRepo.findOne({ where: { id: roleId, business: { id: businessId } } });
    if (!role) throw { status: 404, message: 'Role not found' };
    if (role.is_system) throw { status: 403, message: 'System roles cannot be deleted' };

    const usersCount = await userRoleRepo.count({ where: { role: { id: roleId } } });
    if (usersCount > 0) {
      throw { status: 400, message: `Cannot delete role: ${usersCount} user(s) are still assigned to it. Reassign them first.` };
    }

    return await AppDataSource.manager.transaction(async (manager) => {
      await manager.delete(RolePermission, { role: { id: roleId } });
      await manager.delete(Role, { id: roleId });
      return { message: 'Role deleted successfully' };
    });
  }

  static async setPermissions(businessId: number, roleId: number, permissions: { feature_id: number; permission: PermissionLevel }[]) {
    return await AppDataSource.manager.transaction(async (manager) => {
      const role = await manager.findOne(Role, { where: { id: roleId, business: { id: businessId } } });
      if (!role) throw { status: 404, message: 'Role not found' };

      // Validate feature_ids
      const featureIds = permissions.map(p => p.feature_id);
      const uniqueFeatureIds = new Set(featureIds);
      if (featureIds.length !== uniqueFeatureIds.size) {
        throw { status: 400, message: 'Duplicate feature_id detected in permissions array' };
      }

      if (featureIds.length > 0) {
        const features = await manager.find(Feature, { where: featureIds.map(id => ({ id })) });
        if (features.length !== featureIds.length) {
           throw { status: 400, message: 'One or more invalid feature_ids provided' };
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

      return {
        message: 'Permissions updated successfully',
        role_id: role.id,
        permissions: updatedRole!.role_permissions.map(rp => ({
          feature_id: rp.feature.id,
          feature: rp.feature.name,
          permission: rp.permission
        }))
      };
    });
  }
}
