// W04 — why the IRR identity route answers 503 IDENTITY_SOURCE_MISSING, shown on IRR's REAL composed server.
//
// SYNTHETIC ONLY. Every directory is a temporary directory created by this probe. The only identity
// content used is IRR's tracked synthetic fixture (iips-platform/tests/investment/fixtures/identity).
// Nothing here is host data, portfolio data or a statement about the Windows host.
//
//   - HTTP server: the exported `server` of frontend/server/executive-transport.ts on an ephemeral
//                  loopback port. IIPS_DATA_DIR is read by the loader on every request, so the probe
//                  changes it between requests in one process.
//   - IPC peer:    IRR's tracked `startSyntheticPeer`, when the checkout has it (main). Without it the
//                  IPC columns print "not observed".
//
// Run from `<IRR checkout>/frontend`, passing the checkout root:
//   ./node_modules/.bin/tsx <path>/irr-identity-source-missing-probe.ts <IRR checkout root>
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';

const root = process.argv[2]!;
type Json = Record<string, unknown>;
const FILES = ['eligible-roster.json', 'listing-map.json', 'corporate-actions.json'] as const;
const FIXTURE = join(root, 'iips-platform/tests/investment/fixtures/identity');
// The id IRR's own tracked Windows diagnostic uses for an absent portfolio.
const ABSENT_ID = 'PROBE-ABSENT-PORTFOLIO-DO-NOT-CREATE';

function line(label: string, value: unknown): void {
  console.log(`${label}: ${JSON.stringify(value)}`);
}

function makeRoot(work: string, name: string, files: readonly string[]): string {
  const dataRoot = join(work, name);
  const dir = join(dataRoot, 'investment', 'identity');
  mkdirSync(dir, { recursive: true });
  for (const file of files) cpSync(join(FIXTURE, file), join(dir, file));
  return dataRoot;
}

