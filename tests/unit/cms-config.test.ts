import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

// Decap only validates its config in the browser, at login time. These checks catch the
// same mistakes in CI.
const root = join(__dirname, '../..');
const config = parse(readFileSync(join(root, 'public/admin/config.yml'), 'utf8'), {
  merge: true,
}) as { collections: Record<string, unknown>[] };

type Field = { name?: string; widget?: string; fields?: Field[]; types?: Field[]; field?: Field };

/** Visits every field / list type definition, with a readable path for error messages. */
function walk(fields: Field[], path: string, visit: (f: Field, path: string) => void) {
  fields.forEach((f, i) => {
    const here = `${path}.${f.name ?? i}`;
    visit(f, here);
    if (f.fields) walk(f.fields, here, visit);
    if (f.types) walk(f.types, `${here}.types`, visit);
    if (f.field) walk([f.field], here, visit);
  });
}

const all: { f: Field; path: string }[] = [];
for (const c of config.collections) {
  const files = (c.files as { name: string; fields: Field[] }[] | undefined) ?? [];
  if (c.fields) walk(c.fields as Field[], String(c.name), (f, path) => all.push({ f, path }));
  for (const file of files)
    walk(file.fields, `${c.name}.${file.name}`, (f, path) => all.push({ f, path }));
}

describe('Decap CMS config', () => {
  it('parses and has collections', () => {
    expect(config.collections.length).toBeGreaterThan(0);
    expect(all.length).toBeGreaterThan(50);
  });

  it('never declares an empty field list (Decap rejects `fields: []`)', () => {
    const empty = all.filter(({ f }) => Array.isArray(f.fields) && f.fields.length === 0);
    expect(empty.map((e) => e.path)).toEqual([]);
  });

  it('gives every field a name', () => {
    expect(all.filter(({ f }) => !f.name).map((e) => e.path)).toEqual([]);
  });

  it('only uses block types that exist in the content schema', () => {
    const schema = readFileSync(join(root, 'src/content.config.ts'), 'utf8');
    const known = new Set([...schema.matchAll(/z\.literal\('(\w+)'\)/g)].map((m) => m[1]));
    const typeNames = all
      .filter(({ path }) => /\.types\.[^.]+$/.test(path))
      .map(({ f, path }) => ({ name: f.name!, path }));
    expect(typeNames.length).toBeGreaterThan(5);
    expect(typeNames.filter((t) => !known.has(t.name)).map((t) => t.path)).toEqual([]);
  });
});
