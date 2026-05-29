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
2. Configure claves JWT RS256 y credenciales

## Levantamiento local

```bash
docker compose up --build
```

Servicios principales:
- Kong Proxy: `http://localhost:8000`
- Kong Admin: `http://localhost:8001`
- Frontend: `http://localhost:5173`
- RabbitMQ UI: `http://localhost:15672`

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
