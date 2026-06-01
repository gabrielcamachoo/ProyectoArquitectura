import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_READ_URL || process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/academic',
  entities: [],
  synchronize: false,
  logging: false
});
