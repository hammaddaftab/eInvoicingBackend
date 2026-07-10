import { PermissionLevel } from '../entities/enums';

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
