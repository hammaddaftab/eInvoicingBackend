import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermission } from './RolePermission';

@Entity('features')
export class Feature {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS', type: 'smallint' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @OneToMany(() => RolePermission, (role_permission) => role_permission.feature)
  role_permissions: RolePermission[];
}
