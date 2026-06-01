import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type TutoringStatus = 'scheduled' | 'completed' | 'cancelled';

@Entity('tutoring_sessions')
export class TutoringSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'tutor_id' })
  tutorId: string;

  @Column('uuid', { name: 'tutee_id' })
  tuteeId: string;

  @Column('uuid', { name: 'course_id' })
  courseId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  topic?: string;

  @Column({ type: 'timestamptz', name: 'scheduled_at' })
  scheduledAt: Date;

  @Column({ type: 'varchar', length: 30, default: 'scheduled' })
  status: TutoringStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
