import { spawn } from 'node:child_process';
import path from 'node:path';

const serverPath = path.resolve(process.cwd(), '.next', 'standalone', 'server.js');
const child = spawn(process.execPath, [serverPath], {
  env: {
    ...process.env,
    HOSTNAME: '127.0.0.1',
    PORT: '3101'
  },
  stdio: 'inherit'
});

let shuttingDown = false;

const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;

  if (!child.killed) {
    child.kill(signal);
  }

  const fallback = setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
    process.exit(0);
  }, 2500);
  fallback.unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

child.on('exit', (code, signal) => {
  if (shuttingDown) {
    process.exit(0);
  }

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
