import {defineConfig} from '@playwright/test'
import {randomUUID} from 'node:crypto'

export default defineConfig({
  testDir: './tests/browser', workers: 1, timeout: 60000,
  expect: {timeout: 20000},
  use: {baseURL: 'http://127.0.0.1:3010', channel: process.platform === 'win32' ? 'chrome' : undefined, trace: 'retain-on-failure'},
  webServer: {
    command: `${process.platform === 'win32' ? 'npm.cmd' : 'npm'} run start -- -p 3010`,
    url: 'http://127.0.0.1:3010/api/projects/health', reuseExistingServer: false,
    env: {PROJECTS_STORAGE_MODE: 'local-file', PROJECTS_LOCAL_FILE: `.data/e2e-${randomUUID()}.json`, NEXT_PUBLIC_SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: ''},
  },
})
