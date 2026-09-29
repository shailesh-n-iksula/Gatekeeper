import { defineClient } from '../src/config/types';

/**
 * Example: Adobe Commerce (B2B) on Luma, selling in UAE, Saudi Arabia, India and the US.
 * One Magento website per market, one store view per language.
 * Copy into client.config.ts and replace every value.
 */
export default defineClient({
  client: 'acme-industrial',
  platform: 'magento',
  theme: 'luma',
  markets: [
    {
      code: 'AE',
      storefronts: [
        { locale: 'en-AE', magentoStoreCode: 'ae_en', urls: { staging: 'https://stg.acme.com/ae-en/', production: 'https://www.acme.com/ae-en/' } },
        { locale: 'ar-AE', magentoStoreCode: 'ae_ar', urls: { staging: 'https://stg.acme.com/ae-ar/', production: 'https://www.acme.com/ae-ar/' } },
      ],
      testPaymentMethod: 'checkmo',
      codPaymentMethod: 'cashondelivery',
    },
    {
      code: 'SA',
      storefronts: [
        { locale: 'ar-SA', magentoStoreCode: 'sa_ar', urls: { staging: 'https://stg.acme.com/sa-ar/' } },
        { locale: 'en-SA', magentoStoreCode: 'sa_en', urls: { staging: 'https://stg.acme.com/sa-en/' } },
      ],
      testPaymentMethod: 'checkmo',
      codPaymentMethod: 'cashondelivery',
    },
    {
      code: 'IN',
      storefronts: [{ locale: 'en-IN', magentoStoreCode: 'in_en', urls: { staging: 'https://stg.acme.in/' } }],
      testPaymentMethod: 'checkmo',
      codPaymentMethod: 'cashondelivery',
    },
    {
      code: 'US',
      storefronts: [{ locale: 'en-US', magentoStoreCode: 'us_en', urls: { staging: 'https://stg.acme.com/us/' } }],
      testPaymentMethod: 'checkmo',
    },
  ],
  catalog: {
    inStock: { path: 'qa-safety-gloves.html', sku: 'QA-GLOVE-01' },
    outOfStock: { path: 'qa-discontinued-drill.html', sku: 'QA-DRILL-OOS' },
    searchTerm: 'gloves',
    categoryPath: 'safety-equipment.html',
  },
  coupons: { valid: 'QA10' },
  features: { guestCheckout: true, storeLocator: true },
  b2b: {
    enabled: true,
    tierPrices: [
      { market: 'AE', persona: 'gold', sku: 'QA-GLOVE-01', qty: 1, expectedUnitPrice: 42.0 },
      { market: 'AE', persona: 'gold', sku: 'QA-GLOVE-01', qty: 50, expectedUnitPrice: 37.8 },
      { market: 'AE', persona: 'gold', sku: 'QA-GLOVE-01', qty: 100, expectedUnitPrice: 33.6 },
    ],
  },
  selectors: {
    overlayDismiss: ['#btn-cookie-allow', '.newsletter-popup .action-close'],
  },
  a11yBaseline: ['color-contrast'],
  budgets: { lcpMs: 4000, cls: 0.1 },
});
