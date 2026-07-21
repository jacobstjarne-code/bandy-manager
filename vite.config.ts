import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'

// __GIT_HASH__ läses EN gång vid serverstart (define bakas in för hela
// dev-server-processens livstid). Ett git-fel vid just den starten (t.ex.
// index.lock från en samtidig git-operation) syns annars aldrig — catch{}
// gömde felet. Om detta återkommer: läs stderr, starta om dev-servern.
let gitHash = 'unknown'
try {
  gitHash = execSync('git rev-parse --short HEAD').toString().trim()
} catch (err) {
  console.warn('[vite.config] git rev-parse --short HEAD misslyckades, __GIT_HASH__ blir "unknown":', (err as Error).message)
}

export default defineConfig({
  define: {
    __GIT_HASH__: JSON.stringify(gitHash),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 16)),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Bandy Manager',
        short_name: 'Bandy Mgr',
        description: 'Upplev atmosfären av svensk elitbandy',
        theme_color: '#0D1B2A',
        background_color: '#0D1B2A',
        display: 'standalone',
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
