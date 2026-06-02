-- Migration: Create assessment-service schema (evaluations and attempts)
-- 006_assessment_service_schema.sql

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  weight NUMERIC(5, 2) NOT NULL,
  total_points INT NOT NULL DEFAULT 100,
  pass_threshold NUMERIC(5, 2) NOT NULL DEFAULT 60,
  description TEXT,
  max_attempts INT NOT NULL DEFAULT 1,
  start_date TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  rubric_config JSONB,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  attempt_number INT NOT NULL DEFAULT 1,
  status VARCHAR(30) DEFAULT 'created' CHECK (status IN ('created', 'in_progress', 'submitted', 'graded', 'annulled')),
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  score NUMERIC(5, 2),
  is_passed BOOLEAN,
  time_spent_seconds INT,
  answers JSONB,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

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

-- Backward-compatible patch for base schema from 001 where attempts has no course_id.
ALTER TABLE attempts
  ADD COLUMN IF NOT EXISTS course_id UUID;

UPDATE attempts a
SET course_id = e.course_id
FROM evaluations e
WHERE a.evaluation_id = e.id
  AND a.course_id IS NULL;

-- Indexes for performance
CREATE INDEX idx_evaluations_course_id ON evaluations(course_id);
CREATE INDEX idx_attempts_evaluation_id ON attempts(evaluation_id);
CREATE INDEX idx_attempts_student_id ON attempts(student_id);
CREATE INDEX idx_attempts_course_id ON attempts(course_id);
CREATE INDEX idx_attempts_status ON attempts(status);
CREATE INDEX idx_attempts_student_course ON attempts(student_id, course_id);

-- Seed removed: requires a pre-seeded course that is not guaranteed during bootstrap.
