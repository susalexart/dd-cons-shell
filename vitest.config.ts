import { defineConfig } from 'vitest/config';

// Mirrors dev-division: two projects, unit + integration. P25 ships one
// integration smoke (auth-session) only. Unit slot is reserved for future use.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['packages/**/*.test.ts', 'tests/unit/**/*.test.ts'],
          exclude: ['**/node_modules/**', '**/dist/**', 'tests/integration/**'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          exclude: ['**/node_modules/**', '**/dist/**'],
          environment: 'node',
          testTimeout: 60_000,
        },
      },
    ],
  },
});
