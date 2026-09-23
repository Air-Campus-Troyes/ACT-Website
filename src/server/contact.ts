import { z } from 'astro/zod';
import type { Mail } from './email';

export type ContactResult = 'ok' | 'invalid' | 'captcha' | 'error';

const schema = z.object({
  lastName: z.string().trim().min(1).max(100),
  firstName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional().default(''),
  message: z.string().trim().min(10).max(5000),
});

export interface ContactDeps {
  verifyCaptcha: (token: string | null) => Promise<boolean>;
  sendMail: (mail: Mail) => Promise<void>;
  to: string;
  from: string;
  siteName: string;
}

/** Validates a contact form submission and forwards it to the club inbox. Stores nothing. */
export async function handleContact(form: FormData, deps: ContactDeps): Promise<ContactResult> {
  // Honeypot filled → silently pretend success so bots learn nothing.
  if (String(form.get('website') ?? '') !== '') return 'ok';

  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return 'invalid';

  const token = form.get('captcha');
  if (!(await deps.verifyCaptcha(typeof token === 'string' ? token : null))) return 'captcha';

  const d = parsed.data;
  const name = `${d.firstName} ${d.lastName}`;
  try {
    await deps.sendMail({
      from: { email: deps.from, name: `Site ${deps.siteName}` },
      to: [{ email: deps.to }],
      replyTo: { email: d.email, name },
      subject: `[Site web] Message de ${name}`,
      text: [
        `Nom : ${name}`,
        `Email : ${d.email}`,
        `Téléphone : ${d.phone || '—'}`,
        '',
        d.message,
        '',
        '— Envoyé depuis le formulaire de contact du site. Répondez directement à cet email.',
      ].join('\n'),
    });
    return 'ok';
  } catch (err) {
    console.error('contact: sendMail failed', err);
    return 'error';
  }
}
