# ✅ RF-04 COMPLETADO - Adaptive Service + RabbitMQ Consumer

**Fecha**: 31 Mayo 2026  
**Estado**: ✅ LISTO PARA TESTING  
**Próximo**: RF-05 Collaboration Service

---

## 📋 LO QUE SE IMPLEMENTÓ EN RF-04

### 1️⃣ **RabbitMQ Consumer**

- Escucha `evaluacion.completada.v1` en cola `adaptive-service.evaluacion.completada.v1`
- Normaliza payloads v1 y legacy envelope via `eventNormalizer.ts`
- Retries + DLQ observable:
  - Reintenta hasta 3 veces (header `x-retry-count`) republicando en `academic.events`
  - Si excede, publica a `academic.events.dlq` con routing key `evaluacion.completada.v1.dlq`
- Métricas internas: `processed`, `failed`, `lastProcessedAt`

### 2️⃣ **RecommendationEngine — Reglas pedagógicas**

| Score | Tipo | Scope |
|-------|------|-------|
| < 60% | `refuerzo` | `current_published_module` |
| 60–80% | `profundización` | `next_modules` |
| > 80% | `recurso_complementario` | `related_courses` |

### 3️⃣ **Redis Cache**

- Claves: `recommendations:{studentId}`, `dashboard:{courseId}`
- TTL: 300 segundos (5 min)
- Fallback in-memory si `REDIS_URL` no está configurado

### 4️⃣ **Circuit Breaker (opossum)**

- Threshold: 50% errores en ventana de 10s
- Timeout: 5s por operación
- Reset: 30s
- Fallback: recomendación genérica `recurso_complementario`
- HTTP 503 cuando circuito abierto en `GET /recommendations/student/:id`

### 5️⃣ **Publicación downstream**

- Evento `recomendacion.generada.v1` → notification-service
- Payload incluye `studentId`, `courseId`, `recommendationType` y `materials[]`

### 6️⃣ **Endpoints**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/recommendations/student/:studentId` | Recomendaciones del estudiante |
| GET | `/recommendations/metrics` | Métricas del consumer (teacher/admin) |
| GET | `/health` | Health check con flags RabbitMQ/Redis |

---

## 🔄 Flujo end-to-end

```
POST /attempts/:id/grade (assessment-service)
  → Guarda calificación sync (<2s)
  → HTTP 200 inmediato
  → evaluacion.completada.v1 (async)

adaptive-service consumer
  → normalizeEvaluationEvent()
  → computeRecommendation() + circuit breaker
  → PostgreSQL + Redis cache
  → recomendacion.generada.v1

notification-service consumer
  → createNotification() para el estudiante
```

---

## 🎬 Demo UC-01 (script 5 min)

### 0) Preparación (30s)

- Tener levantado el stack:

```bash
docker compose up -d postgres redis rabbitmq auth-service course-service assessment-service adaptive-service notification-service kong
```

- Base URL del gateway: `http://localhost:8000`

### 1) Crear usuarios y login (1 min)

1. Registrar estudiante y profesor:

```bash
curl -s -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d "{\"fullName\":\"Demo Student\",\"institutionalEmail\":\"student_demo@puj.edu.co\",\"password\":\"StudentPass123!\",\"role\":\"student\"}"
curl -s -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d "{\"fullName\":\"Demo Teacher\",\"institutionalEmail\":\"teacher_demo@puj.edu.co\",\"password\":\"TeacherPass123!\",\"role\":\"teacher\"}"
```

2. Login y capturar `accessToken` (uno por rol):

```bash
curl -s -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d "{\"institutionalEmail\":\"student_demo@puj.edu.co\",\"password\":\"StudentPass123!\"}"
curl -s -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d "{\"institutionalEmail\":\"teacher_demo@puj.edu.co\",\"password\":\"TeacherPass123!\"}"
```

### 2) Crear evaluación y attempt (1 min)

3. Crear evaluación (token profesor):

```bash
curl -s -X POST http://localhost:8000/evaluations -H "Authorization: Bearer <TEACHER_TOKEN>" -H "Content-Type: application/json" -d "{\"courseId\":\"course-demo\",\"title\":\"Demo Evaluation\",\"type\":\"quiz\",\"weight\":0.5,\"totalPoints\":100,\"passThreshold\":60,\"maxAttempts\":1}"
```

4. Crear attempt (token estudiante) para esa evaluación:

```bash
curl -s -X POST http://localhost:8000/evaluations/<EVALUATION_ID>/attempts -H "Authorization: Bearer <STUDENT_TOKEN>" -H "Content-Type: application/json" -d "{\"courseId\":\"course-demo\"}"
```

5. Iniciar y enviar attempt:

```bash
curl -s -X POST http://localhost:8000/attempts/<ATTEMPT_ID>/start -H "Authorization: Bearer <STUDENT_TOKEN>"
curl -s -X POST http://localhost:8000/attempts/<ATTEMPT_ID>/submit -H "Authorization: Bearer <STUDENT_TOKEN>" -H "Content-Type: application/json" -d "{\"answers\":{\"q1\":\"A\",\"q2\":\"B\"},\"timeSpentSeconds\":42}"
```

### 3) Calificar (<2s) y mostrar propagación async (2 min)

6. Calificar attempt (token profesor) y recalcar DR-01: respuesta inmediata (<2s) mientras el evento se procesa async:

```bash
curl -s -X POST http://localhost:8000/attempts/<ATTEMPT_ID>/grade -H "Authorization: Bearer <TEACHER_TOKEN>" -H "Content-Type: application/json" -d "{\"score\":92}"
```

7. Esperar 1–2s y consultar recomendaciones (token estudiante):

```bash
curl -s http://localhost:8000/recommendations/student/<STUDENT_ID> -H "Authorization: Bearer <STUDENT_TOKEN>"
```

8. Consultar notificaciones creadas por el consumer (token estudiante):

```bash
curl -s http://localhost:8000/notifications/user/<STUDENT_ID> -H "Authorization: Bearer <STUDENT_TOKEN>"
```

### 4) (Opcional) Mostrar resiliencia (30s)

- Circuit breaker / métricas (teacher/admin):

```bash
curl -s http://localhost:8000/recommendations/metrics -H "Authorization: Bearer <TEACHER_TOKEN>"
```

---

## 📁 Archivos clave

```
services/adaptive-service/
├── src/messaging/consumer.ts       # RabbitMQ consumer
├── src/messaging/eventNormalizer.ts
├── src/messaging/publisher.ts
├── src/rules/recommendationEngine.ts
├── src/services/recommendationService.ts  # Redis + opossum
├── src/domain/entities/Recommendation.ts
└── tests/recommendationEngine.test.ts

migrations/009_adaptive_service_schema.sql
```

---

## ⚙️ Variables de entorno

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
PORT=3000  # host: 3004 en docker-compose
```

---

## ✅ Criterios de aceptación

| Criterio | Estado |
|----------|--------|
| Consumer escucha evaluacion.completada | ✅ |
| Reglas pedagógicas por score | ✅ |
| Redis cache TTL 5min | ✅ |
| Circuit breaker con fallback | ✅ |
| Publica recomendacion.generada.v1 | ✅ |
| Manual grade republish (RF-03 fix) | ✅ |
| Puerto 3004 alineado con docker-compose | ✅ |

---

**RF-04**: ✅ COMPLETADO  
**Próximo**: RF-05 Foros + Colaboración
