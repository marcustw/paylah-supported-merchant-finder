import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', testMatch: '*.spec.mjs', use: { baseURL: 'http://127.0.0.1:5173', browserName: 'chromium' }, webServer: { command: 'pnpm run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: true }, reporter: 'list' });
