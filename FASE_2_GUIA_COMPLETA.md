# FASE 2: Guía Completa de Migración (DIY)

## 📋 ÍNDICE
1. [Visión General](#visión-general)
2. [Arquitectura del Shared Core](#arquitectura-del-shared-core)
3. [Proceso de Migración Paso a Paso](#proceso-de-migración)
4. [Solución de Problemas Comunes](#solución-de-problemas)
5. [Checklist de Verificación](#checklist-de-verificación)
6. [Scripts y Automatización](#scripts-y-automatización)

---

## 🎯 VISIÓN GENERAL

### ¿Qué es la Fase 2?
La Fase 2 consiste en migrar TODOS los servicios restantes para que usen el `@proyecto/shared-core`, eliminando así el código duplicado.

### Servicios a Migrar
| Servicio | Prioridad | Estado |
|----------|-----------|--------|
| course-service | ✅ Completado | ✅ Build OK |
| assessment-service | 🔄 En progreso | ⚠️ Ajustes de tipos |
| progress-service | ⏳ Pendiente | - |
| notification-service | ⏳ Pendiente | - |
| collaboration-service | ⏳ Pendiente | - |
| adaptive-service | ⏳ Pendiente | - |
| analytics-service | ⏳ Pendiente | - |
| auth-service | ⏳ Pendiente (último) | - |

---

## 🏗️ ARQUITECTURA DEL SHARED CORE

### Estructura de Carpetas
```
/packages/shared-core/
├── src/
│   ├── index.ts                    # Punto de entrada principal
│   ├── auth/                       # Módulo de autenticación
│   │   ├── index.ts                # Exports
│   │   ├── authGuard.ts            # Middleware de auth
│   │   ├── tokenService.ts         # Verificación JWT
│   │   └── types.ts                # Tipos AuthRequest, TokenPayload
│   ├── repository/                 # Módulo de repositorios
│   │   ├── index.ts
│   │   └── baseRepository.ts       # RepositoryPort, InMemoryRepository
│   ├── logging/                    # Módulo de logging
│   │   └── index.ts                # Logger, createLoggingMiddleware
│   ├── swagger/                    # Módulo de documentación
│   │   └── index.ts                # setupSwaggerUI
│   └── http/                       # Módulo HTTP
│       └── index.ts                # createBaseApp, utilidades
├── package.json
└── tsconfig.json
```

### Módulos Disponibles

#### 1. `@proyecto/shared-core/auth`
```typescript
import { 
  authGuard,           // Middleware de autenticación
  requireRole,         // Middleware de autorización por rol
  requireSelfOrRole,   // Autorización de recursos propios
  optionalAuth,        // Autenticación opcional
  verifyToken,         // Verificación JWT
  decodeToken,         // Decodificación JWT
  AuthRequest,         // Tipo de request extendido
  TokenPayload         // Tipo del payload JWT
} from '@proyecto/shared-core/auth';
```

#### 2. `@proyecto/shared-core/repository`
```typescript
import {
  RepositoryPort,      // Interfaz base del repositorio
  InMemoryRepository   // Implementación en memoria
} from '@proyecto/shared-core/repository';
```

#### 3. `@proyecto/shared-core/logging`
```typescript
import {
  logger,                   // Instancia singleton del logger
  createLoggingMiddleware   // Factory para middleware de logging
} from '@proyecto/shared-core/logging';
```

#### 4. `@proyecto/shared-core/swagger`
```typescript
import {
  setupSwaggerUI,   // Configuración de Swagger UI
  SwaggerConfig     // Tipo de configuración
} from '@proyecto/shared-core/swagger';
```

#### 5. `@proyecto/shared-core/http`
```typescript
import {
  createBaseApp,   // Factory para crear app Express base
  AppConfig        // Tipo de configuración
} from '@proyecto/shared-core/http';
```

---

## 🔄 PROCESO DE MIGRACIÓN PASO A PASO

### Paso 1: Preparación
```bash
# 1. Asegurar que el shared-core está compilado
npm run build:shared

# 2. Verificar que el servicio compila antes de migrar
cd services/<nombre-servicio>
npm run build
```

### Paso 2: Actualizar Configuración

#### 2.1 package.json
```json
{
  "dependencies": {
    "@proyecto/shared-core": "1.0.0",
    // ... resto de dependencias
  }
}
```

#### 2.2 tsconfig.json
```json
{
  "extends": "../../tsconfig.services.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "paths": {
      "@proyecto/shared-core": ["../../packages/shared-core/dist"],
      "@proyecto/shared-core/*": ["../../packages/shared-core/dist/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Paso 3: Migrar app.ts

#### ANTES
```typescript
import express from 'express';
import routes from './routes';
import { loggingMiddleware } from './middleware/logging';
import { setupSwaggerUI } from './utils/swagger';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(loggingMiddleware('nombre-servicio'));
  app.get('/health', (_req, res) => res.json({ 
    service: 'nombre-servicio', 
    status: 'ok' 
  }));
  setupSwaggerUI(app, 'nombre-servicio');
  app.use(routes);
  return app;
}
```

#### DESPUÉS
```typescript
import { createBaseApp } from '@proyecto/shared-core/http';
import { createLoggingMiddleware } from '@proyecto/shared-core/logging';
import { setupSwaggerUI } from '@proyecto/shared-core/swagger';
import routes from './routes';

export function createApp() {
  const app = createBaseApp({
    serviceName: 'nombre-servicio',
    enableCors: true,
    bodyLimit: '10mb'
  });

  // Logging middleware
  app.use(createLoggingMiddleware('nombre-servicio'));

  // Swagger documentation
  setupSwaggerUI(app, {
    serviceName: 'nombre-servicio'
  });

  // Application routes
  app.use(routes);

  return app;
}
```

### Paso 4: Actualizar Imports en Rutas y Controllers

#### Rutas - ANTES
```typescript
import { authGuard, requireRole } from '../middleware/auth';
```

#### Rutas - DESPUÉS
```typescript
import { authGuard, requireRole } from '@proyecto/shared-core/auth';
```

#### Controllers - ANTES
```typescript
import { AuthRequest } from '../middleware/auth';
```

#### Controllers - DESPUÉS
```typescript
import { AuthRequest } from '@proyecto/shared-core/auth';
```

### Paso 5: Verificar y Corregir Tipos

```bash
cd services/nombre-servicio
npm install
npm run build
```

Si hay errores de tipos, revisar:
1. Firmas de métodos en el service vs controller
2. Nombres de propiedades en DTOs
3. Tipos de parámetros opcionales vs requeridos

### Paso 6: Pruebas

```bash
# Ejecutar tests
npm test

# Iniciar en modo desarrollo
npm run dev

# Verificar health endpoint
curl http://localhost:3000/health
```

---

## 🛠️ SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "Cannot find module '@proyecto/shared-core'"
**Solución**: Ejecutar `npm run build:shared` en la raíz del proyecto.

### Error: "Property 'X' does not exist on type 'Y'"
**Solución**: Verificar que los nombres de propiedades coincidan entre el controller y el service.

### Error: "Expected N arguments, but got M"
**Solución**: Revisar la firma del método en el service y ajustar la llamada en el controller.

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Antes de Migrar
- [ ] Servicio compila sin errores
- [ ] Tests pasan
- [ ] Entiendo la estructura del servicio

### Durante la Migración
- [ ] package.json actualizado
- [ ] tsconfig.json actualizado
- [ ] app.ts usando createBaseApp
- [ ] Routes usando @proyecto/shared-core/auth
- [ ] Controllers usando AuthRequest del shared-core

### Después de Migrar
- [ ] npm install ejecutado sin errores
- [ ] npm run build exitoso
- [ ] npm test pasa todas las pruebas
- [ ] npm run dev inicia correctamente
- [ ] Health endpoint responde 200
- [ ] Endpoints principales funcionan

---

## 🚀 SCRIPTS Y AUTOMATIZACIÓN

### Script de Migración Completa
```bash
#!/bin/bash
# migrate-all.sh

SERVICES=(
  "progress-service"
  "notification-service"
  "collaboration-service"
  "adaptive-service"
  "analytics-service"
  "auth-service"
)

for service in "${SERVICES[@]}"; do
  echo "🚀 Migrando $service..."
  node scripts/migrate-service.mjs "$service"
  
  cd "services/$service" || exit
  npm install
  npm run build
  cd ../..
  
  echo "✅ $service completado"
done

echo "🎉 Todas las migraciones completadas!"
```

---

## 📚 RECURSOS ADICIONALES

- [Shared Core API Docs](docs/shared-core-api.md)
- [Ejemplos de Migración](docs/migration-examples.md)
- [Troubleshooting Guide](docs/troubleshooting.md)

---

**¡Con esta guía tienes todo lo necesario para completar la Fase 2!** 🚀

¿Necesitas que profundice en alguna sección específica o que resuelva algún problema particular?
