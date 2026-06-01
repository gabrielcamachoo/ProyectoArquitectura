import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'jsonb' })
  content: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
