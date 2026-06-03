-- Migration: Adaptive service recommendations schema (RF-04)
-- 009_adaptive_service_schema.sql

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  evaluation_id UUID,
  type VARCHAR(50) NOT NULL,
  scope VARCHAR(50) NOT NULL,
  reasoning TEXT,
  score FLOAT NOT NULL,
  resource JSONB,
  fallback BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recommendations_student_created ON recommendations(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_course_id ON recommendations(course_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_evaluation_id ON recommendations(evaluation_id);
