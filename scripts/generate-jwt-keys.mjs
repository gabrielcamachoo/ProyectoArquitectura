#!/usr/bin/env node
/**
 * Genera par RS256 para auth-service y Kong.
 * Uso: node scripts/generate-jwt-keys.mjs
 */
import { generateKeyPairSync } from 'node:crypto';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const kongDir = join(root, 'kong');
mkdirSync(kongDir, { recursive: true });

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const privPem = privateKey.export({ type: 'pkcs1', format: 'pem' });
const pubPem = publicKey.export({ type: 'spki', format: 'pem' });

writeFileSync(join(kongDir, 'jwt-private.pem'), privPem, { mode: 0o600 });
writeFileSync(join(kongDir, 'jwt-public.pem'), pubPem);

const envPath = join(root, '.env');
const envLines = [
  `JWT_PRIVATE_KEY=${JSON.stringify(privPem.trim())}`,
  `JWT_PUBLIC_KEY=${JSON.stringify(pubPem.trim())}`
];
let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
for (const line of envLines) {
  const key = line.split('=')[0];
  if (envContent.match(new RegExp(`^${key}=`, 'm'))) {
    envContent = envContent.replace(new RegExp(`^${key}=.*$`, 'm'), line);
  } else {
    envContent += (envContent.endsWith('\n') ? '' : '\n') + line + '\n';
  }
}
writeFileSync(envPath, envContent);

console.log('Claves generadas: kong/jwt-public.pem, kong/jwt-private.pem y .env actualizado.');
console.log('Ejecute: node scripts/build-kong-config.mjs');
