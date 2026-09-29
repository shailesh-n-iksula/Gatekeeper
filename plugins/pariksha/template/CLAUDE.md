# E2E suite: rules for Claude

This repo is a client test suite built from Iksula's Pariksha template. The Pariksha plugin
(`/pariksha-onboard`, `/pariksha-write-test`, `/pariksha-triage`) knows this layout.

## Layout
- `client.config.ts`: the only per-client file. Markets, storefront URLs, test products, selector overrides.
- `src/adapters/`: Magento and Shopify API code. Tests never call platform APIs directly.
- `src/pages/`: page objects (locators and actions, no assertions).
- `src/config/suites.ts`: which tests run where (PR / post-deploy / nightly / weekly / synthetic).
- `tests/<domain>/`: specs. Import `test`/`expect` from `src/fixtures`, never from `@playwright/test`.

## Non-negotiables
1. Every test is tagged: exactly one of `@p0 @p1 @p2`, plus `@smoke` / `@synthetic` / `@visual` / `@a11y` / `@b2b` where they apply.
2. Arrange through `adapter` (API), assert through the UI. Only the test that covers a flow may click through it.
3. No `waitForTimeout`, no `force: true`, no XPath, no CSS chains longer than two levels.
4. No hard-coded URLs, SKUs, prices, currencies or selectors in specs. They come from `cfg`, `sf` or `shop.selectors`.
5. Paths passed to `page.goto()` have no leading slash (the base URL carries the store path).
6. Money: read with `parseMoney(text, sf.locale)`, compare with `moneyTolerance(sf.currency)`. Never compare price strings.
7. Anything a test creates uses the `ns` prefix.
8. `@synthetic` tests must be read-only: no cart writes, no orders, no accounts. They run on production.
9. Staging only: test payment methods (checkmo, COD, PSP sandbox, Shopify Bogus). Never live keys.

## Commands
- `npm run doctor`: validate client.config.ts against staging (run first).
- `npm run test:pr`, `test:post-deploy`, `test:nightly`: run a suite locally.
- `npx playwright test tests/cart --project=en-AE-desktop-chromium --headed`: debug one area.
- `npx playwright show-trace test-results/<test>/trace.zip`: step through a failure.
