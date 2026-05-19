import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const workspaceTempDir = path.resolve(process.cwd(), '.tmp');
fs.mkdirSync(workspaceTempDir, { recursive: true });

const playwrightCli = path.resolve(process.cwd(), 'node_modules', 'playwright', 'cli.js');
const child = spawn(process.execPath, [playwrightCli, 'test', ...process.argv.slice(2)], {
  env: {
    ...process.env,
    TEMP: workspaceTempDir,
    TMP: workspaceTempDir,
    TMPDIR: workspaceTempDir
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
