# Plataforma de Aprendizaje Adaptativo - Proyecto de Arquitectura

Bienvenido a la plataforma de aprendizaje adaptativo de la Pontificia Universidad Javeriana. Este proyecto implementa una arquitectura basada en microservicios, donde interactúan múltiples componentes, incluyendo servicios en Node.js, .NET y JEE.

## 🚀 Cómo iniciar el proyecto desde cero

Si necesitas iniciar todo el entorno para tu presentación o desarrollo, cuentas con un script preparado para reiniciar la base de datos, levantar todos los servicios y cargar los datos iniciales necesarios para probar el flujo.

### Paso a paso:
1. Abre tu terminal de **PowerShell** y ubícate en la raíz del proyecto (`c:\Users\OsoGa\Uni\ProyectoArquitectura`).
2. Ejecuta el script de reinicio y carga de datos:
   ```powershell
   .\reset_and_seed.ps1
   ```
   *(Este script detendrá servicios antiguos, limpiará la BD, encenderá los contenedores Docker y poblará la base de datos)*.
3. El frontend de la aplicación estará disponible en: [http://localhost:5173](http://localhost:5173).

---

## 👩‍💻👨‍🏫 Credenciales de Acceso

- **👩‍💻 Estudiante (Ana)**
  - **Email:** `ana.sistemas@puj.edu.co`
  - **Contraseña:** `Password123!`
- **👨‍🏫 Profesor (Carlos)**
  - **Email:** `carlos.arq@puj.edu.co`
  - **Contraseña:** `Password123!`

---

## 🎬 Flujo sugerido para la Presentación

Te recomendamos seguir esta historia o "flujo feliz" para demostrar todas las capacidades de la plataforma de manera fluida y conectada:

### Parte 1: La Visión del Docente
1. Ingresa a la plataforma usando las credenciales del profesor **Carlos**.
2. **Dashboard**: Muestra el panel docente, evidenciando el diseño y la información general.
3. **Cursos y Evaluaciones**: Navega a *Mis Cursos* para demostrar que el curso de Arquitectura existe. Luego entra a *Evaluaciones* y resalta que se pueden programar evaluaciones.
4. **Foros / Tutorías**: Muestra cómo el profesor tiene acceso al módulo de colaboración y puede ver o agendar tutorías.

### Parte 2: La Experiencia del Estudiante
1. Cierra sesión y entra con las credenciales de la estudiante **Ana**.
2. **Inicio y Cursos**: Ve a la sección de *Cursos*, explicando que ya estás inscrito en "Arquitectura de Software".
3. **Evaluación Adaptativa (Clave)**:
   - Dirígete a la pestaña de **Evaluaciones** (donde aparecerán las disponibles).
   - Simula que iniciarás/enviarás un intento o resalta que al enviarlo se notifica.
4. **Motor de Recomendación**: 
   - Ve a la pestaña de **Recomendaciones**.
   - Explica cómo el *motor adaptativo* analizó los resultados de la evaluación y determinó sugerir material específico para el perfil de Ana.
5. **Colaboración**:
   - Entra a la sección **Colaboración** (Foros) para demostrar que los estudiantes pueden crear grupos de estudio y postear en los foros.
   - Envía un mensaje rápido en el foro.
6. **Notificaciones (Event-Driven)**:
   - Finalmente, ve a la pestaña de **Notificaciones** (la campanita en la barra).
   - ¡Demuestra que están llegando mensajes automáticos indicando nuevas evaluaciones, mensajes de foro o inscripciones! Esto muestra integración asíncrona entre microservicios.

### Parte 3: El Backend Híbrido (Opcional si preguntan)
Si el profesor te pregunta por los servicios en otras tecnologías, puedes mostrarle directamente el código en estas carpetas:
* `services/jee-service` (Java)
* `services/dotnet-service` (C# .NET)
* `services/assessment-service`, etc. (Node)
