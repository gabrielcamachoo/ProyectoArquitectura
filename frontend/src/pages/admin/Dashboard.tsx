import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div style={{ padding: 40, maxWidth: 900, fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <span style={{ backgroundColor: '#db2777', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold' }}>ADMINISTRADOR</span>
        <h2 style={{ color: '#831843', margin: '12px 0 8px 0' }}>¡Bienvenido de vuelta, {user?.name}!</h2>
        <p style={{ color: '#9d174d', margin: 0 }}>Gestione la privacidad de los usuarios, administre credenciales y cumpla con el marco legal Ley 1581.</p>
      </div>

      <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Panel de Control</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link to="/app/admin/users" style={{ color: '#db2777', textDecoration: 'none', fontWeight: 500 }}>👥 Administrar usuarios de la plataforma</Link>
          <Link to="/app/admin/privacy" style={{ color: '#db2777', textDecoration: 'none', fontWeight: 500 }}>🛡️ Gestión de Privacidad y Consentimiento (Ley 1581)</Link>
        </div>
      </div>
    </div>
  );
}
