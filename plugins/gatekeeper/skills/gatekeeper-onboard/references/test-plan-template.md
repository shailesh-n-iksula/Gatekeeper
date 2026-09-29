# Test plan: <Client>

**Platform:** <Magento 2.4.x Luma / Shopify Plus Dawn ...> · **Markets:** <AE (en, ar), SA (ar), IN (en), US (en)> · **Owner:** <name> · **Date:** <YYYY-MM-DD>

## What we protect (P0, release gate)
| # | Journey | Markets | Layer | Status |
|---|---|---|---|---|
| 1 | Home → search → PDP → add to cart | All storefronts | UI | ✅ / ⏳ / ⛔ |
| 2 | Cart quantity / remove recalculates | All | UI + API seed | |
| 3 | Guest checkout with <test method> | Per market | UI | |
| 4 | Login | Primary | UI + API seed | |
| 5 | Language, RTL, currency | All storefronts | UI | |
| 6 | Cart currency, precision, coupon | All | API | |
| … | <client-specific: B2B quote, PIN serviceability, store locator …> | | | |

## Priority matrix
| | High value | Lower value |
|---|---|---|
| **Low effort** | *Automate now:* <list> | *Crawler / one snapshot:* <list> |
| **High effort** | *Automate deliberately:* <list> | *Keep manual:* <list> |

## Market risks for this client
<From src/markets/markets.ts gotchas, filtered to this client's markets, with what we test for each.>

## Platform risks for this client
<From gatekeeper-standards/references/platforms.md, filtered to this client's platform/theme/extensions.>

## Not automated, and why
<3D/AR fidelity, real 3DS challenges on live PSPs, email rendering in clients …>

## Needed from the client
<Missing test data, access, staging config changes such as disabling reCAPTCHA.>

## Schedule
| Suite | Trigger | Scope | Budget |
|---|---|---|---|
| PR | PR to test repo | @smoke, primary | ≤10 min |
| Post-deploy | App pipeline after staging deploy | @p0, every market | ≤20 min |
| Nightly | 21:30 UTC | @p0 @p1, matrix | ≤45 min |
| Weekly | Fri 22:00 UTC | All | ≤3 h |
| Synthetic | 15 min (if approved) | @synthetic, production | ≤3 min |
