import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Progress } from '../domain/entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/academic',
  entities: [Progress],
  synchronize: false,
  logging: false
});
