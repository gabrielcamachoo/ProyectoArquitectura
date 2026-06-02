-- Migration: Sync course-service schema with TypeORM entities
-- 011_sync_course_service.sql

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS max_students INT,
  ADD COLUMN IF NOT EXISTS learning_objectives TEXT,
  ADD COLUMN IF NOT EXISTS total_modules INT NOT NULL DEFAULT 0;

ALTER TABLE modules
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'draft';

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS visibility VARCHAR(30) NOT NULL DEFAULT 'private';
