import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Attempt } from './Attempt';

@Entity('grades')
@Index(['attemptId', 'createdAt'])
export class GradeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'attempt_id' })
  attemptId: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  score: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'rubric_score' })
  rubricScore: number | null;

  @Column({ type: 'int', nullable: true, name: 'total_points' })
  totalPoints: number | null;

  @Column({ type: 'text', nullable: true })
  feedback: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'rubric_details' })
  rubricDetails: Record<string, any> | null;

  @Column('uuid', { nullable: true, name: 'graded_by' })
  gradedBy: string | null; // Null si es auto-grading

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Attempt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attempt_id' })
  attempt: Attempt;
}
