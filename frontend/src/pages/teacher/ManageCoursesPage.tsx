import { useEffect, useState } from 'react';
import { coursesAPI } from '../../services/api';

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = () => {
    coursesAPI.list()
      .then(res => setCourses(res.data.courses ?? []))
      .catch(() => setCourses([]));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coursesAPI.create({ name, description });
      setName('');
      setDescription('');
      load();
      alert('Curso creado exitosamente');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al crear curso');
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 800, fontFamily: 'sans-serif' }}>
      <h2>Gestionar Cursos</h2>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <h3>Crear Nuevo Curso</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>Nombre del curso</label>
              <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: 8, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: 8, boxSizing: 'border-box' }} />
            </div>
            <button type="submit" style={{ padding: 10, backgroundColor: '#16a34a', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Crear Curso</button>
          </form>
        </div>

        <div style={{ flex: 1 }}>
          <h3>Mis Cursos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {courses.map(c => (
              <div key={c.id} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                <strong>{c.name}</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#6b7280' }}>ID: {c.id}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#6b7280' }}>{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
