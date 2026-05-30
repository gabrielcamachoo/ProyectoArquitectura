#!/usr/bin/env node
/**
 * Genera kong/kong.yml con JWT RS256 embebido (producción).
 * Uso: node scripts/build-kong-config.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const configDir = process.env.KONG_CONFIG_DIR || join(root, 'kong');
const pubPem = readFileSync(join(configDir, 'jwt-public.pem'), 'utf8').trim();
const yamlKey = pubPem
  .split('\n')
  .map((line) => `          ${line}`)
  .join('\n');

const jwtPlugin = `          - name: jwt
            config:
              key_claim_name: iss
              claims_to_verify:
                - exp`;

const template = readFileSync(join(configDir, 'kong.template.yml'), 'utf8');
const output = template.replace('__JWT_PUBLIC_KEY__', yamlKey).replace(/__JWT_PLUGIN__/g, jwtPlugin);
writeFileSync(join(configDir, 'kong.yml'), output);
console.log('kong/kong.yml generado con validación JWT RS256.');
