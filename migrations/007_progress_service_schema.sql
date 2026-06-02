-- Migration: Create progress-service schema
-- 007_progress_service_schema.sql

CREATE TABLE IF NOT EXISTS progress_records (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  module_id UUID,
  percentage NUMERIC(5, 2) NOT NULL,
  status VARCHAR(30) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, course_id, module_id)
);

-- Indexes for performance
CREATE INDEX idx_progress_records_student_id ON progress_records(student_id);
CREATE INDEX idx_progress_records_course_id ON progress_records(course_id);
CREATE INDEX idx_progress_records_student_course ON progress_records(student_id, course_id);
CREATE INDEX idx_progress_records_status ON progress_records(status);
