import type { BrowserContext } from '@playwright/test';
import type { Platform, ProductRef } from '../config/types';

export interface Money {
  amount: number;
  currency: string;
}

export interface CartTotals {
  subtotal: Money;
  grandTotal: Money;
  discount: number;
  itemsQty: number;
}

export interface CustomerCreds {
  email: string;
  password: string;
  id?: string;
}

/** A cart driven purely through the platform API. Fast, no browser. */
export interface ApiCart {
  add(product: ProductRef, qty: number): Promise<void>;
  totals(): Promise<CartTotals>;
  applyCoupon(code: string): Promise<{ applied: boolean; message?: string }>;
}

/**
 * Everything platform-specific lives behind this interface. Tests only talk to it,
 * so the same test file runs on Magento and Shopify.
 */
export interface CommerceAdapter {
  readonly platform: Platform;
  readonly can: { createCustomer: boolean; apiCart: boolean; customerPricing: boolean };

  /** Per-context setup: storefront password, store cookies. Runs before each test. */
  prepareContext(context: BrowserContext): Promise<void>;
  /** Put a product in the BROWSER's cart without clicking through the UI. */
  seedBrowserCart(context: BrowserContext, product: ProductRef, qty: number): Promise<void>;
  /** Sign the browser in without the login form. */
  loginBrowser(context: BrowserContext, creds: CustomerCreds): Promise<void>;
  createCustomer(namespace: string): Promise<CustomerCreds>;
  apiCart(): Promise<ApiCart>;
  /** Unit price a logged-in customer pays for a quantity (B2B tier / customer-group pricing). */
  customerUnitPrice(creds: CustomerCreds, sku: string, qty: number): Promise<Money>;
  /** Remove anything this adapter created. Best effort: never throws. */
  cleanup(): Promise<void>;
}

export class NotSupported extends Error {}
