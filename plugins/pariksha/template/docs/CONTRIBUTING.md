# Adding and changing tests

## Write a test in 5 steps
1. Pick the folder by domain: `tests/cart`, `tests/checkout`, `tests/account`, `tests/i18n` ...
2. Import from the fixtures: `import { expect, test } from '../../src/fixtures';`
3. Tag it: one priority (`@p0`/`@p1`/`@p2`) plus any of `@smoke @synthetic @visual @a11y @b2b`.
4. Arrange with `adapter` (API), act and assert in the UI through `shop`.
5. Run it on one project: `npx playwright test tests/cart --project=en-AE-desktop-chromium`.

```ts
test('changing quantity recalculates the subtotal', { tag: ['@p0'] }, async ({ context, adapter, shop, cfg, sf }) => {
  await adapter.seedBrowserCart(context, cfg.catalog.inStock, 1);   // arrange: API, fast
  await shop.cart.open();
  const single = parseMoney(await shop.cart.subtotal().innerText(), sf.locale);
  await shop.cart.setQty(0, 2);                                     // act: UI
  await expect.poll(async () => parseMoney(await shop.cart.subtotal().innerText(), sf.locale))
    .toBeCloseTo(single * 2, 1);                                    // assert: UI
});
```

## Review checklist
- [ ] Tagged with exactly one priority
- [ ] Independent: passes alone, in any order, in parallel
- [ ] Arranged by API, not by clicking through other flows
- [ ] No hard waits, no `force`, no brittle selectors
- [ ] No hard-coded market data (currency, URLs, SKUs, prices)
- [ ] Creates data only with the `ns` prefix
- [ ] Runs in under 60 seconds (use `test.slow()` only for checkout)
- [ ] If `@synthetic`: read-only

## Theme differences
If a selector is wrong for this client, override it in `client.config.ts` → `selectors`.
Do not edit `src/config/selectors.ts` for one client. That file holds the stock-theme defaults.
