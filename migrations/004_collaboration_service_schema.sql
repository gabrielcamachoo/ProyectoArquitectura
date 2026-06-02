-- Migration: Create collaboration-service schema (forums, posts, study groups, tutoring)
-- 004_collaboration_service_schema.sql

CREATE TABLE IF NOT EXISTS forums (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  moderator_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY,
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS study_groups (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  leader_id UUID NOT NULL,
  status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutoring_sessions (
  id UUID PRIMARY KEY,
  tutor_id UUID NOT NULL,
  tutee_id UUID NOT NULL,
  course_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_forums_course_id ON forums(course_id);
CREATE INDEX idx_forum_posts_forum_id ON forum_posts(forum_id);
CREATE INDEX idx_forum_posts_author_id ON forum_posts(author_id);
CREATE INDEX idx_study_groups_course_id ON study_groups(course_id);
CREATE INDEX idx_tutoring_sessions_tutor_id ON tutoring_sessions(tutor_id);
CREATE INDEX idx_tutoring_sessions_tutee_id ON tutoring_sessions(tutee_id);
CREATE INDEX idx_tutoring_sessions_course_id ON tutoring_sessions(course_id);
CREATE INDEX idx_tutoring_sessions_status ON tutoring_sessions(status);

-- Seed data for demo
INSERT INTO forums (id, course_id, title, status, moderator_id) VALUES
  ('00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000001', 'Foro general — Arquitectura de Software', 'active', '00000000-0000-4000-8000-000000000010')
  ON CONFLICT (id) DO NOTHING;

INSERT INTO forum_posts (id, forum_id, author_id, content, created_at) VALUES
  ('00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000010', 'Bienvenidos al foro del curso. Compartan dudas sobre microservicios y el proyecto integrador.', CURRENT_TIMESTAMP)
  ON CONFLICT (id) DO NOTHING;
