# Pariksha — Iksula's QA automation agent

*Pariksha* (परीक्षा) means "test". It is the sibling of Parakh, the code reviewer.

Pariksha is two things in one repository:

1. **An agent** (Claude Code plugin). It onboards a commerce client into automated end-to-end testing, writes tests to Iksula's standard, and explains failing runs.
2. **A template** that the agent copies for each client: a Playwright + TypeScript suite for **Magento / Adobe Commerce** and **Shopify**, aware of **MENA, India and US** markets.

The idea: every client gets the same suite. The only file that differs is `client.config.ts` (markets, URLs, test products, theme selectors). Anything an engineer learns on one client improves the template for all of them.

```
pariksha/
├── .claude-plugin/marketplace.json     ← lets Claude Code install the plugin from this repo
├── plugins/pariksha/
│   ├── agents/pariksha.md              ← the QA architect agent
│   ├── skills/
│   │   ├── pariksha-onboard/           ← new client → working suite (+ intake form, test-plan template)
│   │   ├── pariksha-write-test/        ← add tests to standard
│   │   ├── pariksha-triage/            ← explain red runs, quarantine flaky tests
│   │   └── pariksha-standards/         ← rules + market and platform reference sheets
│   └── template/                       ← the client suite (copied per client)
│       ├── client.config.ts            ← THE per-client file
│       ├── examples/                   ← Magento B2B and Shopify Plus examples
│       ├── src/adapters/               ← Magento + Shopify API code
│       ├── src/markets/markets.ts      ← AE SA QA KW BH OM EG US IN facts
│       ├── src/config/suites.ts        ← what runs on PR / post-deploy / nightly / weekly / synthetic
│       ├── tests/                      ← smoke, cart, checkout, account, i18n, a11y, visual, perf, edge, b2b
│       ├── .github/workflows/          ← GitHub Actions
│       └── .gitlab-ci.yml              ← GitLab CI (keep one)
├── README.md
└── ROLLOUT_GUIDE.md                    ← for the owner: publish, pilot, roll out
```

## Using it (after install)

In Claude Code, inside any folder:

| You say | What happens |
|---|---|
| `/pariksha-onboard` or "set up automation for Acme, Magento, UAE and India" | Intake → new `acme-e2e` repo → config filled and verified → first green runs → test plan |
| `/pariksha-write-test` or "add a test that COD is hidden above AED 5,000" | Test written at the right layer, tagged, verified |
| `/pariksha-triage` or "why is the nightly red?" | Failures classified (bug / test / environment / data / flaky) with actions |
| "Ask the pariksha agent to review our tests" | Review against `pariksha-standards` |

## Changing the template or the agent

This repo is meant to be edited by the team.

1. Branch, change, open a PR. At least one QA lead reviews.
2. Template changes: explain which client taught you the lesson in the PR description.
3. Bump `version` in `plugins/pariksha/.claude-plugin/plugin.json` on every merge that changes behaviour.
4. Teammates get the update with `/plugin marketplace update iksula-qa`.

Existing client repos do **not** update automatically. They were copied from the template. Pull improvements into a client repo deliberately (ask Pariksha: "bring acme-e2e up to the latest template").

## Status

v0.1.0. Written without a Node runtime, so it has **not yet been compiled or run**. Part 1 of `ROLLOUT_GUIDE.md` covers that first run. Checkout selectors for Luma and Shopify one-page checkout and all theme defaults must be confirmed on the pilot client (`npm run doctor`).
