// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';
import { redirects } from './src/config/redirects.mjs';

// Canonical production origin: canonicals, sitemap and social images all use it, including on
// staging. Override with SITE_URL (e.g. the workers.dev URL before the domain is live).
const SITE = process.env.SITE_URL || 'https://www.aircampustroyes.fr';

// Pages flagged "Masquer de Google" (seo.noindex) are kept out of the sitemap.
const PAGES_DIR = './src/content/pages/';
const noindexPaths = readdirSync(PAGES_DIR)
  .map((f) => readFileSync(PAGES_DIR + f, 'utf8'))
  .filter((src) => /^\s+noindex:\s*true\s*$/m.test(src))
  .map((src) => {
    const path = src.match(/^path:\s*'?([^'\n]*)'?\s*$/m)?.[1] ?? '';
    return new URL(path ? `/${path}/` : '/', SITE).href;
  });

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  // CSS is small (Tailwind, purged): inlining it removes a render-blocking request.
  build: { format: 'directory', inlineStylesheets: 'always' },
  // Hosting adapter: the only Cloudflare-specific line. Swap for @astrojs/node, netlify, vercel…
  adapter: cloudflare({ imageService: 'compile' }),
  // No server sessions: avoids an implicit Cloudflare KV binding.
  session: false,
  devToolbar: { enabled: false },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  redirects,
  integrations: [
    sitemap({
      filter: (page) => !/\/(admin|api|gestion|auth)\//.test(page) && !noindexPaths.includes(page),
    }),
  ],
  env: {
    schema: {
      // Build-time: which environment this build is for (drives robots / noindex).
      PUBLIC_SITE_ENV: envField.enum({
        context: 'client',
        access: 'public',
        values: ['development', 'staging', 'production'],
        default: 'development',
      }),
      // Set to false to keep a production build out of search engines (e.g. before launch).
      PUBLIC_ALLOW_INDEXING: envField.boolean({
        context: 'client',
        access: 'public',
        default: true,
      }),
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        context: 'client',
        access: 'public',
        // Cloudflare's documented "always passes" test key.
        default: '1x00000000000000000000AA',
      }),
      // Runtime secrets (Worker secrets / .dev.vars locally).
      TURNSTILE_SECRET_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      BREVO_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      GITHUB_OAUTH_CLIENT_ID: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      GITHUB_OAUTH_CLIENT_SECRET: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
