import 'dotenv/config';
import { defineConfig, type ReporterDescription } from '@playwright/test';
import client from './client.config';
import { buildProjects, currentSuite, SUITES } from './src/config/suites';

const suite = currentSuite();
const isCI = Boolean(process.env.CI);
const sharded = Boolean(process.env.SHARDED);
const basicAuthUser = process.env.BASIC_AUTH_USER;

const reporter: ReporterDescription[] = sharded
  ? [['blob'], ['list']]
  : [
      ['list'],
      ['html', { open: 'never' }],
      ['json', { outputFile: 'test-results/results.json' }],
      ['junit', { outputFile: 'test-results/junit.xml' }],
    ];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  // Retries surface flakiness; a pass-on-retry is reported as "flaky", not hidden.
  retries: isCI && suite !== 'doctor' ? 2 : 0,
  // Shared staging, no preview environments: keep load on the server modest.
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : isCI ? 4 : undefined,
  maxFailures: isCI && suite === 'pr' ? 10 : undefined,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide' },
  },
  grep: SUITES[suite].grep,
  grepInvert: SUITES[suite].grepInvert,
  reporter,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    contextOptions: { reducedMotion: 'reduce' },
    httpCredentials: basicAuthUser ? { username: basicAuthUser, password: process.env.BASIC_AUTH_PASS ?? '' } : undefined,
  },
  projects: buildProjects(client, suite),
});
