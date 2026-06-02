#!/usr/bin/env node

/**
 * Script de migración automática al shared-core
 * 
 * Uso:
 *   node scripts/migrate-to-shared-core.mjs <service-name>
 * 
 * Ejemplo:
 *   node scripts/migrate-to-shared-core.mjs course-service
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
  console.error('Uso: node scripts/migrate-to-shared-core.mjs <service-name>');
  console.error('Ejemplo: node scripts/migrate-to-shared-core.mjs course-service');
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
// PASO 2: Crear backup de archivos a eliminar
// ============================================================================
console.log('💾 Paso 2: Creando backups...');

const filesToBackup = [
  'src/middleware/auth.ts',
  'src/middleware/logging.ts',
  'src/utils/swagger.ts',
  'src/repositories/baseRepository.ts',
  'src/services/tokenService.ts'
];

const backupDir = path.join(serviceDir, '.migration-backup');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

for (const file of filesToBackup) {
  const filePath = path.join(serviceDir, file);
  if (fs.existsSync(filePath)) {
    const backupPath = path.join(backupDir, path.basename(file));
    fs.copyFileSync(filePath, backupPath);
    console.log(`  ✅ Backup creado: ${file}`);
  }
}

console.log(`  💡 Backups guardados en: ${backupDir}\n`);

// ============================================================================
// PASO 3: Actualizar app.ts
// ============================================================================
console.log('🔄 Paso 3: Actualizando app.ts...');

try {
  const appTsPath = path.join(serviceDir, 'src', 'app.ts');
  
  if (fs.existsSync(appTsPath)) {
    const newAppTs = `import { createBaseApp } from '@proyecto/shared-core/http';
import { createLoggingMiddleware } from '@proyecto/shared-core/logging';
import { setupSwaggerUI } from '@proyecto/shared-core/swagger';
import routes from './routes';

export function createApp() {
  const app = createBaseApp({
    serviceName: '${serviceName}',
    enableCors: true
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
  } else {
    console.log('  ⚠️ app.ts no encontrado, saltando...\n');
  }
} catch (error) {
  errors.push(`Error actualizando app.ts: ${error.message}`);
  console.error(`  ❌ Error: ${error.message}\n`);
}

// ============================================================================
// PASO 4: Actualizar imports en archivos de rutas
// ============================================================================
console.log('🔄 Paso 4: Actualizando imports en rutas...');

try {
  const routesDir = path.join(serviceDir, 'src', 'routes');
  
  if (fs.existsSync(routesDir)) {
    const files = fs.readdirSync(routesDir);
    
    for (const file of files) {
      if (file.endsWith('.ts')) {
        const filePath = path.join(routesDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Reemplazar imports de auth
        if (content.includes("from './../middleware/auth'") || content.includes("from '../middleware/auth'")) {
          content = content.replace(
            /from ['"]\.\.?\/\.\.?\/middleware\/auth['"]/g,
            "from '@proyecto/shared-core/auth'"
          );
          changes.push(`Actualizados imports de auth en ${file}`);
        }
        
        fs.writeFileSync(filePath, content);
      }
    }
    
    console.log(`  ✅ Imports actualizados en ${files.length} archivo(s)\n`);
  } else {
    console.log('  ⚠️ Directorio de rutas no encontrado, saltando...\n');
  }
} catch (error) {
  errors.push(`Error actualizando imports: ${error.message}`);
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
console.log('📋 PRÓXIMOS PASOS MANUALES');
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

5. Eliminar archivos duplicados (después de verificar que todo funciona):
   - src/middleware/auth.ts
   - src/middleware/logging.ts  
   - src/utils/swagger.ts
   - src/repositories/baseRepository.ts
   - src/services/tokenService.ts

6. Actualizar el Dockerfile si es necesario
`);

console.log('='.repeat(70));
console.log('💾 BACKUPS CREADOS');
console.log('='.repeat(70));
console.log(`
Ubicación: ${backupDir}

Archivos respaldados:
${filesToBackup.filter(f => fs.existsSync(path.join(backupDir, path.basename(f)))).map(f => `  - ${path.basename(f)}`).join('\n')}

Para restaurar los backups:
  1. Copiar los archivos de .migration-backup/ a src/
  2. Deshacer los cambios en package.json y app.ts
`);

console.log('\n' + '='.repeat(70));
console.log('🎉 MIGRACIÓN COMPLETADA');
console.log('='.repeat(70) + '\n');

// Guardar un resumen en un archivo
const summaryPath = path.join(serviceDir, '.migration-summary.json');
const summary = {
  serviceName,
  timestamp: new Date().toISOString(),
  changes,
  errors,
  backupLocation: backupDir,
  filesBackedUp: filesToBackup.filter(f => fs.existsSync(path.join(backupDir, path.basename(f)))),
  nextSteps: [
    'npm install',
    'npm run build',
    'npm test',
    'npm run dev',
    'Eliminar archivos duplicados',
    'Actualizar Dockerfile'
  ]
};

fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(`📄 Resumen guardado en: ${summaryPath}\n`);

process.exit(errors.length > 0 ? 1 : 0);
