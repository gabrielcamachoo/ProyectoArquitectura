import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { progressAPI, notificationsAPI } from '../../services/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const [progRes, notifsRes] = await Promise.all([
          progressAPI.getStudentProgress(user.id).catch(() => ({ data: { overallPercentage: 0 } })),
          notificationsAPI.getStudentNotifications(user.id).catch(() => [])
        ]);
        setProgress(progRes.data?.overallPercentage ?? 0);
        setNotifCount(notifsRes?.filter((n: any) => !n.read).length ?? 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>Cargando panel...</div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="hero-banner" style={{ background: 'linear-gradient(135deg, var(--info) 0%, var(--ja-blue-light) 100%)', marginBottom: '24px' }}>
        <div>
          <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>ESTUDIANTE</span>
          <h2 style={{ margin: '12px 0 8px 0', fontSize: '28px', fontWeight: '500' }}>¡Hola, {user?.name}!</h2>
          <p style={{ margin: 0, fontSize: '16px' }}>Explora cursos, completa evaluaciones y recibe recomendaciones adaptadas a tu desempeño.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/app/student/courses" className="btn" style={{ textDecoration: 'none', backgroundColor: 'var(--surface)', color: 'var(--info)', padding: '10px 16px', borderRadius: '4px', fontWeight: '500' }}>Ver Cursos</Link>
          <Link to="/app/student/recommendations" className="btn" style={{ textDecoration: 'none', backgroundColor: 'transparent', border: '1px solid white', color: 'white', padding: '10px 16px', borderRadius: '4px', fontWeight: '500' }}>Mis Recomendaciones</Link>
        </div>
      </div>

      <div className="cards-grid" style={{ marginBottom: '24px' }}>
        <div className="card card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ fontSize: '32px', background: 'var(--bg)', padding: '12px', borderRadius: '50%' }}>📈</div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-muted)' }}>Progreso General</h3>
            <p style={{ fontSize: '28px', fontWeight: '500', margin: '0 0 4px 0', color: 'var(--text)' }}>{progress}%</p>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Promedio en tus cursos</span>
          </div>
        </div>
        <div className="card card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ fontSize: '32px', background: 'var(--bg)', padding: '12px', borderRadius: '50%' }}>🔔</div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-muted)' }}>Notificaciones</h3>
            <p style={{ fontSize: '28px', fontWeight: '500', margin: '0 0 4px 0', color: 'var(--text)' }}>{notifCount}</p>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sin leer actualmente</span>
          </div>
        </div>
        <div className="card card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ fontSize: '32px', background: 'var(--bg)', padding: '12px', borderRadius: '50%' }}>✨</div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-muted)' }}>Motor Adaptativo</h3>
            <p style={{ fontSize: '28px', fontWeight: '500', margin: '0 0 4px 0', color: 'var(--success)' }}>Activo</p>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Personalización activa</span>
          </div>
        </div>
      </div>

      <div className="card card-body">
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '500' }}>Accesos Rápidos</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link to="/app/student/evaluations" style={{ color: 'var(--info)', textDecoration: 'none', fontWeight: 500, padding: '8px 12px', borderRadius: '4px', background: 'var(--bg)' }}>📝 Evaluaciones pendientes</Link>
          <Link to="/app/student/collaboration" style={{ color: 'var(--info)', textDecoration: 'none', fontWeight: 500, padding: '8px 12px', borderRadius: '4px', background: 'var(--bg)' }}>💬 Foros y grupos de estudio</Link>
          <Link to="/app/student/notifications" style={{ color: 'var(--info)', textDecoration: 'none', fontWeight: 500, padding: '8px 12px', borderRadius: '4px', background: 'var(--bg)' }}>🔔 Centro de notificaciones</Link>
          <Link to="/app/student/tutoring" style={{ color: 'var(--info)', textDecoration: 'none', fontWeight: 500, padding: '8px 12px', borderRadius: '4px', background: 'var(--bg)' }}>👥 Solicitar tutorías académicas</Link>
        </div>
      </div>
    </div>
  );
}
