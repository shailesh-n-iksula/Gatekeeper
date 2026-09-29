import { test as base, expect } from '@playwright/test';
import client from '../client.config';
import { createAdapter, type CommerceAdapter } from './adapters';
import { selectorsFor } from './config/selectors';
import { resolveStorefront, targetEnv, type ResolvedStorefront } from './config/resolve';
import type { ProjectMeta } from './config/suites';
import type { ClientConfig } from './config/types';
import { namespaceFor } from './helpers/data';
import { blockThirdParties } from './helpers/network';
import { Shop } from './pages/shop';

interface Fixtures {
  /** The client's config (client.config.ts). */
  cfg: ClientConfig;
  /** The storefront this project runs against: market, locale, currency, address, RTL. */
  sf: ResolvedStorefront;
  /** Platform API (Magento or Shopify) for seeding and API-level checks. */
  adapter: CommerceAdapter;
  /** Unique prefix for data this test creates. */
  ns: string;
  /** Page objects. */
  shop: Shop;
  /** Refuses to run non-synthetic tests against production. */
  productionGuard: void;
}

export const test = base.extend<Fixtures>({
  productionGuard: [
    async ({}, use, info) => {
      if (targetEnv() === 'production' && !info.tags.includes('@synthetic')) {
        info.skip(true, 'Only @synthetic (read-only) tests may run against production');
      }
      await use();
    },
    { auto: true },
  ],

  cfg: async ({}, use) => {
    await use(client);
  },

  sf: async ({ cfg }, use, info) => {
    const meta = info.project.metadata as ProjectMeta;
    await use(resolveStorefront(cfg, meta.market, meta.locale));
  },

  adapter: async ({ cfg, sf, playwright }, use) => {
    const user = process.env.BASIC_AUTH_USER;
    const api = await playwright.request.newContext({
      baseURL: sf.url,
      httpCredentials: user ? { username: user, password: process.env.BASIC_AUTH_PASS ?? '' } : undefined,
    });
    const adapter = createAdapter(cfg, sf, api);
    await use(adapter);
    await adapter.cleanup();
    await api.dispose();
  },

  context: async ({ context, cfg, adapter }, use) => {
    await blockThirdParties(context, cfg.blockHosts);
    await adapter.prepareContext(context);
    await use(context);
  },

  page: async ({ page, cfg }, use) => {
    // Cookie banners and newsletter popups get dismissed whenever they appear.
    for (const sel of selectorsFor(cfg).overlayDismiss) {
      await page.addLocatorHandler(page.locator(sel).first(), async (btn) => btn.click());
    }
    await use(page);
  },

  ns: async ({}, use, info) => {
    await use(namespaceFor(info));
  },

  shop: async ({ page, cfg }, use) => {
    await use(new Shop(page, cfg));
  },
});

export { expect };
