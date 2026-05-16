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

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
