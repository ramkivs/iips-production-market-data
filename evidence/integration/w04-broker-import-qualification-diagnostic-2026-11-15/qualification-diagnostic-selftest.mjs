#!/usr/bin/env node
/**
 * Self-test of the broker import qualification diagnostic. SYNTHETIC INPUTS ONLY.
 *
 * It writes a synthetic CSV and synthetic captures into a temporary directory of the operating
 * system, runs the diagnostic against THIS checkout (which must be built: `npm run build`), and
 * checks the results. The rows use issuer facts of the tracked P04 master and P7 manifest
 * (symbol, ISIN, exchange); quantities and prices are invented and the captures are hand-built.
 * Nothing here is a holding of anyone, and nothing here says anything about revision 1.
 *
 * The self-test may write (to the temporary directory) and may start a child process (the
 * diagnostic). The diagnostic itself may do neither; scenario 9 checks its source for that.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');
const tool = path.join(here, 'w04-broker-import-qualification-diagnostic.mjs');
const sha256 = (data) => createHash('sha256').update(data).digest('hex');

/* SYNTHETIC rows. Issuer facts from the tracked master; one is in the P7 manifest, three are not. */
const ROWS = [
  { name: 'Reliance Industries', symbol: 'RELIANCE', isin: 'INE002A01018', exchange: 'NSE', securityId: 'ISIN:INE002A01018:EQ' },
  { name: 'Bajaj Finance', symbol: 'BAJFINANCE', isin: 'INE296A01032', exchange: 'NSE', securityId: null },
  { name: 'Havells India', symbol: 'HAVELLS', isin: 'INE176B01034', exchange: 'NSE', securityId: null },
  { name: 'Pidilite Industries', symbol: 'PIDILITIND', isin: 'INE318A01026', exchange: 'BSE', securityId: null },
];
const csvText = ['Security Name,Trading Symbol,ISIN,Exchange,Quantity,Average Buy Price,Last Traded Price',
  ...ROWS.map((r, i) => `${r.name},${r.symbol},${r.isin},${r.exchange},${i + 1},100,110`)].join('\r\n') + '\r\n';

function capture(holdings) {
  return JSON.stringify({
    schema: 'iips.w11-dep1.owner-bound-portfolio-capture.exact/v1',
    outcome: 'CONSISTENT_CAPTURE',
    synthetic: true,
    reads: [{ operation: 'portfolio.get', wireResult: { portfolioId: 'SYNTHETIC', revision: 1, holdingsCount: holdings.length, holdings } }],
  });
}
const stored = (row, identity) => ({
  symbol: row.symbol,
  identityStatus: 'RESOLVED',
  resolutionDisposition: 'CANONICAL_P04',
  securityIdentity: identity ? { securityId: identity, isin: identity.split(':')[1], series: identity.split(':')[2] } : null,
});

const work = mkdtempSync(path.join(tmpdir(), 'w04-qualification-diagnostic-'));
let failed = 0;
let passed = 0;
function expect(id, ok, detail = '') {
  if (ok) passed += 1;
  else failed += 1;
  process.stdout.write(`[${ok ? 'PASS' : 'FAIL'}] ${id}${ok || !detail ? '' : `: ${detail}`}\n`);
}
function run(args) {
  const out = spawnSync(process.execPath, [tool, ...args], { encoding: 'utf8' });
  const result = (out.stdout.match(/^RESULT: (.+)$/m) ?? [])[1] ?? null;
  const jsonLine = (out.stdout.match(/^W04_QUALIFICATION_DIAGNOSTIC_RESULT_JSON: (.+)$/m) ?? [])[1];
  return { stdout: out.stdout, stderr: out.stderr, status: out.status, result, json: jsonLine ? JSON.parse(jsonLine) : null };
}
/** Size and SHA-256 of every tracked-area file the diagnostic is pointed at. */
function fingerprint(dir) {
  const acc = [];
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else acc.push(`${path.relative(dir, full)}:${statSync(full).size}:${statSync(full).mtimeMs}:${sha256(readFileSync(full))}`);
    }
  };
  walk(dir);
  return sha256(acc.sort().join('\n'));
}

