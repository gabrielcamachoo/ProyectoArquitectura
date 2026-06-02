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
      navigate('/app');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card-modern">
        <h1 className="auth-title">Google-like Platform</h1>
        <p className="auth-subtitle">Inicia sesión con tu cuenta institucional</p>
        
        <form onSubmit={handleSubmit}>
          <div className="auth-field-modern">
            <label className="auth-label-modern">Correo institucional</label>
            <input type="email" value={email}
              onChange={e => setEmail(e.target.value)} required
              className="auth-input-modern" placeholder="tu.correo@institucion.edu" />
          </div>
          
          <div className="auth-field-modern">
            <label className="auth-label-modern">Contraseña</label>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)} required
              className="auth-input-modern" placeholder="••••••••" />
          </div>
          
          {error && (
            <div style={{ background: 'rgba(255, 0, 0, 0.2)', color: '#ffb3b3', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem', border: '1px solid rgba(255,0,0,0.3)' }}>
              {error}
            </div>
          )}
          
          <button type="submit" disabled={loading} className="auth-btn-modern">
            {loading ? 'Verificando...' : 'Entrar al Ecosistema'}
          </button>
        </form>
        
        <div className="auth-footer">
          ¿No tienes cuenta? <Link to="/register" className="auth-link-modern">Crear cuenta</Link>
        </div>
      </div>
    </div>
  );
}
