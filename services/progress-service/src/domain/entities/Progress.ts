import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

@Entity('progress_records')
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'student_id' })
  studentId: string;

  @Column('uuid', { name: 'course_id' })
  courseId: string;

  @Column('uuid', { name: 'module_id', nullable: true })
  moduleId: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  percentage: number;

  @Column({ type: 'varchar', length: 30, default: 'not_started' })
  status: ProgressStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', name: 'last_updated' })
  lastUpdated: Date;
}
