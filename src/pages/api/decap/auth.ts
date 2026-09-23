import type { APIRoute } from 'astro';
import { GITHUB_OAUTH_CLIENT_ID } from 'astro:env/server';
import { STATE_COOKIE, authorizeUrl, randomState } from '~/server/github-oauth';

export const prerender = false;

// Step 1 of the Decap CMS login popup: send the editor to GitHub.
export const GET: APIRoute = ({ url, cookies, redirect }) => {
  if (!GITHUB_OAUTH_CLIENT_ID) return new Response('OAuth non configuré', { status: 500 });
  const state = randomState();
  cookies.set(STATE_COOKIE, state, {
    path: '/api/decap/',
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    maxAge: 600,
  });
  return redirect(
    authorizeUrl({
      clientId: GITHUB_OAUTH_CLIENT_ID,
      redirectUri: new URL('/api/decap/callback/', url).href,
      // The repository is public: public_repo is enough to open PRs.
      scope: 'public_repo',
      state,
    }),
  );
};
