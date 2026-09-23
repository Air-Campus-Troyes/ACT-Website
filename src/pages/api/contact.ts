import type { APIRoute } from 'astro';
import {
  BREVO_API_KEY,
  CONTACT_FROM_EMAIL,
  CONTACT_TO_EMAIL,
  TURNSTILE_SECRET_KEY,
} from 'astro:env/server';
import { verifyCaptcha } from '~/server/captcha';
import { handleContact } from '~/server/contact';
import { sendMail } from '~/server/email';
import { getSite } from '~/lib/site';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress, redirect }) => {
  const site = await getSite();
  const result =
    BREVO_API_KEY && CONTACT_TO_EMAIL && CONTACT_FROM_EMAIL
      ? await handleContact(await request.formData(), {
          verifyCaptcha: (token) => verifyCaptcha(token, TURNSTILE_SECRET_KEY, clientAddress),
          sendMail: (mail) => sendMail(mail, BREVO_API_KEY!),
          to: CONTACT_TO_EMAIL,
          from: CONTACT_FROM_EMAIL,
          siteName: site.name,
        })
      : (console.error('contact: email secrets are not configured'), 'error' as const);

  const status = { ok: 200, invalid: 400, captcha: 403, error: 502 }[result];
  if (request.headers.get('accept')?.includes('application/json')) {
    return Response.json({ result }, { status });
  }
  // Plain HTML form post (no JS): back to the contact page with a message code.
  return redirect(`/contact/?envoi=${result}#contenu`, 303);
};
