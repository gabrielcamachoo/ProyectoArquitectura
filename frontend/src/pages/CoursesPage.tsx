import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { Course, Material, Module } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';

export function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await api.getCourses();
    setCourses(res.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const selectCourse = async (course: Course) => {
    setSelected(course);
    const mods = await api.getModules(course.id);
    setModules(mods.items ?? []);
    if (mods.items?.[0]) {
      const mats = await api.getMaterials(course.id, mods.items[0].id);
      setMaterials(mats.items ?? []);
    } else {
      setMaterials([]);
    }
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    await api.createCourse({
      name,
      description,
      teacherId: user?.id,
      status: user?.role === 'teacher' ? 'published' : 'draft'
    });
    setName('');
    setDescription('');
    await load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="page-grid two-col">
      <div>
        <Card title="Catálogo de cursos" subtitle={`${courses.length} curso(s) disponibles`}>
          <div className="list-stack">
            {courses.map((c) => (
              <button key={c.id} type="button" className={`list-item ${selected?.id === c.id ? 'active' : ''}`} onClick={() => selectCourse(c)}>
                <div>
                  <strong>{c.name}</strong>
                  <p>{c.description}</p>
                </div>
                <Badge tone={c.status === 'published' ? 'success' : 'neutral'}>{c.status}</Badge>
              </button>
            ))}
          </div>
        </Card>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Card title="Nuevo curso" className="mt">
            <form className="form-stack" onSubmit={onCreate}>
              <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Button type="submit">Publicar curso</Button>
            </form>
          </Card>
        )}
      </div>
      <div>
        {selected ? (
          <Card title={selected.name} subtitle="Módulos y materiales">
            <div className="module-list">
              {modules.map((m) => (
                <div key={m.id} className="module-chip">
                  <span className="module-order">{m.order}</span>
                  <div>
                    <strong>{m.title}</strong>
                    <Badge tone="info">{m.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
            {materials.length > 0 && (
              <>
                <h4 className="section-title">Materiales del primer módulo</h4>
                <ul className="material-list">
                  {materials.map((mat) => (
                    <li key={mat.id}>
                      <span>{mat.type === 'video' ? '🎬' : '📄'}</span>
                      <a href={mat.url} target="_blank" rel="noreferrer">
                        {mat.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        ) : (
          <Card title="Detalle del curso">
            <p className="muted">Seleccione un curso para ver módulos y materiales.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
