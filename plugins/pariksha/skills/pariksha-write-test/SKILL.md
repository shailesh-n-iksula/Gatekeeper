---
name: pariksha-write-test
description: Write, extend or refactor end-to-end tests in a Pariksha client suite to Iksula standards — correct layer (API vs UI), tags, fixtures, market-neutral assertions, resilient selectors. Use when asked to "add a test for X", "automate this journey", "cover this bug", "write the B2B / COD / coupon / RTL test", "convert this manual test case", or "/pariksha-write-test".
---

# Write a Pariksha test

Read the client repo's `CLAUDE.md` and `client.config.ts` first. Load `pariksha-standards` for the rules.

## 1. Decide the layer before writing code

| If the behaviour is… | Write it as… |
|---|---|
| A calculation (price, tax, discount, tier, rounding) | API test through `adapter.apiCart()` or `adapter.customerUnitPrice()`, data-driven from config |
| A permission or rule (who can buy what, stock, limits) | API test, with one UI sample |
| What the shopper sees or does | UI test, arranged through `adapter` |
| A full revenue path | One E2E test per path, `@p0` |
| Layout or branding | `@visual` snapshot of the smallest meaningful region |

If the adapter lacks the API call you need, add it to `src/adapters/types.ts` and implement it for **both** platforms. Where one platform cannot support it, set a capability flag and throw `NotSupported`. Tests skip on the flag.

## 2. Shape

```ts
import { expect, test } from '../../src/fixtures';

test('<outcome in shopper language>', { tag: ['@p0'] }, async ({ context, adapter, shop, cfg, sf, ns }) => {
  test.skip(<config condition>, '<why this client/market does not have it>');
  // Arrange: API
  // Act: one UI action
  // Assert: web-first expect / expect.poll, money via parseMoney + moneyTolerance
});
```

- The title states the outcome ("guest places an order with COD"), not the steps.
- Exactly one priority tag. Add `@smoke` only if it is P0, under 30s, and needs no order placement.
- `@synthetic` only if it is strictly read-only.
- New selectors go in `SelectorMap` (`src/config/types.ts`), with a stock-theme default in `src/config/selectors.ts` and client overrides in `client.config.ts`.
- New market facts go in `src/markets/markets.ts`, not in the spec.

## 3. Verify

1. Run the test on the primary project and on one RTL project if the client has Arabic:
   `npx playwright test <file> --project=<locale>-desktop-chromium --repeat-each=3`
2. It must pass 3/3 alone and with `--workers=4`.
3. `npm run lint && npm run typecheck`.

If you cannot run it (no Node, no staging access), say so in your summary and list the exact command for the engineer to run.

## 4. Converting manual test cases

Split a long manual case into one test per outcome. Move the preconditions into API arrangement. Drop steps that only navigate. Keep a comment with the source case id: `// TC-1234`.
