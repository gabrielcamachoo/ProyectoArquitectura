# ✅ VALIDATION CHECKLIST - PRE-LAUNCH

Usa esta checklist para verificar que todo está funcionando correctamente antes de considerar el proyecto completado.

---

## 🔧 PREREQUISITES CHECK

- [ ] Node.js v20+ instalado
  ```bash
  node --version  # Debe ser v20.x.x o superior
  ```

- [ ] npm v10+ instalado
  ```bash
  npm --version   # Debe ser 10.x.x o superior
  ```

- [ ] Docker instalado y ejecutándose
  ```bash
  docker --version
  docker ps       # No debe dar error
  ```

- [ ] Docker Compose instalado
  ```bash
  docker-compose --version  # Debe ser 2.x.x o superior
  ```

- [ ] Git instalado
  ```bash
  git --version
  ```

---

## 📦 SETUP CHECK

- [ ] Dependencias instaladas
  ```bash
  npm install
  npm list @playwright/test  # Debe estar listado
  ```

- [ ] Claves JWT generadas
  ```bash
  ls keys/private.key  # Debe existir
  ls keys/public.key   # Debe existir
  ```

- [ ] Variables de entorno configuradas
  ```bash
  # Cada servicio debe tener .env
  ls services/auth-service/.env
  ls services/course-service/.env
  # ... etc
  ```

- [ ] Kong configurado
  ```bash
  ls kong/kong.yml
  ls kong/kong.dev.yml
  ```

---

## 🐳 DOCKER COMPOSE CHECK

- [ ] Servicios levantados
  ```bash
  docker-compose up -d
  docker-compose ps
  
  # Debe mostrar (todos con STATUS "Up"):
  # postgres          - DB primaria
  # postgres-replica  - DB read-replica
  # redis             - Caché
  # rabbitmq          - Message broker
  # kong              - API Gateway
  # auth-service      - Puerto 3000
  # course-service    - Puerto 3001
  # assessment-service - Puerto 3002
  # adaptive-service   - Puerto 3003
  # progress-service   - Puerto 3004
  # collaboration-service - Puerto 3005
  # analytics-service  - Puerto 3006
  # notification-service - Puerto 3007
  # frontend          - Puerto 5173
  ```

- [ ] Servicios responden a health check
  ```bash
  curl http://localhost:3000/health
  # Response: {"service":"auth-service","status":"ok"}
  
  curl http://localhost:3001/health
  # Response: {"service":"course-service","status":"ok"}
  
  # Repetir para 3002-3007
  ```

- [ ] PostgreSQL disponible
  ```bash
  psql -U admin -h localhost -d adaptive_learning -c "SELECT 1"
  # Debe responder: 1
  ```

- [ ] Redis disponible
  ```bash
  redis-cli ping
  # Response: PONG
  ```

- [ ] RabbitMQ disponible
  ```bash
  curl http://localhost:15672/api/connections \
    -u guest:guest
  # Debe responder con JSON
  ```

- [ ] Kong disponible
  ```bash
  curl http://localhost:8001/status
  # Debe responder con status JSON
  ```

- [ ] Frontend accesible
  ```bash
  curl http://localhost:5173
  # Debe responder con HTML
  ```

---

## 🔐 AUTHENTICATION CHECK

- [ ] Registro funciona
  ```bash
  curl -X POST http://localhost:3000/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "fullName":"Test User",
      "institutionalEmail":"test@puj.edu.co",
      "password":"TestPass123!"
    }'
  # Response: {"id":"...", "fullName":"Test User", ...}
  # Status: 201
  ```

- [ ] Login funciona
  ```bash
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "institutionalEmail":"test@puj.edu.co",
      "password":"TestPass123!"
    }'
  # Response: {"accessToken":"...", "refreshToken":"..."}
  # Status: 200
  ```

- [ ] JWT RS256 válido
  ```bash
  # Verificar que token tiene algoritmo RS256
  # Decodificar token en https://jwt.io
  # Debe mostrar: "alg":"RS256"
  ```

- [ ] Refresh token funciona
  ```bash
  curl -X POST http://localhost:3000/auth/refresh \
    -H "Content-Type: application/json" \
    -d '{"refreshToken":"<refresh-token-here>"}'
  # Response: {"accessToken":"...", "refreshToken":"..."}
  # Status: 200
  ```

---

## 📚 API ENDPOINTS CHECK

- [ ] GET /courses funciona
  ```bash
  curl http://localhost:3001/courses
  # Response: Array o empty array []
  # Status: 200
  ```

- [ ] POST /courses requiere RBAC
  ```bash
  # Sin token
  curl -X POST http://localhost:3001/courses \
    -H "Content-Type: application/json" \
    -d '{"name":"Test"}'
  # Status: 401
  
  # Con token de estudiante
  curl -X POST http://localhost:3001/courses \
    -H "Authorization: Bearer <student-token>" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test"}'
  # Status: 403 (Forbidden - estudiantes no pueden crear cursos)
  ```

