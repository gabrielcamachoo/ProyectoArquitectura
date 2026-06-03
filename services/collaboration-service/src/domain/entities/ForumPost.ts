import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ForumEntity } from './Forum';

@Entity('forum_posts')
export class ForumPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'forum_id' })
  forumId: string;

  @Column('uuid', { name: 'author_id' })
  authorId: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ForumEntity, (forum) => forum.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'forum_id' })
  forum: ForumEntity;
}
