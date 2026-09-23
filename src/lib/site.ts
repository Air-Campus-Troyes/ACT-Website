import { getEntry } from 'astro:content';
import { PUBLIC_ALLOW_INDEXING, PUBLIC_SITE_ENV } from 'astro:env/client';

/** Only production builds with indexing allowed may be crawled; everything else is noindex. */
export const INDEXABLE = PUBLIC_SITE_ENV === 'production' && PUBLIC_ALLOW_INDEXING;

export async function getSite() {
  const entry = await getEntry('site', 'site');
  if (!entry) throw new Error('src/content/settings/site.yaml is missing');
  return entry.data;
}

export type Site = Awaited<ReturnType<typeof getSite>>;

/** "prestations/vol-decouverte" → "/prestations/vol-decouverte/" (trailingSlash: always). */
export function pagePath(path: string): string {
  return path ? `/${path}/` : '/';
}
