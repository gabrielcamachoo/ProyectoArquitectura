import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CourseEntity, Module, Material } from '../domain/entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/academic',
  entities: [CourseEntity, Module, Material],
  synchronize: false,
  logging: false
});
