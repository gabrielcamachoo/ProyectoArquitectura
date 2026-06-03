import net from 'net';
import { execFileSync } from 'child_process';

type StorageMode = 'postgres_env' | 'postgres_local' | 'postgres_docker' | 'memory';

function buildDatabaseUrl(input: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}): string {
  const user = encodeURIComponent(input.user);
  const password = encodeURIComponent(input.password);
  const host = input.host;
  const port = input.port;
  const database = input.database;
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

async function canConnectPostgres(url: string, timeoutMs: number): Promise<boolean> {
  const { Client } = require('pg') as { Client: new (cfg: any) => any };
  const client = new Client({ connectionString: url, connectionTimeoutMillis: timeoutMs });
  try {
    await client.connect();
    await client.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    try {
      await client.end();
    } catch {
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findAvailablePort(preferredPort: number): Promise<number> {
  const isFree = await new Promise<boolean>((resolve) => {
    const server = net
      .createServer()
      .once('error', () => resolve(false))
      .once('listening', () => server.close(() => resolve(true)))
      .listen(preferredPort, '127.0.0.1');
  });

  if (isFree) return preferredPort;

  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address !== 'string') {
        const port = address.port;
        server.close(() => resolve(port));
        return;
      }
      server.close(() => reject(new Error('failed_to_allocate_port')));
    });
  });
}

function dockerIsUsable(): boolean {
  try {
    execFileSync('docker', ['info'], { stdio: 'ignore', timeout: 1500 });
    return true;
  } catch {
    return false;
  }
}

function dockerExec(args: string[], timeoutMs: number): string {
  return execFileSync('docker', args, { encoding: 'utf8', timeout: timeoutMs }).trim();
}

function parseDockerPortMapping(output: string): number | null {
  const match = output.match(/:(\d+)\s*$/);
  if (!match) return null;
  const port = Number(match[1]);
  return Number.isFinite(port) ? port : null;
}

async function ensureDockerPostgres(config: {
  user: string;
  password: string;
  database: string;
}): Promise<string | null> {
  const containerName = 'proyectoarquitectura-postgres-auto';
  const image = 'postgres:16';

  try {
    const ps = dockerExec(
      ['ps', '-a', '--filter', `name=^/${containerName}$`, '--format', '{{.Names}}|{{.Status}}'],
      3000
    );
    const exists = ps.split('\n').some((line) => line.startsWith(`${containerName}|`));

    if (exists) {
      const statusLine = ps.split('\n').find((line) => line.startsWith(`${containerName}|`)) ?? '';
      const status = statusLine.split('|')[1] ?? '';
      if (!status.startsWith('Up')) {
        dockerExec(['start', containerName], 15000);
      }
    } else {
      const hostPort = await findAvailablePort(5432);
      dockerExec(
        [
          'run',
          '-d',
          '--name',
          containerName,
          '-e',
          `POSTGRES_USER=${config.user}`,
          '-e',
          `POSTGRES_PASSWORD=${config.password}`,
          '-e',
          `POSTGRES_DB=${config.database}`,
          '-p',
          `${hostPort}:5432`,
          image
        ],
        30000
      );
    }

    const portOut = dockerExec(['port', containerName, '5432/tcp'], 5000);
    const mappedPort = parseDockerPortMapping(portOut);
    if (!mappedPort) return null;

    const url = buildDatabaseUrl({
      host: 'localhost',
      port: mappedPort,
      user: config.user,
      password: config.password,
      database: config.database
    });

    const maxWaitMs = 30000;
    const startedAt = Date.now();
    while (Date.now() - startedAt < maxWaitMs) {
      if (await canConnectPostgres(url, 800)) return url;
      await sleep(1000);
    }

    return null;
  } catch {
    return null;
  }
}

async function resolveStorage(): Promise<{ mode: StorageMode; databaseUrl?: string }> {
  if (process.env.DATABASE_URL) {
    return { mode: 'postgres_env', databaseUrl: process.env.DATABASE_URL };
  }

  const user = process.env.POSTGRES_USER || 'postgres';
  const password = process.env.POSTGRES_PASSWORD || 'postgres';
  const database = process.env.POSTGRES_DB || 'proyecto';

  const localUrl = buildDatabaseUrl({ host: 'localhost', port: 5432, user, password, database });
  if (await canConnectPostgres(localUrl, 700)) {
    process.env.DATABASE_URL = localUrl;
    return { mode: 'postgres_local', databaseUrl: localUrl };
  }

  if (dockerIsUsable()) {
    const dockerUrl = await ensureDockerPostgres({ user, password, database });
    if (dockerUrl) {
      process.env.DATABASE_URL = dockerUrl;
      return { mode: 'postgres_docker', databaseUrl: dockerUrl };
    }
  }

  return { mode: 'memory' };
}

async function bootstrap() {
  const port = Number(process.env.PORT || 3000);
  const keepAlive = setInterval(() => {}, 1000);

  const storage = await resolveStorage();

  const { AppDataSource } = await import('./repositories/dataSource');

  let storageMode: StorageMode = storage.mode;

  if (storage.databaseUrl) {
    try {
      await AppDataSource.initialize();
    } catch {
      delete process.env.DATABASE_URL;
      storageMode = 'memory';
    }
  }

  try {
    const { createApp } = await import('./app');
    const server = createApp().listen(port, () => {
      console.log(JSON.stringify({ service: 'auth-service', port, storage: storageMode }));
      clearInterval(keepAlive);
    });
    server.on('error', (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        JSON.stringify({
          service: 'auth-service',
          event: 'listen_failed',
          message,
          action: `Verifique que el puerto ${port} esté libre o ejecute con PORT=<otro_puerto>.`
        })
      );
      clearInterval(keepAlive);
      process.exitCode = 1;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      JSON.stringify({
        service: 'auth-service',
        event: 'startup_failed',
        message,
        action: 'Verifique que el puerto esté libre y que Node.js tenga permisos para abrir sockets en este equipo.'
      })
    );
    clearInterval(keepAlive);
    process.exitCode = 1;
  }
}

bootstrap().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    JSON.stringify({
      service: 'auth-service',
      event: 'bootstrap_failed',
      message,
      action: 'Si el problema persiste, intente ejecutar el servicio con un puerto alterno (PORT=3100).'
    })
  );
  process.exitCode = 1;
});
