import { useState } from 'react';
import { assessmentsAPI } from '../../services/api';

export default function GradingPage() {
  const [attemptId, setAttemptId] = useState('');
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const s = Number(score);
  const expectedType = !score ? '' :
    s < 60 ? '📚 refuerzo — score bajo (< 60%)' :
    s <= 85 ? '📖 suplementario — buen desempeño (60-85%)' :
              '🚀 profundización — excelente (> 85%)';

  const handleGrade = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await assessmentsAPI.grade(
        attemptId, Number(score), feedback);
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al calificar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding:40, maxWidth:640, fontFamily: 'sans-serif' }}>
      <h1>Calificar Evaluación</h1>
      <div style={{ padding:12, backgroundColor:'#eff6ff',
        border:'1px solid #bfdbfe', borderRadius:8, marginBottom:24,
        fontSize:14, color:'#1e40af' }}>
        💡 Al calificar se dispara automáticamente el <strong>motor
        adaptativo</strong>. Las recomendaciones aparecen en ~3 segundos.
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={{ display:'block', marginBottom:4, fontWeight:500 }}>
          ID del Intento (attemptId)
        </label>
        <input value={attemptId}
          onChange={e => setAttemptId(e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          style={{ width:'100%', padding:'10px 12px',
            border:'1px solid #d1d5db', borderRadius:6,
            fontSize:14, boxSizing:'border-box', fontFamily:'monospace' }} />
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={{ display:'block', marginBottom:4, fontWeight:500 }}>
          Puntaje obtenido (0–100)
        </label>
        <input type="number" min={0} max={100}
          value={score} onChange={e => setScore(e.target.value)}
          style={{ width:'100%', padding:'10px 12px',
            border:'1px solid #d1d5db', borderRadius:6, fontSize:15,
            boxSizing:'border-box' }} />
        {expectedType && (
          <p style={{ marginTop:6, fontSize:13, color:'#6b7280' }}>
            Motor generará: <strong>{expectedType}</strong>
          </p>
        )}
      </div>

      <div style={{ marginBottom:20 }}>
        <label style={{ display:'block', marginBottom:4, fontWeight:500 }}>
          Retroalimentación al estudiante
        </label>
        <textarea value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={3} placeholder="Ej: Revisar capítulo 3 sobre patrones..."
          style={{ width:'100%', padding:'10px 12px',
            border:'1px solid #d1d5db', borderRadius:6,
            fontSize:14, boxSizing:'border-box' }} />
      </div>

      <button onClick={handleGrade}
        disabled={loading || !attemptId || !score}
        style={{ width:'100%', padding:14, backgroundColor:'#1a56db',
          color:'white', border:'none', borderRadius:8,
          fontSize:16, fontWeight:600,
          cursor: (loading||!attemptId||!score) ? 'not-allowed' : 'pointer',
          opacity: (loading||!attemptId||!score) ? 0.6 : 1 }}>
        {loading ? '⏳ Calificando...' :
          '✅ Calificar y Activar Motor Adaptativo'}
      </button>

      {error && (
        <div style={{ marginTop:16, padding:12, backgroundColor:'#fef2f2',
          border:'1px solid #fca5a5', borderRadius:6, color:'#dc2626' }}>
          ❌ {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop:16, padding:20, backgroundColor:'#f0fdf4',
          border:'2px solid #16a34a', borderRadius:8 }}>
          <h3 style={{ color:'#16a34a', margin:'0 0 12px' }}>
            ✅ Calificación registrada exitosamente
          </h3>
          <pre style={{ margin:0, fontSize:12, backgroundColor:'#dcfce7',
            padding:12, borderRadius:4, overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          <div style={{ marginTop:12, padding:10, backgroundColor:'#bbf7d0',
            borderRadius:6, fontSize:13 }}>
            🔄 El motor adaptativo está procesando la recomendación...
            Espera ~3 segundos y verifica en la página de recomendaciones del estudiante.
          </div>
        </div>
      )}
    </div>
  );
}
