---
name: pariksha-onboard
description: Onboard a new commerce client (Magento / Adobe Commerce or Shopify) into Iksula's Pariksha Playwright suite — collect the intake, scaffold the repo from the template, fill client.config.ts, verify selectors and test data against staging, get the doctor and smoke runs green, and write the client test plan. Use when someone says "set up automation for <client>", "onboard <client> to Pariksha", "new client test suite", "start E2E for <site>", or "/pariksha-onboard".
---

# Onboard a client to Pariksha

Goal: the client has its own repo with a correct `client.config.ts`, a green `npm run doctor`, a green `npm run test:pr`, CI wired, and a one-page test plan. Target: one working day.

The template is at `../../template` relative to this skill's base directory. The intake questionnaire is `references/intake.md` and the plan template is `references/test-plan-template.md`.

## Step 1: Intake

Check whether the intake is already filled in (a completed `references/intake.md`-style document, a ticket, or answers in chat). Ask only for what is missing, in one message, grouped. Do not proceed without:

- Platform + edition + theme (Luma / Hyvä / Hyvä Checkout / Dawn / custom)
- Markets and, per market, each storefront's locale, **staging URL**, and Magento store code
- Two test products per market: a **simple, always-in-stock** one, and an out-of-stock one if possible
- Test payment method per market (checkmo / COD / PSP sandbox / Shopify Bogus)
- Whether staging has basic auth, a storefront password, or reCAPTCHA on login/checkout
- CI host (GitHub or GitLab) and who owns the repo

If they do not know a store code or variant id, tell them exactly where to find it (see intake.md).

## Step 2: Scaffold

1. Ask where the client repo should live. Default: a sibling folder `<client>-e2e`.
2. Copy the template: `cp -R <template>/. <client>-e2e/` (hidden files included). Remove the CI you will not use (`.github/` or `.gitlab-ci.yml`).
3. Set `name` in `package.json` to `<client>-e2e`.
4. `git init` and make the first commit **only if the user asked for a repo**. Never push or create a remote without asking.

## Step 3: Fill client.config.ts

Start from `examples/magento.client.ts` or `examples/shopify.client.ts`. Rules:
- The first market is the primary market; its first storefront is the PR smoke target. Pick the highest-revenue one.
- Paths have no leading slash. Storefront URLs end with `/`.
- Only add `production` URLs when the client has approved synthetic checks on production.
- Shopify: `catalog.*.id` is the **variant** id.
- Set `checkoutFlow: 'custom'` for Hyvä Checkout, one-step-checkout extensions or headless checkouts.

## Step 4: Verify against staging

If browser tools are available, open staging yourself. Visit home, category, the in-stock PDP, cart and login in each theme variant (at least one LTR and one RTL storefront), and confirm each selector in `src/config/selectors.ts` for the theme. Where a stock selector does not match, find a stable one (data-testid > role/label > id/name > short class) and put it in `client.config.ts` → `selectors`. Record cookie banners and popups in `selectors.overlayDismiss`.

If Node is available: `npm install`, `npx playwright install chromium`, have the user create `.env` from `.env.example` (never ask them to paste secrets into chat), then `npm run doctor`. Fix what it reports and re-run until it is green.

If neither is available, say so plainly and list the checks the engineer must run.

## Step 5: Custom checkout (only if needed)

For `checkoutFlow: 'custom'`, walk the staging checkout as a guest with the test payment method and implement `src/pages/checkout-custom.ts` → `placeGuestOrder`. Wait on the network responses and loaders the page actually uses, never on timers.

## Step 6: First runs

`npm run test:pr` and then `npm run test:post-deploy`. Triage anything red with `pariksha-triage`. A test that cannot work for this client (for example no guest checkout) is skipped through config, not deleted.

## Step 7: CI

- Secret `QA_ENV_FILE` = the staging `.env` contents. The user adds it; you never handle the values.
- Give the application team the post-deploy trigger snippet from the workflow file header.
- Fill `.github/CODEOWNERS` with real teams, or delete the lines you cannot fill.
- Leave `synthetic.yml` disabled until the client signs off on production traffic.

## Step 8: Test plan

Fill `references/test-plan-template.md` for this client and save it as `docs/TEST-PLAN.md` in the client repo. Use the market gotchas from `src/markets/markets.ts` and the platform gotchas from `pariksha-standards`. Be specific: name their markets, their payment methods and their riskiest flows.

## Finish

Report in this order: what is green, what is skipped and why, what the client still has to provide, and the next three tests worth writing. Keep it short enough for a delivery manager to forward.