async function main(): Promise<void> {
  const work = mkdtempSync(join(tmpdir(), 'w04-idsrc-'));
  const socketPath = join(work, 'synthetic-peer.sock');

  process.env.NODE_ENV = 'test';
  process.env.IIPS_G3_IPC_BINDING_PROVISIONED = 'true';
  process.env.IIPS_G2_IPC_ENDPOINT = socketPath;
  delete process.env.IIPS_LOCAL_PERSONAL_USE;
  delete process.env.IIPS_NP04_DATABASE_PATH;
  delete process.env.IIPS_REPORTS_OWNER_PATH;

  const peerPath = join(root, 'frontend/server/user-portfolio/capture/testing/syntheticIpcPeer.ts');
  const peerModule = existsSync(peerPath) ? await import(peerPath) : null;
  const peer = peerModule === null ? null : await peerModule.startSyntheticPeer(socketPath, 'CONSISTENT');
  const syntheticId: string | null = peerModule === null ? null : peerModule.SYNTHETIC_PORTFOLIO_ID;

  const { server, EXEC_TRANSPORT_BIND_HOST } = await import(join(root, 'frontend/server/executive-transport.ts'));
  await new Promise<void>((done) => server.listen(0, EXEC_TRANSPORT_BIND_HOST, () => done()));
  const origin = `http://${EXEC_TRANSPORT_BIND_HOST}:${String((server.address() as AddressInfo).port)}`;

  const call = async (path: string) => {
    const before = peer === null ? 0 : peer.operations.length;
    const response = await fetch(`${origin}${path}`);
    const text = await response.text();
    let json: Json | null = null;
    try { json = text === '' ? null : (JSON.parse(text) as Json); } catch { json = null; }
    const ipc = peer === null ? 'not observed' : peer.operations.slice(before);
    return { status: response.status, json, ipc };
  };
  const identities = (id: string) => call(`/api/investment/portfolio/${encodeURIComponent(id)}/identities`);

  /** Prints the sanitized shape of one identities answer. `expectedDir` is compared, never printed. */
  const report = async (id: string, expectedDir: string | null) => {
    const answer = await identities(id);
    const issues = ((answer.json?.issues ?? []) as Json[]);
    line('status, error', [answer.status, answer.json?.error ?? null]);
    line('body keys', answer.json === null ? null : Object.keys(answer.json));
    line('issues: count', issues.length);
    line('issues: keys of one item', issues.length === 0 ? null : Object.keys(issues[0]!));
    line('issues: [file, code]', issues.map((issue) => [issue.file, issue.code]));
    line('issues: subject is an absolute path', issues.map((issue) => isAbsolute(String(issue.subject))));
    if (expectedDir !== null) {
      line('issues: subject equals the expected identity directory', issues.map((issue) => String(issue.subject) === expectedDir));
    }
    line('body names which of the three files are absent', issues.some((issue) => FILES.some((f) => f !== 'eligible-roster.json' && JSON.stringify(issue).includes(f)))
      || JSON.stringify(answer.json ?? {}).includes('missing file'));
    line('IPC operations caused', answer.ipc);
    return answer;
  };

  const readiness = await import(join(root, 'frontend/server/investment/cli/iid-readiness.ts'));
  const readinessOf = (dataRoot: string) => {
    const result = readiness.runReadinessCli(['--json', '--data-dir', dataRoot]);
    const finding = (result.report.findings as Json[]).find((f) => f.id === 'identity-files')!;
    line('readiness CLI, identity-files: reason, ownership, actionOwner', [finding.reason, finding.ownership, finding.actionOwner]);
    line('readiness CLI output contains the data directory path', String(result.text).includes(dataRoot));
  };

  console.log('== S0. Data root exists; no investment/identity directory under it');
  const s0 = join(work, 'root-empty');
  mkdirSync(s0, { recursive: true });
  process.env.IIPS_DATA_DIR = s0;
  await report(ABSENT_ID, join(resolve(s0), 'investment', 'identity'));
  line('data root still has no investment directory after the request', !existsSync(join(s0, 'investment')));
  readinessOf(s0);
  const companies = await call('/api/investment/companies?q=ab');
  line('GET /api/investment/companies?q=ab: status, error, issue codes', [companies.status, companies.json?.error ?? null, ((companies.json?.issues ?? []) as Json[]).map((i) => i.code)]);

  console.log('== S1. IIPS_DATA_DIR not set in the process');
  delete process.env.IIPS_DATA_DIR;
  const cwdDefault = join(resolve(process.cwd(), '.iips-data'), 'investment', 'identity');
  if (existsSync(cwdDefault)) {
    line('skipped', 'a .iips-data identity directory exists under the working directory');
  } else {
    await report(ABSENT_ID, cwdDefault);
    line('expected directory is <working directory>/.iips-data/investment/identity', true);
  }

  console.log('== S2. Identity directory exists; roster and listing map present; corporate-actions.json absent');
  const s2 = makeRoot(work, 'root-two-of-three', ['eligible-roster.json', 'listing-map.json']);
  process.env.IIPS_DATA_DIR = s2;
  await report(ABSENT_ID, join(resolve(s2), 'investment', 'identity'));
  readinessOf(s2);

  console.log('== S3. All three files present and valid (synthetic fixture)');
  const s3 = makeRoot(work, 'root-valid', FILES);
  process.env.IIPS_DATA_DIR = s3;
  // The synthetic peer answers `portfolio.get` with its one portfolio whatever id is asked for, so the
  // absent id is not exercised here. What this state shows is that, once the files load, the route
  // goes on to read holdings: exactly one IPC `portfolio.get`.
  if (syntheticId === null) {
    const noPeer = await identities(ABSENT_ID);
    line('no IPC peer in this checkout: status, error', [noPeer.status, noPeer.json?.error ?? null]);
  } else {
    const ok = await identities(syntheticId);
    const directory = (ok.json?.directory ?? {}) as Json;
    line('status, count', [ok.status, ok.json?.count ?? null]);
    line('rosterDataClass', directory.rosterDataClass ?? null);
    line('rosterDigest has the form sha256:<64 hex>', /^sha256:[0-9a-f]{64}$/.test(String(directory.rosterDigest)));
    line('IPC operations caused', ok.ipc);
  }
  readinessOf(s3);

  console.log('== S4. eligible-roster.json present but not JSON');
  const s4 = makeRoot(work, 'root-invalid-json', FILES);
  writeFileSync(join(s4, 'investment', 'identity', 'eligible-roster.json'), '{ not json', 'utf8');
  process.env.IIPS_DATA_DIR = s4;
  await report(ABSENT_ID, null);
  readinessOf(s4);

  console.log('== S5. eligible-roster.json present with another schemaVersion');
  const s5 = makeRoot(work, 'root-schema', FILES);
  writeFileSync(join(s5, 'investment', 'identity', 'eligible-roster.json'), JSON.stringify({ schemaVersion: 'OTHER', issuers: [], securities: [] }), 'utf8');
  process.env.IIPS_DATA_DIR = s5;
  await report(ABSENT_ID, null);

  console.log('== S6. eligible-roster.json exists but is a directory, not a file');
  const s6 = makeRoot(work, 'root-not-a-file', ['listing-map.json', 'corporate-actions.json']);
  mkdirSync(join(s6, 'investment', 'identity', 'eligible-roster.json'));
  process.env.IIPS_DATA_DIR = s6;
  await report(ABSENT_ID, null);

  console.log('== S7. All three files valid, but eligible-roster.json is saved with a UTF-8 byte-order mark');
  const s7 = makeRoot(work, 'root-bom', FILES);
  const rosterPath = join(s7, 'investment', 'identity', 'eligible-roster.json');
  writeFileSync(rosterPath, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), readFileSync(join(FIXTURE, 'eligible-roster.json'))]));
  process.env.IIPS_DATA_DIR = s7;
  await report(ABSENT_ID, null);
  readinessOf(s7);

  await new Promise<void>((done) => server.close(() => done()));
  if (peer !== null) await peer.close();
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
