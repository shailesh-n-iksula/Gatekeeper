---
name: pariksha-triage
description: Triage a failing or flaky Pariksha test run — read the report and traces, classify each failure (product bug, test bug, environment, third party, test data), explain it in business terms, and recommend fix, quarantine or bug report. Use when someone says "why is the nightly red", "triage these failures", "is this a real bug", "this test is flaky", "what broke on staging", or "/pariksha-triage".
---

# Triage a run

## Inputs
Look for, in order:
1. `test-results/results.json` (run `npm run flaky` for the summary)
2. `playwright-report/` or a downloaded CI artifact
3. `test-results/**/trace.zip`: `npx playwright show-trace <zip>`, or unzip and read `*.trace` / `*.network` for the failing step, console errors and network responses
4. `error-context.md` / screenshots next to each failed test

If none exists, ask for the CI run link or artifact. Do not guess from test names.

## Classify every failure

| Class | Signals | Action |
|---|---|---|
| **Product bug** | Assertion on business outcome fails consistently across retries/projects; API returns wrong value; 5xx from the store | Raise a bug with repro, market/locale/device, trace. P0 → alert the release owner now |
| **Test bug** | Locator not found after a theme change; wrong assumption; fails in one project only for a test reason | Fix the selector in `client.config.ts`, or fix the test |
| **Environment** | Staging down or slow, deploy in progress, basic-auth/password change, reCAPTCHA re-enabled, index/cache not warmed | Re-run after the environment is fixed; tell the client's DevOps |
| **Third party** | Sandbox PSP/tax/search timeout, CDN, a script not on the block list | Add the host to `blockHosts` or stub it; never retry-until-green |
| **Test data** | Test SKU out of stock, coupon expired or used up, B2B tier changed | Fix the data on staging, or update `client.config.ts` |
| **Flaky** | Passed on retry; timing-dependent; passes with `--workers=1` only | See quarantine below |

Look for patterns before reading individual tests. Everything in `ar-*` failing means RTL/locale. Everything on `webkit` failing means Safari. Everything after one timestamp means a deploy or outage.

## Quarantine rule
Flaky 3+ times in 7 days → add `'@quarantine'` to its tags and open a ticket for the CODEOWNERS owner. It keeps running in the non-blocking quarantine job. Fix or delete within 10 working days. P0 tests are never quarantined silently: escalate to the QA lead.

## Output
Start with one line a delivery manager can forward, for example: "Nightly: 2 real bugs (Saudi Arabic checkout, KWD rounding), 3 selector fixes after the header release, 1 flaky test quarantined."

Then a table: test · project · class · evidence (one line from trace/log) · action · owner.

Fix test bugs and selector drift directly if the user asked you to. Never "fix" a product bug by loosening the assertion.
