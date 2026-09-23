/**
 * Server-side anti-spam verification (Cloudflare Turnstile).
 * To switch provider, re-implement this function and src/components/Captcha.astro.
 */
export async function verifyCaptcha(
  token: string | null,
  secret: string | undefined,
  remoteIp?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (!token || !secret) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);
  const res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}
