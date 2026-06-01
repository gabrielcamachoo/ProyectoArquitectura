import { useEffect, useState } from 'react';
import { assessmentsAPI } from '../../services/api';

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Muestra las evaluaciones creadas
    assessmentsAPI.get('') // o llama a endpoint global si existe, o listamos mock
      .then(res => setEvaluations(res.data.evaluations ?? []))
      .catch(() => setEvaluations([]))
      .finally(() => setLoading(false));
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
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Cargando evaluaciones...</div>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 800, fontFamily: 'sans-serif' }}>
      <h2>Mis Evaluaciones</h2>
      {evaluations.length === 0 ? (
        <div style={{ padding: 24, backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#6b7280' }}>No hay evaluaciones disponibles actualmente.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {evaluations.map(e => (
            <div key={e.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0' }}>{e.title}</h3>
                <span style={{ color: '#6b7280', fontSize: 13 }}>Peso: {e.weight}% · Total Puntos: {e.totalPoints}</span>
              </div>
              <button onClick={() => handleStartAttempt(e.id)} style={{ padding: '8px 16px', backgroundColor: '#1a56db', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Iniciar Intento</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
