# 🎓 Plataforma Adaptativa de Aprendizaje - Microservicios

**Universidad Javeriana - PUJ AS 2026**

Plataforma educativa con 8 microservicios Node.js, frontend React, y motor de recomendaciones inteligentes basado en pedagogía adaptativa.

---

## 📚 DOCUMENTACIÓN

### 🟢 **Comienza aquí**
- **[EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md)** - Resumen de lo que se entregó (5 min read)
- **[QUICK_START.sh](QUICK_START.sh)** - Comandos rápidos para iniciar

### 🟡 **Guías Completas**
- **[COMPLETE_PROJECT_GUIDE.md](COMPLETE_PROJECT_GUIDE.md)** - Guía exhaustiva con todos los detalles (30+ min read)
- **[VALIDATION_CHECKLIST.md](VALIDATION_CHECKLIST.md)** - Checklist de validación paso a paso

### 🔵 **Documentación Técnica**
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Referencia de APIs, autenticación, RBAC
- **[services/*/openapi.yaml](services/)** - OpenAPI 3.0.3 specs para cada servicio
- **[Swagger UI](http://localhost:3000/docs)** - Interfaz interactiva (después de levantar servicios)

---

## 🚀 INICIO RÁPIDO (3 pasos)

### Paso 1: Instalar
```bash
npm install
npm run keys:generate
```

### Paso 2: Levantar
```bash
docker-compose up -d
# Esperar 30-60 segundos
docker-compose ps  # Verificar que todo está UP
```

### Paso 3: Testear
```bash
npm run test:e2e
npx playwright show-report  # Ver resultados
```

**✅ Listo** - Todo debe pasar sin errores

---

## 📋 QUÉ INCLUYE

### Backend (8 Microservicios)
- ✅ **auth-service** (3000) - JWT RS256, RBAC, Ley 1581
- ✅ **course-service** (3001) - Cursos, módulos, materiales
- ✅ **assessment-service** (3002) - Evaluaciones, calificación async (<2s)
- ✅ **adaptive-service** (3003) - Motor recomendaciones, circuit breaker
- ✅ **progress-service** (3004) - Seguimiento de progreso
- ✅ **collaboration-service** (3005) - Foros, grupos estudio
- ✅ **analytics-service** (3006) - Dashboard CQRS + read-replica
- ✅ **notification-service** (3007) - Notificaciones

### Frontend
- ✅ **React 19 + TypeScript + Vite** (5173)
- ✅ Todas las páginas: Login, Courses, Evaluations, Analytics, etc.
- ✅ JWT token management + refresh

### Infraestructura
- ✅ PostgreSQL 16 (primaria + read-replica)
- ✅ Redis 7 (caché distribuido)
- ✅ RabbitMQ 3.13 (message queue)
- ✅ Kong 3.7 (API Gateway)

### Testing
- ✅ **53 tests E2E** con Playwright
- ✅ Validación de DR-01 (<2s gradeAttempt)
- ✅ RBAC enforcement verification
- ✅ Critical flows coverage

---

## 🔍 ESTRUCTURA DE CARPETAS

```
ProyectoArquitectura/
├── README.md                    ← Estás aquí
├── EXECUTIVE_SUMMARY.md         ← Resumen ejecutivo
├── COMPLETE_PROJECT_GUIDE.md    ← Guía completa (⭐ LEER ESTO)
├── VALIDATION_CHECKLIST.md      ← Checklist de validación
├── QUICK_START.sh               ← Comandos rápidos
├── playwright.config.ts         ← Config Playwright
├── docker-compose.yml           ← Infraestructura
├── API_DOCUMENTATION.md         ← Docs APIs
├── package.json                 ← Root + E2E scripts
├── services/                    ← 8 microservicios
│   ├── auth-service/
│   ├── course-service/
│   ├── assessment-service/
│   ├── adaptive-service/
│   ├── progress-service/
│   ├── collaboration-service/
│   ├── notification-service/
│   └── analytics-service/
├── frontend/                    ← React app
├── tests/e2e/                   ← 53 E2E tests
├── migrations/                  ← SQL migrations
├── terraform/                   ← IaC para AWS
└── keys/                        ← JWT keys (generadas)
```

---

## 🎯 NEXT STEPS

### Para Ejecutar
1. Lee [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md) (5 min)
2. Sigue [QUICK_START.sh](QUICK_START.sh) (comandos)
3. Valida con [VALIDATION_CHECKLIST.md](VALIDATION_CHECKLIST.md)

### Para Entender Todo
1. Lee [COMPLETE_PROJECT_GUIDE.md](COMPLETE_PROJECT_GUIDE.md) (completo)
2. Explora [API_DOCUMENTATION.md](API_DOCUMENTATION.md) (APIs)
3. Mira [services/*/openapi.yaml](services/) (specs)

### Para Debugging
1. Ver logs: `docker-compose logs -f <service>`
2. Health check: `curl http://localhost:PORT/health`
3. Swagger UI: `http://localhost:PORT/docs`

---

## 📊 ESTADO DEL PROYECTO

| Área | Status |
|------|--------|
| 8 Microservicios | ✅ Completo |
| Frontend React | ✅ Completo |
| Autenticación JWT | ✅ Completo |
| RBAC Enforcement | ✅ Completo |
| E2E Tests (53) | ✅ Completo |
| OpenAPI Specs | ✅ Completo |
| Swagger UI | ✅ Completo |
| Docker Compose | ✅ Completo |
| Documentación | ✅ Completo |

**Estado**: ✅ LISTO PARA PRODUCCIÓN

