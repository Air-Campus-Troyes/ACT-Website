import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { redirects } from '../../src/config/redirects.mjs';

// Old URLs recorded when the WordPress site was crawled.
const oldSite = JSON.parse(
  readFileSync(join(__dirname, '../../design/old-site/urls.json'), 'utf8'),
) as { url: string; type: string; status: number | null }[];

const pagesDir = join(__dirname, '../../src/content/pages');
const livePaths = new Set(
  readdirSync(pagesDir).map((file) => {
    const match = readFileSync(join(pagesDir, file), 'utf8').match(/^path:\s*'?([^'\n]*)'?\s*$/m);
    const path = match?.[1] ?? '';
    return path ? `/${path}/` : '/';
  }),
);

describe('SEO migration from the old site', () => {
  it('every redirect points at an existing page', () => {
    for (const [from, { destination, status }] of Object.entries(redirects)) {
      expect(status, from).toBe(301);
      expect(livePaths.has(destination), `${from} → ${destination}`).toBe(true);
    }
  });

  it('no redirect shadows a live page', () => {
    for (const from of Object.keys(redirects)) expect(livePaths.has(from), from).toBe(false);
  });

  it('every indexed old page either still exists or is redirected', () => {
    const oldPages = oldSite
      .filter((u) => ['page', 'post', 'category-archive', 'page+category-archive'].includes(u.type))
      .map((u) => new URL(u.url).pathname);
    expect(oldPages.length).toBeGreaterThan(10);
    const missing = oldPages.filter((p) => !livePaths.has(p) && !(p in redirects));
    expect(missing).toEqual([]);
  });
});
