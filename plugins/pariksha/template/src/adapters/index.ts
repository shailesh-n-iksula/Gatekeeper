import type { APIRequestContext } from '@playwright/test';
import type { ResolvedStorefront } from '../config/resolve';
import type { ClientConfig } from '../config/types';
import { MagentoAdapter } from './magento';
import { ShopifyAdapter } from './shopify';
import type { CommerceAdapter } from './types';

export function createAdapter(cfg: ClientConfig, sf: ResolvedStorefront, api: APIRequestContext): CommerceAdapter {
  switch (cfg.platform) {
    case 'magento':
      return new MagentoAdapter(cfg, sf, api);
    case 'shopify':
      return new ShopifyAdapter(cfg, sf, api);
  }
}

export * from './types';
