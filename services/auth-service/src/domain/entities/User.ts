import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { RoleEntity } from './Role';

@Entity('users')
@Index(['institutionalEmail'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'bytea',
    name: 'full_name',
    transformer: {
      to: (v: string) => Buffer.from(v),
      from: (v: Buffer) => v.toString()
    }
  })
  fullName: string;

  @Column({
    type: 'bytea',
    name: 'institutional_email',
    transformer: {
      to: (v: string) => Buffer.from(v),
      from: (v: Buffer) => v.toString()
    }
  })
  institutionalEmail: string;

  @Column({
    type: 'boolean',
    name: 'consent',
    default: false
  })
  consentAccepted: boolean;
  @Column({ type: 'text', name: 'password_hash' })
  passwordHash: string;

  @Column('uuid', { name: 'role_id' })
  roleId: string;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status: 'active' | 'inactive';



  @Column({ type: 'timestamp', nullable: true, name: 'consent_accepted_at' })
  consentAcceptedAt: Date | null;

  @Column('uuid', { nullable: true, name: 'created_by' })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column('uuid', { nullable: true, name: 'updated_by' })
  updatedBy: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => RoleEntity, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;
}
