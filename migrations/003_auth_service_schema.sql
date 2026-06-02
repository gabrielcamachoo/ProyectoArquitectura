-- Auth Service Migration: Create roles, permissions, and users tables

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('student', 'Student role with access to courses and evaluations'),
  ('teacher', 'Teacher role with ability to create courses and grade'),
  ('admin', 'Administrator role with full platform access')
ON CONFLICT (name) DO NOTHING;

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
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

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name BYTEA NOT NULL,
  institutional_email BYTEA NOT NULL,
  password_hash TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  -- Backward-compatible consent flag (legacy)
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  -- Ley 1581 fields used by auth-service TypeORM entity
  consent_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  consent_accepted_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_permissions_role_id ON permissions(role_id);

-- Seed data: Demo user and Demo course for other services to reference
INSERT INTO users (id, full_name, institutional_email, password_hash, role_id, status)
SELECT 
  '00000000-0000-4000-8000-000000000010',
  E'\\x44656d6f2054656163686572'::bytea, -- 'Demo Teacher' in hex
  E'\\x746561636865724064656d6f2e656475'::bytea, -- 'teacher@demo.edu' in hex
  'hash',
  id,
  'active'
FROM roles WHERE name = 'teacher'
ON CONFLICT (id) DO NOTHING;

INSERT INTO courses (id, name, description, teacher_id, status) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Arquitectura de Software', 'Curso Integrador', '00000000-0000-4000-8000-000000000010', 'published')
ON CONFLICT (id) DO NOTHING;
