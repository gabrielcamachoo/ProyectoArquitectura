import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { PermissionEntity } from './Permission';
import { UserEntity } from './User';

@Entity('roles')
@Index(['name'], { unique: true })
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column('uuid', { nullable: true, name: 'created_by' })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column('uuid', { nullable: true, name: 'updated_by' })
  updatedBy: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PermissionEntity, (perm) => perm.role, { cascade: true })
  permissions: PermissionEntity[];

  @OneToMany(() => UserEntity, (user) => user.role)
  users: UserEntity[];
}
