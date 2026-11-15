// W04 — the same route, driven through IRR's REAL composed HTTP server.
//
// SYNTHETIC ONLY. Not IPD, not host data, not evidence about any actual portfolio.
//   - HTTP server:   the exported `server` of frontend/server/executive-transport.ts (the real route table),
//                    listening on an ephemeral loopback port.
//   - IPC:           IRR's real `callIpc` client over a local socket.
//   - IPC peer:      IRR's own tracked test fixture `startSyntheticPeer`
//                    (frontend/server/user-portfolio/capture/testing/syntheticIpcPeer.ts). It serves a
//                    fabricated two-holding portfolio at revision 1 and answers read operations only.
//   - Identity files: a temporary copy of IRR's tracked synthetic identity fixture.
//
// Run from `<IRR checkout>/frontend`, passing the checkout root:
//   ./node_modules/.bin/tsx <path>/irr-composed-server-probe.ts <IRR checkout root>
import { cpSync, mkdirSync, mkdtempSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.argv[2]!;
type Json = Record<string, unknown>;

function line(label: string, value: unknown): void {
  console.log(`${label}: ${JSON.stringify(value)}`);
}
function tally(identities: readonly Json[]): Json {
  const counts: Record<string, number> = {};
  for (const identity of identities) {
    const key = `${String(identity.state)} / ${String(identity.reason)}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

async function main(): Promise<void> {
  const work = mkdtempSync(join(tmpdir(), 'w04-composed-'));
  const identityDir = join(work, 'data', 'investment', 'identity');
  mkdirSync(identityDir, { recursive: true });
  for (const file of ['eligible-roster.json', 'listing-map.json', 'corporate-actions.json']) {
    cpSync(join(root, 'iips-platform/tests/investment/fixtures/identity', file), join(identityDir, file));
  }
  const socketPath = join(work, 'synthetic-peer.sock');

  // Server-owned settings, set before the server module is loaded.
  process.env.NODE_ENV = 'test';
  process.env.IIPS_DATA_DIR = join(work, 'data');
  process.env.IIPS_G3_IPC_BINDING_PROVISIONED = 'true';
  process.env.IIPS_G2_IPC_ENDPOINT = socketPath;
  delete process.env.IIPS_LOCAL_PERSONAL_USE;

  const peerModule = await import(join(root, 'frontend/server/user-portfolio/capture/testing/syntheticIpcPeer.ts'));
  const peer = await peerModule.startSyntheticPeer(socketPath, 'CONSISTENT');
  const portfolioId: string = peerModule.SYNTHETIC_PORTFOLIO_ID;

  const { server, EXEC_TRANSPORT_BIND_HOST } = await import(join(root, 'frontend/server/executive-transport.ts'));
  await new Promise<void>((resolve) => server.listen(0, EXEC_TRANSPORT_BIND_HOST, () => resolve()));
  const origin = `http://${EXEC_TRANSPORT_BIND_HOST}:${String((server.address() as AddressInfo).port)}`;
  const call = async (path: string, method = 'GET') => {
    const before = peer.operations.length;
    const response = await fetch(`${origin}${path}`, { method });
    const text = await response.text();
    let json: Json | null = null;
    try { json = text === '' ? null : (JSON.parse(text) as Json); } catch { json = null; }
    return { status: response.status, text, json, headers: response.headers, ipc: peer.operations.slice(before) };
  };

  const id = encodeURIComponent(portfolioId);
  line('bind host constant', EXEC_TRANSPORT_BIND_HOST);

  console.log('== A. GET /api/user-portfolios/<id> (existing revision-bearing read)');
  const detail = await call(`/api/user-portfolios/${id}`);
  const portfolio = (detail.json?.portfolio ?? {}) as Json;
  line('status', detail.status);
  line('IPC operations', detail.ipc);
  line('revision', portfolio.revision);
  line('provenanceDigest present, length', [typeof portfolio.provenanceDigest === 'string', String(portfolio.provenanceDigest ?? '').length]);
  line('holdings', (portfolio.holdings as Json[]).length);
  line('holdings with a securityIdentity object', (portfolio.holdings as Json[]).filter((h) => h.securityIdentity !== null && typeof h.securityIdentity === 'object').length);
  line('holdings with securityIdentity null', (portfolio.holdings as Json[]).filter((h) => h.securityIdentity === null).length);

  console.log('== B. GET /api/investment/portfolio/<id>/identities');
  const identities = await call(`/api/investment/portfolio/${id}/identities`);
  line('status', identities.status);
  line('IPC operations', identities.ipc);
  line('top-level keys', Object.keys(identities.json ?? {}));
  line('count', identities.json?.count);
  line('tally by state / reason (computed by the probe)', tally((identities.json?.identities ?? []) as Json[]));
  line('directory keys', Object.keys((identities.json?.directory ?? {}) as Json));
  line('rosterDataClass', ((identities.json?.directory ?? {}) as Json).rosterDataClass);
  line('body mentions revision or provenance', /revision|provenance/i.test(identities.text));
  line('body contains the provenance digest value served upstream', identities.text.includes(String(portfolio.provenanceDigest)));
  line('Access-Control-Allow-Origin header', identities.headers.get('access-control-allow-origin'));
  line('Cache-Control header', identities.headers.get('cache-control'));

  console.log('== C. The same route with a revision named in the query');
  const named = await call(`/api/investment/portfolio/${id}/identities?revision=999`);
  line('status', named.status);
  line('IPC operations', named.ipc);
  line('body byte-identical to B', named.text === identities.text);

  console.log('== D. GET /api/user-portfolios/<id>/revisions');
  const revisions = await call(`/api/user-portfolios/${id}/revisions`);
  line('status', revisions.status);
  line('IPC operations', revisions.ipc);
  line('entries', ((revisions.json?.revisions ?? []) as Json[]).length);
  line('entry keys', Object.keys((((revisions.json?.revisions ?? []) as Json[])[0] ?? {}) as Json));
  line('entry for the detail revision carries the same provenanceDigest', ((revisions.json?.revisions ?? []) as Json[]).some((e) => e.revision === portfolio.revision && e.provenanceDigest === portfolio.provenanceDigest));

  console.log('== E. Methods');
  for (const method of ['HEAD', 'POST', 'PUT', 'DELETE']) {
    const result = await call(`/api/investment/portfolio/${id}/identities`, method);
    line(`${method} identities: status, allow, IPC operations`, [result.status, result.headers.get('allow'), result.ipc]);
  }

  console.log('== F. Every IPC operation the peer received during this probe');
  line('operations', peer.operations);
  line('any operation other than portfolio.list / portfolio.get / portfolio.revisions', peer.operations.some((op: string) => !['portfolio.list', 'portfolio.get', 'portfolio.revisions'].includes(op)));

  await new Promise<void>((resolve) => server.close(() => resolve()));
  await peer.close();
}

main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
