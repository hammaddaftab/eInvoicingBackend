import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Business } from './Business';
import { User } from './User';
import { Role } from './Role';

@Entity('invitations')
@Unique(['business', 'email'])
export class Invitation {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'invited_by' })
  invited_by: User;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @ManyToOne(() => Role, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ type: 'char', length: 60 })
  token_hash: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  accepted_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
