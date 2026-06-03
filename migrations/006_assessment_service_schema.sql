-- Migration: Create assessment-service schema (evaluations and attempts)
-- 006_assessment_service_schema.sql

-- Alter evaluations table (already created in 001)
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS total_points INT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS pass_threshold NUMERIC(5, 2) NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS max_attempts INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rubric_config JSONB,
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'draft';

-- Alter attempts table (already created in 001)
ALTER TABLE attempts
  ADD COLUMN IF NOT EXISTS course_id UUID,
  ADD COLUMN IF NOT EXISTS attempt_number INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_passed BOOLEAN,
  ADD COLUMN IF NOT EXISTS time_spent_seconds INT,
  ADD COLUMN IF NOT EXISTS answers JSONB;

-- Backfill course_id in attempts based on evaluations
UPDATE attempts a
SET course_id = e.course_id
FROM evaluations e
WHERE a.evaluation_id = e.id AND a.course_id IS NULL;

-- Grades table (used by GradeEntity)
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  score NUMERIC(5, 2) NOT NULL,
  rubric_score NUMERIC(5, 2),
  total_points INT,
  feedback TEXT,
  rubric_details JSONB,
  graded_by UUID,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_grades_attempt_created ON grades(attempt_id, created_at);

-- Indexes for performance
CREATE INDEX idx_evaluations_course_id ON evaluations(course_id);
CREATE INDEX idx_attempts_evaluation_id ON attempts(evaluation_id);
CREATE INDEX idx_attempts_student_id ON attempts(student_id);
CREATE INDEX idx_attempts_course_id ON attempts(course_id);
CREATE INDEX idx_attempts_status ON attempts(status);
CREATE INDEX idx_attempts_student_course ON attempts(student_id, course_id);

-- Seed data
INSERT INTO evaluations (id, course_id, title, type, weight, deadline) VALUES
  ('00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000001', 'Parcial 1 — Arquitectura de microservicios', 'quiz', 30.00, NOW() + INTERVAL '7 days')
  ON CONFLICT (id) DO NOTHING;
