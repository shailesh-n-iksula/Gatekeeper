import type { Locator, Page } from '@playwright/test';
import type { Address } from '../markets/markets';

export interface GuestOrder {
  email: string;
  address: Address;
  /** Magento payment code, or 'bogus' / 'cod' on Shopify. */
  paymentMethod: string;
}

export interface Checkout {
  /** Starts from a browser cart that already has items. Returns the order reference shown to the shopper. */
  placeGuestOrder(order: GuestOrder): Promise<string>;
}

async function fillIfVisible(field: Locator, value: string | undefined): Promise<void> {
  if (value !== undefined && (await field.isVisible())) await field.fill(value);
}

/** Magento Luma one-page checkout (also Hyvä with the Luma checkout fallback). */
export class MagentoLumaCheckout implements Checkout {
  constructor(private readonly page: Page) {}

  private async settle(): Promise<void> {
    await this.page.locator('.loading-mask').first().waitFor({ state: 'hidden' });
  }

  async placeGuestOrder(o: GuestOrder): Promise<string> {
    const p = this.page;
    await p.goto('checkout/');
    await p.locator('#customer-email').fill(o.email);
    const form = p.locator('#co-shipping-form');
    await form.locator('[name="firstname"]').fill(o.address.firstName);
    await form.locator('[name="lastname"]').fill(o.address.lastName);
    await form.locator('[name="street[0]"]').fill(o.address.street);
    await form.locator('select[name="country_id"]').selectOption(o.address.countryCode);
    await this.settle();
    const regionSelect = form.locator('select[name="region_id"]');
    if (o.address.region && (await regionSelect.isVisible())) await regionSelect.selectOption({ label: o.address.region });
    else await fillIfVisible(form.locator('input[name="region"]'), o.address.region);
    await form.locator('[name="city"]').fill(o.address.city);
    await fillIfVisible(form.locator('[name="postcode"]'), o.address.postcode);
    await form.locator('[name="telephone"]').fill(o.address.phone);
    await this.settle();

    const methods = p.locator('#checkout-shipping-method-load input[type="radio"]');
    if ((await methods.count()) > 0) await methods.first().check();
    await p.locator('button[data-role="opc-continue"]').click();
    await this.settle();

    await p.locator(`input[type="radio"]#${o.paymentMethod}`).check();
    await p.locator('.payment-method._active button.action.checkout').click();
    await p.waitForURL(/checkout\/onepage\/success/, { timeout: 60_000 });
    const text = await p.locator('.checkout-success').innerText();
    return text.match(/\d{6,}/)?.[0] ?? text.trim();
  }
}

/** Shopify one-page checkout (2024+). Card fields live in per-field iframes. */
export class ShopifyCheckout implements Checkout {
  constructor(private readonly page: Page) {}

  async placeGuestOrder(o: GuestOrder): Promise<string> {
    const p = this.page;
    await p.goto('checkout');
    await p.locator('#email').fill(o.email);
    await p.locator('select[name="countryCode"]').selectOption(o.address.countryCode);
    await p.locator('input[name="firstName"]').fill(o.address.firstName);
    await p.locator('input[name="lastName"]').fill(o.address.lastName);
    await p.locator('input[name="address1"]').fill(o.address.street);
    await p.locator('input[name="city"]').fill(o.address.city);
    await fillIfVisible(p.locator('input[name="postalCode"]'), o.address.postcode);
    const zone = p.locator('select[name="zone"]');
    if (await zone.isVisible()) await zone.selectOption(o.address.regionCode ?? { label: o.address.region ?? '' });
    await fillIfVisible(p.locator('input[name="phone"]'), o.address.phone);

    if (o.paymentMethod === 'bogus') {
      // Shopify Bogus Gateway (development stores only): card number "1" always succeeds.
      const yy = String((new Date().getFullYear() + 3) % 100).padStart(2, '0');
      await p.frameLocator('iframe[name^="card-fields-number"]').locator('input[name="number"]').fill('1');
      await p.frameLocator('iframe[name^="card-fields-expiry"]').locator('input[name="expiry"]').fill(`12 / ${yy}`);
      await p.frameLocator('iframe[name^="card-fields-verification_value"]').locator('input[name="verification_value"]').fill('111');
      await p.frameLocator('iframe[name^="card-fields-name"]').locator('input[name="name"]').fill('Bogus Gateway');
    } else if (o.paymentMethod === 'cod') {
      await p.getByLabel(/cash on delivery|COD|الدفع عند الاستلام/i).first().check();
    }

    await p.locator('#checkout-pay-button').click();
    await p.waitForURL(/thank[-_]you|\/orders\//, { timeout: 90_000 });
    const confirmation = await p.getByText(/confirmation\s*#?\s*[A-Z0-9]+/i).first().innerText();
    return confirmation.replace(/.*#\s*/i, '').trim();
  }
}
