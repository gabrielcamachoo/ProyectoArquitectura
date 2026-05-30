# Plataforma de Aprendizaje Adaptativo y Colaborativo

Implementación base del proyecto AS2026-10 (Grupo 2) con arquitectura de microservicios en Node.js + TypeScript, frontend React, Kong API Gateway, PostgreSQL, Redis y RabbitMQ.

## Estructura

- `services/` 8 microservicios de dominio
- `frontend/` SPA React 18 + TypeScript
- `migrations/` esquema SQL (expand-contract)
- `kong/kong.yml` configuración declarativa de gateway
- `terraform/` esqueleto de infraestructura AWS
- `docker-compose.yml` entorno local integral

## Variables de entorno

1. Copie `.env.example` a `.env`
2. Genere claves JWT RS256 y Kong (producción):

```bash
npm run kong:setup
```

Esto crea `kong/jwt-public.pem`, `kong/jwt-private.pem` (gitignored) y actualiza `.env` + `kong/kong.yml` con validación JWT obligatoria en el gateway.

## Levantamiento local

1. Copie `.env.example` a `.env` (si aún no existe).
2. Levante el stack (en Windows, si falla el build paralelo, use `COMPOSE_PARALLEL_LIMIT=2`):

```powershell
docker compose build
docker compose up -d
```

3. Verifique contenedores: `docker compose ps`

Servicios principales:
- Kong Proxy (API Gateway): `http://localhost:8000`
- Kong Admin: `http://localhost:8001`
- Frontend: `http://localhost:5173`
- Auth directo (sin gateway): `http://localhost:3000/health`
- RabbitMQ UI: `http://localhost:15672` (guest/guest)

## Uso de la plataforma (frontend)

1. Abra **http://localhost:5173**
2. Regístrese como **estudiante**, **docente** o **administrador**
3. Explore el panel según su rol:
   - **Estudiante:** cursos, evaluaciones, recomendaciones adaptativas, foros, notificaciones
   - **Docente:** gestión de cursos, calificación (activa el motor adaptativo vía RabbitMQ), analítica
   - **Administrador:** vista global y analítica

### Flujo demo (estudiante → docente)

1. Registre un **estudiante** y otro usuario **docente**
2. Como estudiante: **Evaluaciones** → *Iniciar intento* → *Enviar respuestas*
3. Como docente: **Evaluaciones** → calificar con una nota (ej. 45, 70 u 85)
4. Como estudiante: **Recomendaciones** (refuerzo / profundización / complementario según nota) y **Notificaciones**

Puertos de microservicios (acceso directo en desarrollo): 3000–3007.

### Funcionalidades adicionales

- **Tutorías** (`/app/tutorias`): agendar, listar y completar/cancelar sesiones entre pares
- **Ley 1581** (`/app/privacidad`): exportación de datos personales; panel admin con listado, exportación y supresión
- **Kong JWT (producción)**: rutas públicas solo `POST /auth/register`, `/auth/login`, `/auth/refresh`; el resto exige `Authorization: Bearer` con RS256 (`iss: auth-jwt-key`)

Sin claves JWT, Kong arranca en modo `kong.dev.yml` (sin validación en gateway).

## Ejecución de pruebas

En la raíz del repositorio:

```bash
npm install
npm run test
```

## Seguridad implementada

- JWT RS256 (1h), refresh token (TTL 7 días) y blacklist en Redis
- Middleware de RBAC en auth-service
- Logging estructurado JSON con correlation ID y sin PII en logs
- Esquema preparado para cifrado de PII en PostgreSQL usando `pgcrypto`
