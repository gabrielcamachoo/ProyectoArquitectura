import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { CourseDashboard } from '../types';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Spinner } from '../components/ui/Spinner';

const SEED_COURSE = '00000000-0000-4000-8000-000000000001';

export function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<CourseDashboard | null>(null);
  const [students, setStudents] = useState<Array<{ studentId: string; fullName?: string; percentage: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getCourseAnalytics(SEED_COURSE), api.getCourseStudentsAnalytics(SEED_COURSE)])
      .then(([d, s]) => {
        setDashboard(d);
        setStudents(s.students ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Cargando analítica (réplica de lectura)..." />;

  return (
    <div className="page-grid">
      <section className="hero-banner compact teacher">
        <h2>Dashboard docente</h2>
        <p>CQRS liviano — lecturas desde réplica PostgreSQL simulada (&lt; 5 s).</p>
      </section>
      <div className="stats-row">
        <StatCard label="Estudiantes activos" value={dashboard?.activeStudents ?? 0} icon="👥" />
        <StatCard label="Finalización" value={`${dashboard?.completionRate ?? 0}%`} icon="✅" />
        <StatCard label="Promedio" value={dashboard?.averageScore ?? 0} icon="📊" />
        <StatCard label="En riesgo" value={dashboard?.atRiskStudents ?? 0} icon="⚠️" />
      </div>
      <Card title="Progreso por estudiante">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Progreso</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.studentId}>
                  <td>{s.fullName ?? s.studentId}</td>
                  <td>
                    <div className="progress-bar">
                      <span style={{ width: `${s.percentage}%` }} />
                    </div>
                    <small>{s.percentage}%</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
