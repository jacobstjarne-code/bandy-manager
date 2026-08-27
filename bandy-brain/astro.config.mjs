// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
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
