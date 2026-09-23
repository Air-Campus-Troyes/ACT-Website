import type { APIRoute } from 'astro';
import { INDEXABLE } from '~/lib/site';

// Built per environment: only an indexable production build is crawlable.
export const GET: APIRoute = ({ site }) => {
  const body = INDEXABLE
    ? [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/',
        '',
        `Sitemap: ${new URL('/sitemap-index.xml', site).href}`,
      ]
    : ['User-agent: *', 'Disallow: /'];
  return new Response(body.join('\n') + '\n', { headers: { 'content-type': 'text/plain' } });
};
