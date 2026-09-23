import { describe, expect, it, vi } from 'vitest';
import { verifyCaptcha } from '../../src/server/captcha';
import { sendMail } from '../../src/server/email';

describe('verifyCaptcha', () => {
  it('returns false without token or secret, without calling the provider', async () => {
    const f = vi.fn();
    expect(await verifyCaptcha(null, 'secret', undefined, f)).toBe(false);
    expect(await verifyCaptcha('tok', undefined, undefined, f)).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });

  it('posts token, secret and IP to Turnstile and reads `success`', async () => {
    const f = vi.fn(async () => Response.json({ success: true }));
    expect(await verifyCaptcha('tok', 'secret', '1.2.3.4', f)).toBe(true);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('turnstile/v0/siteverify');
    const body = init.body as URLSearchParams;
    expect(body.get('response')).toBe('tok');
    expect(body.get('remoteip')).toBe('1.2.3.4');
  });

  it('fails closed on provider errors', async () => {
    expect(
      await verifyCaptcha('tok', 's', undefined, async () => new Response('', { status: 500 })),
    ).toBe(false);
    expect(
      await verifyCaptcha('tok', 's', undefined, async () => Response.json({ success: false })),
    ).toBe(false);
  });
});

describe('sendMail', () => {
  const mail = {
    from: { email: 'site@example.fr' },
    to: [{ email: 'club@example.fr' }],
    subject: 'Test',
    text: 'Bonjour',
  };

  it('calls the Brevo transactional API with the API key', async () => {
    const f = vi.fn(async () => Response.json({ messageId: '1' }, { status: 201 }));
    await sendMail(mail, 'key', f);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect((init.headers as Record<string, string>)['api-key']).toBe('key');
    expect(JSON.parse(init.body as string)).toMatchObject({
      subject: 'Test',
      textContent: 'Bonjour',
    });
  });

  it('throws on non-2xx responses', async () => {
    await expect(
      sendMail(mail, 'key', async () => new Response('nope', { status: 401 })),
    ).rejects.toThrow(/401/);
  });
});
