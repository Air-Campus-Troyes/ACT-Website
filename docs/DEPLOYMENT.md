# Deployment & CI setup

Everything is deployed by GitHub Actions; nothing is deployed from a laptop. Until the club
domain is available the site runs on Cloudflare's free `workers.dev` subdomain. The
[last section](#switching-to-aircampustroyesfr) lists the steps for moving to
`www.aircampustroyes.fr`.

```
pull request  ─► checks only (lint, tests, build, SEO, links, Playwright, Lighthouse)
push to main  ─► checks ─► build ×2 (no secrets) ─► staging ─► smoke tests
                                                 └► ⏸ approval ─► production ─► smoke tests
```

`main` is staging: every merge is live on staging a few minutes later. Production is the same
commit, deployed only after a required reviewer approves it in the _Actions_ tab.

## Security model

| Threat                                                                   | Mitigation                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unreviewed PR code (fork or branch) reaches Cloudflare or reads a secret | Nothing is deployed from pull requests. The CI workflow has no secrets and a read-only token, and we never use `pull_request_target`.                                                                                           |
| A PR edits a workflow to grab deploy secrets                             | All secrets live in the `staging` and `production` **environments**, which only the `main` branch can use. GitHub enforces this outside the workflow file, so a PR can't get around it.                                         |
| A compromised dependency (npm install script) steals the deploy token    | Jobs that run project code (`checks`, `build`, `*-e2e`) have no secrets. Jobs that hold secrets (`staging`, `production`) never check out or install the project: they download the build artifact and run a pinned `wrangler`. |
| Unreviewed code reaches production                                       | Code changes need a Code Owner review before merging to `main`. Production then needs a second, explicit approval.                                                                                                              |
| Compromised third-party action                                           | Every action is pinned to a commit SHA. Dependabot proposes updates.                                                                                                                                                            |

Content-only PRs (the president's CMS edits) can be merged without a code review. They only touch
Markdown/YAML, and the schema check rejects anything malformed. They still go through staging and
the production approval.

## One-time setup

### 1. Cloudflare

One free account is enough: both tokens are restricted to the `main` branch.

1. Open _Workers & Pages_ once so Cloudflare assigns the account's `workers.dev` subdomain, e.g.
   `aircampus.workers.dev`.
2. _My Profile → API Tokens → Create Token → "Edit Cloudflare Workers"_ template, restricted to
   that account. Note the token and the **Account ID** (shown in the dashboard sidebar).

The resulting URLs are:

- Production: `https://website.<subdomain>.workers.dev`
- Staging: `https://website-staging.<subdomain>.workers.dev`

The Workers don't need to exist beforehand: the first push to `main` creates them.

### 2. Turnstile (anti-spam)

Create a widget whose hostname is the production host (`website.<subdomain>.workers.dev` for
now). Staging uses Cloudflare's always-pass test keys, so it doesn't need a widget.

### 3. Brevo (email)

Create the account and an API key. Until the domain is available, verify a single sender address
(Senders → Add a sender) to use as `CONTACT_FROM_EMAIL`; deliverability improves once the domain is
authenticated. Staging can share the key or leave it unset. Without it, the form answers with a
polite error.

### 4. GitHub OAuth Apps (Decap CMS login)

Organisation settings → Developer settings → OAuth Apps → New, one per environment (an OAuth App
has a single callback URL):

| App                   | Homepage       | Authorization callback URL             |
| --------------------- | -------------- | -------------------------------------- |
| ACT website           | production URL | `<production URL>/api/decap/callback/` |
| ACT website (staging) | staging URL    | `<staging URL>/api/decap/callback/`    |

### 5. GitHub repository settings

**Settings → Actions → General**

- Fork pull request workflows: _Require approval for all external contributors_.
- Workflow permissions: _Read repository contents_ (the default); leave "allow GitHub Actions to
  create and approve pull requests" unchecked.

**Settings → Environments**

| Environment  | Deployment branches | Protection                   | Secrets                                                                                                                                                                                                       |
| ------------ | ------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `staging`    | `main` only         | —                            | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; `TURNSTILE_SECRET_KEY` = `1x0000000000000000000000000000000AA`; optional `BREVO_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`; staging `OAUTH_GITHUB_*` |
| `production` | `main` only         | **Required reviewers** (you) | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `TURNSTILE_SECRET_KEY`, `BREVO_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `OAUTH_GITHUB_CLIENT_ID`, `OAUTH_GITHUB_CLIENT_SECRET`                    |

GitHub reserves the `GITHUB_` prefix, so the OAuth secrets are stored as `OAUTH_GITHUB_*` and
passed to the Worker as `GITHUB_OAUTH_*`. The Worker's runtime secrets are synced on every deploy
with `wrangler deploy --secrets-file`. Only the secrets that are set are sent, and removing one in
GitHub does not delete it from the Worker (use `wrangler secret delete` for that).

**Settings → Secrets and variables → Actions → Variables** (repository level)

| Variable                    | Value while on workers.dev                                                            |
| --------------------------- | ------------------------------------------------------------------------------------- |
| `CANONICAL_URL`             | `https://website.<subdomain>.workers.dev`                                             |
| `ALLOW_INDEXING`            | `false` (keeps the workers.dev copy out of Google while the old site owns the domain) |
| `PRODUCTION_URL`            | `https://website.<subdomain>.workers.dev`                                             |
| `STAGING_URL`               | `https://website-staging.<subdomain>.workers.dev`                                     |
| `PUBLIC_TURNSTILE_SITE_KEY` | production widget's site key                                                          |

**Branch protection on `main`**: require a pull request, require the status check
_Lint, tests, build, SEO_, and require review from Code Owners. Set `backend.repo` in
`public/admin/config.yml` and the team in `.github/CODEOWNERS`.

### 6. First deployment

Push to `main` (or merge the first PR). The _Deploy_ workflow runs the checks, deploys staging,
runs the smoke tests, then waits for your approval in the _Actions_ tab before deploying
production.

## Switching to aircampustroyes.fr

Do this when the domain is transferred, or when its DNS can be pointed at Cloudflare.

1. **DNS**: add `aircampustroyes.fr` as a zone in the Cloudflare account and change the
   nameservers at the registrar.
2. **`wrangler.jsonc`** (via a PR):
   - Production: uncomment the `www.aircampustroyes.fr` custom domain route and set
     `"workers_dev": false` so the workers.dev copy stops serving.
   - Staging: optionally uncomment `staging.aircampustroyes.fr`, or keep it on workers.dev.
   - Optionally add `aircampustroyes.fr` (apex). Cloudflare redirects apex → `www` with a
     redirect rule (_Rules → Redirect Rules → "Redirect from root to WWW"_).
3. **GitHub variables**:
   - Delete `CANONICAL_URL` (the default is `https://www.aircampustroyes.fr`).
   - Delete `ALLOW_INDEXING` (the default is indexable).
   - `PRODUCTION_URL` = `https://www.aircampustroyes.fr`.
   - `STAGING_URL`, if you moved staging.
4. **Turnstile**: add `www.aircampustroyes.fr` to the widget's hostnames.
5. **OAuth Apps**: update the homepage and callback to
   `https://www.aircampustroyes.fr/api/decap/callback/` (and staging's if it moved).
6. **Brevo**: authenticate the domain (SPF, DKIM and DMARC records in Cloudflare DNS), then switch
   `CONTACT_FROM_EMAIL` to e.g. `site@aircampustroyes.fr`.
7. **Merge the PR and approve the production deploy.** Then check that:
   - `https://www.aircampustroyes.fr/robots.txt` shows `Allow: /` and the sitemap line;
   - a few old URLs return 301, e.g. `/lassociation/plan-dacces/` and
     `/2019/09/28/tour-deurope-ete-2019/` (full list in `design/old-site/urls.json`);
   - pages carry `index, follow` and canonicals on `www.aircampustroyes.fr`.
8. **Search engines**: verify the domain in Google Search Console and Bing Webmaster Tools,
   submit `/sitemap-index.xml`, and point the Google Business Profile at the new site.
