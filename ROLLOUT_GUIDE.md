# Rolling out Pariksha

Written for a non-technical owner. You do not need to read the code. You need one engineer for a
morning, then one pilot client for two weeks.

---

## Part 1: Publish and prove it (one engineer, ~half a day)

Send this section to the engineer.

**1. Create an empty private repository** named `pariksha` in Iksula's GitHub or GitLab, and push this folder:

```bash
cd pariksha
git remote add origin git@github.com:<iksula-org>/pariksha.git
git push -u origin main
```

**2. Compile the template once.** It was written without Node available, so this is its first build:

```bash
cd plugins/pariksha/template
npm install
npx playwright install chromium
npm run typecheck
npm run lint
SUITE=pr npx playwright test --list
```

Fix anything that fails, and commit `package-lock.json`.

**3. Install the agent** in Claude Code:

```
/plugin marketplace add <iksula-org>/pariksha
/plugin install pariksha@iksula-qa
```

Restart Claude Code. Typing `/pariksha` should now show the four skills.

**4. Tell the owner the repo path** so it can go in the announcement.

---

## Part 2: Pilot on one client (two weeks)

Choose a client that is **Magento or Shopify**, has a **working staging** site, and has **at least two markets**, one of them Arabic. That combination tests the most.

| Day | Who | What |
|---|---|---|
| 1 | Delivery manager | Send the client the intake form: `plugins/pariksha/skills/pariksha-onboard/references/intake.md` |
| 2–3 | QA engineer + Pariksha | `/pariksha-onboard`: repo created, config verified, doctor and smoke green |
| 4 | Client DevOps | Add the post-deploy trigger to their staging deploy (one line, in the workflow file) |
| 5–10 | QA engineer | Nightly running. Triage every red with `/pariksha-triage`. Write 5 client-specific tests with `/pariksha-write-test` |
| 10 | Owner + QA lead | Review against the success criteria below |

**Success criteria for the pilot**
- Onboarding took **≤ 2 days** of engineer time.
- Post-deploy gate runs **≤ 20 minutes** and has caught at least one real issue, or ran clean on every deploy.
- Flaky rate **< 3%** by the end of week 2.
- Every template fix the pilot needed is merged back into `pariksha`.

---

## Part 3: Roll out

- Onboard the next clients **one at a time**, each by a different QA engineer. That is how you find out whether the agent carries the knowledge or one person does.
- Track per client: onboarding days, escaped P0 defects, flaky rate, post-deploy duration.
- Review the template monthly with QA leads. Merge the lessons, bump the version, announce.

## What it will not do on its own

- It will not push code, create repositories or add CI secrets without someone saying yes.
- It will not run anything that writes data on production. Only read-only checks, and only after the client approves.
- It cannot test Apple Pay/Google Pay end to end, real 3DS challenges on live gateways, or Shopify checkout on a live store. Those stay manual or sandbox-only.
