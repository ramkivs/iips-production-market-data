import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createConnection } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import { createConnectionHandler } from '../src/ipc/dispatch.js';
import {
  listenIpc,
  resolveEndpointTarget,
  settlementPolicyForEndpoint,
} from '../src/ipc/endpoint.js';
import { DurablePortfolioStore } from '../src/persistence/portfolio_store.js';
import {
  HOLDINGS_CANONICAL_OWNER_ID,
  HOLDINGS_TENANT_ID,
} from '../src/persistence/binding.js';

const owner = {
  canonicalOwnerId: HOLDINGS_CANONICAL_OWNER_ID,
  tenantId: HOLDINGS_TENANT_ID,
};
const foreign = { canonicalOwnerId: 'other-owner', tenantId: 'other-tenant' };
const request = (value: number) => ({
  holdings: [
    {
      symbol: 'SYN',
      companyId: 'SYN',
      quantity: 1,
      averageBuyPrice: 10,
      currentPrice: value,
      marketValue: value,
      weightPercentage: 100,
      active: true,
      sourceBroker: 'GENERIC',
      lineageDigest: `line-${value}`,
      identityStatus: 'RESOLVED',
      resolutionDisposition: 'CANONICAL_P04',
    },
  ],
  provenanceDigest: `prov-${value}`,
});
function frame(envelope: unknown) {
  const b = Buffer.from(JSON.stringify(envelope));
  const n = Buffer.alloc(4);
  n.writeUInt32BE(b.length);
  return Buffer.concat([n, b]);
}
function call(path: string, envelope: unknown): Promise<Buffer> {
  return new Promise((resolve) => {
    const s = createConnection({ path });
    const chunks: Buffer[] = [];
    s.on('data', (c) => chunks.push(c));
    s.on('error', () => resolve(Buffer.concat(chunks)));
    s.on('close', () => resolve(Buffer.concat(chunks)));
    s.on('connect', () => s.write(frame(envelope), () => s.end()));
  });
}
function parse(b: Buffer): any {
  assert.ok(b.length >= 4);
  return JSON.parse(b.subarray(4, 4 + b.readUInt32BE()).toString());
}
// Deterministic barrier: the real SELECT finishes on the read connection, then
// the separate writer attempts its operation before the next statement.
function instrument(
  db: DatabaseSync,
  barrier: {
    needle: string;
    action: () => void;
    log: string[];
    fired: boolean;
  },
): DatabaseSync {
  return new Proxy(db, {
    get(target, prop) {
      if (prop === 'prepare')
        return (sql: string) => {
          const stmt = target.prepare(sql);
          return new Proxy(stmt, {
            get(st, key) {
              const v = Reflect.get(st, key, st);
              if (
                (key === 'all' || key === 'get') &&
                sql.includes(barrier.needle)
              )
                return (...args: unknown[]) => {
                  const result = Reflect.apply(v, st, args);
                  if (!barrier.fired) {
                    barrier.fired = true;
                    barrier.log.push('reader-select-complete');
                    barrier.action();
                    barrier.log.push('writer-attempt-complete');
                  }
                  return result;
                };
              return typeof v === 'function' ? v.bind(st) : v;
            },
          });
        };
      const v = Reflect.get(target, prop, target);
      return typeof v === 'function' ? v.bind(target) : v;
    },
  });
}
async function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'w02-bindings-'));
  const db = new DatabaseSync(join(root, 'db.sqlite'));
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON');
  ensureMigrations(db, GATE3_MIGRATIONS);
  const writerDb = new DatabaseSync(join(root, 'db.sqlite'));
  writerDb.exec('PRAGMA foreign_keys=ON');
  const store = new DurablePortfolioStore(writerDb);
  store.create(owner, 'OWN', request(10));
  store.create(foreign, 'FOREIGN', request(30));
  const now = '2026-01-01T00:00:00.000Z';
  db.prepare(
    "INSERT INTO local_principal_bindings VALUES ('b1','one','ACTIVE',?,?,NULL),('b2','two','REVOKED',?,?,?)",
  ).run(now, now, now, now, now);
  db.prepare(
    "INSERT INTO local_principal_memberships VALUES ('m1','b1',?,?,'ACTIVE',?,?,NULL),('m2','b2',?,?,'REVOKED',?,?,?)",
  ).run(
    owner.tenantId,
    owner.canonicalOwnerId,
    now,
    now,
    foreign.tenantId,
    foreign.canonicalOwnerId,
    now,
    now,
    now,
  );
  const barrier = {
    needle: '__disabled__',
    action: () => {},
    log: [] as string[],
    fired: false,
  };
  const target = resolveEndpointTarget(
    {
      IIPS_G2_IPC_ENDPOINT: `w02-${process.pid}-${Math.random().toString(36).slice(2)}`,
      IIPS_G3_LOCAL_STATE_DIR: join(root, 'state'),
    },
    process.platform === 'win32' ? 'win32' : 'linux',
  );
  const handle = await listenIpc(
    target,
    createConnectionHandler(instrument(db, barrier), {
      settlement: settlementPolicyForEndpoint(target),
    }),
    { platform: process.platform === 'win32' ? 'win32' : 'linux' },
  );
  return {
    db,
    writerDb,
    store,
    barrier,
    path: target.path,
    close: async () => {
      await handle.stop();
      writerDb.close();
      db.close();
      rmSync(root, { recursive: true, force: true });
    },
  };
}
const get = (id: string, v: 1 | 2 = 1) => ({
  v,
  op: 'portfolio.get',
  payload: { portfolioId: id },
  requestId: 'same',
});
const switchBinding = (db: DatabaseSync) => {
  db.exec(
    "BEGIN IMMEDIATE; UPDATE local_principal_memberships SET status='REVOKED' WHERE membership_id='m1'; UPDATE local_principal_bindings SET status='REVOKED' WHERE binding_id='b1'; UPDATE local_principal_bindings SET status='ACTIVE' WHERE binding_id='b2'; UPDATE local_principal_memberships SET status='ACTIVE' WHERE membership_id='m2'; COMMIT;",
  );
};

