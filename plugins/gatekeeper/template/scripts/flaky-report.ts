/**
 * Reads test-results/results.json and lists flaky tests (failed, then passed on retry)
 * and failures. Writes Markdown to stdout and to the CI job summary when available.
 *
 *   npm run flaky
 *
 * Quarantine policy (docs/STRATEGY.md): a test flaky 3+ times in 7 days gets the
 * @quarantine tag and a ticket for its owner. It keeps running in the non-blocking
 * quarantine job. Fix or delete within 10 working days.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import type { JSONReport, JSONReportSuite } from '@playwright/test/reporter';

const file = process.argv[2] ?? 'test-results/results.json';
if (!existsSync(file)) {
  console.error(`No report at ${file}. Run the suite first.`);
  process.exit(0);
}
const report = JSON.parse(readFileSync(file, 'utf8')) as JSONReport;

interface Row {
  title: string;
  project: string;
  file: string;
  status: string;
  error?: string;
}
const rows: Row[] = [];

function walk(suite: JSONReportSuite, path: string[]): void {
  for (const spec of suite.specs) {
    for (const t of spec.tests) {
      if (t.status === 'flaky' || t.status === 'unexpected') {
        const lastError = t.results.at(-1)?.error?.message?.split('\n')[0];
        rows.push({ title: [...path, spec.title].join(' › '), project: t.projectName, file: `${spec.file}:${spec.line}`, status: t.status, error: lastError });
      }
    }
  }
  for (const child of suite.suites ?? []) walk(child, [...path, child.title]);
}
for (const s of report.suites) walk(s, []);

const flaky = rows.filter((r) => r.status === 'flaky');
const failed = rows.filter((r) => r.status === 'unexpected');
const { expected, unexpected, flaky: flakyCount, skipped } = report.stats;
const total = expected + unexpected + flakyCount;

const lines = [
  '## Test run summary',
  '',
  `Passed **${expected}** · Failed **${unexpected}** · Flaky **${flakyCount}** · Skipped ${skipped} · Flaky rate ${total ? ((flakyCount / total) * 100).toFixed(1) : '0'}%`,
  '',
];
if (failed.length) {
  lines.push('### Failed', '', '| Test | Project | Error |', '|---|---|---|');
  for (const r of failed) lines.push(`| ${r.title} (${r.file}) | ${r.project} | ${(r.error ?? '').replace(/\|/g, '\\|').slice(0, 160)} |`);
  lines.push('');
}
if (flaky.length) {
  lines.push('### Flaky (passed on retry). Candidates for @quarantine', '', '| Test | Project |', '|---|---|');
  for (const r of flaky) lines.push(`| ${r.title} (${r.file}) | ${r.project} |`);
}

const md = lines.join('\n');
console.log(md);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${md}\n`);
