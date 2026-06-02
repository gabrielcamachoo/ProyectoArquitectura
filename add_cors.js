const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'services');
const services = fs.readdirSync(servicesDir);

const corsMiddleware = `  app.use((req, res, next) => {
    const origin = req.header('origin');
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });
`;

for (const service of services) {
  if (service === 'auth-service') continue;
  
  const appTsPath = path.join(servicesDir, service, 'src', 'app.ts');
  if (fs.existsSync(appTsPath)) {
    let content = fs.readFileSync(appTsPath, 'utf8');
    if (!content.includes('res.setHeader(\'Access-Control-Allow-Origin\'')) {
      content = content.replace('const app = express();', 'const app = express();\n' + corsMiddleware);
      fs.writeFileSync(appTsPath, content);
      console.log(`Updated ${service}/src/app.ts`);
    }
  }
}
