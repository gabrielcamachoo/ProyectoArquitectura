import axios from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

const apiInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ─── INTERCEPTOR REQUEST: JWT en cada petición ───
apiInstance.interceptors.request.use((config) => {
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
        const res = await axios.post(`${API_BASE}/auth/refresh`,
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
    name?: string; email?: string; fullName?: string; institutionalEmail?: string; password: string;
    role: string; consentAccepted: boolean;
  }) => apiInstance.post('/auth/register', {
    fullName: data.name ?? data.fullName,
    institutionalEmail: data.email ?? data.institutionalEmail,
    password: data.password,
    role: data.role,
    consentAccepted: data.consentAccepted,
  }),

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
  getEnrolled: () => apiInstance.get('/courses/enrolled'),
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
  create: (data: object) => apiInstance.post('/evaluations', data),
  get: (id: string) => apiInstance.get(`/evaluations/${id}`),
  list: () => apiInstance.get('/evaluations'),
  startAttempt: async (assessmentId: string) => {
    // 1. Create the attempt
    const res = await apiInstance.post(`/evaluations/${assessmentId}/attempts`);
    const attemptId = res.data.id;
    // 2. Start the attempt to mark it as in_progress
    await apiInstance.post(`/attempts/${attemptId}/start`);
    // Return the created attempt
    return res;
  },
  submit: (attemptId: string, answers: object[]) =>
    apiInstance.post(`/attempts/${attemptId}/submit`, { answers }),
  grade: (attemptId: string, score: number, feedback: string) =>
    apiInstance.post(`/attempts/${attemptId}/grade`, { score, feedback }),
  getResults: (assessmentId: string) =>
    apiInstance.get(`/evaluations/${assessmentId}/results`),
};

export const adaptiveAPI = {
  getRecommendations: (studentId: string) =>
    apiInstance.get(`/recommendations/student/${studentId}`)
      .then(res => res.data.recommendations ?? res.data ?? []),
};

export const progressAPI = {
  getStudentProgress: (studentId: string) =>
    apiInstance.get(`/progress/student/${studentId}`),
};

export const notificationsAPI = {
  getStudentNotifications: (studentId: string) =>
    apiInstance.get(`/notifications/student/${studentId}`)
      .then(res => res.data.items ?? res.data.notifications ?? (Array.isArray(res.data) ? res.data : [])),
  markRead: (notificationId: string) =>
    apiInstance.put(`/notifications/${notificationId}/read`),
};

export const analyticsAPI = {
  getCourseProgress: (courseId: string) =>
    apiInstance.get(`/analytics/course/${courseId}`),
  getCourseDifficulties: (courseId: string) =>
    apiInstance.get(`/analytics/course/${courseId}`),
  getCourseStudents: (courseId: string) =>
    apiInstance.get(`/analytics/course/${courseId}/students`),
  getStudentReport: (studentId: string) =>
    apiInstance.get(`/analytics/course/${studentId}`),
};

export const collaborationAPI = {
  getForums: () =>
    apiInstance.get('/forums'),
  getForumPosts: (forumId: string) =>
    apiInstance.get(`/forums/${forumId}/posts`),
  createForum: (data: object) =>
    apiInstance.post('/forums', data),
  createForumPost: (forumId: string, data: object) =>
    apiInstance.post(`/forums/${forumId}/posts`, data),
  getStudyGroups: () =>
    apiInstance.get('/study-groups'),
  createStudyGroup: (data: object) =>
    apiInstance.post('/study-groups', data),
  getTutoring: () => apiInstance.get('/tutoring'),
  createTutoring: (data: object) =>
    apiInstance.post('/tutoring', data),
};

// ─── LEGACY NAMED API BRIDGE ───
export const api = {
  register: (data: any) => authAPI.register({ name: data.fullName, email: data.institutionalEmail, password: data.password, role: data.role, consentAccepted: true }).then(res => res.data),
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
  startAttempt: (evaluationId: string, _studentId: string, _courseId?: string) => assessmentsAPI.startAttempt(evaluationId).then(res => res.data),
  submitAttempt: (attemptId: string) => assessmentsAPI.submit(attemptId, []).then(res => res.data),
  gradeAttempt: (attemptId: string, score: number) => assessmentsAPI.grade(attemptId, score, '').then(res => res.data.attempt || res.data),
  getCourseProgress: (studentId: string, _courseId: string) => progressAPI.getStudentProgress(studentId).then(res => ({ item: res.data })),
  getStudentProgress: (studentId: string) => progressAPI.getStudentProgress(studentId).then(res => res.data),
  getRecommendations: (studentId: string) => adaptiveAPI.getRecommendations(studentId).then(data => data[0] || null),
  getCourseAnalytics: (courseId: string) => analyticsAPI.getCourseProgress(courseId).then(res => res.data),
  getCourseStudentsAnalytics: (courseId: string) => analyticsAPI.getCourseProgress(courseId).then(res => res.data),
  getForums: () => collaborationAPI.getForums().then(res => ({ items: res.data.forums ?? res.data ?? [] })),
  createForum: (data: any) => collaborationAPI.createForum(data).then(res => res.data),
  getForumPosts: (forumId: string) => collaborationAPI.getForumPosts(forumId).then(res => ({ items: res.data.posts ?? res.data ?? [] })),
  createForumPost: (forumId: string, data: any) => collaborationAPI.createForumPost(forumId, data).then(res => res.data),
  getStudyGroups: () => collaborationAPI.getStudyGroups().then(res => ({ items: res.data.groups ?? res.data ?? [] })),
  createStudyGroup: (data: any) => collaborationAPI.createStudyGroup(data).then(res => res.data),
  getTutoring: (_params?: any) => collaborationAPI.getTutoring().then(res => ({ items: res.data.sessions ?? res.data ?? [] })),
  createTutoring: (data: any) => collaborationAPI.createTutoring(data).then(res => res.data),
  updateTutoringStatus: (_id: string, _status: any) => collaborationAPI.getTutoring().then(res => res.data),
  listUsers: () => authAPI.listUsers().then(users => ({ items: users })),
  exportUserData: (userId: string) => authAPI.exportData(userId).then(res => res.data),
  deleteUserData: (userId: string) => authAPI.deleteAccount(userId).then(res => res.data),
  getNotifications: (userId: string) => notificationsAPI.getStudentNotifications(userId).then(notifications => ({ items: notifications })),
  markNotificationRead: (id: string) => notificationsAPI.markRead(id).then(res => res.data)
};

export default apiInstance;
