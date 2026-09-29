import type { Address, MarketCode } from '../markets/markets';

export type Platform = 'magento' | 'shopify';

/**
 * Storefront theme. Picks default selectors and the checkout flow.
 * 'custom' means the client's own theme: every selector must come from client.config.ts.
 */
export type Theme = 'luma' | 'hyva' | 'dawn' | 'custom';

export type TargetEnv = 'staging' | 'production';

export interface ProductRef {
  /** Path relative to the storefront URL, NO leading slash: 'joust-duffle-bag.html', 'products/classic-tee'. */
  path: string;
  /** Magento SKU (used by the REST API). For Shopify, informational only. */
  sku: string;
  /**
   * Magento: numeric product entity id. Optional, looked up by SKU if missing.
   * Shopify: numeric VARIANT id. Required for cart seeding.
   */
  id?: string;
}

export interface Storefront {
  /** BCP 47 locale this storefront serves: 'en-AE', 'ar-AE', 'en-IN', 'hi-IN', 'en-US'. */
  locale: string;
  /** Storefront base URL per environment. Leave production out to keep synthetic checks off it. */
  urls: Partial<Record<TargetEnv, string>> & { staging: string };
  /** Magento store view code ('ae_en'). Required for Magento API calls. */
  magentoStoreCode?: string;
}

export interface MarketConfig {
  code: MarketCode;
  /** The first storefront is the market's primary one. The first market is the client's primary market. */
  storefronts: Storefront[];
  /** Currency override when the client sells in a non-local currency (for example USD in a MENA market). */
  currency?: string;
  /**
   * Payment method the checkout test uses.
   * Magento: payment method code ('checkmo', 'cashondelivery', or a PSP sandbox code).
   * Shopify: 'bogus' (Bogus Gateway on a dev store) or 'cod'.
   */
  testPaymentMethod: string;
  /** Cash-on-delivery method code, if this market offers COD. */
  codPaymentMethod?: string;
  address?: Partial<Address>;
}

export interface TierPriceCase {
  market: MarketCode;
  /** Persona name. Credentials come from env B2B_<PERSONA>_EMAIL / _PASSWORD. */
  persona: string;
  sku: string;
  qty: number;
  expectedUnitPrice: number;
}

export interface SelectorMap {
  logo: string;
  searchOpen?: string;
  searchInput: string;
  searchResult: string;
  categoryProduct: string;
  miniCartCount: string;
  pdpPrice: string;
  pdpAddToCart: string;
  pdpQty: string;
  pdpOutOfStock: string;
  /** Substring of the add-to-cart request URL, used to wait for the add to finish. */
  addToCartRequest: string;
  cartPath: string;
  cartLine: string;
  cartLineQty: string;
  cartLineRemove: string;
  cartUpdate?: string;
  cartSubtotal: string;
  cartGrandTotal: string;
  cartEmpty: string;
  couponToggle?: string;
  couponInput?: string;
  couponApply?: string;
  loginPath: string;
  loginEmail: string;
  loginPassword: string;
  loginSubmit: string;
  accountMarker: string;
  /** Clicked automatically whenever it appears (cookie banners, newsletter popups). */
  overlayDismiss: string[];
  /** Hidden in visual snapshots (live prices, dates, recommendations). */
  visualMask: string[];
}

export interface ClientConfig {
  client: string;
  platform: Platform;
  theme: Theme;
  /** Which checkout page object to use. Defaults from theme. 'custom' = write src/pages/checkout-custom.ts. */
  checkoutFlow?: 'magento-luma' | 'shopify' | 'custom';
  markets: MarketConfig[];
  catalog: {
    /** Simple (non-configurable) product that is always in stock in every tested market. */
    inStock: ProductRef;
    outOfStock?: ProductRef;
    searchTerm: string;
    /** Category/collection path, no leading slash. */
    categoryPath: string;
  };
  coupons?: {
    /** A coupon that applies to catalog.inStock, never expires on staging, and has no usage limit. */
    valid?: string;
  };
  features?: { guestCheckout?: boolean; storeLocator?: boolean };
  b2b?: { enabled: boolean; tierPrices?: TierPriceCase[] };
  selectors?: Partial<SelectorMap>;
  /** Extra third-party hosts to block during tests, on top of the defaults. */
  blockHosts?: string[];
  /** axe rule ids accepted as known debt. New violations still fail. */
  a11yBaseline?: string[];
  budgets?: { lcpMs?: number; cls?: number };
  magento?: { apiOrigin?: string };
  shopify?: { storeDomain: string; apiVersion: string };
}

export function defineClient(config: ClientConfig): ClientConfig {
  return config;
}
