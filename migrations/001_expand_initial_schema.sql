CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE module_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE attempt_status AS ENUM ('created', 'in_progress', 'submitted', 'graded', 'annulled');
CREATE TYPE recommendation_status AS ENUM ('pending', 'sent', 'read', 'expired');

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name BYTEA NOT NULL,
  institutional_email BYTEA NOT NULL,
  password_hash TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  action VARCHAR(80) NOT NULL,
  resource VARCHAR(120) NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (role_id, action, resource)
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL REFERENCES users(id),
  status course_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  "order" INT NOT NULL,
  status module_status NOT NULL DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  visibility VARCHAR(30) NOT NULL DEFAULT 'private',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  weight NUMERIC(5,2) NOT NULL,
  deadline TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  submitted_at TIMESTAMPTZ,
  score NUMERIC(5,2),
  status attempt_status NOT NULL DEFAULT 'created',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  module_id UUID REFERENCES modules(id),
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(40) NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  type VARCHAR(80) NOT NULL,
  suggested_content JSONB NOT NULL,
  validity TIMESTAMPTZ NOT NULL,
  status recommendation_status NOT NULL DEFAULT 'pending',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  title VARCHAR(200) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  moderator_id UUID NOT NULL REFERENCES users(id),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  name VARCHAR(200) NOT NULL,
  leader_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tutoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES users(id),
  tutee_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(80) NOT NULL,
  content JSONB NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(80) NOT NULL,
  resource VARCHAR(120) NOT NULL,
  resource_id UUID,
  ip INET,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_attempts_evaluation_student ON attempts(evaluation_id, student_id);
CREATE INDEX idx_progress_student_course ON progress(student_id, course_id);
CREATE INDEX idx_recommendations_student ON recommendations(student_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at);
