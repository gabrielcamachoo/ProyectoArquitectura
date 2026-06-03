import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { UserEntity } from '../domain/entities/User';
import { RoleEntity } from '../domain/entities/Role';
import { PermissionEntity } from '../domain/entities/Permission';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [UserEntity, RoleEntity, PermissionEntity],
  migrations: [],
  migrationsRun: false,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});
