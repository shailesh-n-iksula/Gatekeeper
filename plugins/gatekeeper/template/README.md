# E2E test suite

Built on Iksula's **Gatekeeper** template: Playwright + TypeScript for Magento / Adobe Commerce and
Shopify storefronts across MENA, India and the US.

## First run (engineer, ~20 minutes)

```bash
npm install
npx playwright install chromium
cp .env.example .env         # fill in staging values
npm run doctor               # checks client.config.ts against staging
npm run test:pr              # the smoke suite
npm run report               # opens the HTML report
```

Commit `package-lock.json` after the first `npm install`.

## What runs when

| Suite | Trigger | What | Where | Budget |
|---|---|---|---|---|
| `pr` | Pull request to this repo | `@smoke` | Primary storefront, desktop + mobile, Chromium | ≤10 min |
| `post-deploy` | App pipeline after staging deploy | `@p0` | Every market, desktop + mobile | ≤20 min |
| `nightly` | 21:30 UTC daily | `@p0 @p1` + visual, a11y, perf | All storefronts; Safari mobile per market; Firefox + tablet on primary | ≤45 min |
| `weekly` | Friday 22:00 UTC | Everything | All storefronts × 3 browsers × 3 devices | ≤3 h |
| `synthetic` | Every 15 min | `@synthetic` (read-only) | **Production**, one storefront per market | ≤3 min |
| `quarantine` | Nightly, non-blocking | `@quarantine` | Primary | n/a |
| `doctor` | Manual | Config check | Per market | n/a |

The policy lives in `src/config/suites.ts`. The CI files only call it.

**No preview environments.** PR runs prove the tests work, against shared staging. The
real release gate is `post-deploy`, triggered by the application's pipeline. See
`.github/workflows/post-deploy.yml` (or `.gitlab-ci.yml`) for the one-line trigger.

## Secrets

One secret, `QA_ENV_FILE`, holds the whole staging `.env` (see `.env.example`).
`QA_PROD_ENV_FILE` is for synthetic checks only. Add `SLACK_WEBHOOK_URL` for alerts.

## Where things go

See `CLAUDE.md` for the rules and `docs/STRATEGY.md` for the reasoning.
