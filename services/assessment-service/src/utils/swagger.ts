import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export function setupSwaggerUI(app: Express, serviceName: string) {
  try {
    const swaggerPath = path.join(__dirname, '..', '..', 'openapi.yaml');
    const fileContents = fs.readFileSync(swaggerPath, 'utf8');
    const swaggerSpec = yaml.load(fileContents) as Record<string, any>;

    app.use('/docs', swaggerUi.serve);
    app.get('/docs', swaggerUi.setup(swaggerSpec, { swaggerUrl: `/openapi.json` }));
    app.get('/openapi.json', (_req, res) => res.json(swaggerSpec));

    console.log(`Swagger UI available at http://localhost:${process.env.PORT || 3000}/docs`);
  } catch (error) {
    console.warn(`Failed to setup Swagger UI for ${serviceName}:`, error instanceof Error ? error.message : error);
  }
}
