import { expect, test } from '../../src/fixtures';

/**
 * `npm run doctor` — run this first on every new client. It checks client.config.ts
 * against the live storefront and lists every selector or test product that is wrong.
 * Soft assertions: you get the whole list in one run, not one failure at a time.
 */
test.describe('Client config doctor', () => {
  test('storefront selectors resolve', { tag: ['@doctor'] }, async ({ page, shop, cfg }) => {
    const s = shop.selectors;
    await page.goto('');
    await expect.soft(page.locator(s.logo).first(), `logo: ${s.logo}`).toBeVisible();
    if (s.searchOpen) await expect.soft(page.locator(s.searchOpen).first(), `searchOpen: ${s.searchOpen}`).toBeVisible();

    await page.goto(cfg.catalog.categoryPath);
    await expect.soft(page.locator(s.categoryProduct).first(), `categoryProduct: ${s.categoryProduct}`).toBeVisible();

    await shop.pdp.open(cfg.catalog.inStock);
    await expect.soft(page.locator(s.pdpPrice).first(), `pdpPrice: ${s.pdpPrice}`).toBeVisible();
    await expect.soft(page.locator(s.pdpAddToCart).first(), `pdpAddToCart: ${s.pdpAddToCart}`).toBeEnabled();
  });

  test('test product can be seeded into the browser cart', { tag: ['@doctor'] }, async ({ page, context, adapter, shop, cfg }) => {
    await adapter.seedBrowserCart(context, cfg.catalog.inStock, 1);
    await shop.cart.open();
    const s = shop.selectors;
    await expect.soft(page.locator(s.cartLine).first(), `cartLine: ${s.cartLine}`).toBeVisible();
    await expect.soft(page.locator(s.cartSubtotal).first(), `cartSubtotal: ${s.cartSubtotal}`).toBeVisible();
    await expect.soft(page.locator(s.cartGrandTotal).first(), `cartGrandTotal: ${s.cartGrandTotal}`).toBeVisible();
    await page.goto('');
    await expect.soft(page.locator(s.miniCartCount).first(), `miniCartCount: ${s.miniCartCount}`).toBeVisible();
  });

  test('platform API is reachable with the configured credentials', { tag: ['@doctor'] }, async ({ adapter, cfg }) => {
    test.skip(!adapter.can.apiCart, 'API cart not configured');
    const cart = await adapter.apiCart();
    await cart.add(cfg.catalog.inStock, 1);
    expect((await cart.totals()).itemsQty).toBe(1);
  });

  test('login page selectors resolve', { tag: ['@doctor'] }, async ({ page, shop }) => {
    const s = shop.selectors;
    await page.goto(s.loginPath);
    await expect.soft(page.locator(s.loginEmail).first(), `loginEmail: ${s.loginEmail}`).toBeVisible();
    await expect.soft(page.locator(s.loginPassword).first(), `loginPassword: ${s.loginPassword}`).toBeVisible();
    await expect.soft(page.locator(s.loginSubmit).first(), `loginSubmit: ${s.loginSubmit}`).toBeVisible();
  });
});
