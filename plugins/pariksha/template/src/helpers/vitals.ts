import { expect, test, type Page } from '@playwright/test';

export interface LabVitals {
  lcp: number;
  cls: number;
}

/**
 * Collects LCP and CLS in the page (Chromium only). Call BEFORE page.goto().
 * These are lab numbers on shared CI hardware: good for catching regressions, not for
 * reporting real-user performance. Use CrUX/RUM for that.
 */
export async function trackVitals(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type Shift = PerformanceEntry & { value: number; hadRecentInput: boolean };
    const w = window as unknown as { __vitals: { lcp: number; cls: number } };
    w.__vitals = { lcp: 0, cls: 0 };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__vitals.lcp = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as Shift[]) if (!e.hadRecentInput) w.__vitals.cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
}

export async function readVitals(page: Page): Promise<LabVitals> {
  return page.evaluate(() => (window as unknown as { __vitals: { lcp: number; cls: number } }).__vitals);
}

export async function expectWithinBudget(page: Page, budget: { lcpMs: number; cls: number }): Promise<void> {
  const v = await readVitals(page);
  await test.info().attach('vitals.json', { body: JSON.stringify(v), contentType: 'application/json' });
  expect.soft(v.lcp, `LCP ${Math.round(v.lcp)}ms over budget ${budget.lcpMs}ms`).toBeLessThanOrEqual(budget.lcpMs);
  expect.soft(v.cls, `CLS ${v.cls.toFixed(3)} over budget ${budget.cls}`).toBeLessThanOrEqual(budget.cls);
}
