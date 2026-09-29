import { expect, test } from '../../src/fixtures';

test.describe('Out of stock', () => {
  test.beforeEach(({ cfg }) => {
    test.skip(!cfg.catalog.outOfStock, 'No out-of-stock product configured');
  });

  test('product page shows unavailable and blocks add-to-cart', { tag: ['@p1'] }, async ({ page, shop, cfg }) => {
    await shop.pdp.open(cfg.catalog.outOfStock!);
    await expect(shop.pdp.outOfStock()).toBeVisible();
    const button = shop.pdp.addToCartButton();
    if ((await button.count()) > 0) await expect(button).toBeDisabled();
    await expect(page).not.toHaveURL(/cart/);
  });
});
