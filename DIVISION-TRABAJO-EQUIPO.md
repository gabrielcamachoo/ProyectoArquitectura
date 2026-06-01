# 📋 División de Trabajo y Hoja de Ruta - Demo Final

Este documento consolida el estado actual del proyecto, la división de responsabilidades y las tareas críticas que cada miembro (o "Persona") debe ejecutar para asegurar el éxito en la sustentación y demo final del proyecto.

---

## 👁️ Vista Rápida de Roles

| Persona | Rol | Enfoque | Estado |
|---------|-----|---------|--------|
| **1 — Ustedes** | Core académico + motor adaptativo | RF-01 a RF-04, flujo evaluación → recomendación | ✅ Implementado — mantener y demostrar |
| **2 — Compañero A** | Frontend + integración | UI conectada al backend vía Kong | 🔴 Crítico para demo |
| **3 — Compañero B** | Colaboración + tutorías + RF-08 | Foros, WebSockets, analítica colaborativa | 🟡 Segundo bloque |
| **4 — Compañero C** | Analytics + infra + calidad | RF-07, migraciones, tests, fixes transversales | 🟡 Paralelo al frontend |

---

## 👤 PERSONA 1 — USTEDES (RF-01 a RF-04)
**Objetivo:** No retomar de RF-05 en adelante. Su trabajo es cerrar, documentar y sostener el flujo core en la demo.

### Ya implementado (No reimplementar)
| RF | Servicio | Entregables |
|----|----------|-------------|
| **RF-01** | `auth-service` | JWT RS256, RBAC, Ley 1581 (parcial), Redis blacklist |
| **RF-02** | `course-service` | CRUD cursos, módulos, materiales |
| **RF-03** | `assessment-service` | Evaluaciones, grading <2s, publish `evaluacion.completada.v1` |
| **RF-04** | `adaptive-service` | Consumer, reglas, Redis, opossum, publish `recomendacion.generada.v1` |

### Tareas suyas (Mantenimiento + Demo)
| # | Tarea | Archivo(s) | Prioridad |
|---|-------|------------|-----------|
| **1.1** | Verificar flujo E2E calificar → RabbitMQ → recomendación → notificación | `assessment-service`, `adaptive-service`, `notification-service` | 🔴 Demo |
| **1.2** | Documentar demo UC-01 (script 5 min) | `CORE_FLOW_RF01_RF04_DEMO.md` | 🔴 |
| **1.3** | Fix menor: GradeEntity en DataSource (si grading falla en PG) | `services/assessment-service/src/repositories/dataSource.ts` | 🟡 |
| **1.4** | Responder preguntas de sustentación sobre motor adaptativo y DR-01 | — | 🟢 |

**Demo que deben poder mostrar:**
`POST /attempts/:id/grade` → `evaluacion.completada.v1` → `adaptive-service genera recomendación` → `recomendacion.generada.v1` → `notification-service crea notificación` → `GET /recommendations/student/:id` (lista con tipo según score).

---

## 👤 PERSONA 2 — FRONTEND + INTEGRACIÓN API
**Objetivo:** Login funcional, páginas conectadas a Kong (`localhost:8000`), manejo de errores 401/403. Frontend navegable end-to-end vía Kong, sin llamadas directas a puertos 3000–3007.

### Tareas (Bloqueador #1 de la demo)
| # | Tarea | Archivo(s) | Est. |
|---|-------|------------|------|
| **2.1** | Corregir contrato auth: `email` → `institutionalEmail`, `token` → `accessToken` | `frontend/src/services/api.ts` | 1h |
| **2.2** | Rutas Ley 1581: `/users/` → `/auth/users/` | `frontend/src/services/api.ts`, `PrivacyPage.tsx` | 30min |
| **2.3** | listUsers: esperar `{ users }` no `{ items }` | `frontend/src/services/api.ts` | 15min |
| **2.4** | Refresh token automático en AuthContext | `frontend/src/context/AuthContext.tsx`, `api.ts` | 1–2h |
| **2.5** | Interceptor 401 → logout + redirect login | `frontend/src/services/api.ts` | 1h |
| **2.6** | Interceptor 403 → mensaje “acceso denegado” | `frontend/src/services/api.ts` | 30min |
| **2.7** | Probar y ajustar páginas por rol | `frontend/src/pages/*.tsx` | 2–3h |
| **2.8** | E2E UI: login español, rutas `/app/*` (no `/dashboard`) | `tests/e2e/auth.spec.ts`, `courses.spec.ts` | 1–2h |

**Páginas a validar por rol:**
- **Estudiante**: Dashboard, Cursos, Evaluaciones, Recomendaciones, Colaboración, Tutorías, Notificaciones.
- **Profesor**: + Crear curso/evaluación, Calificar, Analytics.
- **Admin**: + Tabla usuarios en Privacidad.

_*Depende de:* Persona 4 (fix Kong `/auth/users` coordinar antes de probar admin vía gateway)._

---

## 👤 PERSONA 3 — COLABORACIÓN + TUTORÍAS + RF-08 SAD
**Objetivo:** Foros/tutorías demostrables + reporte UC-08 de engagement colaborativo. Las bases de RF-05 y RF-06 están; falta cerrar calidad e implementar analítica.

