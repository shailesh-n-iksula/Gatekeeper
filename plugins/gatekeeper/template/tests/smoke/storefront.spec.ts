import { expect, test } from '../../src/fixtures';

test.describe('Storefront availability', () => {
  test('home page loads without script errors', { tag: ['@smoke', '@p0', '@synthetic'] }, async ({ page, shop }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto('');
    expect(res?.status(), 'home page HTTP status').toBeLessThan(400);
    await expect(shop.header.logo()).toBeVisible();
    expect(errors, 'uncaught JavaScript errors').toEqual([]);
  });

  test('search finds the test product', { tag: ['@smoke', '@p0', '@synthetic'] }, async ({ page, shop, cfg }) => {
    await page.goto('');
    await shop.header.search(cfg.catalog.searchTerm);
    await expect(shop.listing.searchResults().first()).toBeVisible();
  });

  test('category page lists products', { tag: ['@p1', '@synthetic'] }, async ({ page, shop, cfg }) => {
    await page.goto(cfg.catalog.categoryPath);
    await expect(shop.listing.categoryProducts().first()).toBeVisible();
  });

  test('product page shows price and add-to-cart', { tag: ['@smoke', '@p0', '@synthetic'] }, async ({ shop, cfg }) => {
    await shop.pdp.open(cfg.catalog.inStock);
    await expect(shop.pdp.price()).toBeVisible();
    await expect(shop.pdp.addToCartButton()).toBeEnabled();
  });
});
