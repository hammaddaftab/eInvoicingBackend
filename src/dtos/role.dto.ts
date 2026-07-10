import { PermissionLevel } from '../entities/enums';
import { Role } from '../entities/Role';

export interface RoleDto {
  id: number;
  name: string;
  description?: string;
  is_system: boolean;
}

export interface CreateRoleDto {
  /**
   * @minLength 2
   * @maxLength 50
   */
  name: string;
  /**
   * @maxLength 255
   */
  description?: string;
}

export interface UpdateRoleDto {
  /**
   * @minLength 2
   * @maxLength 50
   */
  name?: string;
  /**
   * @maxLength 255
   */
  description?: string;
}

export interface RolePermissionDto {
  /**
   * @isInt
   * @minimum 1
   */
  feature_id: number;
  permission: PermissionLevel;
}

export interface SetPermissionsDto {
  permissions: RolePermissionDto[];
}

export interface RoleResponseDto {
  id: number;
  name: string;
  description?: string;
  is_system: boolean;
}

export interface RoleDetailResponseDto extends RoleResponseDto {
  permissions: {
    feature_id: number;
    feature: string;
    permission: PermissionLevel;
  }[];
}

export interface GetRolesResponseDto {
  roles: RoleResponseDto[];
}

export interface CreateRoleResponseDto {
  message: string;
  role: RoleResponseDto;
}

export interface UpdateRoleResponseDto {
  message: string;
  role: RoleResponseDto;
}

export interface SetPermissionsResponseDto {
  message: string;
  role_id: number;
  permissions: {
    feature_id: number;
    feature: string;
    permission: PermissionLevel;
  }[];
}

// Mappers
export function toRoleDto(role: Role): RoleResponseDto {
  return {
    id: role.id,
    name: role.name,
    description: role.description || undefined,
    is_system: role.is_system
  };
}

export function toRoleDetailDto(role: Role): RoleDetailResponseDto {
  return {
    ...toRoleDto(role),
    permissions: (role.role_permissions || []).map((rp: any) => ({
      feature_id: rp.feature.id,
      feature: rp.feature.name,
      permission: rp.permission
    }))
  };
}
