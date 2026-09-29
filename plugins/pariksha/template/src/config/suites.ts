import { devices, type PlaywrightTestConfig } from '@playwright/test';
import { MARKETS, type MarketCode } from '../markets/markets';
import { storefrontUrl, targetEnv } from './resolve';
import type { ClientConfig } from './types';

type Project = NonNullable<PlaywrightTestConfig['projects']>[number];
type BrowserName = 'chromium' | 'firefox' | 'webkit';
type DeviceKind = 'desktop' | 'tablet' | 'mobile';
/** primary = client's first storefront only; per-market = first storefront of each market; all = every storefront. */
type Scope = 'primary' | 'per-market' | 'all';

interface Lane {
  browser: BrowserName;
  device: DeviceKind;
  scope: Scope;
}

export type Suite = 'pr' | 'post-deploy' | 'nightly' | 'weekly' | 'synthetic' | 'quarantine' | 'doctor';

export type ProjectMeta = {
  market: MarketCode;
  locale: string;
  device: DeviceKind;
  browser: BrowserName;
};

const NOT_GATING = /@quarantine|@doctor/;
const ALL_BROWSERS: BrowserName[] = ['chromium', 'webkit', 'firefox'];
const ALL_DEVICES: DeviceKind[] = ['desktop', 'tablet', 'mobile'];

/**
 * What each suite runs, and where. This table is the test-selection policy.
 * Change it here, not in CI files.
 */
export const SUITES: Record<Suite, { grep?: RegExp; grepInvert?: RegExp; lanes: Lane[] }> = {
  // Every pull request. Must stay under ~10 minutes.
  pr: {
    grep: /@smoke/,
    grepInvert: NOT_GATING,
    lanes: [
      { browser: 'chromium', device: 'desktop', scope: 'primary' },
      { browser: 'chromium', device: 'mobile', scope: 'primary' },
    ],
  },
  // After each staging deploy (no preview environments, so this is the real release gate).
  'post-deploy': {
    grep: /@p0/,
    grepInvert: NOT_GATING,
    lanes: [
      { browser: 'chromium', device: 'desktop', scope: 'per-market' },
      { browser: 'chromium', device: 'mobile', scope: 'per-market' },
    ],
  },
  // Risk-weighted matrix: everything on Chromium, Safari where mobile traffic is, Firefox as a sanity check.
  nightly: {
    grep: /@p0|@p1/,
    grepInvert: NOT_GATING,
    lanes: [
      { browser: 'chromium', device: 'desktop', scope: 'all' },
      { browser: 'chromium', device: 'mobile', scope: 'all' },
      { browser: 'webkit', device: 'mobile', scope: 'per-market' },
      { browser: 'chromium', device: 'tablet', scope: 'primary' },
      { browser: 'firefox', device: 'desktop', scope: 'primary' },
    ],
  },
  weekly: {
    grepInvert: NOT_GATING,
    lanes: ALL_BROWSERS.flatMap((browser) => ALL_DEVICES.map((device) => ({ browser, device, scope: 'all' as const }))),
  },
  // Production, read-only, every 15 minutes.
  synthetic: {
    grep: /@synthetic/,
    grepInvert: NOT_GATING,
    lanes: [{ browser: 'chromium', device: 'desktop', scope: 'per-market' }],
  },
  // Quarantined tests keep running so we know when they are fixed. Never blocks.
  quarantine: {
    grep: /@quarantine/,
    grepInvert: /@doctor/,
    lanes: [{ browser: 'chromium', device: 'desktop', scope: 'primary' }],
  },
  // Onboarding: checks the selectors and test data in client.config.ts against the live storefront.
  doctor: {
    grep: /@doctor/,
    lanes: [
      { browser: 'chromium', device: 'desktop', scope: 'per-market' },
      { browser: 'chromium', device: 'mobile', scope: 'primary' },
    ],
  },
};

export function currentSuite(): Suite {
  const suite = (process.env.SUITE ?? 'pr') as Suite;
  if (!(suite in SUITES)) throw new Error(`Unknown SUITE "${suite}". Use one of: ${Object.keys(SUITES).join(', ')}`);
  return suite;
}

function deviceUse(device: DeviceKind, browser: BrowserName): Project['use'] {
  if (device === 'desktop') return { browserName: browser, viewport: { width: 1440, height: 900 } };
  const descriptor = device === 'tablet' ? devices['iPad Pro 11'] : browser === 'webkit' ? devices['iPhone 15'] : devices['Pixel 7'];
  const { defaultBrowserType, ...rest } = descriptor;
  void defaultBrowserType;
  // Firefox has no mobile emulation: keep the viewport and user agent only.
  if (browser === 'firefox') return { browserName: browser, viewport: rest.viewport, userAgent: rest.userAgent };
  return { ...rest, browserName: browser };
}

interface Target {
  market: MarketCode;
  locale: string;
  url: string;
  primary: boolean;
  marketPrimary: boolean;
}

function targets(cfg: ClientConfig): Target[] {
  const env = targetEnv();
  const out: Target[] = [];
  for (const market of cfg.markets) {
    const available = market.storefronts
      .map((sf) => ({ sf, url: storefrontUrl(sf, env) }))
      .filter((x): x is { sf: typeof x.sf; url: string } => Boolean(x.url));
    available.forEach(({ sf, url }, i) => {
      out.push({ market: market.code, locale: sf.locale, url, primary: out.length === 0, marketPrimary: i === 0 });
    });
  }
  return out;
}

export function buildProjects(cfg: ClientConfig, suite: Suite): Project[] {
  const all = targets(cfg);
  if (all.length === 0) throw new Error(`No storefronts have a ${targetEnv()} URL in client.config.ts`);
  const projects: Project[] = [];
  const seen = new Set<string>();
  for (const lane of SUITES[suite].lanes) {
    const picked = all.filter((t) => lane.scope === 'all' || (lane.scope === 'primary' ? t.primary : t.marketPrimary));
    for (const t of picked) {
      const name = `${t.locale}-${lane.device}-${lane.browser}`;
      if (seen.has(name)) continue;
      seen.add(name);
      const facts = MARKETS[t.market];
      const metadata: ProjectMeta = { market: t.market, locale: t.locale, device: lane.device, browser: lane.browser };
      projects.push({
        name,
        metadata,
        use: {
          ...deviceUse(lane.device, lane.browser),
          baseURL: t.url,
          locale: t.locale,
          timezoneId: facts.timezone,
          geolocation: facts.geolocation,
        },
      });
    }
  }
  return projects;
}
