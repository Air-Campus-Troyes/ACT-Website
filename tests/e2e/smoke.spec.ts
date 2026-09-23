import { expect, test } from '@playwright/test';

const pages = [
  ['/', 'Bienvenue chez Air Campus Troyes'],
  ['/bapteme-de-lair/', 'Vol découverte'],
  ['/vol-d-initiation/', 'Vol d’initiation'],
  ['/apprendre-a-piloter/', 'Apprendre à piloter'],
  ['/apprendre-a-piloter/licence-pilote-prive-ppl/', 'Licence pilote privé (PPL)'],
  ['/apprendre-a-piloter/vol-nuit/', 'Qualification vol de nuit'],
  ['/nos-tarifs/', 'Nos tarifs'],
  ['/nos-avions/', 'Nos avions'],
  ['/liens-utiles/', 'Liens utiles'],
  ['/contact/', 'Contact'],
  ['/plan-dacces/', 'Plan d’accès'],
  ['/faq/', 'Foire aux questions'],
] as const;

for (const [path, h1] of pages) {
  test(`${path} renders`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1, { ignoreCase: true });
    await expect(page.locator('nav#menu-principal')).toBeAttached();
  });
}

test('unknown pages return a real 404', async ({ page }) => {
  const res = await page.goto('/cette-page-n-existe-pas/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/introuvable/i);
});

test('old WordPress URLs are permanently redirected', async ({ request }) => {
  for (const [from, to] of [
    ['/lassociation/plan-dacces/', '/plan-dacces/'],
    ['/2019/09/28/tour-deurope-ete-2019/', '/'],
    [
      '/wp-content/uploads/2015/02/guide_instructeur_VFR_nuit.pdf',
      '/apprendre-a-piloter/vol-nuit/',
    ],
  ]) {
    const res = await request.get(from!, { maxRedirects: 0 });
    expect(res.status(), from).toBe(301);
    expect(new URL(res.headers()['location']!, 'http://x').pathname, from).toBe(to);
  }
});

test('mobile menu opens and dropdowns work', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) {
    await page.getByRole('button', { name: 'Menu' }).click();
  }
  await page.getByText('Prestations', { exact: true }).click();
  await page.getByRole('link', { name: 'Vol découverte' }).first().click();
  await expect(page).toHaveURL(/\/bapteme-de-lair\/$/);
});

test('contact form validates required fields client-side', async ({ page }) => {
  await page.goto('/contact/');
  const form = page.locator('[data-contact-form]');
  await form.getByRole('button', { name: 'Envoyer' }).click();
  // Native validation blocks submission: nothing is sent, the status stays empty.
  await expect(form.locator('[data-status]')).toHaveText('');
});

test('contact API rejects incomplete submissions', async ({ request, baseURL }) => {
  const res = await request.post('/api/contact/', {
    // Astro's CSRF protection only accepts same-origin form posts.
    headers: { accept: 'application/json', origin: new URL(baseURL!).origin },
    multipart: { email: 'pas-un-email' },
  });
  expect([400, 502]).toContain(res.status());
});
