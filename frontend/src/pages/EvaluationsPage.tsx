import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { Attempt, Evaluation } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';

const SEED_COURSE = '00000000-0000-4000-8000-000000000001';

export function EvaluationsPage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [attempts, setAttempts] = useState<Record<string, Attempt>>({});
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [gradeScore, setGradeScore] = useState('75');

  const load = async () => {
    const res = await api.getEvaluations();
    setEvaluations(res.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startAttempt = async (ev: Evaluation) => {
    if (!user) return;
    const attempt = await api.startAttempt(ev.id, user.id, ev.courseId || SEED_COURSE);
    setAttempts((prev) => ({ ...prev, [ev.id]: attempt }));
  };

  const submitAttempt = async (ev: Evaluation) => {
    const attempt = attempts[ev.id];
    if (!attempt) return;
    const updated = await api.submitAttempt(attempt.id);
    setAttempts((prev) => ({ ...prev, [ev.id]: updated }));
  };

  const gradeAttempt = async (ev: Evaluation) => {
    const attempt = attempts[ev.id];
    if (!attempt) return;
    const updated = await api.gradeAttempt(attempt.id, Number(gradeScore));
    setAttempts((prev) => ({ ...prev, [ev.id]: updated }));
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    await api.createEvaluation({ title, courseId: SEED_COURSE, type: 'quiz', weight: 20 });
    setTitle('');
    await load();
  };

  if (loading) return <Spinner />;

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  return (
    <div className="page-grid">
      {isTeacher && (
        <Card title="Nueva evaluación">
          <form className="form-inline" onSubmit={onCreate}>
            <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Button type="submit">Crear</Button>
          </form>
        </Card>
      )}
      <div className="cards-grid">
        {evaluations.length === 0 ? (
          <Card>
            <p className="muted">No hay evaluaciones. {isTeacher ? 'Cree una arriba.' : 'Su docente publicará evaluaciones pronto.'}</p>
          </Card>
        ) : (
          evaluations.map((ev) => {
            const attempt = attempts[ev.id];
            return (
              <Card key={ev.id} title={ev.title} subtitle={`${ev.type} · Peso ${ev.weight}%`}>
                <div className="eval-meta">
                  <Badge tone="info">{ev.courseId?.slice(0, 8)}…</Badge>
                  {attempt && <Badge tone={attempt.status === 'graded' ? 'success' : 'warning'}>{attempt.status}</Badge>}
                  {attempt?.score !== undefined && <span className="score-pill">Nota: {attempt.score}</span>}
                </div>
                <div className="btn-row">
                  {user?.role === 'student' && !attempt && (
                    <Button size="sm" onClick={() => startAttempt(ev)}>
                      Iniciar intento
                    </Button>
                  )}
                  {user?.role === 'student' && attempt?.status === 'in_progress' && (
                    <Button size="sm" variant="secondary" onClick={() => submitAttempt(ev)}>
                      Enviar respuestas
                    </Button>
                  )}
                  {isTeacher && attempt?.status === 'submitted' && (
                    <>
                      <Input label="Calificación" type="number" min={0} max={100} value={gradeScore} onChange={(e) => setGradeScore(e.target.value)} />
                      <Button size="sm" onClick={() => gradeAttempt(ev)}>
                        Calificar y activar motor adaptativo
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
