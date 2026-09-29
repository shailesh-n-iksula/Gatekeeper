import { expect, test } from '../../src/fixtures';
import { isRoundedFor, moneyTolerance } from '../../src/helpers/money';

/**
 * Cart maths through the platform API. No browser, so these run in milliseconds and
 * carry most of the pricing/coupon coverage. The UI only samples it.
 */
test.describe('Cart (API)', () => {
  test.beforeEach(({ adapter }) => {
    test.skip(!adapter.can.apiCart, 'API cart not available (Shopify needs SHOPIFY_STOREFRONT_TOKEN)');
  });

  test('cart is priced in the market currency with correct precision', { tag: ['@smoke', '@p0'] }, async ({ adapter, cfg, sf }) => {
    const cart = await adapter.apiCart();
    await cart.add(cfg.catalog.inStock, 2);
    const t = await cart.totals();

    expect(t.itemsQty).toBe(2);
    expect(t.subtotal.currency, 'cart currency').toBe(sf.currency);
    expect(t.subtotal.amount).toBeGreaterThan(0);
    expect(isRoundedFor(t.subtotal.amount, sf.currency), `subtotal ${t.subtotal.amount} precision for ${sf.currency}`).toBe(true);
    expect(isRoundedFor(t.grandTotal.amount, sf.currency), `grand total ${t.grandTotal.amount} precision for ${sf.currency}`).toBe(true);
  });

  test('adding the same product again adds up exactly', { tag: ['@p0'] }, async ({ adapter, cfg, sf }) => {
    const cart = await adapter.apiCart();
    await cart.add(cfg.catalog.inStock, 1);
    const one = (await cart.totals()).subtotal.amount;
    await cart.add(cfg.catalog.inStock, 2);
    const three = await cart.totals();
    expect(three.itemsQty).toBe(3);
    expect(Math.abs(three.subtotal.amount - one * 3)).toBeLessThanOrEqual(moneyTolerance(sf.currency) * 3);
  });

  test('valid coupon applies a discount', { tag: ['@p0'] }, async ({ adapter, cfg }) => {
    test.skip(!cfg.coupons?.valid, 'No test coupon configured');
    const cart = await adapter.apiCart();
    await cart.add(cfg.catalog.inStock, 1);
    const result = await cart.applyCoupon(cfg.coupons!.valid!);
    expect(result.applied, result.message).toBe(true);
    expect((await cart.totals()).discount).toBeGreaterThan(0);
  });

  test('unknown coupon is rejected and changes nothing', { tag: ['@p1'] }, async ({ adapter, cfg, ns }) => {
    const cart = await adapter.apiCart();
    await cart.add(cfg.catalog.inStock, 1);
    const before = await cart.totals();
    const result = await cart.applyCoupon(`${ns}-NOT-A-CODE`.toUpperCase());
    expect(result.applied).toBe(false);
    expect((await cart.totals()).grandTotal.amount).toBe(before.grandTotal.amount);
  });

  test('out-of-stock product cannot be added', { tag: ['@p1'] }, async ({ adapter, cfg }) => {
    test.skip(!cfg.catalog.outOfStock, 'No out-of-stock product configured');
    const cart = await adapter.apiCart();
    await expect(cart.add(cfg.catalog.outOfStock!, 1)).rejects.toThrow();
  });
});
