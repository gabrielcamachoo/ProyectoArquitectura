import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

const navByRole: Record<string, { to: string; label: string; icon: string }[]> = {
  student: [
    { to: '/app', label: 'Inicio', icon: '🏠' },
    { to: '/app/cursos', label: 'Cursos', icon: '📚' },
    { to: '/app/evaluaciones', label: 'Evaluaciones', icon: '📝' },
    { to: '/app/recomendaciones', label: 'Recomendaciones', icon: '✨' },
    { to: '/app/colaboracion', label: 'Colaboración', icon: '💬' },
    { to: '/app/tutorias', label: 'Tutorías', icon: '🎓' },
    { to: '/app/notificaciones', label: 'Notificaciones', icon: '🔔' },
    { to: '/app/privacidad', label: 'Mis datos (Ley 1581)', icon: '🔒' }
  ],
  teacher: [
    { to: '/app', label: 'Panel docente', icon: '📊' },
    { to: '/app/cursos', label: 'Mis cursos', icon: '📚' },
    { to: '/app/evaluaciones', label: 'Evaluaciones', icon: '📝' },
    { to: '/app/analytics', label: 'Analítica', icon: '📈' },
    { to: '/app/colaboracion', label: 'Foros', icon: '💬' },
    { to: '/app/tutorias', label: 'Tutorías', icon: '🎓' },
    { to: '/app/privacidad', label: 'Mis datos', icon: '🔒' }
  ],
  admin: [
    { to: '/app', label: 'Administración', icon: '⚙️' },
    { to: '/app/cursos', label: 'Cursos', icon: '📚' },
    { to: '/app/analytics', label: 'Analítica global', icon: '📈' },
    { to: '/app/tutorias', label: 'Tutorías', icon: '🎓' },
    { to: '/app/privacidad', label: 'Ley 1581 / usuarios', icon: '🔒' }
  ]
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = navByRole[user?.role ?? 'student'] ?? navByRole.student;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">JA</span>
          <div>
            <strong>Aprendizaje Adaptativo</strong>
            <small>Pontificia Universidad Javeriana</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/app'} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p className="user-name">{user?.fullName}</p>
          <BadgeRole role={user?.role} />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <h1>Bienvenido, {user?.fullName?.split(' ')[0]}</h1>
          <span className="topbar-meta">Proyecto AS2026-10 · Grupo 2</span>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function BadgeRole({ role }: { role?: string }) {
  const labels: Record<string, string> = { student: 'Estudiante', teacher: 'Docente', admin: 'Administrador' };
  return <span className={`role-pill role-${role}`}>{labels[role ?? ''] ?? role}</span>;
}
