import { useEffect, useState } from 'react';
import { progressAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ProgressPage() {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    progressAPI.getStudentProgress(user.id)
      .then(res => setProgressData(res.data))
      .catch(() => setProgressData(null))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Cargando progreso...</div>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 600, fontFamily: 'sans-serif' }}>
      <h2>Mi Progreso Académico</h2>
      {progressData ? (
        <div style={{ padding: 24, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Porcentaje General de Avance</h3>
          <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: 10, height: 20, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: `${progressData.overallPercentage ?? 0}%`, backgroundColor: '#16a34a', height: '100%', transition: 'width 0.5s ease-in-out' }}></div>
          </div>
          <span style={{ fontSize: 24, fontWeight: 'bold' }}>{progressData.overallPercentage ?? 0}%</span>
        </div>
      ) : (
        <p style={{ color: '#6b7280' }}>No se registran datos de progreso para tu usuario aún.</p>
      )}
    </div>
  );
}
