import { Entity, ManyToOne, JoinColumn, Column, PrimaryColumn } from 'typeorm';
import { Role } from './Role';
import { Feature } from './Feature';
import { PermissionLevel } from './enums';

@Entity('roles_permissions')
export class RolePermission {
  @PrimaryColumn({ type: 'smallint' })
  role_id: number;

  @PrimaryColumn({ type: 'smallint' })
  feature_id: number;

  @ManyToOne(() => Role, (role) => role.role_permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Feature, (feature) => feature.role_permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feature_id' })
  feature: Feature;

  @Column({ type: 'enum', enum: PermissionLevel, enumName: 'permissions_enum' })
  permission: PermissionLevel;
}
