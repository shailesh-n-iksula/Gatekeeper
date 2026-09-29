import { MARKETS, RTL_LANGUAGES, type Address, type MarketCode, type MarketFacts } from '../markets/markets';
import type { ClientConfig, MarketConfig, Storefront, TargetEnv } from './types';

export interface ResolvedStorefront {
  market: MarketConfig;
  facts: MarketFacts;
  locale: string;
  language: string;
  /** Storefront base URL, always with a trailing slash. Use relative paths with page.goto(). */
  url: string;
  origin: string;
  storeCode?: string;
  rtl: boolean;
  currency: string;
  address: Address;
}

export function targetEnv(): TargetEnv {
  const env = process.env.TARGET_ENV ?? 'staging';
  if (env !== 'staging' && env !== 'production') throw new Error(`TARGET_ENV must be staging or production, got "${env}"`);
  return env;
}

export function withSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

export function storefrontUrl(sf: Storefront, env: TargetEnv): string | undefined {
  const url = sf.urls[env];
  return url ? withSlash(url) : undefined;
}

export function resolveStorefront(cfg: ClientConfig, code: MarketCode, locale: string): ResolvedStorefront {
  const market = cfg.markets.find((m) => m.code === code);
  if (!market) throw new Error(`Market ${code} is not in client.config.ts`);
  const sf = market.storefronts.find((s) => s.locale === locale);
  if (!sf) throw new Error(`Storefront ${locale} is not configured for market ${code}`);
  const url = storefrontUrl(sf, targetEnv());
  if (!url) throw new Error(`Storefront ${locale} has no ${targetEnv()} URL`);
  const facts = MARKETS[code];
  const language = locale.split('-')[0].toLowerCase();
  return {
    market,
    facts,
    locale,
    language,
    url,
    origin: new URL(url).origin,
    storeCode: sf.magentoStoreCode,
    rtl: RTL_LANGUAGES.includes(language),
    currency: market.currency ?? facts.currency,
    address: { ...facts.address, ...market.address },
  };
}
