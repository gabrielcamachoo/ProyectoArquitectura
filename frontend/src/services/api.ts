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
  create: (data: object) => apiInstance.post('/assessments', data),
  get: (id: string) => apiInstance.get(`/assessments/${id}`),
  startAttempt: (assessmentId: string) =>
    apiInstance.post(`/assessments/${assessmentId}/attempts`),
  submit: (attemptId: string, answers: object[]) =>
    apiInstance.post(`/attempts/${attemptId}/submit`, { answers }),
  grade: (attemptId: string, score: number, feedback: string) =>
    apiInstance.post(`/attempts/${attemptId}/grade`, { score, feedback }),
  getResults: (assessmentId: string) =>
    apiInstance.get(`/assessments/${assessmentId}/results`),
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
  getCourseProgress: (courseId: string) =>
    apiInstance.get(`/analytics/courses/${courseId}/progress`),
  getCourseDifficulties: (courseId: string) =>
    apiInstance.get(`/analytics/courses/${courseId}/difficulties`),
  getStudentReport: (studentId: string) =>
    apiInstance.get(`/analytics/students/${studentId}/report`),
};

export const collaborationAPI = {
  getForums: (courseId: string) =>
    apiInstance.get(`/forums/${courseId}/threads`),
  createThread: (courseId: string, data: object) =>
    apiInstance.post(`/forums/${courseId}/threads`, data),
  replyThread: (threadId: string, content: string) =>
    apiInstance.post(`/forums/${threadId}/replies`, { content }),
  requestTutoring: (data: object) =>
    apiInstance.post('/tutoring/request', data),
  getTutoring: () => apiInstance.get('/tutoring'),
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
  gradeAttempt: (attemptId: string, score: number) => assessmentsAPI.grade(attemptId, score, '').then(res => res.data),
  getCourseProgress: (studentId: string, _courseId: string) => progressAPI.getStudentProgress(studentId).then(res => ({ item: res.data })),
  getStudentProgress: (studentId: string) => progressAPI.getStudentProgress(studentId).then(res => res.data),
  getRecommendations: (studentId: string) => adaptiveAPI.getRecommendations(studentId).then(data => data[0] || null),
  getCourseAnalytics: (courseId: string) => analyticsAPI.getCourseProgress(courseId).then(res => res.data),
  getCourseStudentsAnalytics: (courseId: string) => analyticsAPI.getCourseProgress(courseId).then(res => res.data),
  getForums: () => collaborationAPI.getForums('').then(res => ({ items: res.data })),
  createForum: (data: any) => collaborationAPI.createThread(data.courseId, data).then(res => res.data),
  getForumPosts: (forumId: string) => collaborationAPI.getForums(forumId).then(res => ({ items: res.data })),
  createForumPost: (forumId: string, data: any) => collaborationAPI.replyThread(forumId, data.content).then(res => res.data),
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
