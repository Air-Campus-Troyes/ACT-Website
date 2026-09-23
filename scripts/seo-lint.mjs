#!/usr/bin/env node
// SEO quality gate over the built site (dist/client). Fails CI on any error.
// Usage: node scripts/seo-lint.mjs [distDir]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse } from 'node-html-parser';

const dist = process.argv[2] ?? 'dist/client';
const SITE = process.env.SITE_URL || 'https://www.aircampustroyes.fr';

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === 'admin' || name === '_astro' ? [] : htmlFiles(p);
    return name.endsWith('.html') ? [p] : [];
  });

// Staging builds must be entirely noindex; production builds must be indexable.
const isProduction = /^Allow: \/$/m.test(readFileSync(join(dist, 'robots.txt'), 'utf8'));
console.log(
  `seo-lint: checking a ${isProduction ? 'production' : 'non-production'} build in ${dist}`,
);

const errors = [];
const warnings = [];
const titles = new Map();
const descriptions = new Map();
const indexable = [];

for (const file of htmlFiles(dist)) {
  const rel = relative(dist, file).split(sep).join('/');
  const path = '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '/');
  const root = parse(readFileSync(file, 'utf8'));
  const err = (msg) => errors.push(`${path}: ${msg}`);
  const warn = (msg) => warnings.push(`${path}: ${msg}`);
  const is404 = rel === '404.html';

  if (root.querySelector('html')?.getAttribute('lang') !== 'fr') err('<html lang="fr"> missing');

  const title = root.querySelector('title')?.text.trim() ?? '';
  if (!title) err('missing <title>');
  else if (title.length > 65) warn(`title is ${title.length} chars (> 65): "${title}"`);

  const description = root.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  if (!description) err('missing meta description');
  else if (description.length < 50 || description.length > 170)
    err(`meta description is ${description.length} chars (expected 50–170)`);

  const robots = root.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '';
  const noindex = robots.includes('noindex');
  if (!isProduction && !noindex) err('non-production build must be noindex');

  const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
  if (!is404) {
    if (canonical !== SITE + path) err(`canonical is "${canonical}", expected "${SITE + path}"`);
  }

  const h1s = root.querySelectorAll('h1');
  if (h1s.length !== 1) err(`expected exactly one <h1>, found ${h1s.length}`);

  // Heading levels must not skip (h2 → h4).
  let last = 1;
  for (const h of root.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    const level = Number(h.tagName[1]);
    if (level > last + 1)
      err(`heading jumps from h${last} to h${level} ("${h.text.trim().slice(0, 40)}")`);
    last = level;
  }

  for (const img of root.querySelectorAll('img')) {
    if (img.getAttribute('alt') === undefined)
      err(`<img src="${img.getAttribute('src')}"> has no alt`);
    if (!img.getAttribute('width') || !img.getAttribute('height'))
      err(`<img src="${img.getAttribute('src')}"> has no width/height (layout shift)`);
  }

  for (const a of root.querySelectorAll('a')) {
    const text = (a.text + (a.getAttribute('aria-label') ?? '')).trim();
    if (!text) err(`link to ${a.getAttribute('href')} has no accessible text`);
  }

  for (const og of ['og:title', 'og:description', 'og:image', 'og:url']) {
    if (!root.querySelector(`meta[property="${og}"]`)) err(`missing ${og}`);
  }

  const ld = root.querySelectorAll('script[type="application/ld+json"]');
  if (!ld.length) err('missing JSON-LD');
  for (const s of ld) {
    try {
      const data = JSON.parse(s.text);
      if (data['@context'] !== 'https://schema.org') err('JSON-LD without schema.org @context');
    } catch (e) {
      err(`invalid JSON-LD: ${e.message}`);
    }
  }

  if (!is404 && (!noindex || !isProduction)) {
    indexable.push(path);
    titles.set(title, [...(titles.get(title) ?? []), path]);
    descriptions.set(description, [...(descriptions.get(description) ?? []), path]);
  }
}

for (const [t, paths] of titles)
  if (paths.length > 1) errors.push(`duplicate title "${t}": ${paths.join(', ')}`);
for (const [d, paths] of descriptions)
  if (paths.length > 1)
    errors.push(`duplicate description on ${paths.join(', ')}: "${d.slice(0, 60)}…"`);

// Sitemap must list exactly the indexable pages (production builds only).
const sitemap = readdirSync(dist)
  .filter((f) => /^sitemap-\d+\.xml$/.test(f))
  .flatMap((f) =>
    [...readFileSync(join(dist, f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]),
  );
const inSitemap = new Set(sitemap.map((u) => new URL(u).pathname));
if (isProduction)
  for (const p of indexable)
    if (!inSitemap.has(p)) errors.push(`${p}: indexable page missing from sitemap`);
if (isProduction)
  for (const p of inSitemap)
    if (!indexable.includes(p)) errors.push(`${p}: in sitemap but not an indexable page`);

for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✖ ${e}`);
console.log(
  `\nseo-lint: ${indexable.length} indexable pages, ${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exit(errors.length ? 1 : 0);
