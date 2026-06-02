import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface SwaggerConfig {
  serviceName: string;
  customCss?: string;
  customSiteTitle?: string;
}

export function setupSwaggerUI(app: Express, config: SwaggerConfig): void {
  const { serviceName } = config;
  
  try {
    // Try multiple possible paths for the OpenAPI spec
    const possiblePaths = [
      path.join(process.cwd(), 'openapi.yaml'),
      path.join(process.cwd(), 'src', 'openapi.yaml'),
      path.join(__dirname, '..', '..', 'openapi.yaml'),
      path.join(__dirname, '..', '..', '..', 'openapi.yaml'),
    ];

    let swaggerPath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        swaggerPath = p;
        break;
      }
    }

    if (!swaggerPath) {
      console.warn(`[${serviceName}] openapi.yaml not found in any of the expected paths`);
      return;
    }

    const fileContents = fs.readFileSync(swaggerPath, 'utf8');
    const swaggerSpec = yaml.load(fileContents) as Record<string, any>;

    // Customize swagger spec with service name
    if (swaggerSpec.info) {
      swaggerSpec.info.title = `${serviceName} API`;
    }

    app.use('/docs', swaggerUi.serve);
    app.get('/docs', swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: config.customCss,
      customSiteTitle: config.customSiteTitle || `${serviceName} API Documentation`,
    }));
    
    app.get('/openapi.json', (_req, res) => res.json(swaggerSpec));

    console.log(`[${serviceName}] Swagger UI available at http://localhost:${process.env.PORT || 3000}/docs`);
  } catch (error) {
    console.warn(`[${serviceName}] Failed to setup Swagger UI:`, error instanceof Error ? error.message : error);
  }
}

export default setupSwaggerUI;