### Tareas
| # | Tarea | Archivo(s) | Est. |
|---|-------|------------|------|
| **3.1** | JWT en WebSocket (validar token al conectar) | `services/collaboration-service/src/websocket.ts` | 1–2h |
| **3.2** | RBAC: solo teacher/admin crean foros; students solo posts | `collaboration-service/src/routes/index.ts`, `middleware/auth.ts` | 1h |
| **3.3** | Publicar evento al crear post → notificación | Nuevo publisher + bind en `notification-service` | 2h |
| **3.4** | RF-08 SAD: endpoint analítica colaborativa | Nuevo en `analytics-service` o `collaboration-service` | 2–3h |
| **3.5** | Vista SQL participación foros (posts/usuario/curso) | `migrations/011_collaboration_analytics.sql` | 1h |
| **3.6** | E2E colaboración + tutorías | `tests/e2e/collaboration.spec.ts` (nuevo) | 2h |
| **3.7** | OpenAPI actualizado con `/tutoring/match` y analytics colaborativo | `collaboration-service/openapi.yaml` | 30min |

**RF-08 — Analítica Colaborativa (propuesta mínima):**
`GET /analytics/collaboration/course/:courseId`
→ `{ total_posts, active_participants, top_contributors[], forum_engagement_rate }`

_*Depende de:* Persona 1 (notificaciones operativas) y Persona 2 (vistas conectadas)._

---

## 👤 PERSONA 4 — ANALYTICS + INFRA + CALIDAD + FIXES TRANSVERSALES
**Objetivo:** Analytics con datos reales (no solo demo), migraciones coherentes, Kong alineado, tests verdes. Desbloquea a todo el equipo.

### Tareas
| # | Tarea | Archivo(s) | Est. |
|---|-------|------------|------|
| **4.1** | Fix requireSelfOrRole: `:userId` en lugar de `:id` | `services/auth-service/src/middleware/auth.ts` | 15min |
| **4.2** | Kong: `/users` → `/auth/users` | `kong/kong.template.yml`, rebuild `kong.yml` | 30min |
| **4.3** | Reparar vistas analytics (`assessments`→`evaluations`, `user_id`→`student_id`) | `migrations/005_analytics_views.sql` | 1h |
| **4.4** | Unificar schema recommendations (001 vs 009) | `migrations/009_adaptive_service_schema.sql` o `ALTER` | 1h |
| **4.5** | Analytics lee cache Redis `dashboard:{courseId}` | `analytics-service/src/services/cqrsService.ts` | 1–2h |
| **4.6** | Healthchecks docker postgres/redis/rabbitmq | `docker-compose.yml` | 1h |
| **4.7** | Fix puerto E2E progress: 3004 → 3003 | `tests/e2e/progress.spec.ts` | 5min |
| **4.8** | Agregar `express-rate-limit` | `package.json` de courses y assessments | 15min |
| **4.9** | E2E: notifications, privacy/Ley 1581, analytics datos reales | `tests/e2e/` (nuevos specs) | 2–3h |
| **4.10**| Middleware audit_log básico (opcional) | Nuevo middleware `auth-service` | 2h |

_*Desbloquea a:* Persona 2 (Kong/1581), Persona 3 (Vistas SQL), Persona 1 (Fix DB Grading).*

---

## 📅 Cronograma Sugerido (Paralelo) y Dependencias

| Sprint / Tareas | Día 1-2 | Día 3-4 | Día 5+ |
|-----------------|----------|---------|--------|
| **Persona 1 (Ustedes)** | Demo UC-01 | Soporte | Sustentación prep |
| **Persona 2 (Frontend)**| api.ts fix | Páginas | E2E UI |
| **Persona 3 (Colab)** | WebSocket | RF-08 | E2E collab |
| **Persona 4 (QA/Infra)**| auth+Kong | Migraciones | Tests E2E |

**Orden de prioridades en bloqueos funcionales:**
1. Persona 4 (Kong fix + auth fix + migraciones)
2. Persona 1 (Mantiene y prueba Flujo RF-03→04 para la demo)
3. Persona 2 (Frontend api.ts)
4. Persona 3 (RF-08 + WebSocket)

---

## ✅ Checklist de Demo Integrada (4 personas)

| Flujo a Demostrar | Responsable Principal |
|-------------------|-----------------------|
| **UC-01** Eval → Recomendación | Persona 1 |
| **UC-02** Dashboard profesor | Persona 4 + Persona 2 (UI) |
| **UC-04** RBAC rechazado | Persona 4 (tests) / Persona 2 (UI) |
| **UC-05** Circuit breaker | Persona 1 |
| **UC-07** Tutoría | Persona 3 + Persona 2 |
| **UC-08** Reporte foros | Persona 3 |
| Login UI → app completa | Persona 2 |
| Ley 1581 export propio usuario | Persona 4 + Persona 2 |

---
> 💡 **Nota para pegar en el grupo**: "Equipo, aquí está la división. Persona 1 (nosotros) tenemos de RF-01 a RF-04 listos y cerramos nuestro bloque de demo. Persona 2, tu meta es arreglar la API Frontend (crítico). Persona 3 encárgate de colaboración, WebSocket y RF-08. Y Persona 4 infraestructura, endpoints, vistas de analytics y habilitar Kong para que Persona 2 pueda integrar. Ver el archivo en el repo para todo el detalle."