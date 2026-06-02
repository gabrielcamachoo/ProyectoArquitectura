import { useEffect, useState } from 'react';
import { collaborationAPI, coursesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function TutoringPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    collaborationAPI.getTutoring()
      .then(res => setSessions(res.data.items ?? []))
      .catch(() => setSessions([]));
      
    coursesAPI.getEnrolled()
      .then(res => setCourses(res.data.courses ?? []))
      .catch(console.error);
  };

  useEffect(loadData, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !date || !topic) return;
    
    const course = courses.find(c => c.id === selectedCourse);
    if (!course) return;

    setLoading(true);
    try {
      await collaborationAPI.createTutoring({
        topic,
        courseId: course.id,
        tutorId: course.createdBy,
        tuteeId: user?.id,
        scheduledAt: new Date(date).toISOString(),
        durationMinutes: 60,
        status: 'scheduled',
      });
      setSelectedCourse('');
      setDate('');
      setTopic('');
      loadData();
      alert('Tutoría agendada con éxito.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al agendar tutoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 800, fontFamily: 'sans-serif' }}>
      <h2>Tutorías Académicas</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Agenda asesorías personalizadas con los profesores de tus cursos.</p>

      <div style={{ backgroundColor: '#f9fafb', padding: 24, borderRadius: 8, marginBottom: 32, border: '1px solid #e5e7eb' }}>
        <h3 style={{ marginTop: 0 }}>Agendar Nueva Tutoría</h3>
        <form onSubmit={handleSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Curso (Profesor)</label>
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} required
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}>
              <option value="">-- Selecciona un curso --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name} (Profesor ID: {c.createdBy.substring(0,6)}...)</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Tema a tratar</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} required placeholder="Ej. Dudas sobre microservicios"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Fecha y Hora</label>
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }} />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '10px 16px', backgroundColor: 'var(--ja-blue)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' }}>
            {loading ? 'Agendando...' : 'Agendar Tutoría'}
          </button>
        </form>
      </div>

      <h3>Mis Tutorías</h3>
      {sessions.length === 0 ? (
        <div style={{ padding: 32, border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>No tienes tutorías agendadas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map(s => (
            <div key={s.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <strong>{s.topic || 'Tutoría de Curso'}</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#6b7280' }}>Fecha: {new Date(s.scheduledAt).toLocaleString()} · Estado: {s.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
