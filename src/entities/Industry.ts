import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Business } from './Business';

@Entity('industry')
export class Industry {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS', type: 'smallint' })
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string;

  @OneToMany(() => Business, (business) => business.industry)
  businesses: Business[];
}
