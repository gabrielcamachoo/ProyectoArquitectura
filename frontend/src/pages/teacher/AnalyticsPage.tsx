export default function TeacherAnalyticsPage() {
  return (
    <div style={{ padding: 40, maxWidth: 800, fontFamily: 'sans-serif' }}>
      <h2>Analítica y Monitoreo del Curso</h2>
      <p style={{ color: '#6b7280' }}>Visualice las estadísticas de progreso y dificultades de aprendizaje de sus alumnos.</p>
      <div style={{ padding: 24, border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', borderRadius: 8, marginTop: 24 }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#1e3a8a' }}>📊 Panel de Analítica Activo</h3>
        <p style={{ margin: 0, color: '#1e40af' }}>Los datos se actualizan basándose en la finalización de los módulos y las calificaciones registradas.</p>
      </div>
    </div>
  );
}
