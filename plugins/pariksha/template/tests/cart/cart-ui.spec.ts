import { expect, test } from '../../src/fixtures';
import { parseMoney } from '../../src/helpers/money';

test.describe('Cart (UI)', () => {
  test('add to cart from the product page updates the mini-cart', { tag: ['@smoke', '@p0'] }, async ({ shop, cfg }) => {
    await shop.pdp.open(cfg.catalog.inStock);
    await shop.pdp.addToCart();
    await expect(shop.header.miniCartCount()).toHaveText(/(^|\D)[1١](\D|$)/);
  });

  test('changing quantity recalculates the subtotal', { tag: ['@p0'] }, async ({ context, adapter, shop, cfg, sf }) => {
    // Arrange through the API: faster and not dependent on the PDP working.
    await adapter.seedBrowserCart(context, cfg.catalog.inStock, 1);
    await shop.cart.open();
    await expect(shop.cart.lines()).toHaveCount(1);
    const single = parseMoney(await shop.cart.subtotal().innerText(), sf.locale);

    await shop.cart.setQty(0, 2);

    await expect
      .poll(async () => parseMoney(await shop.cart.subtotal().innerText(), sf.locale), { message: 'subtotal for qty 2' })
      .toBeCloseTo(single * 2, 1);
  });

  test('removing the last line empties the cart', { tag: ['@p0'] }, async ({ context, adapter, shop, cfg }) => {
    await adapter.seedBrowserCart(context, cfg.catalog.inStock, 1);
    await shop.cart.open();
    await shop.cart.remove(0);
    await expect(shop.cart.empty()).toBeVisible();
  });

  test('coupon applied in the cart lowers the total', { tag: ['@p1'] }, async ({ context, adapter, shop, cfg, sf }) => {
    test.skip(!cfg.coupons?.valid, 'No test coupon configured');
    test.skip(!shop.cart.canApplyCoupon(), 'Theme applies coupons at checkout, not in the cart');
    await adapter.seedBrowserCart(context, cfg.catalog.inStock, 1);
    await shop.cart.open();
    const before = parseMoney(await shop.cart.grandTotal().innerText(), sf.locale);
    await shop.cart.applyCoupon(cfg.coupons!.valid!);
    await expect.poll(async () => parseMoney(await shop.cart.grandTotal().innerText(), sf.locale)).toBeLessThan(before);
  });
});
