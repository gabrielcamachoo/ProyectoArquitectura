import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { EvaluationEntity } from './Evaluation';
import { GradeEntity } from './Grade';

export type AttemptStatus = 'created' | 'in_progress' | 'submitted' | 'graded' | 'annulled';

@Entity('attempts')
@Index(['evaluationId', 'studentId'])
@Index(['courseId', 'studentId'])
@Index(['status', 'createdAt'])
export class Attempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'evaluation_id' })
  evaluationId: string;

  @Column('uuid', { name: 'student_id' })
  studentId: string;

  @Column('uuid', { name: 'course_id' })
  courseId: string;

  @Column({ type: 'varchar', length: 30, default: 'created' })
  status: AttemptStatus;

  @Column({ type: 'int', default: 1, name: 'attempt_number' })
  attemptNumber: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'started_at' })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'submitted_at' })
  submittedAt: Date | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  score: number | null;

  @Column({ type: 'boolean', nullable: true, name: 'is_passed' })
  isPassed: boolean | null;

  @Column({ type: 'jsonb', nullable: true, name: 'answers' })
  answers: Record<string, any> | null; // Student responses

  @Column({ type: 'int', nullable: true, name: 'time_spent_seconds' })
  timeSpentSeconds: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => EvaluationEntity, (evaluation) => evaluation.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluation_id' })
  evaluation: EvaluationEntity;

  @OneToOne(() => GradeEntity, { nullable: true, cascade: false })
  @JoinColumn({ name: 'id' })
  grade: GradeEntity | null;
}
