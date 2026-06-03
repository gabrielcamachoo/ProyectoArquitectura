import { useState } from 'react';
import { assessmentsAPI } from '../../services/api';

export default function CreateEvaluationPage() {
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [weight, setWeight] = useState('');
  const [totalPoints, setTotalPoints] = useState('100');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assessmentsAPI.create({
        courseId,
        title,
        type: 'quiz',
        weight: Number(weight),
        totalPoints: Number(totalPoints),
        passThreshold: 60
      });
      setCourseId('');
      setTitle('');
      setWeight('');
      alert('Evaluación creada exitosamente');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al crear evaluación');
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 500, fontFamily: 'sans-serif' }}>
      <h2>Crear Nueva Evaluación</h2>
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>ID del Curso</label>
          <input value={courseId} onChange={e => setCourseId(e.target.value)} required style={{ width: '100%', padding: 8, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Título de la Evaluación</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', padding: 8, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Peso de la Evaluación (0-100%)</label>
          <input type="number" min={0} max={100} value={weight} onChange={e => setWeight(e.target.value)} required style={{ width: '100%', padding: 8, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Puntos Totales</label>
          <input type="number" value={totalPoints} onChange={e => setTotalPoints(e.target.value)} required style={{ width: '100%', padding: 8, boxSizing: 'border-box' }} />
        </div>
        <button type="submit" style={{ padding: 10, backgroundColor: '#16a34a', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Crear Evaluación</button>
      </form>
    </div>
  );
}
