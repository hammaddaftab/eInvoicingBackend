import { Entity, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';
import { Role } from './Role';

@Entity('user_roles')
export class UserRole {
  @PrimaryColumn({ type: 'integer' })
  user_id: number;

  @PrimaryColumn({ type: 'smallint' })
  role_id: number;

  @ManyToOne(() => User, (user) => user.user_roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, (role) => role.user_roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @CreateDateColumn({ type: 'timestamptz' })
  assigned_at: Date;
}
