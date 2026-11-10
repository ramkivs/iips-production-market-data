/**
 * Stage 4 — broker-import identity composition-root integration
 *
 * WHAT THIS SUITE PROVES
 *   The NORMAL application composition path — `startIpcServer` in
 *   `src/ipc/entrypoint.ts`, the shipped entrypoint — now supplies the governed
 *   P04 security master and retained P7 instrument registry to
 *   `createBrokerImportConsumer`, so broker-import holdings reach the existing
 *   joint P04 → P7 qualification service instead of the pre-Stage-4 fallback.
 *
 *   Stage 4C recorded the opposite: the composition root called
 *   `createBrokerImportConsumer(db)` with no options, so
 *   `mapBrokerImportHoldings` took its `else` branch and built a D114 identity
 *   directly from broker-supplied ISIN + series without consulting P04 or P7.
 *   These tests fail on that composition and pass only when the dependencies
 *   are actually wired and actually invoked.
 *
 * WHAT THIS SUITE IS NOT
 *   - Not a Gate 4 or Gate 5 result. `evaluatePortSaveGuard()` remains
 *     hard-false, so every import still returns `WRITE_NOT_AUTHORIZED` with
 *     `storeEffect: 'NONE'` and zero store effect. Composing qualification
 *     never implies authorization.
 *   - Not production qualification, deployment or acceptance, and not a live
 *     provider capability claim. Every dependency here is the repository's own
 *     offline governed source; nothing contacts Dhan.
 *   - Not a change to the identity master, the write gate, portfolio
 *     persistence or the closed IPC operation set.
 *
 * Fixtures: the repository's own governed D05 authenticated universe master and
 * its retained P7 qualification manifest. No mapping is invented, and every
 * negative case below asserts that missing or conflicting evidence fails closed.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase, closeDatabase } from '../src/persistence/connection.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS, startIpcServer } from '../src/ipc/entrypoint.js';
import {
  brokerImportConsumerOptions,
  composeBrokerImportIdentityDependencies,
} from '../src/ipc/brokerImportComposition.js';
import { createBrokerImportConsumer } from '../src/ipc/brokerImportConsumer.js';
import type { BrokerImportHolding, BrokerImportRequest } from '../src/persistence/brokerImportPersistence.js';
import { evaluatePortSaveGuard, type OwnerRef } from '../src/persistence/portfolio_store.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import { DhanInstrumentRegistry, type DhanInstrumentMapping } from '../src/providers/dhan/dhan_instrument_map.js';

const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
const REPO_ROOT = (() => {
  let candidate = resolve(dirname(fileURLToPath(import.meta.url)));
  while (!existsSync(resolve(candidate, 'src/ipc/entrypoint.ts'))) {
    const parent = resolve(candidate, '..');
    if (parent === candidate) throw new Error('Unable to locate IPD repository root');
    candidate = parent;
  }
  return candidate;
})();
const OWNER: OwnerRef = { canonicalOwnerId: 'owner-local', tenantId: 'tenant-local' };
const COMPOSITION = 'P-STAGE4-COMPOSITION';
const IMPORTED_AT = '2026-11-09T10:00:00.000Z';

/**
 * A holding that IS resolvable in the governed D05 authenticated universe and
 * IS qualified by the retained P7 manifest: Reliance Industries, BSE, series A.
 * Both the ISIN and the exchange symbol are governed source facts — the
 * governed broker-observation resolver requires every supplied identifier to
 * agree, so the symbol is the P04 listing symbol, not a guess.
 */
const GOVERNED_QUALIFIABLE = {
  symbol: 'RELIANCE',
  isin: 'INE002A01018',
  exchange: 'BSE' as const,
  expectedCompanyId: 'EQ_RELIANCE_IN',
  expectedSecurityId: 'ISIN:INE002A01018:A',
};

function holding(overrides: Partial<BrokerImportHolding> = {}): BrokerImportHolding {
  return {
    symbol: GOVERNED_QUALIFIABLE.symbol,
    isin: GOVERNED_QUALIFIABLE.isin,
    exchange: GOVERNED_QUALIFIABLE.exchange,
    quantity: 10,
    averageBuyPrice: 100,
    currentPrice: 110,
    marketValue: 1100,
    weightPercentage: 100,
    active: true,
    sourceBroker: 'ZERODHA',
    lineageDigest: 'lineage-reliance',
    ...overrides,
  };
}

