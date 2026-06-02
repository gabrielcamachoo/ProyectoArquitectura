import { useEffect, useState } from 'react';
import { assessmentsAPI, coursesAPI } from '../../services/api';

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Obtener cursos inscritos y todas las evaluaciones en paralelo
        const [enrolledRes, evalsRes] = await Promise.all([
          coursesAPI.getEnrolled().catch(() => ({ data: { courses: [] } })),
          assessmentsAPI.list().catch(() => ({ data: { evaluations: [] } }))
        ]);

        const enrolledIds = new Set<string>();
        (enrolledRes.data.courses ?? []).forEach((c: any) => enrolledIds.add(c.id));
        setEnrolledCourseIds(enrolledIds);

        // Filtrar evaluaciones para que solo salgan las de cursos inscritos
        const allEvals = evalsRes.data.evaluations ?? [];
        const myEvals = allEvals.filter((e: any) => enrolledIds.has(e.courseId));
        setEvaluations(myEvals);

      } catch (err) {
        console.error('Error cargando evaluaciones', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleStartAttempt = async (evalId: string) => {
    try {
      const res = await assessmentsAPI.startAttempt(evalId);
      alert(`Intento creado con éxito. ID del Intento: ${res.data.id || res.data.attempt?.id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al iniciar intento');
    }
  };

  if (loading) {
    return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>Cargando tus evaluaciones...</div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '8px' }}>Mis Evaluaciones</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Aquí encontrarás las pruebas y quices de los cursos en los que estás inscrito.</p>

      {enrolledCourseIds.size === 0 ? (
        <div className="card card-body" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📚</div>
          <h3 style={{ margin: '0 0 8px 0' }}>No estás inscrito en ningún curso</h3>
          <p style={{ margin: 0 }}>Ve a la sección de Cursos y explora el catálogo para inscribirte.</p>
        </div>
      ) : evaluations.length === 0 ? (
        <div className="card card-body" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🎉</div>
          <h3 style={{ margin: '0 0 8px 0' }}>Estás al día</h3>
          <p style={{ margin: 0 }}>No hay evaluaciones disponibles en tus cursos inscritos actualmente.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {evaluations.map(e => (
            <div key={e.id} className="card card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--info)' }}>
              <div>
                <span style={{ fontSize: '12px', background: 'var(--bg)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-muted)', marginBottom: '8px', display: 'inline-block' }}>Evaluación</span>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--text)' }}>{e.title}</h3>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <span>⚖️ Peso: {e.weight}%</span>
                  <span>🏆 Puntos Totales: {e.totalPoints}</span>
                </div>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => handleStartAttempt(e.id)} 
                style={{ padding: '10px 20px', fontWeight: 500 }}
              >
                Iniciar Intento
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
