import { useEffect, useState } from 'react';
import { coursesAPI, authAPI } from '../../services/api';

export default function CoursesPage() {
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'my_courses' | 'explore'>('my_courses');
  const [selected, setSelected] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allRes, enrolledRes, usersRes] = await Promise.all([
        coursesAPI.list().catch(() => ({ data: { courses: [] } })),
        coursesAPI.getEnrolled().catch(() => ({ data: { courses: [] } })),
        authAPI.listUsers().catch(() => [])
      ]);

      const usersMap: Record<string, any> = {};
      usersRes.forEach((u: any) => { usersMap[u.id] = u; });
      setUsers(usersMap);

      setAllCourses(allRes.data.courses ?? []);
      setEnrolledCourses(enrolledRes.data.courses ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
      loadData(); // Recargar para actualizar la lista de mis cursos
      setActiveTab('my_courses');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al inscribirse');
    }
  };

  if (loading && allCourses.length === 0) {
    return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>Cargando catálogo...</div>;
  }

  const isEnrolled = (courseId: string) => enrolledCourses.some(c => c.id === courseId);

  const displayCourses = activeTab === 'my_courses' ? enrolledCourses : allCourses.filter(c => !isEnrolled(c.id));

  return (
    <div className="page-content" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '24px' }}>
      <div style={{ flex: '1 1 40%', minWidth: '350px' }}>
        <h2 style={{ marginBottom: '20px' }}>Gestión de Cursos</h2>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid var(--border)' }}>
          <button 
            onClick={() => { setActiveTab('my_courses'); setSelected(null); }}
            style={{ 
              background: 'none', border: 'none', padding: '10px 16px', cursor: 'pointer', fontWeight: 600,
              borderBottom: activeTab === 'my_courses' ? '3px solid var(--info)' : '3px solid transparent',
              color: activeTab === 'my_courses' ? 'var(--info)' : 'var(--text-muted)'
            }}
          >
            Mis Cursos ({enrolledCourses.length})
          </button>
          <button 
            onClick={() => { setActiveTab('explore'); setSelected(null); }}
            style={{ 
              background: 'none', border: 'none', padding: '10px 16px', cursor: 'pointer', fontWeight: 600,
              borderBottom: activeTab === 'explore' ? '3px solid var(--info)' : '3px solid transparent',
              color: activeTab === 'explore' ? 'var(--info)' : 'var(--text-muted)'
            }}
          >
            Explorar Catálogo
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayCourses.length === 0 ? (
            <div className="card card-body" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              {activeTab === 'my_courses' ? 'No estás inscrito en ningún curso.' : 'No hay cursos nuevos disponibles.'}
            </div>
          ) : (
            displayCourses.map(c => {
              const teacher = users[c.createdBy] || { fullName: 'Profesor Desconocido' };
              
              return (
                <div 
                  key={c.id} 
                  className="card"
                  style={{ 
                    cursor: 'pointer', 
                    border: selected?.id === c.id ? '2px solid var(--info)' : '1px solid var(--border)',
                    boxShadow: selected?.id === c.id ? '0 4px 12px rgba(59,130,246,0.15)' : 'none',
                    transition: 'all 0.2s'
                  }} 
                  onClick={() => selectCourse(c)}
                >
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--text)' }}>{c.name}</h3>
                      {activeTab === 'my_courses' && (
                        <span style={{ fontSize: '12px', background: 'var(--success-light)', color: 'var(--success)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Inscrito</span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 12px 0', color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>{c.description}</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>👨‍🏫 {teacher.fullName}</span>
                      <span>•</span>
                      <span>📦 {c.totalModules} módulos</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {activeTab === 'explore' && (
                        <button 
                          className="btn btn-primary"
                          onClick={(e) => { e.stopPropagation(); handleEnroll(c.id); }} 
                          style={{ width: '100%', padding: '8px' }}
                        >
                          Inscribirse al Curso
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={{ flex: '1 1 60%', position: 'sticky', top: '24px', alignSelf: 'flex-start' }}>
        {selected ? (
          <div className="card" style={{ height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            <div className="card-body" style={{ borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', background: 'var(--bg)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-muted)', marginBottom: '12px', display: 'inline-block' }}>ID: {selected.id}</span>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '24px' }}>{selected.name}</h2>
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{selected.description}</p>
              
              {selected.learningObjectives && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Objetivos de Aprendizaje</h4>
                  <p style={{ margin: 0, fontSize: '14px' }}>{selected.learningObjectives}</p>
                </div>
              )}
            </div>

            <div className="card-body">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Contenido del Curso</h3>
              
              {(!isEnrolled(selected.id)) ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔒</div>
                  <h4 style={{ margin: '0 0 8px 0' }}>Contenido Bloqueado</h4>
                  <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)' }}>Debes inscribirte en el curso para ver los materiales y módulos.</p>
                  <button className="btn btn-primary" onClick={() => handleEnroll(selected.id)}>Inscribirse Ahora</button>
                </div>
              ) : modules.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center', background: 'var(--bg)', borderRadius: '8px' }}>El profesor aún no ha publicado módulos para este curso.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {modules.map(m => (
                    <div key={m.id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--info-light)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {m.order}
                        </div>
                        <strong style={{ fontSize: '16px' }}>{m.title}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card card-body" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📚</div>
            <h3 style={{ margin: '0 0 8px 0' }}>Selecciona un curso</h3>
            <p style={{ margin: 0, maxWidth: '300px' }}>Haz clic en cualquier curso de la lista para ver su descripción detallada y temario.</p>
          </div>
        )}
      </div>
    </div>
  );
}
