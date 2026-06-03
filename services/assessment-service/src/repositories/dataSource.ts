import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { EvaluationEntity, Attempt, GradeEntity } from '../domain/entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/academic',
  entities: [EvaluationEntity, Attempt, GradeEntity],
  synchronize: false,
  logging: false
});
