import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'student', consentAccepted: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consentAccepted) {
      setError('Debes aceptar el tratamiento de datos personales (Ley 1581)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authAPI.register(form);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card-modern" style={{ maxWidth: '540px' }}>
        <h1 className="auth-title">Pontificia Universidad Javeriana</h1>
        <p className="auth-subtitle">Crea tu cuenta para comenzar a aprender</p>
        
        <form onSubmit={handleSubmit}>
          {([
            { key: 'name', label: 'Nombre completo', type: 'text', placeholder: 'Ej. Juan Pérez' },
            { key: 'email', label: 'Correo institucional', type: 'email', placeholder: 'juan@institucion.edu' },
            { key: 'password', label: 'Contraseña', type: 'password', placeholder: '••••••••' }
          ] as const).map(field => (
            <div key={field.key} className="auth-field-modern">
              <label className="auth-label-modern">{field.label}</label>
              <input
                type={field.type}
                value={form[field.key as keyof typeof form] as string}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                required
                className="auth-input-modern" placeholder={field.placeholder} />
            </div>
          ))}
          
          <div className="auth-field-modern">
            <label className="auth-label-modern">Rol</label>
            <select value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="auth-input-modern" style={{ cursor: 'pointer' }}>
              <option value="student">Estudiante</option>
              <option value="teacher">Profesor</option>
            </select>
          </div>
          
          <div style={{ display:'flex', gap:'12px', alignItems:'flex-start', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
            <input type="checkbox" id="consent"
              checked={form.consentAccepted}
              onChange={e => setForm(f => ({ ...f, consentAccepted: e.target.checked }))}
              style={{ marginTop: '4px', cursor: 'pointer', accentColor: '#fbbc04', width: '18px', height: '18px' }} />
            <label htmlFor="consent" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', lineHeight: '1.5' }}>
              Acepto el tratamiento de mis datos personales conforme a la
              <strong style={{ color: '#fff' }}> Ley 1581 de 2012</strong> (Protección de Datos Personales)
            </label>
          </div>
          
          {error && (
            <div style={{ background: 'rgba(255, 0, 0, 0.2)', color: '#ffb3b3', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem', border: '1px solid rgba(255,0,0,0.3)' }}>
              {error}
            </div>
          )}
          
          <button type="submit" disabled={loading} className="auth-btn-modern">
            {loading ? 'Creando cuenta...' : 'Unirse a la Plataforma'}
          </button>
        </form>
        
        <div className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login" className="auth-link-modern">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
