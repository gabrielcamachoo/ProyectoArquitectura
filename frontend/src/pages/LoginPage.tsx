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
      setError(err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: 32,
      border: '1px solid #e5e7eb', borderRadius: 12, fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#1a56db' }}>🎓 PUJ Aprende</h1>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
            Correo institucional
          </label>
          <input type="email" value={email}
            onChange={e => setEmail(e.target.value)} required
            style={{ width: '100%', padding: '10px 12px',
              border: '1px solid #d1d5db', borderRadius: 6,
              fontSize: 15, boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
            Contraseña
          </label>
          <input type="password" value={password}
            onChange={e => setPassword(e.target.value)} required
            style={{ width: '100%', padding: '10px 12px',
              border: '1px solid #d1d5db', borderRadius: 6,
              fontSize: 15, boxSizing: 'border-box' }} />
        </div>
        {error && (
          <div style={{ padding: 10, backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5', borderRadius: 6,
            color: '#dc2626', marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} style={{
          width: '100%', padding: 12, backgroundColor: '#1a56db',
          color: 'white', border: 'none', borderRadius: 6,
          fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1, fontWeight: 'bold' }}>
          {loading ? 'Iniciando sesión...' : 'Ingresar'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16 }}>
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </div>
  );
}
