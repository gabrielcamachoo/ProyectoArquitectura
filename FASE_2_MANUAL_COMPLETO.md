# 📘 FASE 2: Manual Completo de Migración (Hazlo Tú Mismo)

> **Versión**: 1.0  
> **Última actualización**: 2026-06-01  
> **Estado**: Guía de referencia completa

---

## 🎯 OBJETIVO DE LA FASE 2

Migrar **todos los servicios restantes** para que usen `@proyecto/shared-core`, eliminando el código duplicado y estandarizando la arquitectura.

---

## 📊 ESTADO ACTUAL (Snapshot)

| Servicio | Estado | Build | Notas |
|----------|--------|-------|-------|
| **shared-core** | ✅ Completado | ✅ | Base estable |
| **course-service** | ✅ Migrado | ✅ | Referencia perfecta |
| **assessment-service** | Migrado | ✅ |  |
| **progress-service** | ⏳ Inicial | ⏳ | Estructura base lista |
| notification-service | ⏳ Pendiente | - | - |
| collaboration-service | ⏳ Pendiente | - | - |
| adaptive-service | ⏳ Pendiente | - | - |
| analytics-service | ⏳ Pendiente | - | - |
| auth-service | ⏳ Pendiente | - | **Migrar al final** |

---

## 🔧 ARSENAL DE HERRAMIENTAS

### 1. Script de Migración Automática
Ubicación: `scripts/migrate-service.mjs`

**Uso**:
```bash
node scripts/migrate-service.mjs <nombre-servicio>
```

**Ejemplo**:
```bash
# Migrar notification-service
node scripts/migrate-service.mjs notification-service
```

**Qué hace el script**:
1. ✅ Actualiza `package.json` (agrega @proyecto/shared-core)
2. ✅ Actualiza `tsconfig.json` (paths y extends)
3. ✅ Actualiza `app.ts` (usa createBaseApp)
4. ⚠️ Requiere revisión manual de controllers

### 2. Plantillas de Código

#### Plantilla: app.ts
```typescript
import { createBaseApp } from '@proyecto/shared-core/http';
import { createLoggingMiddleware } from '@proyecto/shared-core/logging';
import { setupSwaggerUI } from '@proyecto/shared-core/swagger';
import routes from './routes';

export function createApp() {
  const app = createBaseApp({
    serviceName: 'NOMBRE-SERVICIO',
    enableCors: true,
    bodyLimit: '10mb'
  });

  app.use(createLoggingMiddleware('NOMBRE-SERVICIO'));
  
  setupSwaggerUI(app, {
    serviceName: 'NOMBRE-SERVICIO'
  });
  
  app.use(routes);
  return app;
}
```

#### Plantilla: routes/index.ts
```typescript
import { Router } from 'express';
import { Controller } from '../controllers/controller';
import { authGuard, requireRole } from '@proyecto/shared-core/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const controller = new Controller();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests'
});

// Definir rutas aquí
router.get('/ruta', limiter, authGuard, requireRole('rol'), controller.metodo.bind(controller));

export default router;
```

#### Plantilla: Controller
```typescript
import { Response } from 'express';
import { AuthRequest } from '@proyecto/shared-core/auth';
import { getService, Service } from '../services/service';

export class Controller {
  private service: Service;

  constructor() {
    this.service = getService();
  }

  async metodo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      // Implementar lógica
      
      res.status(200).json({ /* respuesta */ });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Internal server error'
      });
    }
  }
}
```

---

## 📋 PROCESO DETALLADO PASO A PASO

### Paso 1: Preparación (5 min)
```bash
# 1. Asegurar shared-core compilado
npm run build:shared

# 2. Guardar estado actual del servicio (backup opcional)
cd services/nombre-servicio
cp -r src src.backup

# 3. Verificar que el servicio compila ANTES de migrar
npm run build
# Si hay errores, corregirlos antes de continuar
```

### Paso 2: Ejecutar Script Automático (2 min)
```bash
cd ../..  # Volver a raíz
node scripts/migrate-service.mjs nombre-servicio
```

Esto actualiza:
- ✅ package.json
- ✅ tsconfig.json  
- ✅ app.ts

### Paso 3: Revisión Manual de Controllers (10-20 min)

**Archivos a revisar:**
1. `src/routes/index.ts` - Actualizar imports de auth
2. `src/controllers/*Controller.ts` - Actualizar imports y tipos

**Cambios típicos:**
```diff
- import { authGuard, requireRole } from '../middleware/auth';
+ import { authGuard, requireRole } from '@proyecto/shared-core/auth';


- import { AuthRequest } from '../middleware/auth';
+ import { AuthRequest } from '@proyecto/shared-core/auth';
```

### Paso 4: Verificación de Build (5 min)
```bash
cd services/nombre-servicio

# Instalar dependencias
npm install

# Compilar
npm run build

# Si hay errores de tipos, revisar:
# - Firmas de métodos en service vs controller
# - Nombres de propiedades en DTOs
# - Tipos de parámetros opcionales
```

### Paso 5: Pruebas (10 min)
```bash
# Ejecutar tests
npm test

# Iniciar en modo dev
npm run dev

# Verificar endpoints en otra terminal
curl http://localhost:3000/health
curl http://localhost:3000/docs  # Swagger UI
```

---

## 🔥 PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: "Cannot find module '@proyecto/shared-core'"
**Causa**: El shared-core no está compilado.
**Solución**:
```bash
npm run build:shared
```

### Problema 2: "Property 'X' does not exist on type 'Y'"
**Causa**: El controller espera una propiedad que no existe en el DTO/service.
**Solución**: Verificar y sincronizar las interfaces entre controller y service.

### Problema 3: "Expected N arguments, but got M"
**Causa**: La firma del método en el service cambió.
**Solución**: Actualizar la llamada en el controller para coincidir con la nueva firma.

### Problema 4: Errores de tipos en build pero no en VS Code
**Causa**: tsconfig.json del servicio no está usando los paths correctos.
**Solución**: Verificar que tsconfig.json tenga:
```json
{
  "extends": "../../tsconfig.services.base.json",
  "compilerOptions": {
    "paths": {
      "@proyecto/shared-core": ["../../packages/shared-core/dist"],
      "@proyecto/shared-core/*": ["../../packages/shared-core/dist/*"]
    }
  }
}
```

---

## ✅ CHECKLIST FINAL

Antes de considerar un servicio como **MIGRADO**, verifica:


- [ ] `package.json` tiene `@proyecto/shared-core`
- [ ] `tsconfig.json` extiende del base y tiene paths configurados
- [ ] `app.ts` usa `createBaseApp` del shared-core
- [ ] `routes/index.ts` importa auth desde `@proyecto/shared-core/auth`
- [ ] `controllers/*Controller.ts` importan `AuthRequest` del shared-core
- [ ] `npm install` ejecuta sin errores
- [ ] `npm run build` **COMPILA SIN ERRORES**
- [ ] `npm test` pasa todas las pruebas
- [ ] `npm run dev` inicia correctamente
- [ ] Endpoint `/health` responde 200
- [ ] Swagger UI (`/docs`) carga correctamente

---

## 📞 ¿NECESITAS AYUDA?

Si te atascas con algún servicio:

1. **Revisa esta guía** - probablemente tu problema está documentado
2. **Compara con `course-service`** - es la referencia perfecta
3. **Verifica el shared-core** - asegúrate de que esté compilado
4. **Pregúntame** - estoy aquí para ayudar

---

**¡ESTÁS LISTO PARA COMPLETAR LA FASE 2!** 🚀💪
