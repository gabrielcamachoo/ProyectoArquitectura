-- Migration: Create analytics views for read-replica queries
-- 005_analytics_views.sql

-- View: Course completion statistics
CREATE OR REPLACE VIEW v_course_analytics AS
SELECT 
  c.id as course_id,
  c.name as course_name,
  COUNT(DISTINCT a.id) as total_attempts,
  COUNT(DISTINCT a.user_id) as active_students,
  AVG(a.score) as average_score,
  ROUND(
    COUNT(CASE WHEN a.score >= 60 THEN 1 END) * 100.0 / 
    NULLIF(COUNT(DISTINCT a.id), 0), 1
  ) as completion_rate,
  COUNT(DISTINCT CASE WHEN a.status = 'graded' THEN a.id END) as evaluations_submitted,
  MAX(a.created_at) as last_activity
FROM courses c
LEFT JOIN assessments e ON c.id = e.course_id
LEFT JOIN attempts a ON e.id = a.evaluation_id
GROUP BY c.id, c.name;

-- View: Student progress by course
CREATE OR REPLACE VIEW v_student_progress AS
SELECT 
  u.id as student_id,
  u.full_name as student_name,
  c.id as course_id,
  c.name as course_name,
  COUNT(DISTINCT a.id) as total_attempts,
  AVG(a.score) as average_score,
  ROUND(
    COUNT(CASE WHEN a.score >= 60 THEN 1 END) * 100.0 / 
    NULLIF(COUNT(DISTINCT a.id), 0), 1
  ) as completion_percentage,
  MAX(a.created_at) as last_activity
FROM users u
CROSS JOIN courses c
LEFT JOIN attempts a ON u.id = a.user_id AND a.course_id = c.id
GROUP BY u.id, u.full_name, c.id, c.name;

-- View: At-risk students (completion < 40% or no recent activity)
CREATE OR REPLACE VIEW v_at_risk_students AS
SELECT 
  vsp.student_id,
  vsp.student_name,
  vsp.course_id,
  vsp.course_name,
  vsp.average_score,
  vsp.completion_percentage,
  vsp.last_activity,
  CASE 
    WHEN vsp.completion_percentage < 40 THEN 'low_completion'
    WHEN vsp.last_activity < NOW() - INTERVAL '7 days' THEN 'no_activity'
    WHEN vsp.average_score < 50 THEN 'low_score'
    ELSE 'ok'
  END as risk_level
FROM v_student_progress vsp
WHERE vsp.completion_percentage < 40 
   OR vsp.last_activity < NOW() - INTERVAL '7 days'
   OR vsp.average_score < 50;
