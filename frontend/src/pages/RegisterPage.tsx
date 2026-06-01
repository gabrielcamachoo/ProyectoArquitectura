import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'student', consent_accepted: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consent_accepted) {
      setError('Debes aceptar el tratamiento de datos personales (Ley 1581)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authAPI.register(form);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="card" style={{ maxWidth: 450, width: '100%', padding: '40px 32px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', background: 'var(--surface)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: 'var(--info)', fontSize: '24px', fontWeight: '500', marginBottom: '8px' }}>Google-like Platform</h1>
          <h2 style={{ fontSize: '28px', fontWeight: '400', color: 'var(--text)' }}>Crear Cuenta</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '8px' }}>Únete para comenzar a aprender</p>
        </div>
        <form onSubmit={handleSubmit} className="form-stack">
          {(['name','email','password'] as const).map(field => (
            <div key={field} className="field">
              <label className="field-label">
                {field === 'name' ? 'Nombre completo' :
                 field === 'email' ? 'Correo institucional' : 'Contraseña'}
              </label>
              <input
                type={field === 'password' ? 'password' :
                      field === 'email' ? 'email' : 'text'}
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                required
                className="field-input" placeholder={field === 'name' ? 'Ej. Juan Pérez' : field === 'email' ? 'juan@institucion.edu' : '••••••••'} />
            </div>
          ))}
          <div className="field">
            <label className="field-label">Rol</label>
            <select value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="field-input">
              <option value="student">Estudiante</option>
              <option value="teacher">Profesor</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'flex-start', background: 'var(--bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <input type="checkbox" id="consent"
              checked={form.consent_accepted}
              onChange={e => setForm(f =>
                ({ ...f, consent_accepted: e.target.checked }))}
              style={{ marginTop: 3, cursor: 'pointer' }} />
            <label htmlFor="consent" style={{ fontSize:13, color:'var(--text-muted)', cursor: 'pointer', lineHeight: '1.4' }}>
              Acepto el tratamiento de mis datos personales conforme a la
              <strong> Ley 1581 de 2012</strong> (Protección de Datos Personales)
            </label>
          </div>
          {error && (
            <div className="form-error" style={{ padding: '10px 12px', background: '#fce8e6', color: 'var(--danger)', borderRadius: '4px' }}>
              {error}
            </div>
          )}
          <div style={{ marginTop: '16px' }}>
            <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg" style={{ background: 'var(--info)', color: 'white', borderRadius: '4px', fontWeight: '500' }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </div>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--info)', fontWeight: '500' }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
