#!/usr/bin/env node
/**
 * Self-test of the P7 mapping gap diagnostic. SYNTHETIC INPUTS ONLY.
 *
 * It writes a synthetic CSV into a temporary directory of the operating system, runs the
 * diagnostic against THIS checkout (which must be built: `npm run build`), and checks the
 * results. The rows use issuer facts of the tracked P04 master and P7 manifest (symbol, ISIN,
 * exchange); quantities and prices are invented. Nothing here is a holding of anyone, and
 * nothing here says anything about the 64 holdings of revision 1.
 *
 * The self-test may write (to the temporary directory) and may start a child process (the
 * diagnostic). The diagnostic itself may do neither; scenario 6 checks its source for that.
 * Each full run of the diagnostic takes about 15 seconds; the self-test takes about 90.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');
const tool = path.join(here, 'w04-p7-mapping-gap-diagnostic.mjs');
const sha256 = (data) => createHash('sha256').update(data).digest('hex');

/* SYNTHETIC rows. Issuer facts from the tracked master; the expected category is a fact of the
 * tracked registry and master, not of any portfolio. */
const ROWS = [
  { name: 'Reliance Industries', symbol: 'RELIANCE', isin: 'INE002A01018', exchange: 'NSE', category: 'QUALIFIED_BY_EXACT_MAPPING' },
  { name: 'Bajaj Finance', symbol: 'BAJFINANCE', isin: 'INE296A01032', exchange: 'NSE', category: 'REGISTRY_NOT_REGENERATED__ISIN_ABSENT' },
  { name: 'Havells India', symbol: 'HAVELLS', isin: 'INE176B01034', exchange: 'NSE', category: 'REGISTRY_NOT_REGENERATED__ISIN_ABSENT' },
  { name: 'Pidilite Industries', symbol: 'PIDILITIND', isin: 'INE318A01026', exchange: 'BSE', category: 'REGISTRY_NOT_REGENERATED__ISIN_ABSENT' },
  /* In the registry under the company id of the earlier master; the master of today renamed it. */
  { name: 'LTIMindtree', symbol: 'LTM', isin: 'INE214T01019', exchange: 'NSE', category: 'REGISTRY_NOT_REGENERATED__COMPANY_ID_CHANGED' },
  /* The master of today has no active BSE listing for this company. */
  { name: 'Aakash Exploration', symbol: 'AAKASH', isin: 'INE087Z01024', exchange: 'BSE', category: 'NOT_A_P7_MAPPING_GAP' },
  /* Well-formed, but no company of the master carries it. */
  { name: 'Synthetic Unknown', symbol: 'SYNTHETICUNKNOWN', isin: 'INE000000000', exchange: 'NSE', category: 'NOT_A_P7_MAPPING_GAP' },
];
const HEADER = 'Security Name,Trading Symbol,ISIN,Exchange,Quantity,Average Buy Price,Last Traded Price';
const csvOf = (rows) => [HEADER, ...rows.map((r, i) => `${r.name},${r.symbol},${r.isin},${r.exchange},${i + 1},100,110`)].join('\r\n') + '\r\n';

