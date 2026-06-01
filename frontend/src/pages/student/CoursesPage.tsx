import { useEffect, useState } from 'react';
import { coursesAPI } from '../../services/api';

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);

  const loadCourses = async () => {
    try {
      const res = await coursesAPI.list();
      setCourses(res.data.courses ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const selectCourse = async (course: any) => {
    setSelected(course);
    try {
      const mods = await coursesAPI.getModules(course.id);
      setModules(mods.data.modules ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await coursesAPI.enroll(courseId);
      alert('¡Inscrito exitosamente!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al inscribirse');
    }
  };

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Cargando catálogo...</div>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 900, fontFamily: 'sans-serif', display: 'flex', gap: 24 }}>
      <div style={{ flex: 1 }}>
        <h2>Catálogo de Cursos</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {courses.map(c => (
            <div key={c.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', backgroundColor: selected?.id === c.id ? '#f3f4f6' : 'white' }} onClick={() => selectCourse(c)}>
              <h3 style={{ margin: '0 0 4px 0' }}>{c.name}</h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>{c.description}</p>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button onClick={(e) => { e.stopPropagation(); handleEnroll(c.id); }} style={{ padding: '6px 12px', backgroundColor: '#1a56db', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Inscribirse</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, borderLeft: '1px solid #e5e7eb', paddingLeft: 24 }}>
        {selected ? (
          <div>
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>
            <h3>Módulos del Curso</h3>
            {modules.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No hay módulos creados aún.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {modules.map(m => (
                  <div key={m.id} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                    <strong>{m.order}. {m.title}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: '#6b7280', marginTop: 40 }}>Selecciona un curso para ver sus detalles y módulos.</p>
        )}
      </div>
    </div>
  );
}
