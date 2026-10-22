/**
 * Gate 3 T-D — honest durability vocabulary and lineage retention.
 *
 * The durable port must identify itself as DURABLE (never SESSION_ONLY), the
 * W-1 guard refuses every write while the gates are unmet, and lineage digests
 * survive a revision round-trip. Native temp paths keep the suite
 * host-adaptive without any network surface.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDatabase, closeDatabase } from '../src/persistence/connection.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import {
  DurablePortfolioStorePort,
  computeLineageHash,
  WriteNotAuthorizedError,
  type DurabilityVocabulary,
  type HoldingInput,
  type OwnerRef,
} from '../src/persistence/durablePortfolioStorePort.js';
import { DurablePortfolioStore } from '../src/persistence/portfolio_store.js';

const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
void HOST_PLATFORM;

function holding(symbol: string, digest: string): HoldingInput {
  return {
    symbol,
    companyId: `C-${symbol}`,
    quantity: 5,
    averageBuyPrice: 200,
    currentPrice: 210,
    marketValue: 1050,
    weightPercentage: 100,
    active: true,
    sourceBroker: 'GENERIC',
    lineageDigest: digest,
    identityStatus: 'RESOLVED',
    resolutionDisposition: 'CANONICAL_P04',
  };
}

describe('g3 / T-D durability vocabulary and lineage', () => {
  let root: string;
  let db: DatabaseSync;
  let port: DurablePortfolioStorePort;
  const owner: OwnerRef = { canonicalOwnerId: 'owner-d', tenantId: 'tenant-d' };

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'g3-durability-'));
    db = openDatabase(join(root, 'store', 'ipd.db'));
    ensureMigrations(db, GATE3_MIGRATIONS);
    port = new DurablePortfolioStorePort(db);
  });

  after(() => {
    closeDatabase();
    rmSync(root, { recursive: true, force: true });
  });

  it('labels the durable port DURABLE and never SESSION_ONLY', () => {
    const label: DurabilityVocabulary = port.durability;
    assert.equal(label, 'DURABLE');
    assert.notEqual(label, 'SESSION_ONLY');
  });

  it('computeLineageHash is deterministic and order-independent', () => {
    const a = [holding('AAPL', 'd1'), holding('MSFT', 'd2')];
    const b = [holding('MSFT', 'd2'), holding('AAPL', 'd1')];
    assert.equal(computeLineageHash(a), computeLineageHash(b));
    assert.match(computeLineageHash(a), /^[0-9a-f]{64}$/);
  });

  it('refuses every port write with WRITE_NOT_AUTHORIZED while W-1 is unmet', () => {
    const request = { holdings: [holding('AAPL', 'lineage-1')], provenanceDigest: 'prov-d1' };
    assert.throws(() => port.create(owner, 'P-D', request), WriteNotAuthorizedError);
    assert.throws(
      () => port.save(owner, 'P-D', request, 1),
      WriteNotAuthorizedError,
    );
    assert.throws(
      () => port.reset(owner, 'P-D', request, 1),
      WriteNotAuthorizedError,
    );
    assert.throws(() => port.delete(owner, 'P-D', 1), WriteNotAuthorizedError);
    assert.deepEqual(port.list(owner), []);
  });

  it('retains lineage digests through a direct store revision round-trip', () => {
    const store = new DurablePortfolioStore(db);
    const pid = 'P-LINEAGE';
    const revision = store.create(owner, pid, {
      holdings: [holding('RELIANCE', 'lineage-retained')],
      provenanceDigest: 'prov-l1',
    });
    assert.equal(revision, 1);
    const snapshot = store.get(owner, pid);
    assert.equal(snapshot.holdings[0].lineageDigest, 'lineage-retained');
    assert.equal(snapshot.holdings[0].identityStatus, 'RESOLVED');
  });

  it('exposes revisions with an honest DURABLE vocabulary on every read path', () => {
    const revisions = port.revisions(owner, 'P-LINEAGE');
    assert.equal(revisions.length, 1);
    assert.equal(revisions[0].operation, 'INITIAL');
    assert.equal(port.durability, 'DURABLE');
  });

  it('a foreign owner cannot read the local portfolio (owner scoping at the store)', () => {
    const foreign: OwnerRef = { canonicalOwnerId: 'someone-else', tenantId: 'tenant-other' };
    assert.throws(() => new DurablePortfolioStore(db).get(foreign, 'P-LINEAGE'));
    assert.deepEqual(port.list(foreign), []);
  });
});
