import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
const root = process.argv[2]!;
const { loadIdentitySourcesFromDir } = await import(join(root, 'iips-platform/src/investment/identity/sources.ts'));
const files = execSync('git ls-files', { cwd: root, encoding: 'utf8' }).split('\n').filter((f) => /(^|\/)eligible-roster\.json$/.test(f));
for (const f of files) {
  const dir = join(root, f.replace(/\/eligible-roster\.json$/, ''));
  const r = loadIdentitySourcesFromDir(dir);
  const raw = JSON.parse(readFileSync(join(root, f), 'utf8'));
  if (r.available) {
    console.log(f.replace(/\/eligible-roster\.json$/, ''), '| VALID |', 'issuers', r.sources.roster.issuers.length, 'securities', r.sources.roster.securities.length, 'listings', r.sources.listingMap.entries.length, 'actions', r.sources.corporateActionTable.actions.length, '| class', r.sources.rosterDataClass, '| label present', typeof raw.rosterLabel === 'string');
  } else {
    console.log(f.replace(/\/eligible-roster\.json$/, ''), '| INVALID |', [...new Set(r.issues.map((i: { file: string; code: string }) => `${i.file}:${i.code}`))].join(','));
  }
}
