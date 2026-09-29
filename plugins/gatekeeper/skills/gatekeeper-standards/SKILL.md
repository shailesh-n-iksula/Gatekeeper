---
name: gatekeeper-standards
description: Iksula's QA automation standards for commerce E2E suites — the test pyramid split, tagging and suite policy, locator and wait rules, data isolation, third-party handling, quarantine policy, plus reference sheets on MENA/India/US market rules and Magento/Shopify testing gotchas. Load before writing, reviewing or judging an automated test, when planning coverage for a client, or when asked "what should we automate", "is this test good", "Magento/Shopify testing gotchas", "how do we test RTL/COD/VAT".
---

# Gatekeeper standards

## The five rules that prevent most suite failures
1. **Right layer.** Calculations and rules go to the API; the UI samples them. About 10% of checks should need a full browser journey.
2. **Independent tests.** Each test arranges its own state through the adapter, uses the `ns` prefix, and passes alone, in any order, in parallel.
3. **No timing guesses.** Web-first assertions, `expect.poll`, `waitForResponse`. `waitForTimeout` and `force: true` are lint errors.
4. **Config, not code, per client.** Theme selectors, URLs, SKUs, payment methods and budgets live in `client.config.ts`. Specs are market- and platform-neutral.
5. **Flaky is not green.** Pass-on-retry is tracked, quarantined at 3 in 7 days, and fixed or deleted in 10 working days.

## Tags → suites
| Tag | Meaning | Runs in |
|---|---|---|
| `@smoke` | P0, fast, no order placement | PR |
| `@p0` | Release-blocking journey | post-deploy, nightly, weekly |
| `@p1` | Important, not blocking | nightly, weekly |
| `@p2` | Nice to have | weekly |
| `@synthetic` | Read-only, safe on production | synthetic (production), plus its priority suites |
| `@visual` `@a11y` `@perf` `@b2b` | Category filters | with their priority |
| `@quarantine` | Known flaky | quarantine job only (non-blocking) |
| `@doctor` | Config verification | doctor only |

## Locators, in order of preference
1. `data-testid` (ask the client's developers to add them; it is cheap)
2. `getByRole` / `getByLabel` (careful: labels change per language, so prefer structure on multilingual sites)
3. Stable `id` / `name` attributes
4. Short class selectors from the theme (at most two levels)

Never: XPath, `nth-child` chains, text in one language for a multilingual storefront.

## Money
Read with `parseMoney(text, sf.locale)`: it handles Arabic-Indic digits, Arabic separators and lakh grouping. Compare with `moneyTolerance(sf.currency)`, which accounts for 3-decimal currencies. Never compare formatted strings across locales.

## Safety
- Production: `@synthetic` only (enforced by the fixture). No carts, orders, accounts or forms.
- Staging payments: offline methods, PSP sandbox, or Shopify Bogus only.
- Secrets only in `.env` / CI secrets. Never in config, specs, logs or chat.
- Test emails go to `TEST_EMAIL_DOMAIN` (default example.com, which never delivers).

## References
- `references/markets.md`: per-market rules and what to test for each.
- `references/platforms.md`: Magento / Adobe Commerce and Shopify testing gotchas.
