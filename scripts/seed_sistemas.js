const API_URL = 'http://localhost:8000'; // Kong API Gateway or the services

// Utilities
async function post(endpoint, data, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const err = await res.text();
    console.warn(`[WARNING] POST ${endpoint} failed: ${res.status} ${err}`);
    return null;
  }
  return res.json();
}

async function get(endpoint, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_URL}${endpoint}`, { headers });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Data
const teachers = [
  { fullName: 'Carlos Profesor Arq', email: 'carlos.arq@puj.edu.co', password: 'Password123!', role: 'teacher' },
  { fullName: 'Maria Profesora Algo', email: 'maria.algo@puj.edu.co', password: 'Password123!', role: 'teacher' }
];

const students = [
  { fullName: 'Ana Ing Sistemas', email: 'ana.sistemas@puj.edu.co', password: 'Password123!', role: 'student' },
  { fullName: 'Luis Ing Sistemas', email: 'luis.sistemas@puj.edu.co', password: 'Password123!', role: 'student' },
  { fullName: 'Pedro Ing Sistemas', email: 'pedro.sistemas@puj.edu.co', password: 'Password123!', role: 'student' }
];

async function seed() {
  console.log('🌱 Iniciando Seeder de Ingeniería de Sistemas...');

  // 1. Register & Login Teachers
  console.log('\n--- Creando Profesores ---');
  const teacherUsers = [];
  for (const t of teachers) {
    let reg = await post('/auth/register', { ...t, institutionalEmail: t.email });
    if (!reg) {
      // Intentar login si ya existe
      reg = await post('/auth/login', { institutionalEmail: t.email, password: t.password });
      if (reg) {
        teacherUsers.push({ id: reg.user?.id || reg.id, token: reg.accessToken, ...t });
      }
    } else {
      const login = await post('/auth/login', { institutionalEmail: t.email, password: t.password });
      teacherUsers.push({ id: login.user?.id || login.id, token: login.accessToken, ...t });
    }
  }

  // 2. Register & Login Students
  console.log('\n--- Creando Estudiantes ---');
  const studentUsers = [];
  for (const s of students) {
    let reg = await post('/auth/register', { ...s, institutionalEmail: s.email });
    if (!reg) {
      reg = await post('/auth/login', { institutionalEmail: s.email, password: s.password });
      if (reg) studentUsers.push({ id: reg.user?.id || reg.id, token: reg.accessToken, ...s });
    } else {
      const login = await post('/auth/login', { institutionalEmail: s.email, password: s.password });
      studentUsers.push({ id: login.user?.id || login.id, token: login.accessToken, ...s });
    }
  }

  if (teacherUsers.length === 0 || studentUsers.length === 0) {
    console.error('No se pudieron crear los usuarios.');
    return;
  }

  const profArq = teacherUsers[0];
  
  // 3. Create Courses
  console.log('\n--- Creando Cursos de Sistemas ---');
  let courseId;
  const existingCourses = await get('/courses', profArq.token);
  const existingCourse = existingCourses?.courses?.find(c => c.name === 'Arquitectura de Software Avanzada');
  
  if (existingCourse) {
    console.log('El curso ya existe. Saltando inicialización para evitar duplicados.');
    console.log('\n✅ Seeder completado con éxito! (Datos ya existían)');
    return;
  }
  
  const courseRes = await post('/courses', {
    name: 'Arquitectura de Software Avanzada',
    description: 'Curso fundamental de sistemas distribuídos y microservicios.'
  }, profArq.token);
  
  if (!courseRes) {
    console.error('Falló creación de curso.');
    return;
  }
  courseId = courseRes.id || courseRes.course?.id;

  // 4. Enroll Students
  console.log(`\n--- Matriculando Estudiantes en Curso ${courseId} ---`);
  for (const s of studentUsers) {
    await post(`/courses/${courseId}/enroll`, {}, s.token);
  }

  // 5. Create Module
  console.log('\n--- Creando Módulos y Materiales ---');
  const modRes = await post(`/courses/${courseId}/modules`, {
    title: 'Módulo 1: Microservicios',
    description: 'Introducción a contenedores y orquestación',
    order: 1
  }, profArq.token);
  
  // 6. Create Evaluations
  console.log('\n--- Creando Evaluaciones ---');
  const evalRes = await post('/evaluations', {
    courseId,
    title: 'Quiz de Microservicios 1',
    type: 'quiz',
    weight: 0.3,
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
  }, profArq.token);
  
  const evalId = evalRes?.id;

  if (evalId) {
    // 7. Students attempt evaluations
    console.log(`\n--- Estudiantes realizando el intento de evaluación ${evalId} ---`);
    for (const [index, s] of studentUsers.entries()) {
      // Create attempt
      const attemptRes = await post(`/evaluations/${evalId}/attempts`, {
        studentId: s.id, courseId
      }, s.token);
      
      if (attemptRes && attemptRes.id) {
        const attemptId = attemptRes.id;
        
        // Start attempt
        await post(`/attempts/${attemptId}/start`, {}, s.token);
        
        // Submit attempt
        await post(`/attempts/${attemptId}/submit`, {
          answers: [{ q: '1', a: 'Docker' }]
        }, s.token);
        
        // Teacher grades attempt
        console.log(`Profesor califica intento de ${s.fullName}`);
        const score = 60 + (index * 15); // Scores: 60, 75, 90
        await post(`/attempts/${attemptId}/grade`, {
          score, feedback: 'Buen trabajo técnico.'
        }, profArq.token);
      }
    }
  }

  // 8. Collaboration (Forums & Posts)
  console.log('\n--- Creando Colaboraciones (Foros) ---');
  const forumRes = await post('/forums', {
    courseId,
    title: 'Dudas sobre Arquitectura Hexagonal',
    description: 'Espacio para discutir puertos y adaptadores'
  }, profArq.token);

  if (forumRes && forumRes.id) {
    const forumId = forumRes.id;
    await post(`/forums/${forumId}/posts`, {
      content: '¿Alguien me explica la diferencia entre puerto y adaptador?'
    }, studentUsers[0].token);
    
    await post(`/forums/${forumId}/posts`, {
      content: 'El puerto es la interfaz, el adaptador es la implementación concreta. ¡Saludos!'
    }, profArq.token);
  }

  // 9. Tutoring (Tutorías)
  console.log('\n--- Creando Tutorías ---');
  await post('/tutoring', {
    topic: 'Revisión de Proyecto Final de Microservicios',
    tutorId: profArq.id,
    tuteeId: studentUsers[1].id,
    courseId: courseId,
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    status: 'scheduled',
    meetingLink: 'https://meet.google.com/abc-defg-hij'
  }, studentUsers[1].token);

  // Wait for rabbitmq async events
  await delay(2000);

  // 10. Fetch Recommendations
  console.log('\n--- Consultando Recomendaciones del Motor Adaptativo ---');
  for (const s of studentUsers) {
    const recs = await get(`/recommendations/student/${s.id}`, s.token);
    console.log(`Recomendaciones para ${s.fullName}:`, recs?.recommendations?.length || 0);
  }

  console.log('\n✅ Seeder completado con éxito!');
}

seed().catch(console.error);
