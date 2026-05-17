import express from 'express';
import net from 'net';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { projectsRouter } from './routes/projects.js';
import { commitsRouter } from './routes/commits.js';
import { logsRouter } from './routes/logs.js';
import { graphRouter } from './routes/graph.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function findAvailablePort(port: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => server.close(() => resolve(port)));
    server.on('error', () => resolve(findAvailablePort(port + 1)));
  });
}

export async function startServer(startPort = 3000): Promise<void> {
  const initialPort = process.env.PORT ? parseInt(process.env.PORT, 10) : startPort;
  const port = await findAvailablePort(initialPort);
  const app = express();

  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
  app.use(express.json());

  app.use('/api', projectsRouter);
  app.use('/api', commitsRouter);
  app.use('/api', logsRouter);
  app.use('/api', graphRouter);

  const uiDir = join(__dirname, '..', 'ui');
  if (existsSync(uiDir)) {
    app.use(express.static(uiDir));
    app.get('*', (_req, res) => {
      res.sendFile(join(uiDir, 'index.html'));
    });
  }

  await new Promise<void>((resolve) => {
    app.listen(port, async () => {
      const url = `http://localhost:${port}`;
      console.log('');
      console.log('  ✦ gitstoria ui');
      console.log('  ─────────────────────────────────────');
      console.log(`  › Running at ${url}`);
      console.log('  ─────────────────────────────────────');
      console.log('');
      resolve();
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
