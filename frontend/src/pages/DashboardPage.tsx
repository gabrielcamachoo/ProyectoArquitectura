import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';

const SEED_COURSE = '00000000-0000-4000-8000-000000000001';

export function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [analytics, setAnalytics] = useState<{ completionRate?: number; activeStudents?: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        if (user.role === 'student') {
          const [prog, notifs] = await Promise.all([
            api.getStudentProgress(user.id).catch(() => ({ overallPercentage: 0, items: [] })),
            api.getNotifications(user.id).catch(() => ({ items: [] }))
          ]);
          setProgress(prog.overallPercentage ?? 0);
          setNotifCount(notifs.items?.filter((n: any) => !n.read).length ?? 0);
        } else {
          const dash = await api.getCourseAnalytics(SEED_COURSE).catch(() => null);
          setAnalytics(dash);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <Spinner />;

  if (user?.role === 'student') {
    return (
      <div className="page-grid">
        <section className="hero-banner">
          <div>
            <Badge tone="info">Estudiante</Badge>
            <h2>Tu ruta de aprendizaje</h2>
            <p>Explora cursos, completa evaluaciones y recibe recomendaciones adaptadas a tu desempeño.</p>
          </div>
          <div className="hero-actions">
            <Link to="/app/cursos" className="btn btn-primary">
              Ver cursos
            </Link>
            <Link to="/app/recomendaciones" className="btn btn-secondary">
              Mis recomendaciones
            </Link>
          </div>
        </section>
        <div className="stats-row">
          <StatCard label="Progreso general" value={`${progress}%`} hint="Promedio en tus cursos" icon="📈" />
          <StatCard label="Notificaciones" value={notifCount} hint="Sin leer" icon="🔔" />
          <StatCard label="Motor adaptativo" value="Activo" hint="Basado en evaluaciones" icon="✨" />
        </div>
        <Card title="Accesos rápidos">
          <div className="quick-links">
            <Link to="/app/evaluaciones">📝 Evaluaciones pendientes</Link>
            <Link to="/app/colaboracion">💬 Foros y grupos</Link>
            <Link to="/app/notificaciones">🔔 Centro de notificaciones</Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-grid">
      <section className="hero-banner teacher">
        <div>
          <Badge tone="success">{user?.role === 'admin' ? 'Administrador' : 'Docente'}</Badge>
          <h2>Panel de gestión académica</h2>
          <p>Monitoree el desempeño del curso, gestione evaluaciones y acompañe a sus estudiantes.</p>
        </div>
        <Link to="/app/analytics" className="btn btn-primary">
          Ver analítica
        </Link>
      </section>
      <div className="stats-row">
        <StatCard label="Estudiantes activos" value={analytics?.activeStudents ?? '—'} icon="👥" />
        <StatCard label="Tasa de finalización" value={`${analytics?.completionRate ?? 0}%`} icon="✅" />
        <StatCard label="Curso principal" value="Arquitectura de Software" icon="📚" />
      </div>
      <Card title="Tareas frecuentes">
        <div className="quick-links">
          <Link to="/app/cursos">📚 Gestionar cursos y módulos</Link>
          <Link to="/app/evaluaciones">📝 Crear y calificar evaluaciones</Link>
          <Link to="/app/colaboracion">💬 Moderar foros</Link>
        </div>
      </Card>
    </div>
  );
}
