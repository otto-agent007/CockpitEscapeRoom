import { defineConfig, devices } from '@playwright/test'

const localChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // The suite exercises the 38 MiB Airbus and 44 MiB locker GLBs. Parallel
  // browser processes contend for GPU/decoder memory and can starve a valid
  // second model load, so keep the real-asset boundary deterministic locally
  // as well as in CI.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: localChromium
          ? { executablePath: localChromium, args: ['--no-sandbox'] }
          : undefined,
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
