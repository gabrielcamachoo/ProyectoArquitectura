import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ForumPost } from './ForumPost';

export type ForumStatus = 'active' | 'archived';

@Entity('forums')
export class ForumEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'course_id' })
  courseId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status: ForumStatus;

  @Column('uuid', { name: 'moderator_id' })
  moderatorId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ForumPost, (post) => post.forum, { cascade: true })
  posts: ForumPost[];
}
