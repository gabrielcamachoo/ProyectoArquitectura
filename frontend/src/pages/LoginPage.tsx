import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch {
      setError('Credenciales inválidas. Verifique su correo institucional y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <p className="auth-tag">Pontificia Universidad Javeriana</p>
        <h2>Plataforma de Aprendizaje Adaptativo y Colaborativo</h2>
        <p>Experiencia unificada para estudiantes, docentes y administradores con motor adaptativo, analítica y colaboración en tiempo real.</p>
        <ul className="auth-features">
          <li>Recomendaciones personalizadas según desempeño</li>
          <li>Seguimiento de progreso y evaluaciones</li>
          <li>Foros, grupos de estudio y tutorías</li>
        </ul>
      </div>
      <Card title="Iniciar sesión" subtitle="Use su correo institucional">
        <form className="form-stack" onSubmit={onSubmit}>
          <Input label="Correo institucional" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" disabled={loading} className="btn-block">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
        <p className="auth-switch">
          ¿No tiene cuenta? <Link to="/register">Registrarse</Link>
        </p>
      </Card>
    </div>
  );
}
