import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CourseEntity } from './Course';

@Entity('course_students')
export class EnrollmentEntity {
  @PrimaryColumn('uuid', { name: 'course_id' })
  courseId: string;

  @PrimaryColumn('uuid', { name: 'student_id' })
  studentId: string;

  @CreateDateColumn({ name: 'enrolled_at' })
  enrolledAt: Date;

  @ManyToOne(() => CourseEntity)
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;
}
