import { Marked } from 'marked';

const md = new Marked({ gfm: true, breaks: false });

/** Renders a Markdown string coming from content frontmatter (card bodies, legends…). */
export function renderMarkdown(source: string | undefined): string {
  if (!source) return '';
  return md.parse(source, { async: false });
}

/** Markdown → plain text, for meta tags and JSON-LD. */
export function markdownToText(source: string): string {
  return renderMarkdown(source)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;|&rsquo;/g, '’')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