test('binding switch between resolution and detail: in-flight owner is pinned; next request uses the new owner', async () => {
  const f = await fixture();
  try {
    f.barrier.needle = 'SELECT portfolio_id, current_revision, status';
    f.barrier.action = () => {
      switchBinding(f.writerDb);
      f.store.reset(owner, 'OWN', request(20), 1);
    };
    const d = parse(await call(f.path, get('OWN')));
    assert.deepEqual(f.barrier.log, [
      'reader-select-complete',
      'writer-attempt-complete',
    ]);
    assert.equal(d.ok, true);
    assert.equal(d.result.revision, 1);
    assert.equal(d.result.holdings[0].currentPrice, 10);
    assert.equal(d.result.contributions[0].amount, 10);
    const own = await call(f.path, get('OWN'));
    const missing = await call(f.path, get('MISSING'));
    assert.ok(own.equals(missing));
    assert.equal(parse(own).outcome, 'RESOURCE_UNAVAILABLE');
    assert.equal(parse(await call(f.path, get('FOREIGN'))).result.revision, 1);
    assert.equal(
      (await call(f.path, get('FOREIGN', 2))).length,
      0,
      'v2 rejects non-holdings binding',
    );
  } finally {
    await f.close();
  }
});

test('binding resolution serializes against a concurrent revoke or replacement', async () => {
  const f = await fixture();
  try {
    let failure: unknown;
    f.barrier.needle = "FROM local_principal_bindings WHERE status = 'ACTIVE'";
    f.barrier.action = () => {
      try {
        switchBinding(f.writerDb);
      } catch (e) {
        failure = e;
        if (f.writerDb.isTransaction) f.writerDb.exec('ROLLBACK');
      }
    };
    const response = parse(await call(f.path, get('OWN')));
    assert.deepEqual(f.barrier.log, [
      'reader-select-complete',
      'writer-attempt-complete',
    ]);
    assert.ok(failure instanceof Error);
    assert.equal(
      (failure as Error & { errcode: number }).errcode,
      5,
      'SQLITE_BUSY',
    );
    assert.equal(response.ok, true);
    assert.equal(response.result.revision, 1);
    assert.equal(f.writerDb.isTransaction, false);
    switchBinding(f.writerDb);
    assert.equal(parse(await call(f.path, get('FOREIGN'))).ok, true);
    assert.ok(
      (await call(f.path, get('OWN'))).equals(
        await call(f.path, get('MISSING')),
      ),
    );
  } finally {
    await f.close();
  }
});

test('competing binding and membership states fail closed without disclosing holdings', async () => {
  const f = await fixture();
  try {
    // Corruption fixtures intentionally remove uniqueness constraints only in this disposable database.
    f.writerDb.exec(
      "DROP INDEX idx_local_principal_bindings_single_active; UPDATE local_principal_bindings SET status='ACTIVE' WHERE binding_id='b2'",
    );
    assert.equal((await call(f.path, get('OWN'))).length, 0);
    assert.equal((await call(f.path, get('FOREIGN'))).length, 0);
    f.writerDb.exec(
      "UPDATE local_principal_bindings SET status='REVOKED' WHERE binding_id='b2'; DROP INDEX idx_local_principal_memberships_single_active; UPDATE local_principal_memberships SET status='ACTIVE' WHERE membership_id='m2'",
    );
    assert.equal((await call(f.path, get('OWN'))).length, 0);
    f.writerDb.exec(
      "UPDATE local_principal_memberships SET status='REVOKED' WHERE membership_id='m1'",
    );
    assert.equal(
      (await call(f.path, get('OWN'))).length,
      0,
      'membership attached to another binding fails closed',
    );
    f.writerDb.exec(
      "UPDATE local_principal_memberships SET status='REVOKED' WHERE membership_id='m2'",
    );
    assert.equal(
      (await call(f.path, get('OWN'))).length,
      0,
      'no active membership fails closed',
    );
  } finally {
    await f.close();
  }
});

test('single-active indexes reject competing bindings and v2 accepts only authorized owner', async () => {
  const f = await fixture();
  try {
    const valid = parse(await call(f.path, get('OWN', 2)));
    assert.equal(valid.ok, true);
    assert.equal(valid.result.revision, 1);
    assert.throws(() =>
      f.writerDb.exec(
        "UPDATE local_principal_bindings SET status='ACTIVE' WHERE binding_id='b2'",
      ),
    );
    assert.throws(() =>
      f.writerDb.exec(
        "UPDATE local_principal_memberships SET status='ACTIVE' WHERE membership_id='m2'",
      ),
    );
    assert.equal(parse(await call(f.path, get('OWN', 2))).ok, true);
    f.writerDb.exec(
      "UPDATE local_principal_bindings SET status='REVOKED' WHERE binding_id='b1'",
    );
    assert.equal((await call(f.path, get('OWN', 2))).length, 0);
  } finally {
    await f.close();
  }
});
