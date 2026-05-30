import type {
  Attempt,
  Course,
  CourseDashboard,
  Evaluation,
  Forum,
  ForumPost,
  Material,
  Module,
  Notification,
  ProgressRecord,
  Recommendation,
  Role,
  StudyGroup,
  TutoringSession,
  User,
  UserExport,
  UserSummary
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  register: (data: { fullName: string; email: string; password: string; role: Role }) =>
    request<User>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (email: string, password: string) =>
    request<{ token: string; refreshToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  getCourses: () => request<{ items: Course[] }>('/courses'),
  getCourse: (id: string) => request<Course>(`/courses/${id}`),
  createCourse: (data: Partial<Course>) => request<Course>('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id: string, data: Partial<Course>) =>
    request<Course>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getModules: (courseId: string) => request<{ items: Module[] }>(`/courses/${courseId}/modules`),
  createModule: (courseId: string, data: { title: string; order?: number; status?: string }) =>
    request<Module>(`/courses/${courseId}/modules`, { method: 'POST', body: JSON.stringify(data) }),

  getMaterials: (courseId: string, moduleId: string) =>
    request<{ items: Material[] }>(`/courses/${courseId}/modules/${moduleId}/materials`),

  getEvaluations: () => request<{ items: Evaluation[] }>('/evaluations'),
  createEvaluation: (data: Partial<Evaluation>) =>
    request<Evaluation>('/evaluations', { method: 'POST', body: JSON.stringify(data) }),
  startAttempt: (evaluationId: string, studentId: string, courseId?: string) =>
    request<Attempt>(`/evaluations/${evaluationId}/attempts`, {
      method: 'POST',
      body: JSON.stringify({ studentId, courseId })
    }),
  submitAttempt: (attemptId: string) =>
    request<Attempt>(`/attempts/${attemptId}/submit`, { method: 'PUT', body: '{}' }),
  gradeAttempt: (attemptId: string, score: number) =>
    request<Attempt>(`/attempts/${attemptId}/grade`, { method: 'PUT', body: JSON.stringify({ score }) }),

  getCourseProgress: (studentId: string, courseId: string) =>
    request<{ item: ProgressRecord }>(`/progress/student/${studentId}/course/${courseId}`),
  getStudentProgress: (studentId: string) =>
    request<{ items: ProgressRecord[]; overallPercentage: number }>(`/progress/student/${studentId}`),

  getRecommendations: (studentId: string) => request<Recommendation>(`/recommendations/student/${studentId}`),

  getCourseAnalytics: (courseId: string) => request<CourseDashboard>(`/analytics/course/${courseId}`),
  getCourseStudentsAnalytics: (courseId: string) =>
    request<{ students: Array<{ studentId: string; fullName?: string; percentage: number }> }>(
      `/analytics/course/${courseId}/students`
    ),

  getForums: () => request<{ items: Forum[] }>('/forums'),
  createForum: (data: { courseId: string; title: string; moderatorId: string }) =>
    request<Forum>('/forums', { method: 'POST', body: JSON.stringify(data) }),
  getForumPosts: (forumId: string) => request<{ items: ForumPost[] }>(`/forums/${forumId}/posts`),
  createForumPost: (forumId: string, data: { authorId: string; content: string }) =>
    request<ForumPost>(`/forums/${forumId}/posts`, { method: 'POST', body: JSON.stringify(data) }),

  getStudyGroups: () => request<{ items: StudyGroup[] }>('/study-groups'),
  createStudyGroup: (data: { courseId: string; name: string; leaderId: string }) =>
    request<StudyGroup>('/study-groups', { method: 'POST', body: JSON.stringify(data) }),
  getTutoring: (params?: { userId?: string; role?: 'tutor' | 'tutee' }) => {
    const q = new URLSearchParams();
    if (params?.userId) q.set('userId', params.userId);
    if (params?.role) q.set('role', params.role);
    const query = q.toString();
    return request<{ items: TutoringSession[] }>(`/tutoring${query ? `?${query}` : ''}`);
  },
  createTutoring: (data: { tutorId: string; tuteeId: string; courseId: string; scheduledAt?: string }) =>
    request<TutoringSession>('/tutoring', { method: 'POST', body: JSON.stringify(data) }),
  updateTutoringStatus: (id: string, status: TutoringSession['status']) =>
    request<TutoringSession>(`/tutoring/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  listUsers: () => request<{ items: UserSummary[] }>('/users'),
  exportUserData: (userId: string) => request<UserExport>(`/users/${userId}/data`),
  deleteUserData: (userId: string) => request<void>(`/users/${userId}`, { method: 'DELETE' }),

  getNotifications: (userId: string) => request<{ items: Notification[] }>(`/notifications/user/${userId}`),
  markNotificationRead: (id: string) =>
    request<Notification>(`/notifications/${id}/read`, { method: 'PUT', body: '{}' })
};
