# Cómo ejecutar el proyecto (local / desarrollo)

Este documento describe los pasos mínimos para ejecutar el frontend y los microservicios del proyecto en tu máquina local (o en un Codespace / Dev Container). Incluye levantado con Docker Compose (recomendado) y ejecución del frontend en modo desarrollo.

---

## Requisitos

- Docker & Docker Compose (o `docker compose`) instalado
- Node.js >= 18 y npm (para ejecutar frontend localmente)
- (Opcional) `jq` para formatear JSON en ejemplos de curl

---

## Preparación

1. Copia el archivo de ejemplo de variables de entorno y ajústalo si hace falta:

```bash
cp .env.example .env
# editar .env si necesitas credenciales o cambiar contraseñas
```

2. (Opcional) Generar claves JWT para Kong (recomendado para usar gateway con validación)

```bash
node scripts/generate-jwt-keys.mjs
```

Esto añade/actualiza `.env` y genera `kong/jwt-public.pem` y `kong/jwt-private.pem`.

---

## Levantar toda la pila (Docker Compose) — recomendado

En la raíz del repo ejecuta:

```bash
# construye imágenes y levanta servicios en background
docker compose up -d --build
```

(En sistemas con `docker-compose` legacy usar `docker-compose up -d --build`).

Ver estado de servicios:

```bash
docker compose ps
```

Monitorear logs de un servicio (ejemplo `frontend` o `auth-service`):

```bash
docker compose logs -f frontend
docker compose logs -f auth-service
```

Para parar y eliminar contenedores:

```bash
docker compose down
```

---

## Puertos y URLs (por defecto en `docker-compose.yml`)

- Frontend (dev / preview): http://localhost:5173
  - Landing: `/` → http://localhost:5173/
  - Login: `/login` → http://localhost:5173/login
  - Área app autenticada: `/app` → http://localhost:5173/app
- Kong (API Gateway / proxy): http://localhost:8000
- Kong Admin: http://localhost:8001

Servicios (acceso directo; normalmente se usan a través del gateway):
- Auth: http://localhost:3000
- Course: http://localhost:3001
- Assessment: http://localhost:3002
- Progress: http://localhost:3003
- Adaptive: http://localhost:3004
- Collaboration: http://localhost:3005
- Analytics: http://localhost:3006
- Notification: http://localhost:3007

Infra:
- Postgres: 5432
- Redis: 6379
- RabbitMQ: 5672 (AMQP) y 15672 (management UI)

---

## Ejecutar sólo el frontend (modo desarrollo local)

Si prefieres levantar sólo el frontend en caliente y apuntarlo al gateway local (`http://localhost:8000`):

```bash
cd frontend
npm install
# el .env del root define VITE_API_URL en el docker-compose; para dev local puedes exportarlo:
export VITE_API_URL=http://localhost:8000
npm run dev
```

Abre http://localhost:5173

---

## Comandos útiles para desarrollar y compilar

Desde `frontend`:

```bash
npm run dev     # start dev server (hot reload)
npm run build   # build producción (genera dist/)
npm run preview # servir build localmente con vite preview
```

---

## Pruebas básicas (curl) — registro y login via gateway

Registrar un usuario demo (estudiante):

```bash
curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Demo Student","institutionalEmail":"student_demo@puj.edu.co","password":"StudentPass123!","role":"student","consent_accepted":true}' | jq
```

Hacer login y recibir `accessToken`:

```bash
curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"institutionalEmail":"student_demo@puj.edu.co","password":"StudentPass123!"}' | jq
```

Usar token para llamar a listados de cursos:

```bash
# sustituye <ACCESS_TOKEN> por el token obtenido
curl -s http://localhost:8000/courses -H "Authorization: Bearer <ACCESS_TOKEN>" | jq
```

(Si no tienes `jq` elimina `| jq`).

---

## Ejecutar un servicio individual (ejemplo `auth-service`) sin Docker

Puedes ejecutar un servicio en local para depuración (cada servicio contiene su propio package.json y scripts). Ejemplo `auth-service`:

```bash
cd services/auth-service
npm install
npm run dev
# revisa README del servicio para flags específicos
```

Nota: muchos servicios usan variables de `.env` o necesitan acceso a Postgres/Redis/RabbitMQ para arrancar correctamente.

---

## Tests end-to-end (Playwright)

Las pruebas e2e están disponibles en `tests/e2e` y usan `playwright`.

```bash
# desde la raíz (si tienes Playwright instalado)
npm run test:e2e
# UI runner
npm run test:e2e:ui
```

---

## Troubleshooting rápido

- Si Kong rechaza peticiones por JWT: genera las claves con `node scripts/generate-jwt-keys.mjs` y reinicia `docker compose up -d --build`.
- Si un servicio no arranca: revisar logs `docker compose logs -f <service-name>` y arreglar la variable de entorno en `.env`.
- Si el frontend conecta a la URL equivocada: valida la variable `VITE_API_URL` (en Docker Compose o exportada para `npm run dev`).

---

## Resumen de comandos más usados

```bash
# preparar env
cp .env.example .env
node scripts/generate-jwt-keys.mjs   # opcional

# levantar todo (recomendado)
docker compose up -d --build

# levantar solo frontend localmente
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev

# pruebas básicas
curl -X POST http://localhost:8000/auth/register -H 'Content-Type: application/json' -d '{...}'
```

---

Si quieres, puedo:
- generar un `Makefile` o `scripts` para automatizar estos comandos, o
- ejecutar `docker compose up -d --build` aquí y validar que los endpoints respondan, o
- añadir screenshots/links directos para las pantallas (login, dashboard, cursos). Dime qué prefieres.
