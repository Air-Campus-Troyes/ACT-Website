import type { CollectionEntry } from 'astro:content';

export type PageData = CollectionEntry<'pages'>['data'];
export type PageSection = PageData['sections'][number];
export type RowSection = Extract<PageSection, { type: 'row' }>;
export type PageItem = RowSection['left'][number];
