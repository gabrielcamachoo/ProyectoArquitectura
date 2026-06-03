import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { TutoringSession } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';

const SEED_COURSE = '00000000-0000-4000-8000-000000000001';

const statusTone: Record<string, 'info' | 'success' | 'neutral' | 'danger'> = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'danger'
};

export function TutoringPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TutoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [tuteeId, setTuteeId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!user) return;
    const res = await api.getTutoring({ userId: user.id });
    setSessions(res.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const schedule = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setMessage('');
    try {
      await api.createTutoring(
        user.role === 'teacher' || user.role === 'admin'
          ? {
              tutorId: user.id,
              tuteeId,
              courseId: SEED_COURSE,
              scheduledAt: scheduledAt || new Date().toISOString()
            }
          : {
              tutorId: tuteeId,
              tuteeId: user.id,
              courseId: SEED_COURSE,
              scheduledAt: scheduledAt || new Date().toISOString()
            }
      );
      setMessage('Tutoría agendada correctamente.');
      setTuteeId('');
      setScheduledAt('');
      await load();
    } catch {
      setMessage('No se pudo agendar la tutoría.');
    }
  };

  const setStatus = async (id: string, status: TutoringSession['status']) => {
    await api.updateTutoringStatus(id, status);
    await load();
  };

  if (loading) return <Spinner />;

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  return (
    <div className="page-grid">
      <section className="hero-banner compact">
        <h2>Tutorías entre pares</h2>
        <p>Agende sesiones de apoyo académico vinculadas al curso de Arquitectura de Software.</p>
      </section>

      <Card title={isTeacher ? 'Agendar tutoría (como tutor)' : 'Solicitar tutoría'}>
        <form className="form-stack" onSubmit={schedule}>
          {isTeacher ? (
            <Input
              label="ID del estudiante (tutelado)"
              value={tuteeId}
              onChange={(e) => setTuteeId(e.target.value)}
              required
              hint="Copie el ID desde el panel de administración o del listado de usuarios"
            />
          ) : (
            <Input
              label="ID del docente / tutor"
              value={tuteeId}
              onChange={(e) => setTuteeId(e.target.value)}
              required
              hint="Solicite el identificador a su docente"
            />
          )}
          <Input
            label="Fecha y hora"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <Button type="submit">{isTeacher ? 'Confirmar sesión' : 'Solicitar tutoría'}</Button>
          {message && <p className={message.includes('correctamente') ? 'form-success' : 'form-error'}>{message}</p>}
        </form>
      </Card>

      <Card title="Mis sesiones" subtitle={`${sessions.length} registro(s)`}>
        {sessions.length === 0 ? (
          <p className="muted">No hay tutorías programadas.</p>
        ) : (
          <div className="list-stack">
            {sessions.map((s) => (
              <div key={s.id} className="list-item static">
                <div>
                  <strong>
                    {isTeacher ? `Estudiante: ${s.tuteeId.slice(0, 8)}…` : `Tutor: ${s.tutorId.slice(0, 8)}…`}
                  </strong>
                  <p>{new Date(s.scheduledAt).toLocaleString('es-CO')}</p>
                </div>
                <div className="btn-row">
                  <Badge tone={statusTone[s.status]}>{s.status}</Badge>
                  {s.status === 'scheduled' && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => setStatus(s.id, 'completed')}>
                        Completar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(s.id, 'cancelled')}>
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
