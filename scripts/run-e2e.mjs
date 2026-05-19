import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const workspaceTempDir = path.resolve(process.cwd(), '.tmp');
fs.mkdirSync(workspaceTempDir, { recursive: true });

const env = {
  ...process.env,
  HOSTNAME: '127.0.0.1',
  PORT: '3101',
  TEMP: workspaceTempDir,
  TMP: workspaceTempDir,
  TMPDIR: workspaceTempDir
};

const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {
    env,
    stdio: 'inherit',
    ...options
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      reject(new Error(`${command} ${args.join(' ')} exited with ${signal}`));
      return;
    }

    if (code === 0) {
      resolve();
      return;
    }

    reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}`));
  });
});

const waitForServer = async (url, timeoutMs = 30_000) => {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`Timed out waiting for ${url}.${lastError ? ` Last error: ${lastError}` : ''}`);
};

await run(process.execPath, [path.resolve(process.cwd(), 'scripts', 'prepare-standalone-assets.mjs')]);

const serverPath = path.resolve(process.cwd(), '.next', 'standalone', 'server.js');
const server = spawn(process.execPath, [serverPath], {
  env,
  stdio: 'inherit'
});

let serverStopped = false;
server.on('exit', (code, signal) => {
  serverStopped = true;
  if (code && code !== 0) {
    console.error(`Standalone server exited with code ${code}.`);
  }
  if (signal) {
    console.error(`Standalone server exited with signal ${signal}.`);
  }
});

try {
  await waitForServer('http://127.0.0.1:3101');
  await run(process.execPath, [
    path.resolve(process.cwd(), 'scripts', 'run-playwright.mjs'),
    ...process.argv.slice(2)
  ], {
    env: {
      ...env,
      FORMAT_EXTERNAL_E2E_SERVER: '1'
    }
  });
} finally {
  if (!serverStopped) {
    server.kill('SIGTERM');
    setTimeout(() => {
      if (!serverStopped) {
        server.kill('SIGKILL');
      }
    }, 2000).unref();
  }
}
