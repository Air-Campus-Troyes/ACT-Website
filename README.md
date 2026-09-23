# Air Campus Troyes — website

Public website of the Air Campus Troyes flying club (aéroport de Troyes-Barberey, LFQB).
Static-first [Astro](https://astro.build) site on Cloudflare Workers, content edited through
[Decap CMS](https://decapcms.org) (every edit becomes a pull request).

> **Editing content?** See [docs/EDITING.md](docs/EDITING.md) (in French).

## Stack

| Concern        | Choice                                                | Swap-out point                                          |
| -------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| Framework      | Astro 7, all public pages prerendered                 | —                                                       |
| Hosting        | Cloudflare Workers + static assets (free tier)        | `adapter:` line in `astro.config.mjs`                   |
| Styling        | Tailwind v4, tokens from Figma in `global.css`        | —                                                       |
| Content        | Markdown/YAML content collections (`src/content`)     | —                                                       |
| CMS            | Decap CMS at `/admin/`, GitHub backend                | `public/admin/`                                         |
| Email          | Brevo transactional API                               | `src/server/email.ts`                                   |
| Anti-spam      | Cloudflare Turnstile + honeypot                       | `src/components/Captcha.astro`, `src/server/captcha.ts` |
| Maps / weather | OpenStreetMap embed, Open-Meteo (no keys, no cookies) | `src/components/blocks/`                                |

Nothing else is Cloudflare-specific: no KV, no sessions, no Access. Moving to Netlify/Vercel/a VPS
means changing the adapter, the deploy steps in `.github/workflows/`, and the `_redirects` file.

## Getting started

```bash
npm ci
npm run dev          # http://localhost:4321
```

| Script                    | What it does                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `npm run dev`             | Dev server                                                                                |
| `npm run cms`             | Local Decap backend; then open http://localhost:4321/admin/ (no login)                    |
| `npm run build`           | Production build into `dist/` (`PUBLIC_SITE_ENV` selects env)                             |
| `npm run preview`         | Serve the build in workerd (same runtime as prod), incl. redirects                        |
| `npm run check`           | Type-check + validate every content file against its schema                               |
| `npm run lint` / `format` | ESLint / Prettier                                                                         |
| `npm test`                | Unit tests (contact handler, providers, redirect map)                                     |
| `npm run test:e2e`        | Playwright smoke tests (builds must exist; set `BASE_URL` to test a deployed site)        |
| `npm run seo:lint`        | SEO gate over `dist/client` (titles, descriptions, canonicals, h1, alt, JSON-LD, sitemap) |

To test the contact form locally, copy `.dev.vars.example` to `.dev.vars`, fill in a Brevo key,
then `npm run build && npm run preview`.

## Project layout

```
src/content/          ← editable content (pages, faq, aircraft, settings/*.yaml)
src/content.config.ts ← content schemas (the contract with the CMS)
src/components/blocks ← page building blocks (card, image, row, pricing, faq, weather, map…)
src/pages/[...slug].astro ← renders every page from src/content/pages
src/pages/api/        ← the only server code: contact form + Decap OAuth
src/server/           ← provider adapters (email, captcha, GitHub OAuth)
src/config/redirects.mjs ← 301s from the old WordPress URLs
public/admin/         ← Decap CMS (config.yml mirrors content.config.ts)
design/               ← cached Figma screens + old-site crawl (reference only)
```

Adding a new kind of block = add it to the zod schema, the renderer (`Item.astro` or
`[...slug].astro`) and the Decap config. Layout and styles stay in code; editors only compose
blocks and edit text/photos.

## Environments & CI/CD

```
PR   ──► CI: format, lint, astro check, unit, build, seo-lint, lychee, Playwright, Lighthouse
main ──► CI again ──► staging (auto) + smoke tests ──► production (manual approval) + smoke tests
```

- **Staging** builds use `PUBLIC_SITE_ENV=staging`: every page is `noindex` and
  `robots.txt` disallows everything.
- **Production** is rebuilt from the same commit with `PUBLIC_SITE_ENV=production`.
- Canonical URLs, the sitemap and social images use `SITE_URL` (default
  `https://www.aircampustroyes.fr`). `PUBLIC_ALLOW_INDEXING=false` keeps a production build out of
  search engines (used while the site only lives on workers.dev).
- Lighthouse budgets (`lighthouserc.json`): Performance ≥ 95, Accessibility ≥ 95,
  Best Practices ≥ 95, SEO = 100.
- `CODEOWNERS` requires review for code, not for content, so the president's content PRs can be
  merged as soon as CI is green; production still needs the manual approval.
- Nothing is deployed from pull requests. Jobs that run project code have no secrets; jobs that
  deploy never run project code.

**Setup, security model and the switch to the real domain: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).**

## Phase 2 (planned): gift vouchers

Stripe Checkout → webhook → voucher stored in D1 (via Drizzle, portable to any SQLite/libSQL) →
email with printable voucher; admin at `/gestion/` behind GitHub login restricted to an allowlist of
GitHub user IDs. See the project plan for details.
