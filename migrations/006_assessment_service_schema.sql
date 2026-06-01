-- Migration: Create assessment-service schema (evaluations and attempts)
-- 006_assessment_service_schema.sql

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  weight NUMERIC(5, 2) NOT NULL,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  status VARCHAR(30) DEFAULT 'created' CHECK (status IN ('created', 'in_progress', 'submitted', 'graded', 'annulled')),
  submitted_at TIMESTAMPTZ,
  score NUMERIC(5, 2),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

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
