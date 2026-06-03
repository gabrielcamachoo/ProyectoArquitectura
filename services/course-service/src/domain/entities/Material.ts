import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Module } from './Module';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'module_id' })
  moduleId: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 30, default: 'private' })
  visibility: string;

  @Column('uuid', { nullable: true, name: 'created_by' })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column('uuid', { nullable: true, name: 'updated_by' })
  updatedBy: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Module, (module) => module.materials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: Module;
}
