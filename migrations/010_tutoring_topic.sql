-- Migration: Add topic to tutoring sessions (RF-06)
-- 010_tutoring_topic.sql

ALTER TABLE tutoring_sessions ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_topic ON tutoring_sessions(topic);
