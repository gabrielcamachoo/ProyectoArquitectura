import axios from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
const USE_DIRECT_PORTS =
  (import.meta as any).env?.VITE_USE_DIRECT_PORTS === 'true' ||
  (!(import.meta as any).env?.VITE_USE_DIRECT_PORTS && window.location.hostname === 'localhost');

function getServiceBaseByPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (normalized.startsWith('/auth') || normalized.startsWith('/users')) return 'http://localhost:3000';
  if (normalized.startsWith('/courses')) return 'http://localhost:3001';
  if (normalized.startsWith('/evaluations') || normalized.startsWith('/attempts')) return 'http://localhost:3002';
  if (normalized.startsWith('/progress')) return 'http://localhost:3003';
  if (normalized.startsWith('/recommendations')) return 'http://localhost:3004';
  if (normalized.startsWith('/forums') || normalized.startsWith('/study-groups') || normalized.startsWith('/tutoring')) return 'http://localhost:3005';
  if (normalized.startsWith('/analytics')) return 'http://localhost:3006';
  if (normalized.startsWith('/notifications')) return 'http://localhost:3007';

  return API_BASE;
}

const apiInstance = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

// ─── INTERCEPTOR REQUEST: JWT en cada petición ───
apiInstance.interceptors.request.use((config) => {
  const requestPath = config.url || '';
  if (!/^https?:\/\//i.test(requestPath)) {
    config.baseURL = USE_DIRECT_PORTS ? getServiceBaseByPath(requestPath) : API_BASE;
  }

  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── INTERCEPTOR RESPONSE: manejo 401 con refresh, 403 con mensaje ───
apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('no refresh');
        const refreshBase = USE_DIRECT_PORTS ? getServiceBaseByPath('/auth/refresh') : API_BASE;
        const res = await axios.post(`${refreshBase}/auth/refresh`,
          { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return apiInstance(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 403) {
      console.warn('Acceso denegado:', error.config?.url);
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: {
    name: string; email: string; password: string;
    role: string; consent_accepted: boolean;
  }) => apiInstance.post('/auth/register', data),

  login: (institutionalEmail: string, password: string) =>
    apiInstance.post('/auth/login', { institutionalEmail, password }),

  refresh: (refreshToken: string) =>
    apiInstance.post('/auth/refresh', { refreshToken }),

  logout: () => apiInstance.post('/auth/logout'),

  exportData: (userId: string) =>
    apiInstance.get(`/auth/users/${userId}/data`),

  deleteAccount: (userId: string) =>
    apiInstance.delete(`/auth/users/${userId}`),

  listUsers: () =>
    apiInstance.get('/auth/users').then(res => res.data.users),
};

export const coursesAPI = {
  list: () => apiInstance.get('/courses'),
  get: (id: string) => apiInstance.get(`/courses/${id}`),
  create: (data: object) => apiInstance.post('/courses', data),
  update: (id: string, data: object) => apiInstance.put(`/courses/${id}`, data),
  delete: (id: string) => apiInstance.delete(`/courses/${id}`),
  enroll: (courseId: string) => apiInstance.post(`/courses/${courseId}/enroll`),
  getModules: (courseId: string) => apiInstance.get(`/courses/${courseId}/modules`),
  createModule: (courseId: string, data: object) =>
    apiInstance.post(`/courses/${courseId}/modules`, data),
};

export const assessmentsAPI = {
  // Service uses "evaluations" and dedicated attempt endpoints
  create: (data: object) => apiInstance.post('/evaluations', data),
  get: (id: string) => apiInstance.get(`/evaluations/${id}`),
  createAttempt: (evaluationId: string) => apiInstance.post(`/evaluations/${evaluationId}/attempts`),
  startAttempt: (attemptId: string) => apiInstance.post(`/attempts/${attemptId}/start`),
  submit: (attemptId: string, answers: object[]) =>
    apiInstance.post(`/attempts/${attemptId}/submit`, { answers }),
  // grading is handled via attempts submit/teacher flows; keep placeholder
  grade: (attemptId: string, score: number, feedback: string) =>
    apiInstance.post(`/attempts/${attemptId}/grade`, { score, feedback }),
  getResults: (evaluationId: string) =>
    apiInstance.get(`/evaluations/${evaluationId}/results`),
};

export const adaptiveAPI = {
  getRecommendations: (studentId: string) =>
    apiInstance.get(`/recommendations/student/${studentId}`)
      .then(res => res.data.recommendations),
};

export const progressAPI = {
  getStudentProgress: (studentId: string) =>
    apiInstance.get(`/progress/student/${studentId}`),
};

export const notificationsAPI = {
  getStudentNotifications: (studentId: string) =>
    apiInstance.get(`/notifications/student/${studentId}`)
      .then(res => res.data.notifications),
  markRead: (notificationId: string) =>
    apiInstance.put(`/notifications/${notificationId}/read`),
};

export const analyticsAPI = {
  // Updated analytics routes
  getCourseProgress: (courseId: string) =>
    apiInstance.get(`/analytics/course/${courseId}`),
  getCourseStudentsAnalytics: (courseId: string) =>
    apiInstance.get(`/analytics/course/${courseId}/students`),
  getStudentReport: (studentId: string) =>
    apiInstance.get(`/analytics/students/${studentId}/report`),
};

export const collaborationAPI = {
  // Collaboration service routes
  getForums: () => apiInstance.get('/forums').then(res => res.data),
  createThread: (data: object) => apiInstance.post('/forums', data).then(res => res.data),
  getForumPosts: (forumId: string) => apiInstance.get(`/forums/${forumId}/posts`).then(res => res.data),
  createForumPost: (forumId: string, data: object) => apiInstance.post(`/forums/${forumId}/posts`, data).then(res => res.data),
  requestTutoring: (data: object) => apiInstance.post('/tutoring', data).then(res => res.data),
  getTutoring: () => apiInstance.get('/tutoring').then(res => res.data),
};

// ─── LEGACY NAMED API BRIDGE ───
export const api = {
  register: (data: any) => authAPI.register({ name: data.fullName, email: data.institutionalEmail, password: data.password, role: data.role, consent_accepted: true }).then(res => res.data),
  login: (email: string, password: string) => authAPI.login(email, password).then(res => ({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken, user: res.data.user })),
  logout: () => authAPI.logout().then(res => res.data),
  getCourses: () => coursesAPI.list().then(res => ({ courses: res.data.courses })),
  getCourse: (id: string) => coursesAPI.get(id).then(res => res.data),
  createCourse: (data: any) => coursesAPI.create(data).then(res => res.data),
  updateCourse: (id: string, data: any) => coursesAPI.update(id, data).then(res => res.data),
  getModules: (courseId: string) => coursesAPI.getModules(courseId).then(res => ({ modules: res.data.modules })),
  createModule: (courseId: string, data: any) => coursesAPI.createModule(courseId, data).then(res => res.data),
  getMaterials: (courseId: string, moduleId: string) => apiInstance.get(`/courses/${courseId}/modules/${moduleId}/materials`).then(res => ({ materials: res.data.materials })),
  getEvaluations: () => apiInstance.get('/evaluations').then(res => ({ evaluations: res.data.items || res.data.evaluations })),
  createEvaluation: (data: any) => assessmentsAPI.create(data).then(res => res.data),
  // Create an attempt for an evaluation and then start it
  startAttempt: async (evaluationId: string, _studentId: string, _courseId?: string) => {
    const created = await assessmentsAPI.createAttempt(evaluationId).then(r => r.data || r);
    const attemptId = created?.id || created?.attemptId;
    if (!attemptId) throw new Error('attempt_id_missing');
    const started = await assessmentsAPI.startAttempt(attemptId).then(r => r.data || r);
    return started;
  },
  submitAttempt: (attemptId: string) => assessmentsAPI.submit(attemptId, []).then(res => res.data),
  gradeAttempt: (attemptId: string, score: number) => assessmentsAPI.grade(attemptId, score, '').then(res => res.data),
  getCourseProgress: (studentId: string, _courseId: string) => progressAPI.getStudentProgress(studentId).then(res => ({ item: res.data })),
  getStudentProgress: (studentId: string) => progressAPI.getStudentProgress(studentId).then(res => res.data),
  getRecommendations: (studentId: string) => adaptiveAPI.getRecommendations(studentId).then(data => data[0] || null),
  getCourseAnalytics: (courseId: string) => analyticsAPI.getCourseProgress(courseId).then(res => res.data),
  getCourseStudentsAnalytics: (courseId: string) => analyticsAPI.getCourseProgress(courseId).then(res => res.data),
  getForums: () => collaborationAPI.getForums().then(items => ({ items })),
  createForum: (data: any) => collaborationAPI.createThread(data).then(res => res),
  getForumPosts: (forumId: string) => collaborationAPI.getForumPosts(forumId).then(items => ({ items })),
  createForumPost: (forumId: string, data: any) => collaborationAPI.createForumPost(forumId, data).then(res => res),
  getStudyGroups: () => collaborationAPI.getTutoring().then(res => ({ items: res.data })),
  createStudyGroup: (data: any) => collaborationAPI.requestTutoring(data).then(res => res.data),
  getTutoring: (_params?: any) => collaborationAPI.getTutoring().then(res => ({ items: res.data })),
  createTutoring: (data: any) => collaborationAPI.requestTutoring(data).then(res => res.data),
  updateTutoringStatus: (_id: string, _status: any) => collaborationAPI.getTutoring().then(res => res.data),
  listUsers: () => authAPI.listUsers().then(users => ({ items: users })),
  exportUserData: (userId: string) => authAPI.exportData(userId).then(res => res.data),
  deleteUserData: (userId: string) => authAPI.deleteAccount(userId).then(res => res.data),
  getNotifications: (userId: string) => notificationsAPI.getStudentNotifications(userId).then(notifications => ({ items: notifications })),
  markNotificationRead: (id: string) => notificationsAPI.markRead(id).then(res => res.data)
};

export default apiInstance;