try {
  const csvFile = path.join(work, 'synthetic.csv');
  writeFileSync(csvFile, csvText);
  const csvDigest = sha256(Buffer.from(csvText, 'utf8'));
  const writeCapture = (name, holdings) => {
    const dir = path.join(work, name, 'LOCAL-ONLY-DO-NOT-PUBLISH');
    mkdirSync(dir, { recursive: true });
    const text = capture(holdings);
    writeFileSync(path.join(dir, 'exact-owner-bound-portfolio-capture.json'), text);
    return { dir: path.join(work, name), digest: sha256(Buffer.from(text, 'utf8')) };
  };
  const matching = writeCapture('matching', ROWS.map((r) => stored(r, r.securityId)));
  /* A stored state the present sources do not produce: an identity on an unmapped holding, none on the mapped one. */
  const differing = writeCapture('differing', ROWS.map((r, i) => stored(r, i === 1 ? 'ISIN:INE296A01032:EQ' : null)));
  const base = ['--csv', csvFile, '--ipd-root', repoRoot, '--expected-csv-sha256', csvDigest];

  const before = [fingerprint(path.join(repoRoot, 'evidence', 'dhan-p7')), fingerprint(path.join(repoRoot, 'dist', 'src', 'identity')), fingerprint(work)];

  const s1 = run(base);
  expect('1 counts only: result', s1.result === 'COUNTS_ONLY_NO_CAPTURE' && s1.status === 0, `${s1.result} ${s1.status}\n${s1.stdout}`);
  expect('1 counts only: outcome', JSON.stringify(s1.json?.qualification?.outcome) === JSON.stringify({ QUALIFIED: 1, 'UNRESOLVED:MISSING_P7_MAPPING': 3 }), JSON.stringify(s1.json?.qualification?.outcome));
  expect('1 counts only: gate', JSON.stringify(s1.json?.qualification?.companyGate) === JSON.stringify({ RESOLVED: 4 }));
  expect('1 counts only: per exchange', s1.json?.qualification?.outcomePerExchange?.['BSE UNRESOLVED:MISSING_P7_MAPPING'] === 1 && s1.json?.qualification?.outcomePerExchange?.['NSE QUALIFIED'] === 1);
  expect('1 sources equal the reviewed versions', s1.json?.checkout?.sources?.equalReviewed === 14 && s1.json?.checkout?.sources?.different === 0, JSON.stringify(s1.json?.checkout?.sources));
  expect('1 manifest is the tracked one', s1.json?.checkout?.manifest?.equalsRecorded === true && s1.json?.checkout?.manifest?.qualifiedMappings === 96 && s1.json?.checkout?.manifest?.distinctIsins === 48);
  expect('1 compiled modules are self-contained', s1.json?.checkout?.compiled?.modules === 11 && s1.json?.checkout?.compiled?.importsOutsideTheSet.length === 0, JSON.stringify(s1.json?.checkout?.compiled));
  expect('1 override is reported', /\[WARN\] csv\.override/.test(s1.stdout) && s1.json?.recordedInputs?.csv === false);
  expect('1 no identity is assigned', s1.json?.identityAssigned === 'NONE' && s1.json?.storedStateComparison === 'NOT_PERFORMED');

  const s2 = run([...base, '--capture-dir', matching.dir, '--expected-capture-sha256', matching.digest]);
  expect('2 matching capture: REPRODUCES_STORED_STATE', s2.result === 'REPRODUCES_STORED_STATE' && s2.status === 0, `${s2.result}\n${s2.stdout}`);
  expect('2 matching capture: table', JSON.stringify(s2.json?.storedStateComparison?.table) === JSON.stringify({ 'STORED_NULL -> UNRESOLVED:MISSING_P7_MAPPING': 3, 'STORED_OBJECT -> QUALIFIED': 1 }), JSON.stringify(s2.json?.storedStateComparison?.table));
  expect('2 matching capture: same security identifier', s2.json?.storedStateComparison?.storedObjectsWithTheSameSecurityIdToday === 1);

  const s3 = run([...base, '--capture-dir', differing.dir, '--expected-capture-sha256', differing.digest]);
  expect('3 differing capture: DIFFERS_FROM_STORED_STATE', s3.result === 'DIFFERS_FROM_STORED_STATE' && s3.status === 1, `${s3.result}\n${s3.stdout}`);
  expect('3 differing capture: table', s3.json?.storedStateComparison?.table?.['STORED_OBJECT -> UNRESOLVED:MISSING_P7_MAPPING'] === 1 && s3.json?.storedStateComparison?.table?.['STORED_NULL -> QUALIFIED'] === 1);

  const s4 = run(['--csv', csvFile, '--ipd-root', repoRoot]);
  expect('4 a CSV that is not the recorded one stops before anything is examined', s4.result === 'INCONCLUSIVE' && s4.status === 2 && /\[STOP\] CSV_SHA256_NOT_EXPECTED/.test(s4.stdout));

  const s5 = run(['--csv', csvFile, '--ipd-root', work, '--expected-csv-sha256', csvDigest]);
  expect('5 a directory without compiled code stops', s5.result === 'INCONCLUSIVE' && /\[STOP\] COMPILED_MODULE_NOT_FOUND/.test(s5.stdout), s5.stdout);

  const s6 = run([...base, '--capture-dir', matching.dir]);
  expect('6 a capture that is not the expected one stops', s6.result === 'INCONCLUSIVE' && /NO_CAPTURE_WITH_EXPECTED_SHA256/.test(s6.stdout));

  const s7 = run([...base, '--server-cwd', repoRoot]);
  expect('7 server working directory with the same manifest', s7.json?.checkout?.serverCwdManifest?.present === true && s7.json?.checkout?.serverCwdManifest?.equalsCheckoutManifest === true);
  const s7b = run([...base, '--server-cwd', work]);
  expect('7 server working directory without a manifest', s7b.json?.checkout?.serverCwdManifest?.present === false && s7b.result === 'COUNTS_ONLY_NO_CAPTURE');

  const everything = [s1, s2, s3, s4, s5, s6, s7, s7b].map((s) => s.stdout + s.stderr).join('\n');
  const forbidden = [...ROWS.flatMap((r) => [r.symbol, r.isin, r.name]), 'EQ_RELIANCE_IN', work, repoRoot, 'synthetic.csv', 'ISIN:'];
  const leaked = forbidden.filter((value) => everything.includes(value));
  expect('8 sanitized output: no symbol, ISIN, name, company id, security id, path or file name', leaked.length === 0, `${leaked.length} forbidden value(s) present`);

  const source = readFileSync(tool, 'utf8');
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const writeApis = ['writeFile', 'appendFile', 'mkdir', 'rmSync', 'rmdir', 'unlink', 'rename', 'copyFile', 'truncate', 'chmod', 'utimes', 'symlink', 'createWriteStream', 'child_process', 'node:net', 'node:http', 'node:https', 'node:dgram', 'node:sqlite', 'node:worker_threads', 'fetch('];
  const used = writeApis.filter((api) => code.includes(api));
  expect('9 the diagnostic uses no write, process, network or database API', used.length === 0, used.join(', '));
  const imports = [...code.matchAll(/from '([^']+)'/g)].map((m) => m[1]).sort();
  expect('9 the diagnostic imports only crypto, fs, path and url', JSON.stringify(imports) === JSON.stringify(['node:crypto', 'node:fs', 'node:path', 'node:url']), imports.join(', '));
  const opens = [...code.matchAll(/openSync\(([^)]*)\)/g)].map((m) => m[1]);
  expect('9 every open is read-only', opens.length > 0 && opens.every((args) => /,\s*'r'$/.test(args.trim())), opens.join(' | '));

  const after = [fingerprint(path.join(repoRoot, 'evidence', 'dhan-p7')), fingerprint(path.join(repoRoot, 'dist', 'src', 'identity')), fingerprint(work)];
  expect('10 the manifest, the compiled code and the inputs are byte-identical and untouched after eight runs', JSON.stringify(before) === JSON.stringify(after));
} finally {
  rmSync(work, { recursive: true, force: true });
}

process.stdout.write(`\nscenarios: ${passed} passed, ${failed} failed (synthetic inputs only)\n`);
process.stdout.write(failed === 0 ? 'SELF-TEST PASSED\n' : 'SELF-TEST FAILED\n');
process.exitCode = failed === 0 ? 0 : 1;
