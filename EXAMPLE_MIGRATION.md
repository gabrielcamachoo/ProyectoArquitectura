# Ejemplo de Migración al Shared Core

Este documento muestra cómo migrar un servicio existente para usar `@proyecto/shared-core`.

## Ejemplo: Migración del `course-service`

### 1. Actualizar package.json del servicio

```json
{
  "name": "course-service",
  "dependencies": {
    "@proyecto/shared-core": "1.0.0"
    // Eliminar duplicados: express, typeorm, etc.
  }
}
```

### 2. Actualizar imports en app.ts

**ANTES:**
```typescript
import express from 'express';
import routes from './routes';
import { loggingMiddleware } from './middleware/logging';
import { setupSwaggerUI } from './utils/swagger';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(loggingMiddleware('course-service'));
  app.get('/health', (_req, res) => res.json({ service: 'course-service', status: 'ok' }));
  setupSwaggerUI(app, 'course-service');
  app.use(routes);
  return app;
}
```

**DESPUÉS:**
```typescript
import { createBaseApp } from '@proyecto/shared-core/http';
import { createLoggingMiddleware } from '@proyecto/shared-core/logging';
import { setupSwaggerUI } from '@proyecto/shared-core/swagger';
import routes from './routes';

export function createApp() {
  const app = createBaseApp({
    serviceName: 'course-service',
    enableCors: true
  });

  app.use(createLoggingMiddleware('course-service'));
  
  setupSwaggerUI(app, {
    serviceName: 'course-service'
  });
  
  app.use(routes);
  return app;
}
```

### 3. Actualizar middleware de autenticación

**ANTES:**
```typescript
// src/middleware/auth.ts
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../services/tokenService';

export const authGuard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // ... código duplicado
};
```

**DESPUÉS:**
```typescript
// Eliminar el archivo src/middleware/auth.ts
// Usar directamente desde shared-core:

import { authGuard, requireRole } from '@proyecto/shared-core/auth';

// En las rutas:
router.get('/courses', authGuard, getCourses);
router.post('/courses', authGuard, requireRole('teacher', 'admin'), createCourse);
```

### 4. Actualizar repositorios

**ANTES:**
```typescript
// src/repositories/baseRepository.ts
export interface RepositoryPort<T> {
  list(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}
```

**DESPUÉS:**
```typescript
// Eliminar src/repositories/baseRepository.ts
// Importar desde shared-core:

import { RepositoryPort, InMemoryRepository } from '@proyecto/shared-core/repository';
```

### 5. Actualizar Dockerfile (si es necesario)

Si el build del servicio necesita el shared-core, asegurarse de que el contexto de build incluya el root del monorepo:

```dockerfile
# Dockerfile del servicio
FROM node:20-alpine AS deps
WORKDIR /app

# Copiar package.json de root, shared-core y el servicio
COPY package*.json ./
COPY packages/shared-core/package*.json ./packages/shared-core/
COPY services/course-service/package*.json ./services/course-service/

# Instalar todas las dependencias
RUN npm install

# Copiar el código fuente
COPY packages/shared-core ./packages/shared-core
COPY services/course-service ./services/course-service

# Build del shared-core
RUN npm run build --workspace=@proyecto/shared-core

# Build del servicio
RUN npm run build --workspace=course-service

FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/services/course-service/dist ./dist
COPY --from=deps /app/services/course-service/package*.json ./
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 6. Verificar la migración

Después de migrar, verificar que todo funciona:

```bash
# Instalar dependencias
npm install

# Build del shared-core
npm run build:shared

# Build del servicio migrado
npm run build --workspace=course-service

# Correr tests
npm test --workspace=course-service

# Iniciar el servicio en modo desarrollo
npm run dev --workspace=course-service
```

## Checklist de Migración

- [ ] Actualizar `package.json` del servicio
- [ ] Migrar `app.ts` a usar `createBaseApp`
- [ ] Eliminar `src/middleware/auth.ts` (usar desde shared-core)
- [ ] Eliminar `src/middleware/logging.ts` (usar desde shared-core)
- [ ] Eliminar `src/utils/swagger.ts` (usar desde shared-core)
- [ ] Eliminar `src/repositories/baseRepository.ts` (usar desde shared-core)
- [ ] Actualizar imports en controladores
- [ ] Actualizar Dockerfile (si es necesario)
- [ ] Verificar que el build funciona
- [ ] Ejecutar tests
- [ ] Verificar en desarrollo
