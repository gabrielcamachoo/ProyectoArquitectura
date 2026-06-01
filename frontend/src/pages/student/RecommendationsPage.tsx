import { useEffect, useState } from 'react';
import { adaptiveAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Recommendation {
  id: string;
  type: 'refuerzo' | 'suplementario' | 'profundización';
  courseId: string;
  materials: string[];
  createdAt: string;
}

const TYPE_CONFIG = {
  refuerzo: {
    color: '#dc2626', bg: '#fef2f2', icon: '📚',
    label: 'Material de Refuerzo',
    desc: 'Tu score fue bajo — repasa este tema antes de continuar',
  },
  suplementario: {
    color: '#d97706', bg: '#fffbeb', icon: '📖',
    label: 'Material Suplementario',
    desc: 'Buen desempeño — amplía tu conocimiento con esto',
  },
  'profundización': {
    color: '#16a34a', bg: '#f0fdf4', icon: '🚀',
    label: 'Profundización',
    desc: '¡Excelente! Estás listo para el siguiente nivel',
  },
};

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadRecommendations = () => {
    if (!user?.id) return;
    setLoading(true);
    adaptiveAPI.getRecommendations(user.id)
      .then(data => {
        setRecs(data);
        setLastUpdated(new Date());
      })
      .catch(() => setError('No se pudieron cargar las recomendaciones'))
      .finally(() => setLoading(false));
  };

  useEffect(loadRecommendations, [user]);

  return (
    <div style={{ padding: 40, maxWidth: 800, fontFamily: 'sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>Mis Recomendaciones Adaptativas</h1>
        <button onClick={loadRecommendations} disabled={loading}
          style={{ padding:'8px 16px', backgroundColor:'#1a56db',
            color:'white', border:'none', borderRadius:6, cursor:'pointer' }}>
          🔄 Actualizar
        </button>
      </div>
      <p style={{ color:'#6b7280', marginBottom: 24 }}>
        El motor adaptativo personaliza este contenido según tu desempeño
        en evaluaciones. Las recomendaciones se actualizan automáticamente.
        {lastUpdated && ` · Actualizado: ${lastUpdated.toLocaleTimeString('es-CO')}`}
      </p>

      {loading && <div style={{ padding:24, textAlign:'center',
        color:'#6b7280' }}>Consultando motor adaptativo...</div>}

      {error && <div style={{ padding:16, backgroundColor:'#fef2f2',
        border:'1px solid #fca5a5', borderRadius:8, color:'#dc2626' }}>
        {error}
      </div>}

      {!loading && !error && recs.length === 0 && (
        <div style={{ padding:32, backgroundColor:'#f9fafb',
          borderRadius:12, textAlign:'center', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize:18 }}>📋 No hay recomendaciones aún</p>
          <p style={{ color:'#6b7280' }}>
            Completa y envía evaluaciones para recibir contenido personalizado.
          </p>
        </div>
      )}

      {recs.map(rec => {
        const cfg = TYPE_CONFIG[rec.type] ?? TYPE_CONFIG['suplementario'];
        return (
          <div key={rec.id} style={{ border:`2px solid ${cfg.color}`,
            backgroundColor: cfg.bg, borderRadius:10, padding:20,
            marginBottom:16 }}>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <span style={{ fontSize:36 }}>{cfg.icon}</span>
              <div>
                <h3 style={{ margin:0, color:cfg.color }}>{cfg.label}</h3>
                <p style={{ margin:'4px 0 0', color:'#374151' }}>{cfg.desc}</p>
              </div>
              <span style={{ marginLeft:'auto', padding:'4px 10px',
                backgroundColor:cfg.color, color:'white', borderRadius:20,
                fontSize:12, fontWeight:700 }}>
                {rec.type.toUpperCase()}
              </span>
            </div>
            {rec.materials?.length > 0 && (
              <div style={{ marginTop:12, paddingTop:12,
                borderTop:`1px solid ${cfg.color}33` }}>
                <strong style={{ fontSize:13 }}>Materiales sugeridos:</strong>
                <ul style={{ margin:'6px 0 0', paddingLeft:20 }}>
                  {rec.materials.map((m, i) =>
                    <li key={i} style={{ fontSize:14, color:'#374151' }}>{m}</li>
                  )}
                </ul>
              </div>
            )}
            <p style={{ margin:'10px 0 0', fontSize:12, color:'#9ca3af' }}>
              Generado: {new Date(rec.createdAt).toLocaleString('es-CO')}
              {rec.courseId && ` · Curso: ${rec.courseId}`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
