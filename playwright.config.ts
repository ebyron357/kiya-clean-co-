import { defineConfig, devices } from '@playwright/test'

// Local production-mode smoke tests only. No remote base URL option and no
// production credentials. Valid quote writes are intercepted in browser tests.
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3107', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: 'pnpm start --port 3107 --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3107',
    reuseExistingServer: false,
    env: {
      // Inert test-only placeholders, NOT keys or a real Supabase project.
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'synthetic-public-test-placeholder',
      SUPABASE_SERVICE_ROLE_KEY: '',
      AUTH_RECOVERY_ENABLED: 'false',
    },
  },
})
