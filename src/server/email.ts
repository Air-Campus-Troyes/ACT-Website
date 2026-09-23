/**
 * Transactional email (Brevo). To switch provider (Resend, Postmark…), re-implement sendMail.
 */
export interface Mail {
  from: { email: string; name?: string };
  to: { email: string; name?: string }[];
  replyTo?: { email: string; name?: string };
  subject: string;
  text: string;
}

export async function sendMail(
  mail: Mail,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const res = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: mail.from,
      to: mail.to,
      replyTo: mail.replyTo,
      subject: mail.subject,
      textContent: mail.text,
    }),
  });
  if (!res.ok) {
    throw new Error(`Brevo responded ${res.status}: ${await res.text()}`);
  }
}
