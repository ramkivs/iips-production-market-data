// W04 — the identities route of IRR's REAL server, answering from provisioned identity files.
//
// What is real: the three identity files (exported from the governed P04 master, accepted by the IRR
// loader gate, installed by the provisioning tool into a temporary data root), IRR's composed HTTP
// server, IRR's route handler, IRR's loader and resolver.
//
// What is NOT real: the portfolio. Part 1 uses IRR's tracked synthetic IPC peer. Part 2 feeds the
// real route handler probe holdings that carry identifiers of the first exported master record.
// They are probe inputs, not provisioned data, and not a statement about any actual portfolio.
// No ISIN, symbol, issuer or name is printed.
//
// Run from `<IRR checkout>/frontend`:
//   ./node_modules/.bin/tsx <path>/irr-provisioned-endpoint-probe.ts <IRR root> <staging dir> <IPD root>
// `<staging dir>` must hold an export that passed `validate` against the same IRR checkout.
import { execFile, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const [root, stagingDir, ipdRoot] = process.argv.slice(2) as [string, string, string];
const cli = join(ipdRoot, 'scripts', 'provision-irr-identity-sources.mjs');
type Json = Record<string, unknown>;

function line(label: string, value: unknown): void {
  console.log(`${label}: ${JSON.stringify(value)}`);
}
function tally(values: readonly string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => (a < b ? -1 : 1)));
}
/** CLI output with every absolute path removed, so the transcript carries no directory name. */
function sanitized(text: string): string[] {
  return text
    .split('\n')
    .filter((entry) => entry.length > 0)
    .map((entry) => entry.replace(/(: )(\/|[A-Za-z]:\\).*$/, '$1<path>'));
}

