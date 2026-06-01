# ✅ RF-04 COMPLETADO - Adaptive Service + RabbitMQ Consumer

**Fecha**: 31 Mayo 2026  
**Estado**: ✅ LISTO PARA TESTING  
**Próximo**: RF-05 Collaboration Service

---

## 📋 LO QUE SE IMPLEMENTÓ EN RF-04

### 1️⃣ **RabbitMQ Consumer**

- Escucha `evaluacion.completada.v1` en cola `adaptive-service.evaluacion.completada.v1`
- Normaliza payloads v1 y legacy envelope via `eventNormalizer.ts`
- DLQ: `academic.events.dlq` en errores (nack sin requeue)
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
- Payload incluye `user_id`, `type: recomendacion`, `content` (recomendación almacenada)

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
