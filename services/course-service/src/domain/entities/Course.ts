import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Module } from './Module';

export type CourseStatus = 'draft' | 'published' | 'archived';

@Entity('courses')
export class CourseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column('uuid', { name: 'teacher_id' })
  teacherId: string;

  @Column({ type: 'int', nullable: true, name: 'max_students' })
  maxStudents: number | null;

  @Column({ type: 'text', nullable: true, name: 'learning_objectives' })
  learningObjectives: string | null;

  @Column({ type: 'int', default: 0, name: 'total_modules' })
  totalModules: number;

  @Column({ type: 'varchar', length: 30, default: 'draft' })
  status: CourseStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'published_at' })
  publishedAt: Date | null;

  @Column('uuid', { nullable: true, name: 'created_by' })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column('uuid', { nullable: true, name: 'updated_by' })
  updatedBy: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Module, (module) => module.course, { cascade: true })
  modules: Module[];
}
