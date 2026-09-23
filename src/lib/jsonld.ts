import type { Site } from './site';

type Thing = Record<string, unknown>;

/** Site-wide organisation markup: a SportsClub is a LocalBusiness subtype, good for local SEO. */
export function organization(site: Site, origin: string, logoUrl: string): Thing {
  return {
    '@type': ['SportsClub', 'LocalBusiness'],
    '@id': `${origin}/#organization`,
    name: site.name,
    legalName: site.legalName,
    description: site.tagline,
    url: `${origin}/`,
    logo: logoUrl,
    image: logoUrl,
    telephone: site.phone,
    ...(site.email ? { email: site.email } : {}),
    foundingDate: site.foundingDate,
    sport: 'Aviation',
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.line1}, ${site.address.line2}`,
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      addressCountry: site.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lon },
    ...(site.openingHours.length ? { openingHours: site.openingHours } : {}),
    sameAs: site.social.map((s) => s.url),
  };
}

export function website(site: Site, origin: string): Thing {
  return {
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    url: `${origin}/`,
    name: site.name,
    inLanguage: 'fr-FR',
    publisher: { '@id': `${origin}/#organization` },
  };
}

export function breadcrumbList(items: { label: string; href?: string }[], origin: string): Thing {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: new URL(item.href, origin).href } : {}),
    })),
  };
}

export function faqPage(entries: { question: string; answer: string }[]): Thing {
  return {
    '@type': 'FAQPage',
    mainEntity: entries.map((e) => ({
      '@type': 'Question',
      name: e.question,
      acceptedAnswer: { '@type': 'Answer', text: e.answer },
    })),
  };
}

export function offerCatalog(
  offers: { name: string; price: number; url?: string }[],
  origin: string,
): Thing {
  return {
    '@type': 'OfferCatalog',
    name: 'Tarifs',
    itemListElement: offers.map((o) => ({
      '@type': 'Offer',
      name: o.name,
      price: o.price.toFixed(2),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      seller: { '@id': `${origin}/#organization` },
      ...(o.url ? { url: new URL(o.url, origin).href } : {}),
    })),
  };
}

export function graph(nodes: Thing[]): string {
  // Escape "<" so content can never close the <script> tag.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(
    /</g,
    '\u003c',
  );
}
