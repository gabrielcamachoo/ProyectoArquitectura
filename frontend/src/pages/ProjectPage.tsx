import { Link } from 'react-router-dom';

const features = [
  {
    icon: '🔐',
    title: 'Auth centralizado',
    description: 'Registro e inicio de sesión con roles de estudiante, docente y administrador.',
  },
  {
    icon: '📚',
    title: 'Cursos y módulos',
    description: 'Explora cursos disponibles, módulos y contenidos asociados.',
  },
  {
    icon: '📝',
    title: 'Evaluaciones adaptativas',
    description: 'Crea, presenta y califica evaluaciones con soporte de intentos y rutas adaptativas.',
  },
  {
    icon: '✨',
    title: 'Recomendaciones inteligentes',
    description: 'Sugerencias de aprendizaje basadas en progreso y desempeño estudiantil.',
  },
  {
    icon: '💬',
    title: 'Colaboración entre pares',
    description: 'Foros, grupos de estudio y comunicación académica integrada.',
  },
  {
    icon: '🔔',
    title: 'Notificaciones',
    description: 'Mensajes y alertas para tareas, evaluaciones y eventos importantes.',
  },
];

export default function ProjectPage({ hideActions = false }: { hideActions?: boolean }) {
  return (
    <div className="page-content project-home">
      <section className="hero-banner">
        <div>
          <span style={{ display: 'inline-block', marginBottom: 12, color: '#fff', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Proyecto académico</span>
          <h1 style={{ margin: '0 0 16px 0', fontSize: '3rem', maxWidth: 680 }}>Plataforma integrada de Aprendizaje Adaptativo</h1>
          <p style={{ margin: 0, maxWidth: 620, lineHeight: 1.75, fontSize: 17 }}>Un frontend conectado con todos los servicios del proyecto: autenticación, cursos, evaluaciones, adaptativo, colaborativo, notificaciones y analítica. Navega, inicia sesión y descubre cómo funciona cada módulo.</p>
        </div>
        {!hideActions && (
          <div className="hero-actions">
            <Link to="/login" className="btn btn-primary">Iniciar sesión</Link>
            <Link to="/register" className="btn btn-secondary">Crear cuenta</Link>
          </div>
        )}
      </section>

      <section className="feature-grid">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="project-summary">
        <h2>Todo el proyecto en una sola experiencia</h2>
        <p>Esta interfaz fue diseñada para representar todos los componentes del proyecto como una plataforma unificada. Cada servicio disponible en el backend tiene una pantalla asociada para que puedas ver la funcionalidad completa y conectada.</p>
        <div className="summary-list">
          <div>
            <strong>Backend central:</strong> Auth Service, Course Service, Assessment Service, Adaptive Service, Collaboration Service, Notification Service y Analytics Service.
          </div>
          <div>
            <strong>Usuarios:</strong> Estudiantes, docentes y administradores con rutas protegidas y roles separados.
          </div>
          <div>
            <strong>Cumplimiento:</strong> Ley 1581 en el flujo de privacidad, exportación y eliminación de datos.
          </div>
        </div>
      </section>
    </div>
  );
}
