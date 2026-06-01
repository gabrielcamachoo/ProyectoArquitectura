import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();

  return (
    <div style={{ padding: 40, maxWidth: 900, fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <span style={{ backgroundColor: '#16a34a', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold' }}>PROFESOR</span>
        <h2 style={{ color: '#14532d', margin: '12px 0 8px 0' }}>¡Bienvenido de vuelta, {user?.name}!</h2>
        <p style={{ color: '#166534', margin: 0 }}>Monitoree el desempeño académico, gestione evaluaciones y acompañe a sus estudiantes.</p>
        <div style={{ marginTop: 16 }}>
          <Link to="/app/teacher/analytics" style={{ textDecoration: 'none', backgroundColor: '#16a34a', color: 'white', padding: '10px 16px', borderRadius: 6, fontWeight: 'bold' }}>Ver Analíticas</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <span style={{ fontSize: 24 }}>👥</span>
          <h3 style={{ margin: '8px 0 4px 0', fontSize: 18 }}>Estudiantes Activos</h3>
          <p style={{ fontSize: 24, fontWeight: 'bold', margin: '4px 0' }}>—</p>
          <span style={{ color: '#6b7280', fontSize: 12 }}>Total inscritos</span>
        </div>
        <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <span style={{ fontSize: 24 }}>✅</span>
          <h3 style={{ margin: '8px 0 4px 0', fontSize: 18 }}>Tasa de Finalización</h3>
          <p style={{ fontSize: 24, fontWeight: 'bold', margin: '4px 0' }}>0%</p>
          <span style={{ color: '#6b7280', fontSize: 12 }}>Promedio global</span>
        </div>
        <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <span style={{ fontSize: 24 }}>📚</span>
          <h3 style={{ margin: '8px 0 4px 0', fontSize: 18 }}>Curso Principal</h3>
          <p style={{ fontSize: 20, fontWeight: 'bold', margin: '8px 0 4px 0' }}>Arquitectura</p>
          <span style={{ color: '#6b7280', fontSize: 12 }}>Servicio activo</span>
        </div>
      </div>

      <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Tareas Frecuentes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link to="/app/teacher/courses" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 500 }}>📚 Gestionar cursos y módulos</Link>
          <Link to="/app/teacher/create-evaluation" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 500 }}>📝 Crear y programar evaluaciones</Link>
          <Link to="/app/teacher/grading" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 500 }}>✅ Calificar intentos (Motor Adaptativo)</Link>
        </div>
      </div>
    </div>
  );
}
