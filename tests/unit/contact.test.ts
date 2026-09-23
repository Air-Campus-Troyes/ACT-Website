import { describe, expect, it, vi } from 'vitest';
import { handleContact, type ContactDeps } from '../../src/server/contact';

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const valid = {
  lastName: 'Blériot',
  firstName: 'Louis',
  email: 'louis@example.fr',
  phone: '06 00 00 00 00',
  message: 'Bonjour, je souhaite offrir un vol découverte.',
  captcha: 'token',
};

function deps(overrides: Partial<ContactDeps> = {}): ContactDeps {
  return {
    verifyCaptcha: vi.fn(async () => true),
    sendMail: vi.fn(async () => {}),
    to: 'club@example.fr',
    from: 'site@example.fr',
    siteName: 'Air Campus Troyes',
    ...overrides,
  };
}

describe('handleContact', () => {
  it('sends the message to the club with reply-to set to the visitor', async () => {
    const d = deps();
    expect(await handleContact(form(valid), d)).toBe('ok');
    expect(d.verifyCaptcha).toHaveBeenCalledWith('token');
    const mail = vi.mocked(d.sendMail).mock.calls[0]![0];
    expect(mail.to).toEqual([{ email: 'club@example.fr' }]);
    expect(mail.replyTo).toEqual({ email: 'louis@example.fr', name: 'Louis Blériot' });
    expect(mail.subject).toContain('Louis Blériot');
    expect(mail.text).toContain('offrir un vol découverte');
  });

  it('silently accepts honeypot submissions without sending anything', async () => {
    const d = deps();
    expect(await handleContact(form({ ...valid, website: 'http://spam' }), d)).toBe('ok');
    expect(d.sendMail).not.toHaveBeenCalled();
    expect(d.verifyCaptcha).not.toHaveBeenCalled();
  });

  it.each([
    ['missing name', { lastName: '' }],
    ['bad email', { email: 'pas-un-email' }],
    ['short message', { message: 'Salut' }],
  ])('rejects invalid input (%s)', async (_, patch) => {
    const d = deps();
    expect(await handleContact(form({ ...valid, ...patch }), d)).toBe('invalid');
    expect(d.sendMail).not.toHaveBeenCalled();
  });

  it('rejects a failed captcha', async () => {
    const d = deps({ verifyCaptcha: vi.fn(async () => false) });
    expect(await handleContact(form(valid), d)).toBe('captcha');
    expect(d.sendMail).not.toHaveBeenCalled();
  });

  it('reports provider failures', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const d = deps({ sendMail: vi.fn(async () => Promise.reject(new Error('down'))) });
    expect(await handleContact(form(valid), d)).toBe('error');
  });
});
