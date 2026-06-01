import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Notification } from '../domain/entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/academic',
  entities: [Notification],
  synchronize: false,
  logging: false
});
