import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: 'http://127.0.0.1:3101',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run prepare:e2e && npm run start:e2e',
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
