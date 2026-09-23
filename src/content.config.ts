import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Content model. Every field here must have a matching field in public/admin/config.yml
 * (Decap CMS) so non-developers can edit it. A wrong value fails `astro check` / the build.
 */

const button = z.object({
  label: z.string(),
  href: z.string(),
  variant: z.enum(['gold', 'navy', 'light']).default('gold'),
});

// Decap CMS writes empty strings / empty objects for untouched optional fields.
const emptyToUndefined = (v: unknown) =>
  v === '' || v === null || (typeof v === 'object' && v !== null && !('src' in v && v.src))
    ? undefined
    : v;

const seo = z.object({
  title: z.string().max(60, 'Le titre SEO doit faire 60 caractères maximum'),
  description: z
    .string()
    .min(50, 'La description SEO doit faire au moins 50 caractères')
    .max(170, 'La description SEO doit faire 170 caractères maximum'),
  noindex: z.boolean().default(false),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: ({ image }) => {
    const img = z.object({ src: image(), alt: z.string().min(1, 'Texte alternatif obligatoire') });

    // Items placed inside a row's columns.
    const item = z.discriminatedUnion('type', [
      z.object({
        type: z.literal('card'),
        title: z.string().optional(),
        body: z.string().default(''),
        align: z.enum(['center', 'left']).default('center'),
        buttons: z.array(button).default([]),
      }),
      z.object({
        type: z.literal('image'),
        image: img,
        shape: z.enum(['auto', 'landscape', 'portrait', 'square']).default('auto'),
      }),
      z.object({ type: z.literal('weather'), title: z.string().default('Météo') }),
      z.object({
        type: z.literal('contactForm'),
        title: z.string().default('Envoyez-nous un message'),
      }),
      z.object({ type: z.literal('map'), title: z.string().default('Carte') }),
      z.object({
        type: z.literal('document'),
        title: z.string(),
        body: z.string().default(''),
        file: z.string(),
        label: z.string(),
      }),
    ]);

    const section = z.discriminatedUnion('type', [
      z.object({
        type: z.literal('hero'),
        title: z.string(),
        image: img,
      }),
      z.object({
        type: z.literal('row'),
        // Relative width of the left/right columns on desktop. Mobile always stacks.
        ratio: z.enum(['1-1', '5-7', '7-5', '1-2', '2-1']).default('1-1'),
        left: z.array(item).default([]),
        right: z.array(item).default([]),
      }),
      z.object({ type: z.literal('full'), items: z.array(item).default([]) }),
      z.object({ type: z.literal('pricing') }),
      z.object({ type: z.literal('aircraft') }),
      z.object({ type: z.literal('faq') }),
      z.object({ type: z.literal('markdown') }),
      z.object({ type: z.literal('sitemap') }),
    ]);

    return z.object({
      // Public URL path without slashes, e.g. "prestations/vol-decouverte". "" = home page.
      path: z.string().regex(/^([a-z0-9-]+(\/[a-z0-9-]+)*)?$/, 'Minuscules, chiffres et tirets'),
      title: z.string(),
      seo,
      breadcrumb: z.array(z.object({ label: z.string(), href: z.string().optional() })).default([]),
      ogImage: z.preprocess(emptyToUndefined, img.optional()),
      sections: z.array(section).default([]),
    });
  },
});

const faq = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/faq' }),
  schema: z.object({
    question: z.string(),
    order: z.number().int().default(100),
  }),
});

const aircraft = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/aircraft' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      registration: z.string().optional(),
      description: z.string(),
      image: z.object({ src: image(), alt: z.string().min(1) }),
      order: z.number().int().default(100),
    }),
});

const pricing = defineCollection({
  loader: glob({ pattern: 'pricing.yaml', base: './src/content/settings' }),
  schema: z.object({
    intro: z.object({ title: z.string(), body: z.string() }),
    tableTitle: z.string(),
    tables: z.array(
      z.object({
        title: z.string(),
        columns: z.array(z.string()).default([]),
        rows: z.array(z.object({ label: z.string(), values: z.array(z.string()) })),
      }),
    ),
    legend: z.object({ title: z.string(), body: z.string() }).optional(),
    // Structured offers, used for JSON-LD (and later for gift vouchers).
    offers: z
      .array(
        z.object({
          name: z.string(),
          price: z.number(),
          url: z.string().optional(),
        }),
      )
      .default([]),
  }),
});

const site = defineCollection({
  loader: glob({ pattern: 'site.yaml', base: './src/content/settings' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      legalName: z.string(),
      tagline: z.string(),
      foundingDate: z.string(),
      phone: z.string(),
      phoneDisplay: z.string(),
      email: z.preprocess((v) => (v === '' ? undefined : v), z.string().email().optional()),
      address: z.object({
        line1: z.string(),
        line2: z.string(),
        postalCode: z.string(),
        city: z.string(),
        country: z.string().default('FR'),
      }),
      geo: z.object({ lat: z.number(), lon: z.number() }),
      parking: z.string(),
      parkingImage: z.preprocess(
        emptyToUndefined,
        z.object({ src: image(), alt: z.string() }).optional(),
      ),
      openingHours: z.array(z.string()).default([]),
      social: z.array(
        z.object({ network: z.enum(['facebook', 'instagram', 'youtube']), url: z.string().url() }),
      ),
      nav: z.array(
        z.object({
          label: z.string(),
          href: z.string().optional(),
          children: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
        }),
      ),
      footerLinks: z.array(z.object({ label: z.string(), href: z.string() })),
      legalLinks: z.array(z.object({ label: z.string(), href: z.string() })),
      defaultOgImage: z.object({ src: image(), alt: z.string() }),
    }),
});

export const collections = { pages, faq, aircraft, pricing, site };
