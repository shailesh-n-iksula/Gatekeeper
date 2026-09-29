import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

const pw = playwright.configs['flat/recommended'];

export default tseslint.config(
  { ignores: ['node_modules', 'playwright-report', 'test-results', 'blob-report', 'all-blob-reports'] },
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts'],
    ...pw,
    rules: {
      ...pw.rules,
      // Hard waits are the #1 cause of flaky suites. Never allowed.
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-force-option': 'error',
      // Market- and platform-aware tests branch and skip by design.
      'playwright/no-conditional-in-test': 'off',
      'playwright/no-conditional-expect': 'off',
      'playwright/no-skipped-test': 'off',
      'playwright/expect-expect': ['warn', { assertFunctionNames: ['expectAccessible', 'expectWithinBudget'] }],
    },
  },
);