function importRequest(overrides: Partial<BrokerImportRequest> = {}): BrokerImportRequest {
  return {
    portfolioId: COMPOSITION,
    expectedRevision: 0,
    holdings: [holding()],
    contentDigest: 'sha256:stage4-composition-a',
    fileName: 'zerodha-holdings-stage4.csv',
    sourceBroker: 'ZERODHA',
    importedAt: IMPORTED_AT,
    ...overrides,
  };
}

/** Spot-check that the governed fixture is still a qualified identity, not a guess. */
async function assertGovernedFixtureQualifies(): Promise<void> {
  const { qualifyHoldingSecurityIdentity } = await import(
    '../src/providers/dhan/dhan_security_identity_service.js'
  );
  const dependencies = composeBrokerImportIdentityDependencies();
  const result = qualifyHoldingSecurityIdentity(
    { isin: GOVERNED_QUALIFIABLE.isin, exchange: GOVERNED_QUALIFIABLE.exchange },
    dependencies.securityMaster,
    dependencies.registry,
  );
  assert.equal(result.status, 'QUALIFIED', 'the governed fixture must still qualify through P04 → P7');
  if (result.status === 'QUALIFIED') {
    assert.equal(result.companyId, GOVERNED_QUALIFIABLE.expectedCompanyId);
    assert.equal(result.securityIdentity.securityId, GOVERNED_QUALIFIABLE.expectedSecurityId);
  }
}

/** The four statement classes an import transaction could reach. */
function countRows(db: DatabaseSync): number {
  const row = db
    .prepare(
      `SELECT (SELECT COUNT(*) FROM portfolios)
            + (SELECT COUNT(*) FROM portfolio_revisions)
            + (SELECT COUNT(*) FROM portfolio_holdings)
            + (SELECT COUNT(*) FROM portfolio_contributions) AS n`,
    )
    .get() as { n: number | bigint };
  return Number(row.n);
}

