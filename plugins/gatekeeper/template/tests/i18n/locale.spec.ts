import { expect, test } from '../../src/fixtures';
import { minorUnits, normaliseDigits, parseMoney } from '../../src/helpers/money';

/**
 * Runs once per storefront (en-AE, ar-AE, ar-SA, en-IN, en-US ...). Catches the
 * regional regressions that single-locale suites never see.
 */
test.describe('Localisation', () => {
  test('page language and direction match the storefront', { tag: ['@smoke', '@p0', '@synthetic'] }, async ({ page, sf }) => {
    await page.goto('');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', new RegExp(`^${sf.language}`, 'i'));
    if (sf.rtl) await expect(html, 'Arabic storefront must be right-to-left').toHaveAttribute('dir', 'rtl');
    else expect(await html.getAttribute('dir')).not.toBe('rtl');
  });

  test('product price shows the market currency', { tag: ['@p0', '@synthetic'] }, async ({ shop, cfg, sf }) => {
    await shop.pdp.open(cfg.catalog.inStock);
    const text = (await shop.pdp.price().innerText()).trim();

    const markers = [sf.currency, ...sf.facts.currencyMarkers];
    expect(markers.some((m) => text.includes(m)), `"${text}" should show one of: ${markers.join(' ')}`).toBe(true);
    expect(parseMoney(text, sf.locale)).toBeGreaterThan(0);

    // Displayed decimals must not exceed the currency's minor units (e.g. 3 for KWD, 2 for AED).
    const decimals = normaliseDigits(text).match(/[.٫](\d+)/)?.[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(minorUnits(sf.currency));

    // India: large amounts use lakh grouping (1,00,000), not Western (100,000).
    if (sf.market.code === 'IN' && parseMoney(text, sf.locale) >= 100000) {
      expect.soft(normaliseDigits(text), 'Indian digit grouping').toMatch(/\d{1,2},\d{2},\d{3}/);
    }
  });

  test('RTL storefront mirrors the header', { tag: ['@p1'] }, async ({ page, shop, sf }) => {
    test.skip(!sf.rtl, 'Left-to-right storefront');
    await page.goto('');
    const box = await shop.header.logo().boundingBox();
    const width = page.viewportSize()?.width ?? 0;
    expect(box, 'logo visible').not.toBeNull();
    // Themes centre the logo on mobile; on wider screens it must sit on the right in RTL.
    if (width >= 1024) expect(box!.x + box!.width / 2, 'logo centre in right half').toBeGreaterThan(width / 2);
  });

  test('checkout does not demand a postcode where none exist', { tag: ['@p1'] }, async ({ context, adapter, page, cfg, sf }) => {
    test.skip(sf.facts.postcode.required || cfg.platform !== 'magento', 'Postcode is legitimately required, or not a Magento checkout');
    await adapter.seedBrowserCart(context, cfg.catalog.inStock, 1);
    await page.goto('checkout/');
    const postcode = page.locator('#co-shipping-form [name="postcode"]');
    await page.locator('#co-shipping-form select[name="country_id"]').selectOption(sf.market.code);
    if (await postcode.isVisible()) {
      await expect(postcode, `${sf.facts.name} has no postcodes; field must be optional`).not.toHaveAttribute('aria-required', 'true');
    }
  });
});
