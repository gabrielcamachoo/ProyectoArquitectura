export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  teacherId?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string | null;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  status: string;
}

export interface Material {
  id: string;
  moduleId: string;
  title: string;
  type: string;
  url: string;
  visibility: string;
}

export interface Evaluation {
  id: string;
  courseId: string;
  title: string;
  type: string;
  weight: number;
  deadline?: string;
}

export interface Attempt {
  id: string;
  evaluationId: string;
  studentId: string;
  status: string;
  submittedAt?: string;
  score?: number;
}

export interface ProgressRecord {
  studentId: string;
  courseId: string;
  moduleId?: string;
  percentage: number;
  status: string;
  lastUpdated: string;
}

export interface Recommendation {
  type: string;
  materialScope?: string;
  studentId?: string;
  courseId?: string;
  generatedAt?: string;
  fallback?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  content: unknown;
  read: boolean;
  createdAt: string;
}

export interface Forum {
  id: string;
  courseId: string;
  title: string;
  status: string;
  moderatorId: string;
}

export interface ForumPost {
  id: string;
  forumId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface StudyGroup {
  id: string;
  courseId: string;
  name: string;
  leaderId: string;
  status: string;
}

export interface TutoringSession {
  id: string;
  tutorId: string;
  tuteeId: string;
  courseId: string;
  scheduledAt: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface UserSummary {
  id: string;
  fullName: string;
  institutionalEmail: string;
  role: Role;
  status: string;
  createdAt: string;
}

export interface UserExport {
  id: string;
  fullName: string;
  institutionalEmail: string;
  role: Role;
  status: string;
  consent: boolean;
  createdAt: string;
  updatedAt: string;
  passwordHashMasked?: string;
}

export interface CourseDashboard {
  courseId: string;
  completionRate: number;
  activeStudents: number;
  averageScore?: number;
  evaluationsSubmitted?: number;
  recommendationsSent?: number;
  atRiskStudents?: number;
  trend?: string;
}