- [ ] GET /health en todos los puertos
  ```bash
  for port in 3000 3001 3002 3003 3004 3005 3006 3007; do
    echo "Port $port:"
    curl -s http://localhost:$port/health | jq .
  done
  # Todos deben responder con {"service":"...", "status":"ok"}
  ```

---

## 📖 SWAGGER UI CHECK

- [ ] Auth Service Swagger UI
  ```
  http://localhost:3000/docs
  ```
  - [ ] Interfaz cargue sin errores
  - [ ] Pueda expandir endpoints
  - [ ] Raw spec disponible en /openapi.json

- [ ] Course Service Swagger UI
  ```
  http://localhost:3001/docs
  ```
  - [ ] Interfaz cargue
  - [ ] Try it out disponible

- [ ] Otros 6 servicios Swagger UI
  ```
  http://localhost:3002/docs
  http://localhost:3003/docs
  http://localhost:3004/docs
  http://localhost:3005/docs
  http://localhost:3006/docs
  http://localhost:3007/docs
  ```
  - [ ] Todos deben cargar

---

## 🧪 E2E TESTS CHECK

### Pre-requisites
- [ ] Docker Compose está ejecutando (`docker-compose ps` muestra todo UP)
- [ ] Frontend está en http://localhost:5173
- [ ] Todos los servicios responden a /health

### Run Tests
- [ ] Tests corren sin timeout
  ```bash
  npm run test:e2e
  # No debe dar timeout (default 30s por test)
  ```

- [ ] 53 tests esperados pasan
  ```bash
  # Output debe mostrar:
  # 53 passed
  # 0 failed
  # 0 skipped
  ```

### Specific Test Suites
- [ ] auth.spec.ts (5 tests)
  ```bash
  npx playwright test tests/e2e/auth.spec.ts
  ```

- [ ] courses.spec.ts (7 tests)
  ```bash
  npx playwright test tests/e2e/courses.spec.ts
  ```

- [ ] assessment.spec.ts (8 tests)
  ```bash
  npx playwright test tests/e2e/assessment.spec.ts
  ```

- [ ] recommendations.spec.ts (5 tests)
  ```bash
  npx playwright test tests/e2e/recommendations.spec.ts
  ```

- [ ] progress.spec.ts (5 tests)
  ```bash
  npx playwright test tests/e2e/progress.spec.ts
  ```

- [ ] analytics.spec.ts (5 tests)
  ```bash
  npx playwright test tests/e2e/analytics.spec.ts
  ```

- [ ] rbac.spec.ts (10 tests)
  ```bash
  npx playwright test tests/e2e/rbac.spec.ts
  ```

- [ ] critical-flows.spec.ts (8 tests)
  ```bash
  npx playwright test tests/e2e/critical-flows.spec.ts
  ```

### Critical Requirements Validation

- [ ] **DR-01 VALIDATION** (<2s P95)
  ```bash
  # En el output debe mostrar:
  # ✅ CRITICAL: gradeAttempt returned in XXXms (target: <2000ms P95)
  # XXX debe ser < 2000
  ```

- [ ] **RBAC VALIDATION**
  ```bash
  # Tests deben pasar RBAC checks:
  # - Student cannot create courses (403)
  # - Student cannot create evaluations (403)
  # - Student cannot access analytics (403)
  # - Teacher can create courses/evaluations
  # - Admin can access everything
  ```

- [ ] **Async Processing VALIDATION**
  ```bash
  # Test debe confirmar:
  # ✅ Evaluation completion triggers async RabbitMQ without blocking
  # ✅ Grading event propagates to recommendations asynchronously
  ```

### Test Artifacts
- [ ] Reporte HTML generado
  ```bash
  npx playwright show-report
  # Debe abrir en navegador con:
  # - Summary de tests
  # - Screenshots de fallos
  # - Traces (video de ejecución)
  # - Tiempos
  ```

- [ ] Todos los tests pasan sin screenshots
  ```bash
  # screenshots/ directory debe estar vacío o no existir
  # (Solo se toman screenshots en fallos)
  ```

---

## 🔄 CRITICAL FLOWS CHECK

### Complete Student Workflow
- [ ] Register → 201
- [ ] Login → 200 + tokens
- [ ] View Courses → 200 + courses array
- [ ] View Progress → 200
- [ ] View Recommendations → 200

### Teacher Workflow
- [ ] Register as teacher → 201
- [ ] Login → 200 + tokens
- [ ] Create Course → 201
- [ ] Add Module → 201
- [ ] Create Evaluation → 201
- [ ] Grade Attempt → 200 (<2s)

### Admin Workflow
- [ ] Register as admin → 201
- [ ] Login → 200
- [ ] View Analytics → 200 (fast, <1s via read-replica)
- [ ] View All Users → 200

### Event Processing Flow
- [ ] Student submits eval attempt
- [ ] Teacher grades attempt (immediately returns <2s)
- [ ] RabbitMQ event publishes async
- [ ] Adaptive-service consumer receives event
- [ ] Recommendations generated and cached in Redis
- [ ] Student can fetch recommendations

---

## 💾 DATABASE CHECK

