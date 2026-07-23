// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
// Vercel-cutover: sajten på bandybrain.se-roten (ingen base). Bryter GitHub Pages
// (root-relativa asset-paths 404:ar på github.io/bandy-manager) — därför på branchen
// vercel-password-gate, merge till main först när Vercel-previewen är grön.
// Grinden: bandy-brain/middleware.ts. Se docs/BANDY_BRAIN_LOSENORDSGRIND.md.
export default defineConfig({
  integrations: [mdx()],
  site: 'https://bandybrain.se',
  output: 'static',
  redirects: {
    '/sources/': '/bandy/',
    '/sources/rules/': '/bandy/',
    '/sources/stats/': '/bandy/',
    '/sources/design_principles/': '/spelet/',
    '/sources/world_canon/': '/spelet/',
  },
});
