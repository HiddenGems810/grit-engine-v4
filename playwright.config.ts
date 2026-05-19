import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const workspaceTempDir = path.resolve(process.cwd(), '.tmp');
fs.mkdirSync(workspaceTempDir, { recursive: true });
process.env.TEMP = workspaceTempDir;
process.env.TMP = workspaceTempDir;
process.env.TMPDIR = workspaceTempDir;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  workers: 1,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: 'http://127.0.0.1:3101',
    trace: 'on-first-retry'
  },
  webServer: process.env.FORMAT_EXTERNAL_E2E_SERVER ? undefined : {
    command: 'node scripts/run-standalone-e2e.mjs',
    url: 'http://127.0.0.1:3101',
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ]
});
