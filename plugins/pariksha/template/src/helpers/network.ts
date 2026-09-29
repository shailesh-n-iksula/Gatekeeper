import type { BrowserContext } from '@playwright/test';

/**
 * Analytics, tag managers, chat widgets and marketing SDKs common across MENA, India and the US.
 * Blocking them makes pages faster and tests deterministic. A third-party outage must
 * never turn a build red. Their payloads are checked separately (dataLayer assertions).
 */
export const DEFAULT_BLOCKED_HOSTS = [
  // analytics / tags
  'google-analytics.com', 'googletagmanager.com', 'doubleclick.net', 'googleadservices.com', 'analytics.google.com',
  'clarity.ms', 'hotjar.com', 'hotjar.io', 'fullstory.com', 'mouseflow.com', 'bat.bing.com', 'segment.io', 'segment.com',
  // ads / social pixels (Snap and TikTok matter in MENA)
  'connect.facebook.net', 'facebook.com', 'analytics.tiktok.com', 'sc-static.net', 'tr.snapchat.com', 'snap.licdn.com',
  'criteo.com', 'criteo.net', 'taboola.com', 'outbrain.com', 'pinimg.com', 'ct.pinterest.com',
  // engagement platforms (MoEngage/CleverTap/WebEngage in India, Insider in MENA)
  'moengage.com', 'clevertap-prod.com', 'wzrkt.com', 'webengage.com', 'webengage.co', 'useinsider.com', 'api.useinsider.com',
  'klaviyo.com', 'braze.com', 'onesignal.com',
  // chat / support widgets
  'zdassets.com', 'zendesk.com', 'intercom.io', 'intercomcdn.com', 'tawk.to', 'freshchat.com', 'gorgias.chat', 'livechatinc.com',
  // reviews / personalisation that injects late layout shifts
  'yotpo.com', 'judge.me', 'trustpilot.com', 'bazaarvoice.com',
];

export async function blockThirdParties(context: BrowserContext, extra: string[] = []): Promise<void> {
  if (process.env.BLOCK_THIRD_PARTIES === '0') return;
  const hosts = [...DEFAULT_BLOCKED_HOSTS, ...extra];
  await context.route(
    (url) => hosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`)),
    (route) => route.abort('blockedbyclient'),
  );
}
