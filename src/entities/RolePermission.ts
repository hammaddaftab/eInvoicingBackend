import { Entity, ManyToOne, JoinColumn, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Role } from './Role';
import { Feature } from './Feature';
import { PermissionLevel } from './enums';
import { User } from './User';

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

  // --- Audit Fields ---
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updated_by: User;
}
