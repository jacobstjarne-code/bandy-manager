import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'

// __GIT_HASH__ läses EN gång vid serverstart (define bakas in för hela
// dev-server-processens livstid). Ett git-fel vid just den starten (t.ex.
// index.lock från en samtidig git-operation) syns annars aldrig — catch{}
// gömde felet. Om detta återkommer: läs stderr, starta om dev-servern.
//
// 2026-08-08 (sluttest): Vercels byggcontainer har ingen git-metadata, så
// execSync kastade och hashen blev 'unknown' i PRODUKTION — varje
// testarrapport ur FeedbackButton bar "build: unknown" och gick inte att
// matcha mot en deploy. CI-hashen läses därför FÖRST; git-anropet är en
// lokal override som vinner när .git finns.
let gitHash = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'unknown'
try {
  gitHash = execSync('git rev-parse --short HEAD').toString().trim()
} catch (err) {
  console.warn(`[vite.config] git rev-parse --short HEAD misslyckades, __GIT_HASH__ = "${gitHash}":`, (err as Error).message)
}

export default defineConfig({
  define: {
    __GIT_HASH__: JSON.stringify(gitHash),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 16)),
  },
  plugins: [
    react(),
    VitePWA({
      // Low 2 (Skutskär-auditen, 2026-08-22): 'autoUpdate' bytte en redan
      // öppen flik till ny kod utan synlig signal — testaren visste inte
      // vilken build de faktiskt körde. 'prompt' + PwaUpdateBanner.tsx ger
      // spelaren ett synligt "Ny version finns — ladda om" i stället för
      // en tyst byte, viktigt när buggrapporter måste knytas till en
      // specifik build-hash (FeedbackButton.tsx).
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        id: '/',
        name: 'Bandy Manager',
        short_name: 'Bandy Mgr',
        description: 'Upplev atmosfären av svensk elitbandy',
        theme_color: '#0D1B2A',
        background_color: '#0D1B2A',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        importScripts: ['notification-sw.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // 2026-07-21: huvudbunten passerade workbox default (2 MiB) — spelets
        // textmängd (domain/data) växer med varje sprint, bundeln med den.
        // 3 MiB ger headroom utan att dölja en verklig storleksregression;
        // om detta träffas igen är det en signal att code-splitta, inte höja igen.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
          },
        ],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  ssr: {
    external: ['better-sqlite3'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://localhost' },
    },
  },
})
