import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, OneToMany } from 'typeorm';
import { Business } from './Business';
import { UserRole } from './UserRole';
import { RolePermission } from './RolePermission';

@Entity('roles')
@Unique(['business', 'name'])
export class Role {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS', type: 'smallint' })
  id: number;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  is_system: boolean;

  @OneToMany(() => UserRole, (user_role) => user_role.role)
  user_roles: UserRole[];

  @OneToMany(() => RolePermission, (role_permission) => role_permission.role)
  role_permissions: RolePermission[];
}
