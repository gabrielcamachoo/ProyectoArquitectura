import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('recommendations')
@Index(['studentId', 'createdAt'])
export class RecommendationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_id' })
  studentId!: string;

  @Column({ name: 'course_id' })
  courseId!: string;

  @Column({ name: 'evaluation_id', nullable: true })
  evaluationId?: string;

  @Column()
  type!: string;

  @Column()
  scope!: string;

  @Column({ type: 'text', nullable: true })
  reasoning?: string;

  @Column({ type: 'float' })
  score!: number;

  @Column({ type: 'jsonb', nullable: true })
  resource?: Record<string, unknown>;

  @Column({ default: false })
  fallback!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
