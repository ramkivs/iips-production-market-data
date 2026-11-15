// W04 — which revision does IPD `portfolio.get` read?
//
// SYNTHETIC ONLY. An in-memory SQLite database, a made-up owner and made-up holdings,
// driven through the unmodified compiled IPD store and the unmodified IPD connection
// handler over a temporary local socket. It reads no real database, no portfolio, no
// capture and no host state. It says nothing about any actual holding.
//
// Run from the repository root after `npm run build:tsc`:
//   node evidence/integration/w04-identities-endpoint-revision-binding-2026-11-13/ipd-portfolio-get-revision-probe.mjs
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { createConnection, createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const dist = (p) => new URL(`../../../dist/src/${p}`, import.meta.url).href;
const { ensureMigrations } = await import(dist('persistence/migration_ledger.js'));
const { GATE3_MIGRATIONS } = await import(dist('ipc/entrypoint.js'));
const { DurablePortfolioStore } = await import(dist('persistence/portfolio_store.js'));
const { mapManualRequest } = await import(dist('persistence/manualPersonalPortfolio.js'));
const { createConnectionHandler } = await import(dist('ipc/dispatch.js'));
const protocol = await import(dist('ipc/protocol.js'));

const line = (label, value) => console.log(`${label}: ${JSON.stringify(value)}`);
const owner = { canonicalOwnerId: 'synthetic-owner', tenantId: 'synthetic-tenant' };
const id = 'DEFAULT_PORTFOLIO';
const h = (symbol, quantity) => ({ symbol, quantity, averageBuyPrice: 1, currentPrice: 1, active: true });

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON');
ensureMigrations(db, GATE3_MIGRATIONS);
const store = new DurablePortfolioStore(db, undefined, { revisionCap: 1000 });
const rowsOf = (revision) => createHash('sha256')
  .update(JSON.stringify(db.prepare('SELECT * FROM portfolio_holdings WHERE revision = ? ORDER BY holding_key').all(revision)))
  .digest('hex');
const revisionRowOf = (revision) => createHash('sha256')
  .update(JSON.stringify(db.prepare('SELECT * FROM portfolio_revisions WHERE revision = ?').all(revision)))
  .digest('hex');

console.log('== 1. Operation set and store signatures');
line('IPC read operations', protocol.IPC_READ_OPERATIONS);
line('IPC write operations', protocol.IPC_WRITE_OPERATIONS);
line('any operation naming a revision or a history read of holdings', protocol.IPC_OPERATIONS.filter((op) => /revision\.|holdingsFor|snapshot|history\.get/i.test(op)));
line('declared parameters of store.get', store.get.length);
line('declared parameters of store.revisions', store.revisions.length);

console.log('== 2. Store: what `get` returns as the portfolio moves on');
store.create(owner, id, mapManualRequest([h('SYNA', 1), h('SYNB', 1)]));
const at1 = store.get(owner, id);
const rev1Rows = rowsOf(1);
const rev1Row = revisionRowOf(1);
line('after create: get.revision, holdings', [at1.revision, at1.holdings.length]);
store.save(owner, id, mapManualRequest([h('SYNC', 1), h('SYND', 1), h('SYNE', 1)], 'REPLACE'), 1);
const at2 = store.get(owner, id);
line('after one save: get.revision, holdings', [at2.revision, at2.holdings.length]);
line('get.provenanceDigest changed with the revision', at1.provenanceDigest !== at2.provenanceDigest);
line('get still returns the revision-1 symbols', at2.holdings.map((x) => x.symbol).join(',') === at1.holdings.map((x) => x.symbol).join(','));
const history = store.revisions(owner, id);
line('revisions: revision numbers', history.map((e) => e.revision));
line('revisions: keys of one entry', Object.keys(history[0]));
line('revisions: entry 1 provenanceDigest equals the digest get returned at revision 1', history[0].provenanceDigest === at1.provenanceDigest);
line('stored holding rows of revision 1 unchanged by the later write', rowsOf(1) === rev1Rows);
line('stored revision row 1 unchanged by the later write', revisionRowOf(1) === rev1Row);

// Protocol v1 only: it is the only version the IRR client sends (`IPC_PROTOCOL_VERSION = 1`).
console.log('== 3. Wire (protocol v1): a request that names revision 1 while the portfolio is at revision 2');
const now = new Date().toISOString();
db.prepare("INSERT INTO local_principal_bindings VALUES ('b','synthetic','ACTIVE',?,?,NULL)").run(now, now);
db.prepare("INSERT INTO local_principal_memberships VALUES ('m','b',?,?,'ACTIVE',?,?,NULL)").run(owner.tenantId, owner.canonicalOwnerId, now, now);
const dir = mkdtempSync(join(tmpdir(), 'w04-ipd-'));
const path = join(dir, 'ipc.sock');
const run = async (env, frames) => {
  const server = createServer({ allowHalfOpen: true }, (socket) => createConnectionHandler(db, { env })(socket));
  await new Promise((resolve) => server.listen(path, resolve));
  const call = (frame) => new Promise((resolve, reject) => {
    const socket = createConnection(path);
    const chunks = [];
    socket.on('error', reject);
    socket.on('data', (c) => chunks.push(c));
    socket.on('end', () => {
      const b = Buffer.concat(chunks);
      resolve(b.length ? JSON.parse(b.subarray(4).toString()) : { zeroBytes: true });
      socket.destroy();
    });
    socket.on('connect', () => {
      const body = Buffer.from(JSON.stringify(frame));
      const prefix = Buffer.alloc(4);
      prefix.writeUInt32BE(body.length);
      socket.end(Buffer.concat([prefix, body]));
    });
  });
  const out = [];
  for (const frame of frames) out.push(await call(frame));
  await new Promise((resolve) => server.close(resolve));
  return out;
};
const summary = (r) => r.zeroBytes ? 'zero bytes, connection closed (refused)' : r.ok
  ? { ok: true, revision: r.result.revision, holdings: r.result.holdings?.length, provenanceIsRevision1: r.result.provenanceDigest === at1.provenanceDigest, provenanceIsRevision2: r.result.provenanceDigest === at2.provenanceDigest }
  : { ok: false, outcome: r.outcome };
const frames = [
  { v: 1, op: 'portfolio.get', payload: { portfolioId: id } },
  { v: 1, op: 'portfolio.get', payload: { portfolioId: id, revision: 1 } },
  { v: 1, op: 'portfolio.get', revision: 1, payload: { portfolioId: id } },
];
const labels = [
  'v1 get {portfolioId}',
  'v1 get {portfolioId, revision: 1}',
  'v1 get with an envelope key revision: 1',
];
for (const [mode, env] of [['personal-use path on', { IIPS_LOCAL_PERSONAL_USE: '1' }], ['personal-use path off', {}]]) {
  const results = await run(env, frames);
  results.forEach((r, i) => line(`${mode} | ${labels[i]}`, summary(r)));
}
rmSync(dir, { recursive: true, force: true });

console.log('== 4. Revision numbers only move forward; a restore repeats a provenance digest under a new number');
store.delete(owner, id, 2);
let unavailable = false;
try { store.get(owner, id); } catch { unavailable = true; }
line('after delete: get refuses', unavailable);
const restored = store.restore(owner, id, 2, 'synthetic-key');
const at4 = store.get(owner, id);
line('after restore: get.revision', at4.revision);
line('after restore: get.provenanceDigest equals the revision-2 digest', at4.provenanceDigest === at2.provenanceDigest);
line('revision numbers in history', store.revisions(owner, id).map((e) => `${e.revision}:${e.operation}`));
line('restore receipt revision', restored.revision);
line('stored holding rows of revision 1 still unchanged', rowsOf(1) === rev1Rows);
db.close();
