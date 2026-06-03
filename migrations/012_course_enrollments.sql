-- Migration: Course Enrollments
-- 012_course_enrollments.sql

CREATE TABLE IF NOT EXISTS course_students (
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (course_id, student_id)
);
