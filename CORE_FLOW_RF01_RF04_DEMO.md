# 🏆 CORE FLOW DEMO GUIDE (RF-01 a RF-04)

**Persona 1 - Frontend & Core Backend Services**
**Objetivo**: Cierre, documentación y sostenimiento del flujo core para la demo final, con un diseño "Google-like" completamente profesional, práctico y estético.

---

## 🎨 1. Mejoras de UI/UX (Estética "Google-like")
Se ha modernizado todo el frontend para tener la apariencia de una plataforma profesional (estilo Google Workspace / Material Design).

- **Tipografía**: Se migró de `DM Sans` a la familia `Roboto` / `Inter`, dando una lectura mucho más limpia y corporativa.
- **Paleta de Colores**: 
  - Primario: Google Blue (`#1a73e8`)
  - Fondos: Light Gray (`#f8f9fa`)
  - Superficies: White (`#ffffff`) con bordes suaves (`#dadce0`)
- **Sombras y Bordes**: Implementación de las elevaciones Material (sombras súper sutiles pero claras) y bordes redondeados estándar de 8px.
- **Vistas Actualizadas**:
  - `LoginPage.tsx` y `RegisterPage.tsx`: Layout completamente rediseñado estilo "Single Sign-On" de Google, con cards limpias y botones amplios.
  - `Dashboard.tsx`: Adaptado para usar componentes tipo Card con sombras sutiles, banners limpios y tipografía jerárquica.
  - `index.css`: Refactorización de variables root para inyectar este tema globally en toda la SPA.

---

## 🛠 2. Componentes del Flujo Core Sostenido (Backend)

Los servicios base que componen el **Core Flow** están cerrados, probados e integrados a través de **Kong API Gateway**.

### RF-01: Auth Service 🔐
- **Estado**: ✅ COMPLETADO Y CERRADO
- **Rol en la demo**: Permite a los estudiantes y profesores autenticarse centralmente. Devuelve el JWT que viaja hacia Kong.
- **Acción a mostrar**: Login de estudiante (`juan@institucion.edu` / `••••••••`) y ruteo automático basado en su rol usando `ProtectedRoute`.

### RF-02: Course Service 📚
- **Estado**: ✅ COMPLETADO Y CERRADO
- **Rol en la demo**: Suministra la metadata de los cursos a los que el estudiante está inscrito.
- **Acción a mostrar**: En el Dashboard y vista de "Mis Cursos", el frontend consume `/api/courses` a través del Gateway.

### RF-03: Assessment Service 📝
- **Estado**: ✅ COMPLETADO Y CERRADO
- **Rol en la demo**: Motor de ejecución de evaluaciones y exámenes.
- **Acción a mostrar**: Cuando un estudiante completa su examen, el Assessment Service califica y publica asíncronamente el evento `evaluacion.completada.v1` vía **RabbitMQ**.

### RF-04: Adaptive Service 🧠
- **Estado**: ✅ COMPLETADO Y CERRADO
- **Rol en la demo**: Escucha los eventos de evaluaciones en RabbitMQ y genera recomendaciones pedagógicas al vuelo.
- **Acción a mostrar**: El indicador de "Motor Adaptativo" en el Dashboard se ilumina, y el estudiante recibe recomendaciones personalizadas usando la política definida de puntajes (<3.0 Refuerzo, >4.0 Avanzado).

---

## 🚀 3. Instrucciones de Ejecución para la Demo

Para presentar este flujo (Responsabilidad Persona 1) de forma perfecta:

1. **Iniciar Infraestructura**:
   ```bash
   docker-compose up -d
   ```
   *Verificar que PostgreSQL, Redis, RabbitMQ y Kong estén "healthy".*

2. **Levantar los Microservicios Core**:
   Abran terminales o usen su orquestador para iniciar en modo dev:
   - `auth-service`
   - `course-service`
   - `assessment-service`
   - `adaptive-service`

3. **Iniciar el Frontend UI (Profesional)**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Flujo de Pantallas Demo**:
   1. Pantalla de **Login**. Visualizar la interfaz renovada "Google-like".
   2. Iniciar sesión como `student`.
   3. Carga el **Dashboard** (limpio, uso de tarjetas, indicadores de progreso).
   4. Mostrar que los servicios listan cursos y evaluaciones pendientes (integración backend).
   5. Explicar (o mostrar si hay mock) cómo interactúan el Assessment y Adaptive service por debajo asíncronamente vía RabbitMQ.

---

> **Nota Final (Persona 1)**: De RF-05 en adelante (Collaboration, Tutoring, Analytics, Notifications) será abarcado por Compañero B y C. La base de arquitectura y el ecosistema visual/core ya quedan firmes para que monten encima.