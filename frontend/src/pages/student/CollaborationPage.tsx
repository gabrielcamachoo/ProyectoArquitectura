import { useState } from 'react';

export default function CollaborationPage() {
  const [forums] = useState<any[]>([]);

  return (
    <div style={{ padding: 40, maxWidth: 800, fontFamily: 'sans-serif' }}>
      <h2>Foros de Colaboración</h2>
      <div style={{ padding: 24, border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#1e3a8a' }}>💬 Espacio Colaborativo</h3>
        <p style={{ margin: 0, color: '#1e40af' }}>Interactúa con tus compañeros en grupos de estudio y foros de discusión autorizados.</p>
      </div>

      {forums.length === 0 ? (
        <div style={{ padding: 32, border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>No hay hilos de discusión activos en este momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {forums.map(f => (
            <div key={f.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <h4>{f.title}</h4>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
