import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright visuell regression för /dev/scenes-svepet.
 *
 * Baselines seedas i Linux-CI-miljön (workflow visual-baselines.yml), ALDRIG ur
 * Mac-renders — cross-OS font-rendering gör annars varje diff flaky. Snapshot-
 * filerna är platform-suffixade (…-linux.png), så CI (ubuntu) jämför mot Linux-
 * baselines och en Mac-körning (…-darwin.png) krockar inte (och gitignoreras).
 *
 * Testfilerna heter *.visual.ts så vitests default-glob (*.test/*.spec) inte plockar dem.
 */
export default defineConfig({
  testDir: './tests/visual',
  testMatch: '**/*.visual.ts',
  snapshotPathTemplate: '{testDir}/__snapshots__/{arg}{-platform}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  expect: {
    // Same-OS-renders är pixelstabila; liten tolerans absorberar font-hinting-brus.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide' },
  },
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 390, height: 844 }, // mobil-först (matchar appens 375–430px)
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Dev-server: /dev/scenes-rutten är import.meta.env.DEV-gatad (AppRouter), så den
  // renderas bara i dev-läge — inte i `vite preview` (prod-bygge). Ingen build behövs.
  // Attention-klienten är en del av de riktiga Portal-/onboardingytorna.
  // Dev-serverns /api-proxy måste därför ha samma lokala backend som npm start;
  // annars väntar visuella grindar på ett nätverksfel i stället för på UI:t.
  webServer: [
    {
      command: 'node server.js',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npx vite --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