---

## 🔒 Seguridad

- ✅ JWT RS256 (autenticación asimétrica)
- ✅ RBAC con 3 roles (student, teacher, admin)
- ✅ Token blacklist en Redis
- ✅ Rate limiting (Kong: 100 req/min)
- ✅ Ley 1581 endpoints (GDPR-like)
- ✅ Encrypted PII (BYTEA columns)

---

## ⚡ Performance

- ✅ **DR-01** (<2s P95): gradeAttempt sin bloquear en RabbitMQ
- ✅ **Async Events**: Evaluación → RabbitMQ → Recomendaciones
- ✅ **Read Replica**: Analytics consulta replica, no primaria
- ✅ **Circuit Breaker**: Opossum con fallback graceful
- ✅ **Redis Cache**: TTL 5min (recommendations), 7d (tokens)

---

## 🐳 Docker Compose

```bash
# Levantar todo
docker-compose up -d

# Ver status
docker-compose ps

# Logs
docker-compose logs -f

# Detener
docker-compose down
```

Servicios disponibles:
- Frontend: http://localhost:5173
- APIs: http://localhost:3000-3007
- Kong Gateway: http://localhost:8000
- RabbitMQ Admin: http://localhost:15672 (guest/guest)
- PostgreSQL: localhost:5432

---

## 🧪 Testing

```bash
# Run all 53 E2E tests
npm run test:e2e

# UI Mode (interactivo)
npm run test:e2e:ui

# Debug Mode
npm run test:e2e:debug

# Suite específica
npx playwright test tests/e2e/critical-flows.spec.ts

# Ver reporte
npx playwright show-report
```

---

## 📞 Soporte

### Documentación
- COMPLETE_PROJECT_GUIDE.md - Guía exhaustiva
- VALIDATION_CHECKLIST.md - Validación paso a paso
- API_DOCUMENTATION.md - APIs y ejemplos

### Commands
- Logs: `docker-compose logs -f`
- Health: `curl http://localhost:PORT/health`
- Swagger: `http://localhost:PORT/docs`

### Common Issues
Ver sección "Troubleshooting" en COMPLETE_PROJECT_GUIDE.md

---

## 📝 Archivos Documentación

| Archivo | Propósito | Leer si... |
|---------|-----------|-----------|
| **EXECUTIVE_SUMMARY.md** | Resumen de lo entregado | Necesitas overview rápido |
| **COMPLETE_PROJECT_GUIDE.md** | Guía completa y exhaustiva | Quieres entenderlo TODO |
| **QUICK_START.sh** | Comandos para iniciar | Solo quieres copy-paste |
| **VALIDATION_CHECKLIST.md** | Checklist de validación | Necesitas verificar que funciona |
| **API_DOCUMENTATION.md** | Referencia de APIs | Necesitas info de endpoints |

---

## 🚀 Deploy a Azure (Opcional)

```bash
# Terraform
cd terraform
terraform plan
terraform apply

# Docker push a ACR
docker tag adaptive-learning/auth-service:latest \
  <acr-name>.azurecr.io/adaptive-learning/auth-service:latest
docker push <acr-name>.azurecr.io/adaptive-learning/auth-service:latest
```

Ver COMPLETE_PROJECT_GUIDE.md sección "DEPLOYMENT A AZURE" para más detalles.

---

## 📈 Requisitos Completados

### Funcionales ✅
- 8 microservicios operacionales
- CRUD completo (cursos, evaluaciones, progreso)
- Autenticación y autorización
- Motor recomendaciones
- Dashboard analytics
- Message queue RabbitMQ
- API Gateway Kong

### No-Funcionales ✅
- **DR-01**: <2s P95 gradeAttempt ✅
- **DR-02**: 99.5% uptime (circuit breaker + fallback)
- **DR-03**: Seguridad JWT + RBAC + Ley 1581
- Escalabilidad (microservicios + read-replica)
- Resiliencia (hybrid fallback)

### Testing ✅
- 53 tests E2E
- DR-01 validation
- RBAC enforcement
- Critical flows coverage

---

## ✨ Resumen

**Entregables:**
- ✅ 8 microservicios + frontend
- ✅ E2E testing suite (53 tests)
- ✅ OpenAPI docs + Swagger UI
- ✅ Guía completa de desarrollo

**Tests:**
- ✅ 53 tests E2E pasando
- ✅ 0 fallos
- ✅ DR-01 validado (<2s)

**Documentación:**
- ✅ COMPLETE_PROJECT_GUIDE.md (600+ líneas)
- ✅ EXECUTIVE_SUMMARY.md
- ✅ VALIDATION_CHECKLIST.md
- ✅ API_DOCUMENTATION.md
- ✅ 8 OpenAPI YAML specs
- ✅ Swagger UI interactivo

---

## 🎓 ¿Por dónde empiezo?

1. **5 minutos**: Lee [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md)
2. **15 minutos**: Ejecuta `docker-compose up -d && npm run test:e2e`
3. **30 minutos**: Lee [COMPLETE_PROJECT_GUIDE.md](COMPLETE_PROJECT_GUIDE.md)
4. **60+ minutos**: Explora código, mira Swagger UI, debugea si es necesario

---

**Versión**: 1.0.0 - FINAL
**Fecha**: 31 Mayo 2026
**Estado**: ✅ LISTO PARA PRODUCCIÓN

Cualquier pregunta, revisar COMPLETE_PROJECT_GUIDE.md sección "Troubleshooting".

¡Bienvenido a la Plataforma Adaptativa de Aprendizaje! 🎓
