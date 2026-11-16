import { defineConfig } from '@playwright/test';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
mkdirSync(resolve('.tmp'), { recursive: true });
process.env.TEMP = process.env.TMP = resolve('.tmp');
const production = process.env.GAME_BASE_E2E_PRODUCTION === '1';
const port = process.env.GAME_BASE_E2E_PORT ?? (production ? '4188' : '5188');
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, timeout: 90000,
  testMatch: production ? '**/production.spec.ts' : '**/*.spec.ts', testIgnore: production ? [] : ['**/production.spec.ts'],
  use: { channel: process.env.GAME_BASE_BROWSER ?? (existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'chrome' : undefined), baseURL: `http://127.0.0.1:${port}`, viewport: { width: 1280, height: 720 }, headless: true },
  reporter: [['list'], ['html', { open: 'never' }]],
});