### PostgreSQL Primaria
```bash
psql -U admin -h localhost -d adaptive_learning

# Verificar tablas existen:
SELECT table_name FROM information_schema.tables WHERE table_schema='public';

# Tablas esperadas:
# - users
# - roles
# - permissions
# - courses
# - modules
# - materials
# - evaluations
# - attempts
# - progress_records
# - forums
# - forum_posts
# - study_groups
# - tutoring_sessions
# - notifications
```

- [ ] Todas las tablas existen
- [ ] Índices creados correctamente
  ```bash
  SELECT indexname FROM pg_indexes WHERE schemaname='public';
  ```
- [ ] Constraints aplicados
  ```bash
  SELECT constraint_name FROM information_schema.table_constraints 
  WHERE table_schema='public';
  ```

### PostgreSQL Read-Replica
```bash
psql -U admin -h localhost -p 5433 -d adaptive_learning

# Debe ser read-only replica
SELECT 1;  # Debe funcionar
```

- [ ] Read-replica responde a queries
- [ ] Analytics-service usa read-replica (DATABASE_READ_URL)

### Redis
```bash
redis-cli

# Ver claves en caché
KEYS *

# Ver token-blacklist
KEYS token-blacklist:*

# Ver recommendations
KEYS recommendations:*

# Ver refresh-tokens
KEYS refresh-token:*
```

- [ ] Claves existen
- [ ] TTLs configurados correctamente
  ```bash
  TTL recommendations:student-123  # Debe ser ~300s
  TTL refresh-token:xyz            # Debe ser ~604800s (7d)
  ```

---

## 📝 DOCUMENTATION CHECK

- [ ] COMPLETE_PROJECT_GUIDE.md existe
  ```bash
  ls COMPLETE_PROJECT_GUIDE.md
  wc -l COMPLETE_PROJECT_GUIDE.md  # Debe tener 600+ líneas
  ```

- [ ] EXECUTIVE_SUMMARY.md existe
  ```bash
  ls EXECUTIVE_SUMMARY.md
  ```

- [ ] API_DOCUMENTATION.md existe
  ```bash
  ls API_DOCUMENTATION.md
  wc -l API_DOCUMENTATION.md  # Debe tener 500+ líneas
  ```

- [ ] OpenAPI YAML files existen
  ```bash
  ls services/*/openapi.yaml
  # Debe haber 8 archivos
  ```

- [ ] Swagger UI accessible en todos
  ```bash
  # Cada URL debe cargar (8 servicios)
  for port in 3000 3001 3002 3003 3004 3005 3006 3007; do
    echo -n "Port $port: "
    curl -s http://localhost:$port/openapi.json > /dev/null && \
      echo "✓" || echo "✗"
  done
  ```

---

## 🚀 DEPLOYMENT CHECK

- [ ] Dockerfile existe para cada servicio
  ```bash
  for dir in services/*/; do
    echo -n "$(basename $dir): "
    test -f "$dir/Dockerfile" && echo "✓" || echo "✗"
  done
  ```

- [ ] docker-compose.yml válido
  ```bash
  docker-compose config > /dev/null && echo "✓ Valid" || echo "✗ Invalid"
  ```

- [ ] .env files no están en git
  ```bash
  git status | grep -i ".env" && echo "⚠️  .env tracked!" || echo "✓ Not tracked"
  ```

- [ ] Terraform files exist
  ```bash
  ls terraform/main.tf
  ls terraform/variables.tf
  terraform -chdir=terraform/ validate
  ```

---

## 📊 LOGS CHECK

- [ ] Sin errores críticos
  ```bash
  docker-compose logs | grep -i "error\|fatal\|panic"
  # Debe retornar líneas vacías o solo warnings
  ```

- [ ] Todos los servicios iniciaron exitosamente
  ```bash
  docker-compose logs | grep "Listening on port"
  # Debe haber 8 líneas (8 servicios)
  ```

- [ ] RabbitMQ consumer conectado
  ```bash
  docker-compose logs adaptive-service | grep -i "listening\|consumer\|queue"
  ```

- [ ] Health checks pasen
  ```bash
  docker-compose logs | grep -i "health"
  ```

---

## 🎯 FINAL VALIDATION

**Checklist Completo = Proyecto Listo ✅**

Si todas las casillas arriba están marcadas:

```bash
echo "✅ PROYECTO LISTO PARA PRODUCCIÓN"
echo ""
echo "Próximos pasos:"
echo "1. Revisar logs: docker-compose logs -f"
echo "2. Ejecutar tests: npm run test:e2e"
echo "3. Ver reporte: npx playwright show-report"
echo "4. Deploy a Azure (si aplica)"
```

---

## ⚠️ COMMON ISSUES

| Problema | Solución |
|----------|----------|
| Puerto ocupado | `lsof -i :3000` y `kill -9 <PID>` |
| DB no conecta | Verificar DATABASE_URL en .env |
| Tests timeout | Aumentar timeout en playwright.config.ts |
| RabbitMQ error | Ver `docker-compose logs rabbitmq` |
| JWT inválido | Regenerar: `npm run keys:generate` |
| Redis error | `redis-cli ping` debe responder PONG |

---

**Última actualización**: 31 Mayo 2026
**Estado**: Validation Checklist v1.0

