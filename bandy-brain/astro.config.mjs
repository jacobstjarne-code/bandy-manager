// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [mdx()],
  site: 'https://jacobstjarne-code.github.io',
  base: '/bandy-manager',
  output: 'static',
  redirects: {
    '/bandy-manager/sources/': '/bandy-manager/bandy/',
    '/bandy-manager/sources/rules/': '/bandy-manager/bandy/',
    '/bandy-manager/sources/stats/': '/bandy-manager/bandy/',
    '/bandy-manager/sources/design_principles/': '/bandy-manager/spelet/',
    '/bandy-manager/sources/world_canon/': '/bandy-manager/spelet/',
  },
});
