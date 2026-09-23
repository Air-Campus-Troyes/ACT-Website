import type { APIRoute } from 'astro';
import { GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET } from 'astro:env/server';
import { STATE_COOKIE, exchangeCode } from '~/server/github-oauth';

export const prerender = false;

/** Page that hands the result back to the Decap CMS window that opened the popup. */
function popupResponse(status: 'success' | 'error', content: object, origin: string) {
  const message = `authorization:github:${status}:${JSON.stringify(content)}`;
  const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Connexion…</title><body><p>Connexion en cours…</p><script>
(function () {
  var origin = ${JSON.stringify(origin)};
  function receive(e) {
    if (e.origin !== origin) return;
    window.removeEventListener('message', receive);
    window.opener.postMessage(${JSON.stringify(message)}, origin);
    window.close();
  }
  window.addEventListener('message', receive);
  window.opener.postMessage('authorizing:github', origin);
})();
</script></body></html>`;
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// Step 2: GitHub redirects back here with ?code=…&state=…
export const GET: APIRoute = async ({ url, cookies }) => {
  const origin = url.origin;
  const expected = cookies.get(STATE_COOKIE)?.value;
  cookies.delete(STATE_COOKIE, { path: '/api/decap/' });

  const code = url.searchParams.get('code');
  if (!code || !expected || url.searchParams.get('state') !== expected) {
    return popupResponse('error', { message: 'État OAuth invalide, merci de réessayer.' }, origin);
  }
  if (!GITHUB_OAUTH_CLIENT_ID || !GITHUB_OAUTH_CLIENT_SECRET) {
    return popupResponse('error', { message: 'OAuth non configuré.' }, origin);
  }
  try {
    const token = await exchangeCode({
      clientId: GITHUB_OAUTH_CLIENT_ID,
      clientSecret: GITHUB_OAUTH_CLIENT_SECRET,
      code,
      redirectUri: new URL('/api/decap/callback/', url).href,
    });
    return popupResponse('success', { token, provider: 'github' }, origin);
  } catch (err) {
    console.error('decap oauth', err);
    return popupResponse('error', { message: 'Échec de la connexion GitHub.' }, origin);
  }
};
