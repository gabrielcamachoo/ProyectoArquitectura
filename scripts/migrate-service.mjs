#!/usr/bin/env node

/**
 * Script de migración automática al shared-core
 * 
 * Uso:
 *   node scripts/migrate-service.mjs <nombre-servicio>
 * 
 * Ejemplo:
 *   node scripts/migrate-service.mjs assessment-service
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const serviceName = process.argv[2];

if (!serviceName) {
  console.error('❌ Error: Debes especificar el nombre del servicio');
  console.error('Uso: node scripts/migrate-service.mjs <nombre-servicio>');
  console.error('Ejemplo: node scripts/migrate-service.mjs assessment-service');
  process.exit(1);
}

const serviceDir = path.join(rootDir, 'services', serviceName);

if (!fs.existsSync(serviceDir)) {
  console.error(`❌ Error: El servicio "${serviceName}" no existe en ${serviceDir}`);
  process.exit(1);
}

console.log(`\n🚀 Iniciando migración del servicio: ${serviceName}\n`);

const changes = [];
const errors = [];

// ============================================================================
// PASO 1: Actualizar package.json
// ============================================================================
console.log('📦 Paso 1: Actualizando package.json...');

try {
  const packageJsonPath = path.join(serviceDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Agregar dependencia al shared-core si no existe
  if (!packageJson.dependencies['@proyecto/shared-core']) {
    packageJson.dependencies['@proyecto/shared-core'] = '1.0.0';
    changes.push('Agregada dependencia @proyecto/shared-core');
  }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('  ✅ package.json actualizado\n');
} catch (error) {
  errors.push(`Error actualizando package.json: ${error.message}`);
  console.error(`  ❌ Error: ${error.message}\n`);
}

// ============================================================================
// PASO 2: Actualizar tsconfig.json
// ============================================================================
console.log('🔧 Paso 2: Actualizando tsconfig.json...');

try {
  const tsconfigPath = path.join(serviceDir, 'tsconfig.json');
  
  const newTsConfig = {
    extends: "../../tsconfig.services.base.json",
    compilerOptions: {
      outDir: "dist",
      rootDir: "src",
      baseUrl: ".",
      paths: {
        "@proyecto/shared-core": ["../../packages/shared-core/dist"],
        "@proyecto/shared-core/*": ["../../packages/shared-core/dist/*"]
      }
    },
    include: [
      "src/**/*"
    ],
    exclude: [
      "node_modules",
      "dist",
      "**/*.test.ts",
      "**/*.spec.ts"
    ]
  };
  
  fs.writeFileSync(tsconfigPath, JSON.stringify(newTsConfig, null, 2));
  changes.push('tsconfig.json actualizado para usar shared-core');
  console.log('  ✅ tsconfig.json actualizado\n');
} catch (error) {
  errors.push(`Error actualizando tsconfig.json: ${error.message}`);
  console.error(`  ❌ Error: ${error.message}\n`);
}

// ============================================================================
// PASO 3: Actualizar app.ts
// ============================================================================
console.log('📝 Paso 3: Actualizando app.ts...');

try {
  const appTsPath = path.join(serviceDir, 'src', 'app.ts');
  
  const newAppTs = `import { createBaseApp } from '@proyecto/shared-core/http';
import { createLoggingMiddleware } from '@proyecto/shared-core/logging';
import { setupSwaggerUI } from '@proyecto/shared-core/swagger';
import routes from './routes';

export function createApp() {
  const app = createBaseApp({
    serviceName: '${serviceName}',
    enableCors: true,
    bodyLimit: '10mb'
  });

  // Logging middleware
  app.use(createLoggingMiddleware('${serviceName}'));

  // Swagger documentation
  setupSwaggerUI(app, {
    serviceName: '${serviceName}'
  });

  // Application routes
  app.use(routes);

  return app;
}
`;
  
  fs.writeFileSync(appTsPath, newAppTs);
  changes.push('app.ts actualizado para usar shared-core');
  console.log('  ✅ app.ts actualizado\n');
} catch (error) {
  errors.push(`Error actualizando app.ts: ${error.message}`);
  console.error(`  ❌ Error: ${error.message}\n`);
}

// ============================================================================
// RESUMEN FINAL
// ============================================================================
console.log('='.repeat(70));
console.log('📊 RESUMEN DE MIGRACIÓN');
console.log('='.repeat(70));
console.log(`\nServicio: ${serviceName}`);
console.log(`Ubicación: ${serviceDir}\n`);

if (changes.length > 0) {
  console.log('✅ Cambios realizados:');
  changes.forEach((change, i) => {
    console.log(`   ${i + 1}. ${change}`);
  });
  console.log();
}

if (errors.length > 0) {
  console.log('❌ Errores encontrados:');
  errors.forEach((error, i) => {
    console.log(`   ${i + 1}. ${error}`);
  });
  console.log();
}

console.log('='.repeat(70));
console.log('📋 PRÓXIMOS PASOS');
console.log('='.repeat(70));
console.log(`
1. Instalar dependencias del servicio:
   cd services/${serviceName}
   npm install

2. Verificar que el build funcione:
   npm run build

3. Ejecutar tests:
   npm test

4. Verificar que el servicio arranque correctamente:
   npm run dev
`);

console.log('='.repeat(70));
console.log('🎉 MIGRACIÓN COMPLETADA');
console.log('='.repeat(70) + '\n');

process.exit(errors.length > 0 ? 1 : 0);
