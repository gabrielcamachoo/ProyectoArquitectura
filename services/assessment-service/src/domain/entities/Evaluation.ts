import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Attempt } from './Attempt';

export type EvaluationType = 'quiz' | 'exam' | 'assignment' | 'project' | 'final';

@Entity('evaluations')
@Index(['courseId', 'createdAt'])
export class EvaluationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'course_id' })
  courseId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 50 })
  type: EvaluationType; // 'quiz' | 'exam' | 'assignment' | 'project' | 'final'

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  weight: number; // % of final grade

  @Column({ type: 'int', default: 100, name: 'total_points' })
  totalPoints: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 60, name: 'pass_threshold' })
  passThreshold: number; // % required to pass

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 1, name: 'max_attempts' })
  maxAttempts: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'start_date' })
  startDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'deadline' })
  deadline: Date | null;

  @Column({ type: 'jsonb', nullable: true, name: 'rubric_config' })
  rubricConfig: Record<string, any> | null;

  @Column({ type: 'varchar', length: 30, default: 'draft', name: 'status' })
  status: 'draft' | 'published' | 'archived';

  @Column('uuid', { nullable: true, name: 'created_by' })
  createdBy: string | null; // Teacher who created

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column('uuid', { nullable: true, name: 'updated_by' })
  updatedBy: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Attempt, (attempt) => attempt.evaluation, { cascade: true })
  attempts: Attempt[];
}
