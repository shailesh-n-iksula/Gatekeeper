import { expect, test } from '../../src/fixtures';

/**
 * Baselines are per project (locale × device × browser) and per OS. Generate them in CI
 * (Linux) with the "Visual baselines" workflow, never on a laptop.
 */
test.describe('Visual regression', () => {
  test('header', { tag: ['@p1', '@visual'] }, async ({ page, shop }) => {
    await page.goto('');
    const header = page.locator('header').first();
    await expect(header).toHaveScreenshot('header.png', { mask: shop.selectors.visualMask.map((s) => page.locator(s)) });
  });

  test('product buy box', { tag: ['@p1', '@visual'] }, async ({ page, shop, cfg }) => {
    await shop.pdp.open(cfg.catalog.inStock);
    await expect(shop.pdp.addToCartButton()).toBeVisible();
    await expect(page).toHaveScreenshot('pdp.png', {
      fullPage: false,
      mask: shop.selectors.visualMask.map((s) => page.locator(s)),
    });
  });
});
