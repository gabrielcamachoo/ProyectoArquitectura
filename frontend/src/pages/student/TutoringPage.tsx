import { useEffect, useState } from 'react';
import { collaborationAPI } from '../../services/api';

export default function TutoringPage() {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    collaborationAPI.getTutoring()
      .then(res => setSessions(res.data.items ?? []))
      .catch(() => setSessions([]));
  }, []);

  return (
    <div style={{ padding: 40, maxWidth: 800, fontFamily: 'sans-serif' }}>
      <h2>Tutorías Académicas</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Agenda asesorías personalizadas con profesores y monitores de la plataforma.</p>

      {sessions.length === 0 ? (
        <div style={{ padding: 32, border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>No tienes tutorías agendadas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map(s => (
            <div key={s.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <strong>Tutoría de Curso</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#6b7280' }}>Fecha: {new Date(s.scheduledAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
