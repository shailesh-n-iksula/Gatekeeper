import { randomUUID } from 'node:crypto';
import type { TestInfo } from '@playwright/test';
import type { CustomerCreds } from '../adapters/types';

/**
 * Unique, traceable prefix for everything a test creates: qa-<run>-<worker>-<random>.
 * The nightly janitor deletes anything starting with "qa-" older than 24h.
 */
export function namespaceFor(info: TestInfo): string {
  const run = process.env.GITHUB_RUN_ID ?? process.env.CI_PIPELINE_ID ?? 'local';
  return `qa-${run}-w${info.workerIndex}-${randomUUID().slice(0, 8)}`;
}

export function testEmail(namespace: string): string {
  return `${namespace}@${process.env.TEST_EMAIL_DOMAIN ?? 'example.com'}`;
}

/** Pre-created account from env, for platforms that cannot create customers by API. */
export function envCustomer(prefix = 'QA_CUSTOMER'): CustomerCreds | undefined {
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  return email && password ? { email, password } : undefined;
}
