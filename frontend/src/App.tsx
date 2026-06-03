import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// ─── Páginas públicas ───
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProjectPage from './pages/ProjectPage';

// ─── Páginas estudiante ───
import StudentDashboard from './pages/student/Dashboard';
import CoursesPage from './pages/student/CoursesPage';
import EvaluationsPage from './pages/student/EvaluationsPage';
import RecommendationsPage from './pages/student/RecommendationsPage';
import ProgressPage from './pages/student/ProgressPage';
import NotificationsPage from './pages/student/NotificationsPage';
import StudentCollaborationPage from './pages/student/CollaborationPage';
import TutoringPage from './pages/student/TutoringPage';

// ─── Páginas profesor ───
import TeacherDashboard from './pages/teacher/Dashboard';
import ManageCoursesPage from './pages/teacher/ManageCoursesPage';
import CreateEvaluationPage from './pages/teacher/CreateEvaluationPage';
import GradingPage from './pages/teacher/GradingPage';
import TeacherAnalyticsPage from './pages/teacher/AnalyticsPage';

// ─── Páginas admin ───
import AdminDashboard from './pages/admin/Dashboard';
import UsersPage from './pages/admin/UsersPage';
import { PrivacyPage } from './pages/PrivacyPage';

// ─── Páginas compartidas ───
import { CollaborationPage } from './pages/CollaborationPage';

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return (
    <div style={{ display:'flex', justifyContent:'center',
      alignItems:'center', height:'100vh', fontFamily: 'sans-serif' }}>
      Cargando...
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
        <h2>⛔ Acceso denegado</h2>
        <p>No tienes permisos para ver esta sección.</p>
        <a href="/">Volver al inicio</a>
      </div>
    );
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'teacher') return <Navigate to="/app/teacher" replace />;
  if (user?.role === 'admin') return <Navigate to="/app/admin" replace />;
  return <Navigate to="/app/student" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProjectPage />} />

      <Route path="/app" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<RootRedirect />} />
        <Route path="student" element={<StudentDashboard />} />
        <Route path="student/courses" element={<CoursesPage />} />
        <Route path="student/evaluaciones" element={<EvaluationsPage />} />
        <Route path="student/recommendations" element={<RecommendationsPage />} />
        <Route path="student/progress" element={<ProgressPage />} />
        <Route path="student/notifications" element={<NotificationsPage />} />
        <Route path="student/collaboration" element={<StudentCollaborationPage />} />
        <Route path="student/tutoring" element={<TutoringPage />} />

        <Route path="teacher" element={<TeacherDashboard />} />
        <Route path="teacher/courses" element={<ManageCoursesPage />} />
        <Route path="teacher/create-evaluation" element={<CreateEvaluationPage />} />
        <Route path="teacher/grading" element={<GradingPage />} />
        <Route path="teacher/analytics" element={<TeacherAnalyticsPage />} />

        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/users" element={<UsersPage />} />
        <Route path="admin/privacy" element={<PrivacyPage />} />

        <Route path="colaboracion" element={<CollaborationPage />} />
        <Route path="tutorias" element={<TutoringPage />} />
        <Route path="analytics" element={<TeacherAnalyticsPage />} />
        <Route path="privacidad" element={<PrivacyPage />} />

        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
