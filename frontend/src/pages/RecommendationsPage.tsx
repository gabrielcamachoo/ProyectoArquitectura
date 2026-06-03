import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { Recommendation } from '../types';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';

const typeLabels: Record<string, { label: string; desc: string; tone: 'warning' | 'info' | 'success' }> = {
  refuerzo: { label: 'Refuerzo', desc: 'Materiales del módulo actual para reforzar conceptos.', tone: 'warning' },
  profundizacion: { label: 'Profundización', desc: 'Contenido de módulos siguientes para avanzar.', tone: 'info' },
  recurso_complementario: { label: 'Complementario', desc: 'Cursos y recursos relacionados por alto desempeño.', tone: 'success' }
};

export function RecommendationsPage() {
  const { user } = useAuth();
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api
      .getRecommendations(user.id)
      .then(setRec)
      .catch(() => setError('Aún no hay recomendaciones. Complete una evaluación calificada para activar el motor adaptativo.'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Spinner />;

  const meta = rec ? typeLabels[rec.type] ?? { label: rec.type, desc: 'Recomendación personalizada', tone: 'info' as const } : null;

  return (
    <div className="page-grid">
      <section className="hero-banner compact">
        <h2>Motor adaptativo</h2>
        <p>Recomendaciones generadas a partir de su desempeño en evaluaciones (caché Redis, TTL 5 min).</p>
      </section>
      {error ? (
        <Card title="Sin recomendaciones">
          <p className="muted">{error}</p>
          <p className="hint">Flujo: Evaluación → envío → calificación docente → evento RabbitMQ → recomendación.</p>
        </Card>
      ) : rec && meta ? (
        <Card title="Su recomendación actual" className="recommendation-card">
          <div className="rec-header">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            {rec.fallback && <Badge tone="neutral">Modo respaldo (circuit breaker)</Badge>}
          </div>
          <p className="rec-desc">{meta.desc}</p>
          <dl className="detail-list">
            <div>
              <dt>Alcance de materiales</dt>
              <dd>{rec.materialScope ?? '—'}</dd>
            </div>
            <div>
              <dt>Curso</dt>
              <dd>{rec.courseId ?? '—'}</dd>
            </div>
            <div>
              <dt>Generada</dt>
              <dd>{rec.generatedAt ? new Date(rec.generatedAt).toLocaleString('es-CO') : '—'}</dd>
            </div>
          </dl>
        </Card>
      ) : null}
    </div>
  );
}
