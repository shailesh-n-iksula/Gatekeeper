import { defineClient } from '../src/config/types';

/**
 * Example: Shopify Plus on Dawn, Shopify Markets with subfolders per market/language.
 * Staging = a development store (password protected, Bogus Gateway enabled).
 * Copy into client.config.ts and replace every value.
 *
 * Variant ids: Admin > Products > (product) > (variant) — the number at the end of the URL.
 */
export default defineClient({
  client: 'acme-lifestyle',
  platform: 'shopify',
  theme: 'dawn',
  shopify: { storeDomain: 'acme-lifestyle-dev.myshopify.com', apiVersion: '2026-07' },
  markets: [
    {
      code: 'AE',
      storefronts: [
        { locale: 'en-AE', urls: { staging: 'https://acme-lifestyle-dev.myshopify.com/en-ae/', production: 'https://acme.com/en-ae/' } },
        { locale: 'ar-AE', urls: { staging: 'https://acme-lifestyle-dev.myshopify.com/ar-ae/' } },
      ],
      testPaymentMethod: 'bogus',
      codPaymentMethod: 'cod',
    },
    {
      code: 'IN',
      storefronts: [{ locale: 'en-IN', urls: { staging: 'https://acme-lifestyle-dev.myshopify.com/en-in/' } }],
      testPaymentMethod: 'bogus',
      codPaymentMethod: 'cod',
    },
    {
      code: 'US',
      storefronts: [{ locale: 'en-US', urls: { staging: 'https://acme-lifestyle-dev.myshopify.com/', production: 'https://acme.com/' } }],
      testPaymentMethod: 'bogus',
    },
  ],
  catalog: {
    inStock: { path: 'products/qa-classic-tee', sku: 'QA-TEE-01', id: '44012345678901' },
    outOfStock: { path: 'products/qa-sold-out-cap', sku: 'QA-CAP-OOS', id: '44012345678902' },
    searchTerm: 'tee',
    categoryPath: 'collections/all',
  },
  coupons: { valid: 'QA10' },
  selectors: {
    overlayDismiss: ['#shopify-pc__banner__btn-accept'],
  },
});
