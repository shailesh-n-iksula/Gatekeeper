import { defineClient } from './src/config/types';

/**
 * THE ONLY FILE YOU MUST EDIT PER CLIENT.
 *
 * Start from examples/magento.client.ts or examples/shopify.client.ts, or ask the
 * Pariksha agent: "/pariksha-onboard". It fills this in and verifies it against staging.
 *
 * Rules:
 *  - Paths have NO leading slash ('checkout/cart/', 'products/tee').
 *  - The first market is the primary market; its first storefront runs on every PR.
 *  - Test products must be simple (no size/colour options) and always in stock on staging.
 */
export default defineClient({
  client: 'example-client',
  platform: 'magento',
  theme: 'luma',
  markets: [
    {
      code: 'AE',
      storefronts: [
        { locale: 'en-AE', urls: { staging: 'https://staging.example.com/ae_en/' }, magentoStoreCode: 'ae_en' },
        { locale: 'ar-AE', urls: { staging: 'https://staging.example.com/ae_ar/' }, magentoStoreCode: 'ae_ar' },
      ],
      testPaymentMethod: 'checkmo',
      codPaymentMethod: 'cashondelivery',
    },
  ],
  catalog: {
    inStock: { path: 'test-simple-product.html', sku: 'QA-SIMPLE-001' },
    searchTerm: 'bag',
    categoryPath: 'gear.html',
  },
});
