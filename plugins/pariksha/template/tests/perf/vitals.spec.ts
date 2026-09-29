import { test } from '../../src/fixtures';
import { expectWithinBudget, trackVitals } from '../../src/helpers/vitals';

/**
 * Lab Core Web Vitals on the key templates. Soft assertions: CI hardware is noisy, so a
 * breach is reported, not fatal. Real-user numbers (CrUX/RUM) remain the source of truth.
 */
test.describe('Performance budgets', () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== 'chromium', 'LCP/CLS observers are Chromium-only');
  });

  test('home page', { tag: ['@p1', '@perf'] }, async ({ page, cfg }) => {
    await trackVitals(page);
    await page.goto('', { waitUntil: 'load' });
    await expectWithinBudget(page, { lcpMs: cfg.budgets?.lcpMs ?? 4000, cls: cfg.budgets?.cls ?? 0.1 });
  });

  test('product page', { tag: ['@p1', '@perf'] }, async ({ page, cfg }) => {
    await trackVitals(page);
    await page.goto(cfg.catalog.inStock.path, { waitUntil: 'load' });
    await expectWithinBudget(page, { lcpMs: cfg.budgets?.lcpMs ?? 4000, cls: cfg.budgets?.cls ?? 0.1 });
  });
});
