// PA/PO-approved read-only relationship. Disposable synthetic databases only;
// no operational provisioning or real-person holdings are accessed here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createConnection } from 'node:net';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import { createConnectionHandler } from '../src/ipc/dispatch.js';
import { parseSingleFrame } from '../src/ipc/protocol.js';
import { listenIpc, resolveEndpointTarget, settlementPolicyForEndpoint } from '../src/ipc/endpoint.js';
import { DurablePortfolioStore, ResourceUnavailableError } from '../src/persistence/portfolio_store.js';
import { BindingAbsentError, BindingInvalidError, resolveHoldingsReadContextInCurrentTransaction, resolveActiveHoldingsBinding } from '../src/persistence/binding.js';

const S1 = { canonicalOwnerId: 'ipd-owner-ramki-personal', tenantId: 'ipd-personal-local' };
const D02 = { canonicalOwnerId: 'owner-4dc756b3', tenantId: S1.tenantId };
const B = 'c5808abaffd072d6401ce63ad86c6ac0';
const M = 'd25dcc5370100b00766efc5166f65cf3';
const NOW = '2026-11-19T00:00:00.000Z';
const request = (price: number) => ({
  holdings: [{ symbol: 'SYN', companyId: 'SYN', quantity: 1, averageBuyPrice: 10,
    currentPrice: price, marketValue: price, weightPercentage: 100, active: true,
    sourceBroker: 'GENERIC', lineageDigest: 'a'.repeat(64), identityStatus: 'RESOLVED',
    resolutionDisposition: 'CANONICAL_P04' }],
  provenanceDigest: 'b'.repeat(64),
});
function seed(db: DatabaseSync) {
  db.prepare('INSERT INTO local_principal_bindings VALUES (?,?,\'ACTIVE\',?,?,NULL)')
    .run(B, 'ramki-personal-local', NOW, NOW);
  db.prepare('INSERT INTO local_principal_memberships VALUES (?,?,?,?,\'ACTIVE\',?,?,NULL)')
    .run(M, B, S1.tenantId, S1.canonicalOwnerId, NOW, NOW);
}
function snapshot(db: DatabaseSync) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[];
  return JSON.stringify(tables.map(({ name }) => [name, db.prepare(`SELECT * FROM "${name}" ORDER BY 1,2`).all()]));
}
function envelope(op = 'portfolio.get', payload: object = { portfolioId: 'SHARED' }, v = 2) {
  return { v, op, ...(op === 'portfolio.list' ? {} : { payload }), requestId: 'same' };
}
function wire(path: string, value: unknown): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ path });
    const chunks: Buffer[] = [];
    socket.setTimeout(5000, () => socket.destroy(new Error('fixture IPC timeout')));
    socket.on('data', b => chunks.push(b));
    socket.on('error', reject);
    socket.on('close', () => resolve(Buffer.concat(chunks)));
    socket.on('connect', () => {
      const body = Buffer.from(JSON.stringify(value));
      const prefix = Buffer.alloc(4); prefix.writeUInt32BE(body.length);
      socket.write(Buffer.concat([prefix, body]), () => socket.end());
    });
  });
}
function parse(bytes: Buffer): any {
  assert.ok(bytes.length >= 4);
  assert.equal(bytes.readUInt32BE(), bytes.length - 4);
  return JSON.parse(bytes.subarray(4).toString());
}
function intercept(db: DatabaseSync, hook: { action?: () => void }): DatabaseSync {
  return new Proxy(db, { get(target, key) {
    if (key === 'prepare') return (sql: string) => {
      const statement = target.prepare(sql);
      return new Proxy(statement, { get(st, prop) {
        const member = Reflect.get(st, prop, st);
        if (prop === 'all' && sql.includes("FROM local_principal_bindings WHERE status = 'ACTIVE'")) {
          return (...args: unknown[]) => {
            const result = Reflect.apply(member, st, args);
            const action = hook.action; hook.action = undefined; action?.();
            return result;
          };
        }
        return typeof member === 'function' ? member.bind(st) : member;
      } });
    };
    const value = Reflect.get(target, key, target);
    return typeof value === 'function' ? value.bind(target) : value;
  } });
}
async function fixture(wal = false) {
  const root = mkdtempSync(join(tmpdir(), 's1-d02-'));
  const file = join(root, 'fixture.db');
  let db = new DatabaseSync(file);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=${wal ? 'WAL' : 'DELETE'}`);
  ensureMigrations(db, GATE3_MIGRATIONS); seed(db);
  let store = new DurablePortfolioStore(db);
  store.create(S1, 'SHARED', request(11));
  store.create(D02, 'SHARED', request(22));
  store.create(D02, 'D02_ONLY', request(23));
  store.create({ canonicalOwnerId: 'foreign', tenantId: 'foreign' }, 'FOREIGN', request(33));
  // Prove persistence survives a full close/reopen before serving the endpoint.
  db.close(); db = new DatabaseSync(file); db.exec('PRAGMA foreign_keys=ON');
  store = new DurablePortfolioStore(db);
  const hook: { action?: () => void } = {};
  const target = resolveEndpointTarget({ IIPS_G2_IPC_ENDPOINT: `s1-${process.pid}-${Math.random().toString(36).slice(2)}`,
    IIPS_G3_LOCAL_STATE_DIR: join(root, 'state') }, process.platform === 'win32' ? 'win32' : 'linux');
  const handle = await listenIpc(target, createConnectionHandler(intercept(db, hook), {
    settlement: settlementPolicyForEndpoint(target), env: {},
  }), { platform: process.platform === 'win32' ? 'win32' : 'linux' });
  return { db, store, file, hook, call: (e: unknown) => wire(target.path, e), close: async () => {
    await handle.stop(); db.close(); rmSync(root, { recursive: true, force: true });
  } };
}

test('S1 resolves to D02 read authority with S1 storage; list/get/history preserve data, schema, identity and wire shapes', async () => {
  const f = await fixture();
  try {
    const before = snapshot(f.db); const bytes = readFileSync(f.file);
    f.db.exec('BEGIN');
    const context = resolveHoldingsReadContextInCurrentTransaction(f.db);
    assert.equal(context.authenticatedBinding.canonicalOwnerId, S1.canonicalOwnerId);
    assert.equal(context.authenticatedBinding.bindingId, B);
    assert.equal(context.authenticatedBinding.membershipId, M);
    assert.equal(context.authenticatedBinding.principalLabel, 'ramki-personal-local');
    assert.deepEqual(context.effectiveDomainOwner, D02);
    assert.deepEqual(context.storageOwner, S1);
    assert.equal(context.relationship, 'S1_D02_PERSONAL_READ');
    f.db.exec('COMMIT');
    const list = parse(await f.call(envelope('portfolio.list', {})));
    assert.equal(list.v, 2); assert.equal(list.ok, true);
    assert.deepEqual(list.result, f.store.list(S1));
    const detail = parse(await f.call(envelope()));
    assert.deepEqual(detail.result, f.store.getV2(S1, 'SHARED'));
    assert.equal(detail.result.holdings[0].currentPrice, 11);
    assert.deepEqual(Object.keys(detail).sort(), ['ok', 'op', 'requestId', 'result', 'v']);
    assert.deepEqual(parse(await f.call(envelope('portfolio.revisions'))).result, f.store.revisions(S1, 'SHARED'));
    assert.deepEqual(parse(await f.call(envelope('portfolio.get', { portfolioId: 'SHARED' }, 1))).result, f.store.get(S1, 'SHARED'));
    assert.ok(!JSON.stringify(detail).includes('canonicalOwnerId'));
    assert.ok(!JSON.stringify(detail).includes(B));
    assert.equal(snapshot(f.db), before);
    assert.deepEqual(readFileSync(f.file), bytes, 'zero persisted bytes changed by reads');
  } finally { await f.close(); }
});

test('foreign, missing, other-tenant, D02-only and tombstoned data do not leak; no union or fallback', async () => {
  const f = await fixture();
  try {
    f.store.create(S1, 'TOMBSTONE', request(44));
    f.db.exec("UPDATE portfolios SET status='TOMBSTONED' WHERE portfolio_id='TOMBSTONE'");
    f.store.create({ canonicalOwnerId: S1.canonicalOwnerId, tenantId: 'other' }, 'OTHER_TENANT', request(55));
    for (const op of ['portfolio.get', 'portfolio.revisions']) {
      const missing = await f.call(envelope(op, { portfolioId: 'MISSING' }));
      assert.equal(parse(missing).outcome, 'RESOURCE_UNAVAILABLE');
      for (const portfolioId of ['FOREIGN', 'D02_ONLY', 'TOMBSTONE', 'OTHER_TENANT']) {
        assert.deepEqual(await f.call(envelope(op, { portfolioId })), missing);
      }
    }
    const before = snapshot(f.db);
    assert.equal((await f.call(envelope('portfolio.get', { portfolioId: 'SHARED', canonicalOwnerId: D02.canonicalOwnerId }))).length, 0);
    assert.equal(snapshot(f.db), before);
  } finally { await f.close(); }
});

test('each mismatching S1 field, absent/detached/duplicate/revoked/inconsistent binding fails closed', async () => {
  const f = await fixture();
  try {
    const mutations = [
      "UPDATE local_principal_bindings SET principal_label='wrong'",
      "UPDATE local_principal_memberships SET tenant_id='wrong'",
      "UPDATE local_principal_memberships SET canonical_owner_id='wrong'",
      "UPDATE local_principal_memberships SET membership_id='wrong'",
      "PRAGMA defer_foreign_keys=ON; UPDATE local_principal_bindings SET binding_id='wrong'; UPDATE local_principal_memberships SET binding_id='wrong'",
      "UPDATE local_principal_memberships SET revoked_at='stale'",
      "UPDATE local_principal_bindings SET revoked_at='stale'",
      "UPDATE local_principal_memberships SET status='REVOKED', revoked_at='revoked'",
      "UPDATE local_principal_bindings SET status='REVOKED', revoked_at='revoked'",
      "DELETE FROM local_principal_memberships; DELETE FROM local_principal_bindings",
      "PRAGMA defer_foreign_keys=ON; UPDATE local_principal_memberships SET binding_id='detached'",
      "DROP INDEX idx_local_principal_memberships_single_active; INSERT INTO local_principal_memberships SELECT 'extra',binding_id,tenant_id,canonical_owner_id,status,created_at,updated_at,revoked_at FROM local_principal_memberships",
      "DROP INDEX idx_local_principal_bindings_single_active; INSERT INTO local_principal_bindings SELECT 'extra',principal_label,status,created_at,updated_at,revoked_at FROM local_principal_bindings",
    ];
    for (const sql of mutations) {
      f.db.exec('BEGIN');
      try {
        f.db.exec(sql);
        assert.throws(() => resolveHoldingsReadContextInCurrentTransaction(f.db), error => error instanceof BindingInvalidError || error instanceof BindingAbsentError, sql);
      } finally { f.db.exec('ROLLBACK'); }
    }
    assert.throws(() => resolveHoldingsReadContextInCurrentTransaction(f.db), /active transaction/);
    f.db.exec("UPDATE local_principal_memberships SET revoked_at='stale'");
    assert.equal((await f.call(envelope())).length, 0, 'IPC binding refusal stays zero bytes');
  } finally { await f.close(); }
});

test('relationship never grants mutation authority; native D02 reads and write refusals remain intact', async () => {
  const f = await fixture();
  try {
    const before = snapshot(f.db);
    assert.throws(() => resolveActiveHoldingsBinding(f.db), BindingInvalidError);
    assert.throws(() => f.store.createEmptySnapshot(S1, {}), ResourceUnavailableError);
    assert.throws(() => f.store.createEmptySnapshot(D02, {}), ResourceUnavailableError);
    for (const op of ['portfolio.create', 'portfolio.save']) {
      const payload = op === 'portfolio.create' ? { portfolioName: 'refused' } : {
        portfolioId: 'SHARED', expectedRevision: 1, mode: 'MERGE', broker: 'GENERIC', contentDigest: 'a'.repeat(64),
        holdings: [{ symbol: 'SYN', quantity: 1, averageBuyPrice: 10, currentPrice: 11, marketValue: 11, weightPercentage: 100, active: true, sourceBroker: 'GENERIC' }],
        sourceEvidence: { fileName: 'fixture.csv', sourceBroker: 'GENERIC', importedAt: NOW, evidenceRecordDigest: 'b'.repeat(64) },
      };
      const body = Buffer.from(JSON.stringify(envelope(op, payload)));
      const prefix = Buffer.alloc(4); prefix.writeUInt32BE(body.length);
      assert.ok(parseSingleFrame(Buffer.concat([prefix, body])), 'mutation fixture is structurally valid, not a parser refusal');
      assert.equal((await f.call(envelope(op, payload))).length, 0, 'strict mutation binding rejects S1');
    }
    for (const op of ['portfolio.reset', 'portfolio.delete', 'portfolio.restore']) {
      assert.equal((await f.call(envelope(op))).length, 0);
    }
    assert.equal(snapshot(f.db), before);
    f.db.prepare('UPDATE local_principal_memberships SET canonical_owner_id=?').run(D02.canonicalOwnerId);
    assert.deepEqual(parse(await f.call(envelope('portfolio.list', {}))).result, f.store.list(D02));
    assert.equal(parse(await f.call(envelope())).result.holdings[0].currentPrice, 22);
    assert.deepEqual(parse(await f.call(envelope('portfolio.revisions'))).result, f.store.revisions(D02, 'SHARED'));
    assert.equal(parse(await f.call(envelope('portfolio.create', {}))).outcome, 'WRITE_NOT_AUTHORIZED');
  } finally { await f.close(); }
});

test('authorization and data share a snapshot: concurrent revoke/update may finish in-flight read; next request refuses', async () => {
  const f = await fixture(true);
  const writer = new DatabaseSync(f.file);
  try {
    f.hook.action = () => {
      writer.exec("BEGIN IMMEDIATE; UPDATE local_principal_memberships SET status='REVOKED',revoked_at='revoked'; UPDATE portfolio_holdings SET current_price=99 WHERE canonical_owner_id='ipd-owner-ramki-personal'; COMMIT");
    };
    const response = parse(await f.call(envelope()));
    assert.equal(f.hook.action, undefined, 'barrier ran after first authorization SELECT');
    assert.equal(response.result.holdings[0].currentPrice, 11, 'same snapshot predates concurrent update');
    assert.equal((await f.call(envelope())).length, 0, 'committed revoke wins on next snapshot');
  } finally { writer.close(); await f.close(); }
});

test('malformed stored projection refuses; errors roll back the read transaction without changing data', async () => {
  const f = await fixture();
  try {
    f.db.exec("UPDATE portfolio_revisions SET total_market_value='bad' WHERE canonical_owner_id='ipd-owner-ramki-personal'");
    const before = snapshot(f.db);
    assert.equal(parse(await f.call(envelope())).outcome, 'UNAVAILABLE');
    assert.equal(f.db.isTransaction, false);
    assert.equal(snapshot(f.db), before);
  } finally { await f.close(); }
});
