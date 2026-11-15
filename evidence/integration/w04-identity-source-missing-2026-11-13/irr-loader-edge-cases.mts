import { cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.argv[2]!;
const { loadIdentitySourcesFromDir } = await import(pathToFileURL(join(root, 'iips-platform/src/investment/identity/sources.ts')).href);
const fixture = join(root, 'iips-platform/tests/investment/fixtures/identity');
const cases: Array<[string, string, (o: any) => void]> = [
  ['roster: issuers key absent', 'eligible-roster.json', (o) => { delete o.issuers; }],
  ['roster: issuers empty', 'eligible-roster.json', (o) => { o.issuers = []; }],
  ['listing-map: entries key absent', 'listing-map.json', (o) => { delete o.entries; }],
  ['listing-map: entries empty', 'listing-map.json', (o) => { o.entries = []; }],
  ['corporate-actions: actions key absent', 'corporate-actions.json', (o) => { delete o.actions; }],
  ['corporate-actions: actions empty', 'corporate-actions.json', (o) => { o.actions = []; }],
  ['roster: top level is an array', 'eligible-roster.json', () => {}],
];
for (const [label, file, mutate] of cases) {
  const dir = mkdtempSync(join(tmpdir(), 'thin-'));
  cpSync(fixture, dir, { recursive: true });
  const obj = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  mutate(obj);
  writeFileSync(join(dir, file), JSON.stringify(label.includes('top level') ? [obj] : obj));
  let out: string;
  try {
    const r = loadIdentitySourcesFromDir(dir);
    out = r.available ? 'VALID' : 'INVALID ' + JSON.stringify([...new Set(r.issues.map((i: any) => i.code))]);
  } catch (e) { out = 'THROWS ' + (e as Error).constructor.name; }
  console.log(`${label} | ${out}`);
}
