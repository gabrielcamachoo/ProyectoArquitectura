import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CoursesPage } from './pages/CoursesPage';
import { EvaluationsPage } from './pages/EvaluationsPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { CollaborationPage } from './pages/CollaborationPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TutoringPage } from './pages/TutoringPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { useAuth } from './hooks/useAuth';

function StudentRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'student') return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function TeacherRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role === 'student') return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="cursos" element={<CoursesPage />} />
        <Route path="evaluaciones" element={<EvaluationsPage />} />
        <Route
          path="recomendaciones"
          element={
            <StudentRoute>
              <RecommendationsPage />
            </StudentRoute>
          }
        />
        <Route path="colaboracion" element={<CollaborationPage />} />
        <Route path="tutorias" element={<TutoringPage />} />
        <Route path="privacidad" element={<PrivacyPage />} />
        <Route
          path="notificaciones"
          element={
            <StudentRoute>
              <NotificationsPage />
            </StudentRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <TeacherRoute>
              <AnalyticsPage />
            </TeacherRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
