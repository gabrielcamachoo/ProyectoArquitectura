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
    <div style={{ maxWidth: 420, margin: '60px auto', padding: 32,
      border: '1px solid #e5e7eb', borderRadius: 12, fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#1a56db' }}>🎓 PUJ Aprende</h1>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Crear Cuenta</h2>
      <form onSubmit={handleSubmit}>
        {(['name','email','password'] as const).map(field => (
          <div key={field} style={{ marginBottom: 16 }}>
            <label style={{ display:'block', marginBottom:4, fontWeight:500 }}>
              {field === 'name' ? 'Nombre completo' :
               field === 'email' ? 'Correo institucional' : 'Contraseña'}
            </label>
            <input
              type={field === 'password' ? 'password' :
                    field === 'email' ? 'email' : 'text'}
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              required
              style={{ width:'100%', padding:'10px 12px',
                border:'1px solid #d1d5db', borderRadius:6,
                fontSize:15, boxSizing:'border-box' }} />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display:'block', marginBottom:4, fontWeight:500 }}>
            Rol
          </label>
          <select value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            style={{ width:'100%', padding:'10px 12px',
              border:'1px solid #d1d5db', borderRadius:6, fontSize:15 }}>
            <option value="student">Estudiante</option>
            <option value="teacher">Profesor</option>
          </select>
        </div>
        <div style={{ marginBottom: 16, display:'flex', gap:8,
          alignItems:'flex-start' }}>
          <input type="checkbox" id="consent"
            checked={form.consent_accepted}
            onChange={e => setForm(f =>
              ({ ...f, consent_accepted: e.target.checked }))}
            style={{ marginTop: 3 }} />
          <label htmlFor="consent" style={{ fontSize:13, color:'#374151' }}>
            Acepto el tratamiento de mis datos personales conforme a la
            <strong> Ley 1581 de 2012</strong> (Protección de Datos Personales)
          </label>
        </div>
        {error && (
          <div style={{ padding:10, backgroundColor:'#fef2f2',
            border:'1px solid #fca5a5', borderRadius:6,
            color:'#dc2626', marginBottom:16, fontSize:14 }}>
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} style={{
          width:'100%', padding:12, backgroundColor:'#1a56db',
          color:'white', border:'none', borderRadius:6,
          fontSize:16, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>
      <p style={{ textAlign:'center', marginTop:16 }}>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  );
}
