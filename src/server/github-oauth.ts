/**
 * Minimal GitHub OAuth helpers (no SDK). Used by the Decap CMS login routes, and later by the
 * admin area (phase 2).
 */

export const STATE_COOKIE = 'gh_oauth_state';

export function randomState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(
    /[+/=]/g,
    (c) => ({ '+': '-', '/': '_', '=': '' })[c]!,
  );
}

export function authorizeUrl(opts: {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
}): string {
  const url = new URL('https://github.com/login/oauth/authorize');
  url.search = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    scope: opts.scope,
    state: opts.state,
    allow_signup: 'false',
  }).toString();
  return url.href;
}

export async function exchangeCode(
  opts: { clientId: string; clientSecret: string; code: string; redirectUri: string },
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const res = await fetchImpl('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      code: opts.code,
      redirect_uri: opts.redirectUri,
    }),
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`GitHub OAuth failed: ${data.error ?? res.status}`);
  return data.access_token;
}
