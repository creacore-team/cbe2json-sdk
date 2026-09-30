import { defineConfig } from 'vitest/config'

// Calls the real API; run by .github/workflows/live.yml, never by `npm test`.
export default defineConfig({
  test: {
    include: ['tests/live/**/*.test.ts'],
    testTimeout: 30_000,
  },
})
