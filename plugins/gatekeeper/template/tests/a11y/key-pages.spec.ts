import { test } from '../../src/fixtures';
import { expectAccessible } from '../../src/helpers/a11y';

test.describe('Accessibility (WCAG 2.2 AA, serious + critical)', () => {
  test('home page', { tag: ['@smoke', '@p1', '@a11y'] }, async ({ page, cfg }) => {
    await page.goto('');
    await expectAccessible(page, { baseline: cfg.a11yBaseline });
  });

  test('product page', { tag: ['@p1', '@a11y'] }, async ({ page, shop, cfg }) => {
    await shop.pdp.open(cfg.catalog.inStock);
    await expectAccessible(page, { baseline: cfg.a11yBaseline });
  });

  test('search results', { tag: ['@p1', '@a11y'] }, async ({ page, shop, cfg }) => {
    await page.goto('');
    await shop.header.search(cfg.catalog.searchTerm);
    await shop.listing.searchResults().first().waitFor();
    await expectAccessible(page, { baseline: cfg.a11yBaseline });
  });

  test('cart', { tag: ['@p1', '@a11y'] }, async ({ page, context, adapter, shop, cfg }) => {
    await adapter.seedBrowserCart(context, cfg.catalog.inStock, 1);
    await shop.cart.open();
    await shop.cart.lines().first().waitFor();
    await expectAccessible(page, { baseline: cfg.a11yBaseline });
  });
});
