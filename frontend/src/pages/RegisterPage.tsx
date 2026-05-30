import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ fullName, email, password, role });
      navigate('/app');
    } catch (err) {
      setError((err as Error).message === 'email_exists' ? 'Este correo ya está registrado.' : 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <p className="auth-tag">Crear cuenta</p>
        <h2>Únase a la plataforma académica</h2>
        <p>Regístrese como estudiante, docente o administrador para acceder a cursos, evaluaciones y herramientas colaborativas.</p>
      </div>
      <Card title="Registro" subtitle="Datos básicos de acceso">
        <form className="form-stack" onSubmit={onSubmit}>
          <Input label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input label="Correo institucional" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} hint="Mínimo 8 caracteres" />
          <label className="field">
            <span className="field-label">Rol</span>
            <select className="field-input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="student">Estudiante</option>
              <option value="teacher">Docente</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" disabled={loading} className="btn-block">
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </Button>
        </form>
        <p className="auth-switch">
          ¿Ya tiene cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </Card>
    </div>
  );
}
