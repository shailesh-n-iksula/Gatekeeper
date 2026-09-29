import { expect, test } from '../../src/fixtures';
import { testEmail } from '../../src/helpers/data';

/**
 * Places real orders on STAGING with test payment methods only.
 * Orders are traceable by the qa- namespace in the customer email.
 */
test.describe('Guest checkout', () => {
  test.beforeEach(({ cfg }) => {
    test.skip(cfg.features?.guestCheckout === false, 'Guest checkout disabled for this client');
  });

  test('guest places an order with the test payment method', { tag: ['@p0'] }, async ({ context, adapter, shop, cfg, sf, ns }) => {
    test.slow();
    await adapter.seedBrowserCart(context, cfg.catalog.inStock, 1);

    const orderRef = await shop.checkout.placeGuestOrder({
      email: testEmail(ns),
      address: sf.address,
      paymentMethod: sf.market.testPaymentMethod,
    });

    expect(orderRef).toMatch(/\w{3,}/);
    test.info().annotations.push({ type: 'order', description: `${sf.locale}: ${orderRef}` });
  });

  test('cash on delivery is offered and orderable', { tag: ['@p1'] }, async ({ context, adapter, shop, cfg, sf, ns }) => {
    test.skip(!sf.market.codPaymentMethod, `No COD configured for ${sf.market.code}`);
    test.slow();
    await adapter.seedBrowserCart(context, cfg.catalog.inStock, 1);

    const orderRef = await shop.checkout.placeGuestOrder({
      email: testEmail(ns),
      address: sf.address,
      paymentMethod: sf.market.codPaymentMethod!,
    });

    expect(orderRef).toMatch(/\w{3,}/);
  });
});
