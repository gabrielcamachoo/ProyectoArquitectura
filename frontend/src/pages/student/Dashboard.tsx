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
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Cargando panel...</div>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 900, fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <span style={{ backgroundColor: '#1d4ed8', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold' }}>ESTUDIANTE</span>
        <h2 style={{ color: '#1e3a8a', margin: '12px 0 8px 0' }}>¡Hola, {user?.name}!</h2>
        <p style={{ color: '#1e40af', margin: 0 }}>Explora cursos, completa evaluaciones y recibe recomendaciones adaptadas a tu desempeño.</p>
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <Link to="/app/student/courses" style={{ textDecoration: 'none', backgroundColor: '#1a56db', color: 'white', padding: '10px 16px', borderRadius: 6, fontWeight: 'bold' }}>Ver Cursos</Link>
          <Link to="/app/student/recommendations" style={{ textDecoration: 'none', backgroundColor: 'white', color: '#1a56db', border: '1px solid #1a56db', padding: '10px 16px', borderRadius: 6, fontWeight: 'bold' }}>Mis Recomendaciones</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <span style={{ fontSize: 24 }}>📈</span>
          <h3 style={{ margin: '8px 0 4px 0', fontSize: 18 }}>Progreso General</h3>
          <p style={{ fontSize: 24, fontWeight: 'bold', margin: '4px 0' }}>{progress}%</p>
          <span style={{ color: '#6b7280', fontSize: 12 }}>Promedio en tus cursos</span>
        </div>
        <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <span style={{ fontSize: 24 }}>🔔</span>
          <h3 style={{ margin: '8px 0 4px 0', fontSize: 18 }}>Notificaciones</h3>
          <p style={{ fontSize: 24, fontWeight: 'bold', margin: '4px 0' }}>{notifCount}</p>
          <span style={{ color: '#6b7280', fontSize: 12 }}>Sin leer actualmente</span>
        </div>
        <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <span style={{ fontSize: 24 }}>✨</span>
          <h3 style={{ margin: '8px 0 4px 0', fontSize: 18 }}>Motor Adaptativo</h3>
          <p style={{ fontSize: 24, fontWeight: 'bold', margin: '4px 0', color: '#16a34a' }}>Activo</p>
          <span style={{ color: '#6b7280', fontSize: 12 }}>Personalización activa</span>
        </div>
      </div>

      <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Accesos Rápidos</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link to="/app/student/evaluations" style={{ color: '#1a56db', textDecoration: 'none', fontWeight: 500 }}>📝 Evaluaciones pendientes</Link>
          <Link to="/app/student/collaboration" style={{ color: '#1a56db', textDecoration: 'none', fontWeight: 500 }}>💬 Foros y grupos de estudio</Link>
          <Link to="/app/student/notifications" style={{ color: '#1a56db', textDecoration: 'none', fontWeight: 500 }}>🔔 Centro de notificaciones</Link>
          <Link to="/app/student/tutoring" style={{ color: '#1a56db', textDecoration: 'none', fontWeight: 500 }}>👥 Solicitar tutorías académicas</Link>
        </div>
      </div>
    </div>
  );
}
