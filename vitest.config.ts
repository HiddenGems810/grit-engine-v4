import { defineConfig } from 'vitest/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceTempDir = path.resolve(process.cwd(), '.tmp');
fs.mkdirSync(workspaceTempDir, { recursive: true });
process.env.TEMP = workspaceTempDir;
process.env.TMP = workspaceTempDir;
process.env.TMPDIR = workspaceTempDir;

export default defineConfig({
  cacheDir: '.tmp/vite',
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    globals: false
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url))
    }
  }
});
