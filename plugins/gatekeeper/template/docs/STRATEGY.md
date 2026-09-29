# Test strategy

For Magento / Adobe Commerce and Shopify storefronts across MENA (AE, SA, QA, KW, BH, OM, EG),
India and the US. No per-PR preview environments; one shared staging per client.

## 1. Layers

| Layer | Share | Owns | Here |
|---|---|---|---|
| Unit / component | ~40% | Price formatting, promo rules, component states | Client app repo |
| **API** | ~25% | Cart maths, coupons, tier pricing, stock, permissions | `tests/cart/cart-api`, `tests/b2b` via `adapter` |
| Contract | ~5% | App ↔ ERP / OMS / PIM / PSP | Client app repo (Pact) |
| **UI integration** | ~20% | Journeys seeded by API, asserted in UI | `tests/cart/cart-ui`, `tests/i18n`, `tests/account` |
| **Full E2E** | ~10% | Revenue paths end to end | `tests/checkout`, `tests/smoke` |
| Visual / a11y / perf | Targeted | Brand, WCAG 2.2 AA, lab CWV | `tests/visual`, `tests/a11y`, `tests/perf` |

Rule: if it can fail without a browser, it is not a UI test.

## 2. P0 journeys (block release)
1. Home → search → PDP → add to cart (every storefront)
2. Cart quantity change and removal recalculate correctly
3. Guest checkout → order placed (test payment method)
4. Login
5. Correct language, direction (RTL for Arabic) and currency on every storefront
6. Cart API: currency and precision per market; coupon applies

P1 (nightly): COD per market, invalid coupon, out-of-stock, tier pricing, a11y, visual, perf, RTL mirroring, postcode rules.

## 3. Market matrix

| Market | Currency (decimals) | Tax | Watch for |
|---|---|---|---|
| AE | AED (2) | VAT 5% incl. | No postcodes; RTL; COD fees and caps |
| SA | SAR (2) | VAT 15% incl. | Arabic-Indic digits; new Riyal sign; rounding at 15% |
| KW / BH / OM | KWD / BHD / OMR (**3**) | 0 / 10% / 5% | 3-decimal rounding bugs |
| QA | QAR (2) | None | Non-zero tax line = misconfiguration |
| EG | EGP (2) | VAT 14% | COD-first |
| IN | INR (2) | GST by HSN, incl. | Lakh grouping; PIN serviceability; COD per PIN |
| US | USD (2) | Sales tax, excl. | Tax only after address; ADA exposure |

Every test runs per storefront (locale). Facts live in `src/markets/markets.ts`.

## 4. Data and isolation
- Golden products per client (in stock, out of stock, B2B tiered) are fixed in `client.config.ts` and must exist on staging.
- Everything else is created per test with the `ns` prefix (`qa-<run>-w<worker>-<id>`).
- No test depends on another test or on leftover state. Carts, customers and coupons are created fresh.
- Magento customers are deleted after the test when `MAGENTO_ADMIN_TOKEN` is set. Staging orders are left, traceable by the `qa-` email.
- Shared staging: 4 workers by default, and concurrency groups stop two suites hitting staging at once.

## 5. Third parties
- Analytics, pixels, chat and engagement SDKs are blocked (`src/helpers/network.ts`). An outage there never reddens a build.
- Payments: staging uses offline methods (checkmo / COD) or PSP sandbox (Checkout.com, Tap, PayTabs, Telr, Razorpay, Stripe, Adyen test mode). Shopify dev stores use Bogus Gateway.
- Production: only read-only `@synthetic` tests. The fixture enforces this.

## 6. Flakiness
- Locators: data-testid > role/label > id/name > short class. Themes are overridden in config, not in specs.
- Web-first assertions and `expect.poll`. Never `waitForTimeout` (lint error).
- Reduced motion, third parties blocked, overlays auto-dismissed.
- CI retries 2×. A pass-on-retry is **flaky**, not green. `npm run flaky` lists them.
- Quarantine: flaky 3+ times in 7 days → tag `@quarantine` + ticket to owner. It runs in the non-blocking quarantine job. Fix or delete in 10 working days. The quarantine is capped at 2% of the suite.

## 7. Reporting
- Every run: HTML report with traces, screenshots and video on failure; JUnit for CI dashboards; JSON for the flaky summary.
- Upgrade path when a client has more than ~500 tests: ReportPortal or Allure TestOps for history and trends.

## 8. Ownership
- Iksula QA owns the framework, `client.config.ts` and P0 journeys.
- Client squads own specs in their folder (`.github/CODEOWNERS`) and get their alerts.
- Developers add `data-testid` on new interactive elements (Definition of Done).