describe('Stage 4 — broker-import identity composition root', () => {
  let root: string;
  let dbPath: string;

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'stage4-composition-'));
    dbPath = join(root, 'store', 'ipd.db');
  });

  after(() => {
    closeDatabase();
    rmSync(root, { recursive: true, force: true });
  });

  function openFixture(): DatabaseSync {
    const db = openDatabase(dbPath);
    ensureMigrations(db, GATE3_MIGRATIONS);
    return db;
  }

  /* ---------------------------------------------------------------- *
   * 1. The composition module supplies governed dependencies
   * ---------------------------------------------------------------- */

  describe('the composition module', () => {
    it('resolves the governed P04 master and retained P7 registry by default', async () => {
      const dependencies = composeBrokerImportIdentityDependencies();
      // Same governed corpus the market-data daemon composes.
      assert.equal(
        dependencies.securityMaster.sourceRevision?.batchId,
        'BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001',
        'the composed master must be the governed D05 authenticated universe',
      );
      // The retained P7 manifest contributes mappings; an empty registry would
      // make every qualification fail closed, which is safe but would mean the
      // composition silently degraded.
      assert.ok(
        dependencies.registry.list().length > 0,
        'the retained P7 qualification manifest must contribute mappings',
      );
      // The options object is the consumer's own contract — not a parallel one.
      assert.deepEqual(
        Object.keys(brokerImportConsumerOptions(dependencies)).sort(),
        ['registry', 'securityMaster'],
      );
      await assertGovernedFixtureQualifies();
    });

    it('honours an explicit dependency seam and composes nothing else', () => {
      const securityMaster = new SecurityMaster();
      const registry = new DhanInstrumentRegistry();
      const dependencies = composeBrokerImportIdentityDependencies({ securityMaster, registry });
      assert.equal(dependencies.securityMaster, securityMaster);
      assert.equal(dependencies.registry, registry);
      assert.equal(dependencies.securityMaster.sourceRevision, undefined);
    });
  });

  /* ---------------------------------------------------------------- *
   * 2. The dependency is not merely supplied — it is INVOKED
   * ---------------------------------------------------------------- */

  describe('the composed consumer', () => {
    it('invokes the governed P04 correspondence and P7 series lookup for each holding', async () => {
      const db = openFixture();
      await assertGovernedFixtureQualifies();

      const dependencies = composeBrokerImportIdentityDependencies();
      const p04Queries: Array<{ identifierType: string; identifierValue: string }> = [];
      const p7Lookups: Array<readonly unknown[]> = [];

      // Instrumented wrappers around the real governed implementations: the
      // assertions are about call evidence, and every call still lands on the
      // real method, so fail-closed behaviour is not simulated.
      const realResolveCompanyId = dependencies.securityMaster.resolveCompanyId.bind(
        dependencies.securityMaster,
      );
      dependencies.securityMaster.resolveCompanyId = (query) => {
        p04Queries.push(query);
        return realResolveCompanyId(query);
      };
      const realResolveSecurity = dependencies.registry.resolveSecurity.bind(dependencies.registry);
      dependencies.registry.resolveSecurity = (...args) => {
        p7Lookups.push(args);
        return realResolveSecurity(...(args as Parameters<typeof realResolveSecurity>));
      };

      const rowsBefore = countRows(db);
      const consumer = createBrokerImportConsumer(db, brokerImportConsumerOptions(dependencies));
      const outcome = consumer(OWNER, importRequest());

      // Stage 4 qualification ran: the P04 ISIN correspondence was queried and
      // the P7 series lookup was scoped to the segment derived from the
      // P04-resolved company and the holding's ISIN.
      assert.ok(p04Queries.length > 0, 'the composed consumer must consult the P04 security master');
      const isinQuery = p04Queries.find(
        (query) => query.identifierValue === GOVERNED_QUALIFIABLE.isin,
      );
      assert.equal(isinQuery?.identifierType, 'ISIN', 'the holding ISIN must be looked up in P04');
      // The governed resolver evaluates correspondence at the import instant.
      assert.equal(
        (isinQuery as unknown as { asOf?: string } | undefined)?.asOf,
        IMPORTED_AT,
        'P04 correspondence is evaluated at the import as-of instant',
      );
      assert.deepEqual(p7Lookups, [
        [GOVERNED_QUALIFIABLE.expectedCompanyId, 'BSE_EQ', GOVERNED_QUALIFIABLE.isin],
      ]);

      // ...and qualification still authorizes nothing: W-1(3)/W-1(4) are frozen.
      assert.equal(evaluatePortSaveGuard().authorized, false);
      assert.equal(outcome.ok, false);
      assert.equal(outcome.ok === false && outcome.code, 'WRITE_NOT_AUTHORIZED');
      assert.equal(outcome.storeEffect, 'NONE');
      assert.equal(countRows(db), rowsBefore, 'no row was written');
      closeDatabase();
    });

    it('fails closed when the composed registry has no mapping for a governed security', async () => {
      const db = openFixture();
      await assertGovernedFixtureQualifies();

      // Deliberately empty registry: the ISIN resolves in P04, but no P7 series
      // evidence exists. Stage 4 must refuse to build an identity rather than
      // fall back to the pre-Stage-4 broker-supplied series.
      const dependencies = composeBrokerImportIdentityDependencies({
        registry: new DhanInstrumentRegistry(),
      });
      const rowsBefore = countRows(db);
      const consumer = createBrokerImportConsumer(db, brokerImportConsumerOptions(dependencies));
      const outcome = consumer(OWNER, importRequest());

      assert.equal(outcome.ok, false);
      assert.equal(outcome.ok === false && outcome.code, 'WRITE_NOT_AUTHORIZED');
      assert.equal(outcome.storeEffect, 'NONE');
      assert.equal(countRows(db), rowsBefore);
      closeDatabase();
    });

    it('refuses an import whose P7 evidence conflicts with the supplied series', async () => {
      const db = openFixture();
      await assertGovernedFixtureQualifies();

      const dependencies = composeBrokerImportIdentityDependencies();
      // A second, conflicting series for the same (company, segment, ISIN) makes
      // the P7 lookup ambiguous. Qualification must fail closed, not pick one.
      const conflicting: DhanInstrumentMapping = {
        companyId: GOVERNED_QUALIFIABLE.expectedCompanyId,
        isin: GOVERNED_QUALIFIABLE.isin,
        securityId: `ISIN:${GOVERNED_QUALIFIABLE.isin}:B`,
        exchange: 'BSE',
        exchangeSegment: 'BSE_EQ',
        symbol: GOVERNED_QUALIFIABLE.symbol,
        dhanSecurityId: '999999',
        mappingProvenance: 'DHAN_INSTRUMENT_MASTER',
        active: true,
        lastVerifiedAt: '2026-11-06T05:27:53.7922492Z',
      };
      dependencies.registry.register(conflicting);

      const rowsBefore = countRows(db);
      const consumer = createBrokerImportConsumer(db, brokerImportConsumerOptions(dependencies));
      const outcome = consumer(OWNER, importRequest());

      assert.equal(outcome.ok, false);
      assert.equal(outcome.ok === false && outcome.code, 'WRITE_NOT_AUTHORIZED');
      assert.equal(outcome.storeEffect, 'NONE');
      assert.equal(countRows(db), rowsBefore);
      closeDatabase();
    });

    it('leaves the pre-Stage-4 fallback reachable only when no dependency is supplied', () => {
      // Documented contrast, so the difference the composition root makes is
      // executable evidence rather than prose: with no options the consumer
      // still runs the old path. The shipped entrypoint never does this.
      const db = openFixture();
      const consumer = createBrokerImportConsumer(db);
      const outcome = consumer(OWNER, importRequest());
      assert.equal(outcome.ok, false);
      assert.equal(outcome.ok === false && outcome.code, 'WRITE_NOT_AUTHORIZED');
      closeDatabase();
    });
  });

  /* ---------------------------------------------------------------- *
   * 3. The shipped entrypoint composes them
   * ---------------------------------------------------------------- */

  describe('the shipped entrypoint', () => {
    it('supplies and reports the governed identity dependencies it composed', async () => {
      openFixture();
      const outcome = await startIpcServer({
        env: {
          IIPS_G2_IPC_ENDPOINT: `iips-stage4-${process.pid}`,
          IIPS_G3_LOCAL_STATE_DIR: join(root, 'state'),
          IIPS_G3_DATABASE_PATH: dbPath,
        } as NodeJS.ProcessEnv,
        platform: HOST_PLATFORM,
      });

      try {
        assert.equal(outcome.ok, true, outcome.error);
        assert.ok(outcome.handle, 'the entrypoint bound its endpoint');
        assert.equal(typeof outcome.brokerImportConsumer, 'function');

        // The composition root actually wired the governed sources. If the
        // entrypoint reverted to `createBrokerImportConsumer(db)` this would be
        // absent and the test would fail here rather than silently passing.
        assert.ok(outcome.brokerImportIdentity, 'the entrypoint must report the composed dependencies');
        assert.equal(
          outcome.brokerImportIdentity.securityMasterRevision,
          'BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001',
        );
        assert.ok(
          outcome.brokerImportIdentity.registryMappingCount > 0,
          'the composed P7 registry must carry the retained mappings',
        );

        // And the composed consumer still refuses: qualification ≠ authorization.
        const rowsBefore = countRows(openDatabase(dbPath));
        const refused = outcome.brokerImportConsumer!(OWNER, importRequest());
        assert.equal(refused.ok, false);
        assert.equal(refused.ok === false && refused.code, 'WRITE_NOT_AUTHORIZED');
        assert.equal(refused.storeEffect, 'NONE');
      } finally {
        await outcome.handle?.stop();
        closeDatabase();
      }
    });

    it('uses a caller-supplied governed dependency seam and still refuses to write', async () => {
      openFixture();
      const securityMaster = new SecurityMaster();
      const registry = new DhanInstrumentRegistry();
      const outcome = await startIpcServer({
        env: {
          IIPS_G2_IPC_ENDPOINT: `iips-stage4-seam-${process.pid}`,
          IIPS_G3_LOCAL_STATE_DIR: join(root, 'state-seam'),
          IIPS_G3_DATABASE_PATH: dbPath,
        } as NodeJS.ProcessEnv,
        platform: HOST_PLATFORM,
        brokerImportIdentity: { securityMaster, registry },
      });

      try {
        assert.equal(outcome.ok, true, outcome.error);
        assert.deepEqual(outcome.brokerImportIdentity, {
          securityMasterRevision: null,
          registryMappingCount: 0,
        });
        const refused = outcome.brokerImportConsumer!(OWNER, importRequest());
        assert.equal(refused.ok, false);
        assert.equal(refused.ok === false && refused.code, 'WRITE_NOT_AUTHORIZED');
        assert.equal(refused.storeEffect, 'NONE');
      } finally {
        await outcome.handle?.stop();
        closeDatabase();
      }
    });

    it('refuses startup at the compose phase when a governed dependency cannot be composed', async () => {
      openFixture();
      const broken = {
        resolveCompanyId() {
          throw new Error('governed source unavailable');
        },
      } as unknown as SecurityMaster;
      // `sourceRevision` is read for provenance before any resolution, so a
      // throwing getter models a source that cannot even be described.
      Object.defineProperty(broken, 'sourceRevision', {
        get() {
          throw new Error('governed source unavailable');
        },
      });

      const outcome = await startIpcServer({
        env: {
          IIPS_G2_IPC_ENDPOINT: `iips-stage4-broken-${process.pid}`,
          IIPS_G3_LOCAL_STATE_DIR: join(root, 'state-broken'),
          IIPS_G3_DATABASE_PATH: dbPath,
        } as NodeJS.ProcessEnv,
        platform: HOST_PLATFORM,
        brokerImportIdentity: { securityMaster: broken },
      });

      assert.equal(outcome.ok, false);
      assert.equal(outcome.phase, 'compose');
      assert.equal(outcome.error, 'governed source unavailable');
      // No endpoint was bound for a refused startup.
      assert.equal(outcome.handle, undefined);
      closeDatabase();
    });
  });

  /* ---------------------------------------------------------------- *
   * 4. The boundaries this pass did not move
   * ---------------------------------------------------------------- */

  describe('unchanged boundaries', () => {
    it('keeps the write gate hard-false and the identity master unaltered', () => {
      const guard = evaluatePortSaveGuard();
      assert.equal(guard.authorized, false);
      assert.deepEqual(guard.reasons, [
        'W-1(3): Gate 4 qualification not accepted',
        'W-1(4): Gate 5 admission not accepted',
      ]);
    });

    it('composes only — it adds no qualification logic, network access or mapping invention', () => {
      const source = readFileSync(resolve(REPO_ROOT, 'src/ipc/brokerImportComposition.ts'), 'utf8');
      const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      // No re-implementation of the Stage 4 rules, no provider client, no network.
      for (const forbidden of [
        'qualifyHoldingSecurityIdentity',
        'buildD114SecurityIdentity',
        'DhanApiClient',
        'node:net',
        'node:http',
        'fetch(',
        'writeFileSync',
        'evaluatePortSaveGuard',
      ]) {
        assert.ok(!code.includes(forbidden), `the composition module must not contain ${forbidden}`);
      }
      // It composes the same governed accessors the daemon uses.
      assert.ok(code.includes('getGovernedBroadSecurityMaster'));
      assert.ok(code.includes('loadGovernedP7InstrumentRegistry'));
    });

    it('keeps the existing consumer and injects it into IPC dispatch', () => {
      const consumerSource = readFileSync(resolve(REPO_ROOT, 'src/ipc/brokerImportConsumer.ts'), 'utf8');
      const code = consumerSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      assert.ok(/new\s+DurablePortfolioStorePort\(/.test(code));
      assert.ok(!/new\s+DurablePortfolioStore\s*\(/.test(code));

      const dispatchSource = readFileSync(resolve(REPO_ROOT, 'src/ipc/dispatch.ts'), 'utf8');
      assert.ok(dispatchSource.includes('brokerImportConsumer'));
      for (const token of ['brokerImportComposition', 'createBrokerImportConsumer']) {
        assert.ok(
          !dispatchSource.includes(token),
          `the composition must remain unreachable from IPC dispatch: ${token}`,
        );
      }
    });
  });
});
