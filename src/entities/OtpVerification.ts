import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { OtpChannel, OtpPurpose } from './enums';

@Entity('otp_verifications')
export class OtpVerification {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: OtpChannel, enumName: 'otp_channel' })
  channel: OtpChannel;

  @Column({ type: 'varchar', length: 255 })
  destination: string;

  @Column({ type: 'char', length: 60 })
  code_hash: string;

  @Column({ type: 'enum', enum: OtpPurpose, enumName: 'otp_purpose' })
  purpose: OtpPurpose;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'smallint', default: 0 })
  attempts: number;

  @Column({ type: 'smallint', default: 3 })
  max_attempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  verified_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}