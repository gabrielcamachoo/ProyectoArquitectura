import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type StudyGroupStatus = 'active' | 'archived';

@Entity('study_groups')
export class StudyGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'course_id' })
  courseId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column('uuid', { name: 'leader_id' })
  leaderId: string;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status: StudyGroupStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
