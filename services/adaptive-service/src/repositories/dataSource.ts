import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { RecommendationEntity } from '../domain/entities/Recommendation';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [RecommendationEntity],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: false
});
