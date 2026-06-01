import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ForumEntity, ForumPost, StudyGroup, TutoringSession } from '../domain/entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/academic',
  entities: [ForumEntity, ForumPost, StudyGroup, TutoringSession],
  synchronize: false,
  logging: false
});