const work = mkdtempSync(path.join(tmpdir(), 'w04-p7-gap-diagnostic-'));
let failed = 0;
let passed = 0;
function expect(id, ok, detail = '') {
  if (ok) passed += 1;
  else failed += 1;
  process.stdout.write(`[${ok ? 'PASS' : 'FAIL'}] ${id}${ok || !detail ? '' : `: ${detail}`}\n`);
}
function run(args, nodeFlags = []) {
  const out = spawnSync(process.execPath, [...nodeFlags, tool, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const json = out.stdout.match(/^W04_P7_MAPPING_GAP_RESULT_JSON: (.*)$/m);
  const hash = out.stdout.match(/^W04_P7_MAPPING_GAP_RESULT_JSON_SHA256: ([0-9a-f]{64})$/m);
  return { status: out.status, stdout: out.stdout, stderr: out.stderr, json: json ? JSON.parse(json[1]) : null, jsonText: json ? json[1] : null, hash: hash ? hash[1] : null };
}
const rowLines = (stdout) => stdout.split('\n').filter((l) => l.startsWith('[ROW] '));

try {
  const csvFile = path.join(work, 'synthetic.csv');
  const text = csvOf(ROWS);
  writeFileSync(csvFile, text);
  const digest = sha256(Buffer.from(text, 'utf8'));
  const base = ['--csv', csvFile, '--ipd-root', repoRoot, '--expected-csv-sha256', digest];

  /* 1. A full run on the synthetic rows. */
  const a = run(base);
  expect('1.exit', a.status === 0, `exit ${a.status}`);
  expect('1.result', a.json?.result === 'ANALYSED');
  expect('1.override-reported', a.json?.recordedInputs?.csv === false && /\[WARN\] csv\.override/.test(a.stdout));
  expect('1.json-digest', a.hash === sha256(Buffer.from(a.jsonText ?? '', 'utf8')));
  expect('1.rows', rowLines(a.stdout).length === ROWS.length && a.json?.holdings?.count === ROWS.length);
  const expectedByCategory = {};
  for (const r of ROWS) expectedByCategory[r.category] = (expectedByCategory[r.category] ?? 0) + 1;
  expect('1.categories', JSON.stringify(a.json?.holdings?.byCategory) === JSON.stringify(Object.fromEntries(Object.entries(expectedByCategory).sort(([x], [y]) => (x < y ? -1 : 1)))), JSON.stringify(a.json?.holdings?.byCategory));
  expect('1.now', a.json?.holdings?.now?.QUALIFIED === 1 && a.json?.holdings?.now?.['UNRESOLVED:MISSING_P7_MAPPING'] === 4 && a.json?.holdings?.now?.['UNRESOLVED:INACTIVE_OR_MISSING_LISTING'] === 1 && a.json?.holdings?.now?.['UNRESOLVED:MISSING_P04_CORRESPONDENCE'] === 1, JSON.stringify(a.json?.holdings?.now));
  expect('1.after-rerun', a.json?.holdings?.afterRerun?.QUALIFIED === 5, JSON.stringify(a.json?.holdings?.afterRerun));
  expect('1.tracked-registry', a.json?.path?.trackedRegistry?.mappings === 96 && a.json?.path?.trackedRegistry?.distinctIsins === 48);
  expect('1.legacy-rerun-equals-tracked', a.json?.path?.rerunLegacyMaster?.equalsTrackedRegistry === true && a.json?.path?.rerunLegacyMaster?.qualified === 96);
  expect('1.rerun-today', a.json?.path?.rerunMasterOfToday?.counts?.QUALIFIED === 4680);
  expect('1.nothing-written', a.json?.identityAssigned === 'NONE' && a.json?.registryWritten === 'NONE');
  const gap = a.json?.holdings?.missingP7Mapping;
  expect('1.gap-breakdown', gap?.holdings === 4 && gap?.isinAbsentFromRegistry === 3 && gap?.isinAndExchangeInRegistryUnderAnotherCompanyId === 1 && gap?.withACashEquitySourceRowOnTheExchange === 4 && gap?.qualifiedAtRuntimeWithTheRerunRegistry === 4, JSON.stringify(gap));

  /* 2. Sanitized output: no symbol, ISIN, name, company id, provider id or path. */
  const forbidden = [...ROWS.flatMap((r) => [r.symbol, r.isin, r.name]), 'EQ_RELIANCE_IN', 'EQ_LTM_IN', 'EQ_LTIM_IN', work, repoRoot, 'synthetic.csv'];
  const leaks = forbidden.filter((needle) => a.stdout.includes(needle) || a.stderr.includes(needle));
  expect('2.no-identifiers', leaks.length === 0, `${leaks.length} forbidden value(s) found`);
  expect('2.no-isin-pattern', !/\bIN[A-Z0-9]{10}\b/.test(a.stdout) && !/\bEQ_[A-Z0-9-]+_IN\b/.test(a.stdout) && !/ISIN:[A-Z0-9]/.test(a.stdout));
  expect('2.stderr-empty', a.stderr === '');

  /* 3. Deterministic: a second run prints the same bytes. */
  const b = run(base);
  expect('3.deterministic', b.stdout === a.stdout);

  /* 4. Labels do not follow the file: the same rows in reverse order give the same rows. */
  const reversedFile = path.join(work, 'synthetic-reversed.csv');
  const reversedText = csvOf([...ROWS].reverse());
  writeFileSync(reversedFile, reversedText);
  const c = run(['--csv', reversedFile, '--ipd-root', repoRoot, '--expected-csv-sha256', sha256(Buffer.from(reversedText, 'utf8'))], ['--permission', '--allow-fs-read=*']);
  expect('4.order-independent', c.status === 0 && JSON.stringify(rowLines(c.stdout)) === JSON.stringify(rowLines(a.stdout)));
  expect('4.runs-under-the-permission-model', c.status === 0 && c.json?.result === 'ANALYSED');

  /* 5. Stops. Each stops before any holding is classified. */
  const wrongCsv = run(['--csv', csvFile, '--ipd-root', repoRoot]);
  expect('5.csv-digest', wrongCsv.status === 2 && /\[STOP\] CSV_SHA256_NOT_EXPECTED/.test(wrongCsv.stdout) && rowLines(wrongCsv.stdout).length === 0);
  const wrongSource = run([...base, '--expected-source-sha256', '0'.repeat(64)]);
  expect('5.source-digest', wrongSource.status === 2 && /\[STOP\] SOURCE_MASTER_SHA256_NOT_EXPECTED/.test(wrongSource.stdout) && rowLines(wrongSource.stdout).length === 0);
  const noRoot = run(['--csv', csvFile, '--ipd-root', path.join(work, 'absent'), '--expected-csv-sha256', digest]);
  expect('5.ipd-root', noRoot.status === 2 && /\[STOP\] IPD_ROOT_NOT_FOUND/.test(noRoot.stdout));
  const noCsv = run(['--csv', path.join(work, 'absent.csv'), '--ipd-root', repoRoot]);
  expect('5.csv-missing', noCsv.status === 2 && /\[STOP\] CSV_FILE_NOT_FOUND/.test(noCsv.stdout) && !noCsv.stdout.includes(work));
  const unknown = run([...base, '--write']);
  expect('5.unknown-argument', unknown.status === 2 && /\[STOP\] ARGUMENT_UNKNOWN/.test(unknown.stdout));

  /* 6. The diagnostic's own source: four built-ins, no write call, no process start, no network. */
  const source = readFileSync(tool, 'utf8');
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const imports = [...code.matchAll(/^import\s[^;]*?from\s+'([^']+)';/gm)].map((m) => m[1]).sort();
  expect('6.imports', JSON.stringify(imports) === JSON.stringify(['node:crypto', 'node:fs', 'node:path', 'node:url']), imports.join(','));
  expect('6.no-write-call', !/\b(writeFile|writeFileSync|appendFile|appendFileSync|createWriteStream|mkdir|mkdirSync|rm|rmSync|unlink|unlinkSync|rename|renameSync|copyFile|copyFileSync|truncate|chmod|utimes)\s*\(/.test(code));
  expect('6.read-flag-only', [...code.matchAll(/openSync\(([^)]*)\)/g)].every((m) => /,\s*'r'$/.test(m[1].trim())));
  expect('6.no-process-or-network', !/child_process|node:net|node:http|node:https|node:dgram|node:worker_threads|node:sqlite|better-sqlite3|\bfetch\s*\(|\bexec(Sync|File)?\s*\(|\bspawn(Sync)?\s*\(/.test(code));
  expect('6.never-loads-the-generator-runner', !/dhan-p7-qualify|dhan_local_daemon\.js'/.test(code));
} finally {
  rmSync(work, { recursive: true, force: true });
}
process.stdout.write(`\nself-test: ${passed} passed, ${failed} failed\n`);
process.exitCode = failed === 0 ? 0 : 1;
