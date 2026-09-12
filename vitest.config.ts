import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // Vitest 3:s fork-pool tar timeout även på våra synkront tunga
    // flersäsongstester. Behåll den tidigare trådbaserade körmodellen och
    // ge de avsiktliga karriärsimuleringarna en uttrycklig, ändlig budget.
    pool: 'threads',
    testTimeout: 20_000,
    environmentOptions: {
      jsdom: {
        url: 'http://localhost',
      },
    },
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**', 'tests/visual/**'],
  },
})