async function main(): Promise<void> {
  const work = mkdtempSync(join(tmpdir(), 'w04-provisioned-'));
  const dataRoot = join(work, 'iips-data');
  mkdirSync(dataRoot);
  const socketPath = join(work, 'synthetic-peer.sock');
  const gate = JSON.parse(readFileSync(join(stagingDir, 'irr-loader-gate.json'), 'utf8')) as Json;
  const gatedRosterVersion = ((gate.loaderOutput as Json).versions as Json).rosterVersion;
  const report = JSON.parse(readFileSync(join(stagingDir, 'provisioning-report.json'), 'utf8')) as Json;

  process.env.NODE_ENV = 'test';
  process.env.IIPS_G3_IPC_BINDING_PROVISIONED = 'true';
  process.env.IIPS_G2_IPC_ENDPOINT = socketPath;
  process.env.IIPS_DATA_DIR = dataRoot;
  delete process.env.IIPS_LOCAL_PERSONAL_USE;
  delete process.env.IIPS_NP04_DATABASE_PATH;
  delete process.env.IIPS_REPORTS_OWNER_PATH;

  const peerPath = join(root, 'frontend/server/user-portfolio/capture/testing/syntheticIpcPeer.ts');
  const peerModule = existsSync(peerPath) ? await import(pathToFileURL(peerPath).href) : null;
  const peer = peerModule === null ? null : await peerModule.startSyntheticPeer(socketPath, 'CONSISTENT');
  const syntheticId: string = peerModule === null ? 'PROBE-PORTFOLIO' : peerModule.SYNTHETIC_PORTFOLIO_ID;

  const { server, EXEC_TRANSPORT_BIND_HOST } = await import(pathToFileURL(join(root, 'frontend/server/executive-transport.ts')).href);
  await new Promise<void>((done) => server.listen(0, EXEC_TRANSPORT_BIND_HOST, () => done()));
  const origin = `http://${EXEC_TRANSPORT_BIND_HOST}:${String((server.address() as AddressInfo).port)}`;
  const identitiesUrl = (base: string, id: string) => `${base}/api/investment/portfolio/${encodeURIComponent(id)}/identities`;
  const get = async (url: string) => {
    const response = await fetch(url);
    const text = await response.text();
    let json: Json | null = null;
    try { json = JSON.parse(text) as Json; } catch { json = null; }
    return { status: response.status, json };
  };
  const runCli = promisify(execFile);

  console.log('== Part 1. IRR composed server');
  console.log('-- 1a. Before installation: the data root exists, the identity directory does not');
  const before = await get(identitiesUrl(origin, syntheticId));
  line('status, error', [before.status, before.json?.error ?? null]);
  line('issues [file, code]', ((before.json?.issues ?? []) as Json[]).map((issue) => [issue.file, issue.code]));

  console.log('-- 1b. Provisioning tool: install into the data root (server still running)');
  const installed = spawnSync(process.execPath, [cli, 'install', '--staging', stagingDir, '--data-dir', dataRoot], { encoding: 'utf8' });
  line('install exit code', installed.status);
  for (const entry of sanitized(installed.stdout)) console.log(`   ${entry}`);

  console.log('-- 1c. After installation, same server process, no restart');
  const after = await get(identitiesUrl(origin, syntheticId));
  const directory = (after.json?.directory ?? {}) as Json;
  const identities = (after.json?.identities ?? []) as Json[];
  line('status, body status', [after.status, after.json?.status ?? null]);
  line('holdings returned (synthetic peer)', after.json?.count ?? null);
  line('rosterDataClass', directory.rosterDataClass ?? null);
  line('rosterVersion equals the version the IRR loader gate computed for the staged files', directory.rosterVersion === gatedRosterVersion);
  line('rosterVersion', directory.rosterVersion ?? null);
  line('synthetic holdings by state/reason', tally(identities.map((identity) => `${String(identity.state)}/${String(identity.reason ?? 'NONE')}`)));
  line('IPC peer present in this checkout', peer !== null);
  if (peer === null) console.log('   (without the tracked synthetic peer no holdings can be read, so 1c and 1d cannot return 200 here)');

  console.log('-- 1d. Provisioning tool: verify-endpoint against the same server');
  try {
    const verified = await runCli(process.execPath, [cli, 'verify-endpoint', '--staging', stagingDir, '--portfolio-id', syntheticId, '--base-url', origin]);
    line('verify-endpoint exit code', 0);
    for (const entry of sanitized(verified.stdout)) console.log(`   ${entry}`);
  } catch (error) {
    line('verify-endpoint exit code', (error as { code?: number }).code ?? null);
    for (const entry of sanitized(String((error as { stdout?: string }).stdout ?? ''))) console.log(`   ${entry}`);
  }

  await new Promise<void>((done) => server.close(() => done()));
  if (peer !== null) await peer.close();

  console.log('== Part 2. IRR route handler with probe holdings (identifiers of the first exported master record)');
  const roster = JSON.parse(readFileSync(join(dataRoot, 'investment', 'identity', 'eligible-roster.json'), 'utf8')) as { securities: Json[] };
  const exportedIsin = String(roster.securities[0]!.isin);
  const withheldIsin = String(((report.withheld as Json[])[0] ?? {}).isin ?? '');
  const base = { symbol: 'PROBE', companyId: 'EQ_PROBE_IN', quantity: 1, averageBuyPrice: 1, currentPrice: 1, marketValue: 1, weightPercentage: 0, active: true, sourceBroker: 'probe', lineageDigest: '', identityStatus: 'RESOLVED', resolutionDisposition: 'CANONICAL_P04' };
  const d114 = (isin: string, series: string) => ({ securityId: `ISIN:${isin}:${series}`, isin, series, isinAuthority: 'NON_AUTHORITATIVE' });
  const firstListing = (JSON.parse(readFileSync(join(dataRoot, 'investment', 'identity', 'listing-map.json'), 'utf8')) as { entries: Json[] }).entries.find((entry) => entry.securityId === `IN:ISIN:${exportedIsin}`)!;
  const exportedSymbol = String(firstListing.symbol);
  const cases: ReadonlyArray<readonly [string, Json]> = [
    ['A. as IPD stores an unqualified holding: no ISIN, no exchange, securityIdentity null', { ...base, securityIdentity: null }],
    ['B. as IPD stores a qualified NSE holding: securityIdentity ISIN:<exported isin>:EQ, no flat ISIN', { ...base, securityIdentity: d114(exportedIsin, 'EQ') }],
    ['C. as IPD stores a qualified BSE holding: securityIdentity ISIN:<exported isin>:A, no flat ISIN', { ...base, securityIdentity: d114(exportedIsin, 'A') }],
    ['D. flat ISIN of an exported record', { ...base, isin: exportedIsin }],
    ['E. flat ISIN and exported NSE symbol, observed on NSE', { ...base, symbol: exportedSymbol, isin: exportedIsin, exchange: 'NSE' }],
    ['F. flat ISIN and the same symbol, observed on BSE', { ...base, symbol: exportedSymbol, isin: exportedIsin, exchange: 'BSE' }],
    ['G. flat ISIN observed on NSE under a symbol that is not the exported symbol', { ...base, isin: exportedIsin, exchange: 'NSE' }],
    ['H. exported NSE symbol observed on NSE, no ISIN', { ...base, symbol: exportedSymbol, exchange: 'NSE' }],
    ['I. flat ISIN of a withheld master record', { ...base, isin: withheldIsin }],
  ];
  const handlerModule = await import(pathToFileURL(join(root, 'frontend/server/investment/holding-identity-transport.ts')).href);
  const handlerServer = http.createServer((req, res) => {
    void handlerModule.handleHoldingIdentityRequest(req, res, {
      holdings: async () => cases.map(([, holding]) => holding),
      today: () => String(gate.asOf),
    });
  });
  await new Promise<void>((done) => handlerServer.listen(0, '127.0.0.1', () => done()));
  const handlerOrigin = `http://127.0.0.1:${String((handlerServer.address() as AddressInfo).port)}`;
  const answer = await get(identitiesUrl(handlerOrigin, 'PROBE-PORTFOLIO'));
  line('status, count', [answer.status, answer.json?.count ?? null]);
  line('rosterVersion equals the gated version', ((answer.json?.directory ?? {}) as Json).rosterVersion === gatedRosterVersion);
  ((answer.json?.identities ?? []) as Json[]).forEach((identity, index) => {
    line(cases[index]![0], {
      state: identity.state,
      reason: identity.reason,
      resolutionBasis: identity.resolutionBasis,
      issuerIdIsTheExportedIssuer: identity.issuerId === null ? null : identity.issuerId === firstListing.issuerId,
      securityIdIsTheExportedSecurity: identity.securityId === null ? null : identity.securityId === firstListing.securityId,
      assessable: identity.assessable,
    });
  });
  await new Promise<void>((done) => handlerServer.close(() => done()));
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
