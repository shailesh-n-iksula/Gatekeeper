import type { Page } from '@playwright/test';
import type { Checkout, GuestOrder } from './checkout';

/**
 * Client-specific checkout (Hyvä Checkout, Amasty/OneStepCheckout, headless PWA, Shopify
 * checkout extensions...). Used when client.config.ts sets checkoutFlow: 'custom'.
 *
 * Ask the Pariksha agent: "write the custom checkout for this client". It will walk the
 * staging checkout in a browser and fill this in.
 */
export class CustomCheckout implements Checkout {
  constructor(private readonly page: Page) {}

  async placeGuestOrder(order: GuestOrder): Promise<string> {
    void order;
    void this.page;
    throw new Error('Custom checkout not implemented yet. See src/pages/checkout-custom.ts');
  }
}
