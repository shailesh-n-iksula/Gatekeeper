import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Fails on NEW serious/critical WCAG 2.2 AA violations. Rule ids in `baseline` are
 * accepted known debt (from client.config.ts a11yBaseline), so debt cannot grow
 * but does not block every build either.
 * axe finds roughly a third of real issues. It does not replace a manual screen-reader pass.
 */
export async function expectAccessible(page: Page, opts: { include?: string; exclude?: string[]; baseline?: string[] } = {}): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (opts.include) builder = builder.include(opts.include);
  for (const sel of opts.exclude ?? []) builder = builder.exclude(sel);
  const results = await builder.analyze();
  await test.info().attach('axe-violations.json', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' });
  const blocking = results.violations
    .filter((v) => (v.impact === 'serious' || v.impact === 'critical') && !(opts.baseline ?? []).includes(v.id))
    .map((v) => `${v.id} [${v.impact}] ${v.help} (${v.nodes.length} element(s)) ${v.helpUrl}`);
  expect(blocking, 'New serious/critical accessibility violations').toEqual([]);
}
