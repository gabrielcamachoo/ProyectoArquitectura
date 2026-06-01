import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// ─── Páginas públicas ───
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// ─── Páginas estudiante ───
import StudentDashboard from './pages/student/Dashboard';
import CoursesPage from './pages/student/CoursesPage';
import EvaluationsPage from './pages/student/EvaluationsPage';
import RecommendationsPage from './pages/student/RecommendationsPage';
import ProgressPage from './pages/student/ProgressPage';
import NotificationsPage from './pages/student/NotificationsPage';
import CollaborationPage from './pages/student/CollaborationPage';
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
import PrivacyPage from './pages/admin/PrivacyPage';

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
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<RootRedirect />} />

      {/* ── ESTUDIANTE ── */}
      <Route path="/app/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/app/student/courses" element={
        <ProtectedRoute allowedRoles={['student']}>
          <CoursesPage />
        </ProtectedRoute>
      } />
      <Route path="/app/student/evaluaciones" element={
        <ProtectedRoute allowedRoles={['student']}>
          <EvaluationsPage />
        </ProtectedRoute>
      } />
      <Route path="/app/student/recommendations" element={
        <ProtectedRoute allowedRoles={['student']}>
          <RecommendationsPage />
        </ProtectedRoute>
      } />
      <Route path="/app/student/progress" element={
        <ProtectedRoute allowedRoles={['student']}>
          <ProgressPage />
        </ProtectedRoute>
      } />
      <Route path="/app/student/notifications" element={
        <ProtectedRoute allowedRoles={['student']}>
          <NotificationsPage />
        </ProtectedRoute>
      } />
      <Route path="/app/student/collaboration" element={
        <ProtectedRoute allowedRoles={['student']}>
          <CollaborationPage />
        </ProtectedRoute>
      } />
      <Route path="/app/student/tutoring" element={
        <ProtectedRoute allowedRoles={['student']}>
          <TutoringPage />
        </ProtectedRoute>
      } />

      {/* ── PROFESOR ── */}
      <Route path="/app/teacher" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherDashboard />
        </ProtectedRoute>
      } />
      <Route path="/app/teacher/courses" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <ManageCoursesPage />
        </ProtectedRoute>
      } />
      <Route path="/app/teacher/create-evaluation" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <CreateEvaluationPage />
        </ProtectedRoute>
      } />
      <Route path="/app/teacher/grading" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <GradingPage />
        </ProtectedRoute>
      } />
      <Route path="/app/teacher/analytics" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherAnalyticsPage />
        </ProtectedRoute>
      } />

      {/* ── ADMIN ── */}
      <Route path="/app/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/app/admin/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <UsersPage />
        </ProtectedRoute>
      } />
      <Route path="/app/admin/privacy" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <PrivacyPage />
        </ProtectedRoute>
      } />

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
