import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="card" style={{ maxWidth: 450, width: '100%', padding: '40px 32px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', background: 'var(--surface)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: 'var(--info)', fontSize: '24px', fontWeight: '500', marginBottom: '8px' }}>Google-like Platform</h1>
          <h2 style={{ fontSize: '28px', fontWeight: '400', color: 'var(--text)' }}>Iniciar sesión</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '8px' }}>Ingresa con tu cuenta institucional</p>
        </div>
        
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="field">
            <label className="field-label">Correo institucional</label>
            <input type="email" value={email}
              onChange={e => setEmail(e.target.value)} required
              className="field-input" placeholder="tu.correo@institucion.edu" />
          </div>
          
          <div className="field">
            <label className="field-label">Contraseña</label>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)} required
              className="field-input" placeholder="••••••••" />
          </div>
          
          {error && (
            <div className="form-error" style={{ padding: '10px 12px', background: '#fce8e6', color: 'var(--danger)', borderRadius: '4px' }}>
              {error}
            </div>
          )}
          
          <div style={{ marginTop: '16px' }}>
            <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg" style={{ background: 'var(--info)', color: 'white', borderRadius: '4px', fontWeight: '500' }}>
              {loading ? 'Iniciando sesión...' : 'Siguiente'}
            </button>
          </div>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          ¿No tienes cuenta? <Link to="/register" style={{ color: 'var(--info)', fontWeight: '500' }}>Crear cuenta</Link>
        </p>
      </div>
    </div>
  );
}
