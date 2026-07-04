import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Industry } from './Industry';
import { Emirate } from './enums';

@Entity('business')
export class Business {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'char', length: 15, unique: true })
  vat_number: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  tl_number: string;

  @ManyToOne(() => Industry)
  @JoinColumn({ name: 'industry_id' })
  industry: Industry;

  @Column({ type: 'enum', enum: Emirate, enumName: 'emirates_enum' })
  emirate: Emirate;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
