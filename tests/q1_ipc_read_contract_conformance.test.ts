/**
 * Q1 — IPC read-path conformance to accepted contract v1 §6, as closed by the
 * effective CAP-03 DR-2 / DQ-1 **Option A** determination.
 *
 * AUTHORITY
 *   - PA decision record `IIPS-V3-CAP03-DR2-DQ1-PA-DECISION-2026-10-25-01`
 *     (IRR locus: `docs/integration/IIPS_v3.0_CAP03_ONE_PASS_PA_DECISION_AND_IRR_EXECUTION_2026-10-25.md`),
 *     §2: "add the seven approved values to the IPD v1 read results and expressly
 *     authorize only the three named IRR renames. Preserve all frozen G2 types and
 *     all other v1/G2 behavior."
 *   - The prior Gate 3 implementation-authority act, which fixes the v1 wire
 *     property names by reference to accepted contract v1 and requires them to be
 *     implemented exactly.
 *
 * WHAT THE PROVIDER MUST NOW SUPPLY (and what this suite pins over the REAL IPC endpoint)
 *
 *   | shape                | v1 fields already present                        | seven approved additions                                   | only permitted rename (IRR boundary) |
 *   |----------------------|--------------------------------------------------|------------------------------------------------------------|--------------------------------------|
 *   | `portfolio.list`     | portfolioId, portfolioName, revision,             | weightSumPercentage, provenanceDigest, isSaved             | holdingsCount → totalHoldingsCount    |
 *   |                      | holdingsCount, totalMarketValue, lastUpdated      |                                                            |                                      |
 *   | `portfolio.get`      | … the same summary fields, plus holdings,         | isSaved                                                    | holdingsCount → totalHoldingsCount    |
 *   |                      | contributions                                     |                                                            |                                      |
 *   | `portfolio.revisions`| revision, operation, committedAt, contentDigest?   | totalMarketValue, provenanceDigest, holdingsCount          | committedAt → createdAt              |
 *
 *   Every added value is projected from the row that owns it: the CURRENT revision
 *   row for list/get, and EACH HISTORICAL revision's own row for history. No value
 *   is re-derived, defaulted, or borrowed across revisions, and `isSaved` is never
 *   added to the frozen history-entry type.
 *
 *   `isSaved` follows the DQ-1 materialized-state rule and nothing else:
 *   MERGE/REPLACE → true, INITIAL/RESET → false. A tombstoned, missing or
 *   foreign-owned record stays unavailable and emits no field at all.
 *
 *   Fail-closed: missing, null, non-finite, wrong-typed or otherwise non-conforming
 *   required values refuse — they are never replaced by 0, '', a generated
 *   identifier or an inferred lifecycle. The refusal is the established
 *   contract-envelope Class A `UNAVAILABLE` outcome, which the IRR adapter maps to
 *   `UPSTREAM_UNAVAILABLE`; it is deliberately NOT `RESOURCE_UNAVAILABLE`, whose
 *   meaning (missing ≡ foreign ≡ tombstoned) must not be widened.
 *
 * WHAT THIS SUITE DOES **NOT** CLAIM
 *   It is a conformance fixture, not an admission. It opens only fixture stores under
 *   the OS temporary directory, writes binding rows and portfolio rows directly (Gate
 *   A′ provisioning is APPROVED and NOT EXECUTED; every write over the endpoint is
 *   still refused by Gate E W-1), and asserts shape. It claims no capability, no
 *   qualification (`QE 0/11`), no durability value (`durability`/`durable` stay
 *   absent under DR-3 / DQ-2), no Gate 5 read-pair admission, and no fence removal.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createConnection } from 'node:net';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase, closeDatabase } from '../src/persistence/connection.js';
import { ensureMigrations, migrationChecksum } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS, startIpcServer } from '../src/ipc/entrypoint.js';
import {
  IPC_OPERATIONS,
  IPC_READ_OPERATIONS,
  IPC_RESERVED_OPERATIONS,
  IPC_WRITE_OPERATIONS,
} from '../src/ipc/protocol.js';
import {
  ContractEnvelopeViolationError,
  DurablePortfolioStore,
  ResourceUnavailableError,
  evaluatePortSaveGuard,
  type HoldingInput,
  type OwnerRef,
} from '../src/persistence/portfolio_store.js';

const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
const OWNER: OwnerRef = { canonicalOwnerId: 'owner-contract', tenantId: 'tenant-contract' };
const FOREIGN_OWNER: OwnerRef = { canonicalOwnerId: 'owner-foreign', tenantId: 'tenant-foreign' };

/**
 * The three DQ-1 `portfolio.list` additions, the single `portfolio.get`
 * addition, and the three `portfolio.revisions` additions — exactly seven.
 */
const DR2_SEVEN_VALUES = Object.freeze([
  'weightSumPercentage',
  'provenanceDigest',
  'isSaved',
  'totalMarketValue',
  'holdingsCount',
] as const);

/** v1 wire names the provider must keep: the renames happen only in IRR. */
const SUMMARY_KEYS = [
  'holdingsCount',
  'isSaved',
  'lastUpdated',
  'portfolioId',
  'portfolioName',
  'provenanceDigest',
  'revision',
  'totalMarketValue',
  'weightSumPercentage',
];

const DETAIL_KEYS = [
  'contributions',
  'holdings',
  'holdingsCount',
  'isSaved',
  'lastUpdated',
  'portfolioId',
  'portfolioName',
  'provenanceDigest',
  'revision',
  'totalMarketValue',
  'weightSumPercentage',
];

const REVISION_KEYS = [
  'committedAt',
  'contentDigest',
  'holdingsCount',
  'operation',
  'provenanceDigest',
  'revision',
  'totalMarketValue',
];

const RENAMED_KEYS_IRR_OWNS = ['totalHoldingsCount', 'createdAt'];

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

interface HoldingSpec {
  readonly symbol: string;
  readonly marketValue: number;
  readonly weight: number;
}

function holding(spec: HoldingSpec): HoldingInput {
  return {
    symbol: spec.symbol,
    companyId: `C-${spec.symbol}`,
    quantity: 10,
    averageBuyPrice: 100,
    currentPrice: 110,
    marketValue: spec.marketValue,
    weightPercentage: spec.weight,
    active: true,
    sourceBroker: 'GENERIC',
    lineageDigest: `lineage-${spec.symbol}`,
    identityStatus: 'RESOLVED',
    resolutionDisposition: 'CANONICAL_P04',
  };
}

function totalOf(specs: readonly HoldingSpec[]): number {
  return specs.reduce((sum, spec) => sum + spec.marketValue, 0);
}

function weightSumOf(specs: readonly HoldingSpec[]): number {
  return specs.reduce((sum, spec) => sum + spec.weight, 0);
}

/** Deterministic fixture values — each revision is deliberately distinguishable. */
const INITIAL_HOLDINGS: readonly HoldingSpec[] = [
  { symbol: 'AAPL', marketValue: 1100, weight: 60 },
  { symbol: 'MSFT', marketValue: 1050, weight: 40 },
];
const MERGE_HOLDINGS: readonly HoldingSpec[] = [
  { symbol: 'AAPL', marketValue: 1500, weight: 50 },
  { symbol: 'MSFT', marketValue: 900, weight: 30 },
  { symbol: 'INFY', marketValue: 600, weight: 20 },
];
const REPLACE_HOLDINGS: readonly HoldingSpec[] = [
  { symbol: 'TCS', marketValue: 2500, weight: 100 },
];
const RESET_HOLDINGS: readonly HoldingSpec[] = [
  { symbol: 'WIPRO', marketValue: 0, weight: 0 },
];

/* ------------------------------------------------------------------ *
 * Wire helpers
 * ------------------------------------------------------------------ */

function frameFor(value: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8');
  const prefix = Buffer.allocUnsafe(4);
  prefix.writeUInt32BE(body.byteLength, 0);
  return Buffer.concat([prefix, body]);
}

function call(endpointPath: string, envelope: unknown): Promise<Buffer> {
  return new Promise((resolvePromise) => {
    const socket = createConnection({ path: endpointPath });
    const chunks: Buffer[] = [];
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.on('error', () => resolvePromise(Buffer.concat(chunks)));
    socket.on('close', () => resolvePromise(Buffer.concat(chunks)));
    socket.on('connect', () => socket.write(frameFor(envelope), () => socket.end()));
  });
}

interface WireFrame {
  ok: boolean;
  result?: unknown;
  outcome?: string;
  detail?: string;
}

function parseFrame(buffer: Buffer): WireFrame {
  assert.ok(buffer.byteLength > 4, 'expected a framed response');
  const declared = buffer.readUInt32BE(0);
  return JSON.parse(buffer.subarray(4, 4 + declared).toString('utf8')) as WireFrame;
}

function parseResult(buffer: Buffer): unknown {
  const frame = parseFrame(buffer);
  assert.equal(frame.ok, true, `expected a success frame, got ${String(frame.outcome)}`);
  return frame.result;
}

function keysOf(value: unknown): string[] {
  assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value));
  return Object.keys(value as Record<string, unknown>).sort();
}

/** Reads a repository file from the repo root (compiled runs execute in `dist/`). */
function readRepoSource(relativePath: string): string {
  const path = resolve(process.cwd(), relativePath);
  assert.ok(existsSync(path), `expected ${relativePath} in the repository root`);
  return readFileSync(path, 'utf8');
}

/** Removes block and line comments so source-text guards inspect code only. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/* ------------------------------------------------------------------ *
 * The IRR adapter's expected envelope
 *
 * The IRR consumer half is published in the sibling repository
 * `ramkivs/iips-review-recovered`. At PR #265 head
 * `c059c326c355b80c3224ad861dfecfb93963f112`, the adapter is blob
 * `1e20e98023f20f80ed61d8d32d070fdde677d3c7`
 * (`frontend/server/user-portfolio/ipcPortAdapter.ts`, 27,511 B) and the frozen
 * G2 contract is blob `e6b57bb8a021d8eb4b9b7572d12affc7de66be0b`.
 *
 * These mappers are a faithful test-local transcription of that adapter's
 * validation and mapping rules, because the IRR file cannot be imported across
 * the repository boundary. They exist so the real IPD wire output is judged by
 * the CONSUMER's rules rather than by the provider's own opinion of them.
 * ------------------------------------------------------------------ */

const G2_OPERATIONS = ['INITIAL', 'MERGE', 'REPLACE', 'RESET', 'DELETE'];

class IrrEnvelopeRefusal extends Error {}

function irrRefuse(shape: string, key: string): never {
  throw new IrrEnvelopeRefusal(`The ${shape} result has a missing or non-conforming ${key} (contract-envelope violation).`);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidPortfolioId(value: unknown): value is string {
  if (!isNonBlankString(value)) return false;
  if (value !== value.trim()) return false;
  if (value.includes('/')) return false;
  return true;
}

function isValidPortfolioName(value: unknown): value is string {
  return isNonBlankString(value) && value.length <= 256;
}

function isValidExpectedRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function irrRequireNonNegativeInteger(record: Record<string, unknown>, key: string, shape: string): void {
  if (!isValidExpectedRevision(record[key])) irrRefuse(shape, key);
}

function irrRequireStrings(record: Record<string, unknown>, keys: readonly string[], shape: string): void {
  for (const key of keys) if (typeof record[key] !== 'string') irrRefuse(shape, key);
}

function irrRequireNumbers(record: Record<string, unknown>, keys: readonly string[], shape: string): void {
  for (const key of keys) {
    const value = record[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) irrRefuse(shape, key);
  }
}

function irrRequireArrays(record: Record<string, unknown>, keys: readonly string[], shape: string): void {
  for (const key of keys) if (!Array.isArray(record[key])) irrRefuse(shape, key);
}

function irrAsRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new IrrEnvelopeRefusal('The upstream result is not an object (contract-envelope violation).');
  }
  return value as Record<string, unknown>;
}

function irrRequireSummaryBase(record: Record<string, unknown>, shape: string): void {
  if (!isValidPortfolioId(record.portfolioId)) irrRefuse(shape, 'portfolioId');
  if (!isValidPortfolioName(record.portfolioName)) irrRefuse(shape, 'portfolioName');
  if (!isNonBlankString(record.lastUpdated)) irrRefuse(shape, 'lastUpdated');
  irrRequireNonNegativeInteger(record, 'revision', shape);
  irrRequireNonNegativeInteger(record, 'holdingsCount', shape);
  irrRequireNumbers(record, ['totalMarketValue'], shape);
}

/** IRR `toG2Summary` — maps `holdingsCount` → `totalHoldingsCount`, nothing else. */
function irrMapSummary(row: unknown): Record<string, unknown> {
  const record = irrAsRecord(row);
  irrRequireSummaryBase(record, 'portfolio.list');
  irrRequireNumbers(record, ['weightSumPercentage'], 'portfolio.list');
  irrRequireStrings(record, ['provenanceDigest'], 'portfolio.list');
  if (typeof record.isSaved !== 'boolean') irrRefuse('portfolio.list', 'isSaved');
  return {
    portfolioId: record.portfolioId,
    portfolioName: record.portfolioName,
    revision: record.revision,
    totalMarketValue: record.totalMarketValue,
    totalHoldingsCount: record.holdingsCount,
    weightSumPercentage: record.weightSumPercentage,
    lastUpdated: record.lastUpdated,
    provenanceDigest: record.provenanceDigest,
    isSaved: record.isSaved,
  };
}

/** IRR `toG2View` — same values, plus holdings/contributions and the DR-3/DR-4r guards. */
function irrMapView(value: unknown): Record<string, unknown> {
  const record = irrAsRecord(value);
  irrRequireSummaryBase(record, 'portfolio view');
  irrRequireNumbers(record, ['weightSumPercentage'], 'portfolio view');
  irrRequireStrings(record, ['provenanceDigest'], 'portfolio view');
  if (typeof record.isSaved !== 'boolean') irrRefuse('portfolio view', 'isSaved');
  irrRequireArrays(record, ['holdings', 'contributions'], 'portfolio view');
  if (Object.prototype.hasOwnProperty.call(record, 'durability') ||
      Object.prototype.hasOwnProperty.call(record, 'durable')) {
    throw new IrrEnvelopeRefusal('The portfolio view contains unadmitted durability/durable properties.');
  }
  if ((record.contributions as unknown[]).length !== 0) {
    throw new IrrEnvelopeRefusal('The portfolio view contains non-empty contributions outside the authorized DR-4r scope.');
  }
  return {
    portfolioId: record.portfolioId,
    portfolioName: record.portfolioName,
    revision: record.revision,
    holdings: record.holdings,
    totalMarketValue: record.totalMarketValue,
    totalHoldingsCount: record.holdingsCount,
    weightSumPercentage: record.weightSumPercentage,
    lastUpdated: record.lastUpdated,
    provenanceDigest: record.provenanceDigest,
    isSaved: record.isSaved,
    contributions: record.contributions,
  };
}

/** IRR `toG2RevisionEntry` — maps `committedAt` → `createdAt`, nothing else. */
function irrMapRevisionEntry(row: unknown): Record<string, unknown> {
  const record = irrAsRecord(row);
  const shape = 'portfolio.revisions';
  irrRequireNonNegativeInteger(record, 'revision', shape);
  irrRequireStrings(record, ['operation', 'committedAt'], shape);
  if (!isNonBlankString(record.committedAt)) irrRefuse(shape, 'committedAt');
  irrRequireNonNegativeInteger(record, 'holdingsCount', shape);
  irrRequireNumbers(record, ['totalMarketValue'], shape);
  irrRequireStrings(record, ['provenanceDigest'], shape);
  if (!G2_OPERATIONS.includes(record.operation as string)) irrRefuse(shape, 'operation');
  if (record.contentDigest !== undefined && typeof record.contentDigest !== 'string') {
    irrRefuse(shape, 'contentDigest');
  }
  return {
    revision: record.revision,
    operation: record.operation,
    totalMarketValue: record.totalMarketValue,
    provenanceDigest: record.provenanceDigest,
    holdingsCount: record.holdingsCount,
    createdAt: record.committedAt,
  };
}

/* ================================================================== *
 * Part 1 — the approved envelope over the real IPC endpoint
 * ================================================================== */

describe('q1 / IPC read path conforms to CAP-03 DR-2 Option A', () => {
  let root: string;
  let db: DatabaseSync;
  let databasePath: string;
  let store: DurablePortfolioStore;

  function startServer(name: string) {
    return startIpcServer({
      env: {
        IIPS_G2_IPC_ENDPOINT: `iips-q1c-${name}-${process.pid}`,
        IIPS_G3_LOCAL_STATE_DIR: join(root, `state-${name}`),
        IIPS_G3_DATABASE_PATH: databasePath,
      } as NodeJS.ProcessEnv,
      platform: HOST_PLATFORM,
    });
  }

  async function read(op: string, payload?: Record<string, unknown>): Promise<WireFrame> {
    const outcome = await startServer(op.replace('.', '-'));
    assert.equal(outcome.ok, true, outcome.error);
    try {
      const envelope: Record<string, unknown> = { v: 1, op, requestId: `q1c-${op}` };
      if (payload !== undefined) envelope.payload = payload;
      return parseFrame(await call(outcome.target!.path, envelope));
    } finally {
      await outcome.handle!.stop();
    }
  }

  function summaryOf(rows: unknown, portfolioId: string): Record<string, unknown> {
    assert.ok(Array.isArray(rows), 'the list result is the array itself');
    const row = (rows as Array<Record<string, unknown>>).find((entry) => entry.portfolioId === portfolioId);
    assert.ok(row, `expected a summary row for ${portfolioId}`);
    return row;
  }

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'q1-contract-'));
    databasePath = join(root, 'store', 'ipd.db');
    db = openDatabase(databasePath);
    ensureMigrations(db, GATE3_MIGRATIONS);

    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('b-contract', 'operator', 'ACTIVE', ?, ?, NULL)",
    ).run(now, now);
    db.prepare(
      "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('m-contract', 'b-contract', ?, ?, 'ACTIVE', ?, ?, NULL)",
    ).run(OWNER.tenantId, OWNER.canonicalOwnerId, now, now);

    // The store's own write path is used directly: the endpoint refuses every
    // write under Gate E W-1, and these fixture rows are not admitted writes.
    store = new DurablePortfolioStore(db);

    // INITIAL — the lifecycle's false case.
    store.create(OWNER, 'P-INITIAL', {
      name: 'Initial portfolio',
      holdings: INITIAL_HOLDINGS.map(holding),
      provenanceDigest: 'prov-initial',
      contentDigest: 'digest-initial',
    });

    // MERGE — the lifecycle's first true case.
    store.create(OWNER, 'P-MERGED', {
      name: 'Merged portfolio',
      holdings: INITIAL_HOLDINGS.map(holding),
      provenanceDigest: 'prov-merged-1',
      contentDigest: 'digest-merged-1',
    });
    store.save(
      OWNER,
      'P-MERGED',
      {
        name: 'Merged portfolio',
        operation: 'MERGE',
        holdings: MERGE_HOLDINGS.map(holding),
        provenanceDigest: 'prov-merged-2',
        contentDigest: 'digest-merged-2',
      },
      1,
    );

    // REPLACE — the lifecycle's second true case.
    store.create(OWNER, 'P-REPLACED', {
      name: 'Replaced portfolio',
      holdings: INITIAL_HOLDINGS.map(holding),
      provenanceDigest: 'prov-replaced-1',
      contentDigest: 'digest-replaced-1',
    });
    store.save(
      OWNER,
      'P-REPLACED',
      {
        name: 'Replaced portfolio',
        operation: 'REPLACE',
        holdings: REPLACE_HOLDINGS.map(holding),
        provenanceDigest: 'prov-replaced-2',
        contentDigest: 'digest-replaced-2',
      },
      1,
    );

    // RESET — a positive revision that is still NOT saved.
    store.create(OWNER, 'P-RESET', {
      name: 'Reset portfolio',
      holdings: INITIAL_HOLDINGS.map(holding),
      provenanceDigest: 'prov-reset-1',
      contentDigest: 'digest-reset-1',
    });
    store.reset(
      OWNER,
      'P-RESET',
      {
        name: 'Reset portfolio',
        holdings: RESET_HOLDINGS.map(holding),
        provenanceDigest: 'prov-reset-2',
        contentDigest: 'digest-reset-2',
      },
      1,
    );

    // An empty stored provenance digest is a stored FACT, not a default.
    store.create(OWNER, 'P-EMPTY-DIGEST', {
      name: 'Empty digest portfolio',
      holdings: [{ symbol: 'EMPTY', marketValue: 0, weight: 0 }].map(holding),
      provenanceDigest: '',
      contentDigest: 'digest-empty',
    });

    // History — four revisions, each with its OWN stored values.
    store.create(OWNER, 'P-HISTORY', {
      name: 'History portfolio',
      holdings: [{ symbol: 'AAA', marketValue: 1000, weight: 100 }].map(holding),
      provenanceDigest: 'prov-h1',
      contentDigest: 'digest-h1',
    });
    store.save(
      OWNER,
      'P-HISTORY',
      {
        name: 'History portfolio',
        operation: 'MERGE',
        holdings: [
          { symbol: 'AAA', marketValue: 1000, weight: 60 },
          { symbol: 'BBB', marketValue: 500, weight: 40 },
        ].map(holding),
        provenanceDigest: 'prov-h2',
        contentDigest: 'digest-h2',
      },
      1,
    );
    store.save(
      OWNER,
      'P-HISTORY',
      {
        name: 'History portfolio',
        operation: 'REPLACE',
        holdings: [{ symbol: 'CCC', marketValue: 700, weight: 100 }].map(holding),
        provenanceDigest: 'prov-h3',
        contentDigest: 'digest-h3',
      },
      2,
    );
    store.reset(
      OWNER,
      'P-HISTORY',
      {
        name: 'History portfolio',
        holdings: [{ symbol: 'DDD', marketValue: 0, weight: 0 }].map(holding),
        provenanceDigest: 'prov-h4',
        contentDigest: 'digest-h4',
      },
      3,
    );

    // Tombstoned and foreign records must stay unavailable.
    const tombRevision = store.create(OWNER, 'P-TOMBSTONED', {
      name: 'Tombstoned portfolio',
      holdings: INITIAL_HOLDINGS.map(holding),
      provenanceDigest: 'prov-tomb',
      contentDigest: 'digest-tomb',
    });
    store.delete(OWNER, 'P-TOMBSTONED', tombRevision);

    // A portfolio whose contribution ledger is empty. `create`/`save`/`reset` always
    // append exactly one contribution row, so this state is produced at fixture level:
    // it is the shape the IRR adapter's DR-4r / DQ-3 guard admits for a full view.
    store.create(OWNER, 'P-NO-CONTRIBUTIONS', {
      name: 'No contribution ledger',
      holdings: INITIAL_HOLDINGS.map(holding),
      provenanceDigest: 'prov-no-contributions',
      contentDigest: 'digest-no-contributions',
    });
    db.prepare('DELETE FROM portfolio_contributions WHERE portfolio_id = ?').run('P-NO-CONTRIBUTIONS');

    store.create(FOREIGN_OWNER, 'P-FOREIGN', {
      name: 'Foreign portfolio',
      holdings: INITIAL_HOLDINGS.map(holding),
      provenanceDigest: 'prov-foreign',
      contentDigest: 'digest-foreign',
    });
  });

  after(() => {
    closeDatabase();
    rmSync(root, { recursive: true, force: true });
  });

  /* ---------------- 1. the seven approved values, exactly mapped ---------------- */

  it('portfolio.list supplies all seven approved values from the current revision row', async () => {
    const frame = await read('portfolio.list');
    assert.equal(frame.ok, true, frame.detail);
    const row = summaryOf(frame.result, 'P-INITIAL');

    assert.deepEqual(keysOf(row), SUMMARY_KEYS, 'the summary key set is exactly the v1 keys plus the three additions');
    assert.equal(row.portfolioId, 'P-INITIAL');
    assert.equal(row.portfolioName, 'Initial portfolio');
    assert.equal(row.revision, 1);
    assert.equal(row.holdingsCount, INITIAL_HOLDINGS.length);
    assert.equal(row.totalMarketValue, totalOf(INITIAL_HOLDINGS));
    assert.equal(row.weightSumPercentage, weightSumOf(INITIAL_HOLDINGS));
    assert.equal(row.provenanceDigest, 'prov-initial');
    assert.equal(row.isSaved, false, 'INITIAL is not saved');
    assert.equal(typeof row.lastUpdated, 'string');
    assert.ok(!Number.isNaN(Date.parse(row.lastUpdated as string)), 'lastUpdated is a real timestamp');

    // The additions are stored values, not re-derivations of the holdings array.
    assert.equal(row.weightSumPercentage, 100);
    assert.equal(row.totalMarketValue, 2150);
  });

  it('portfolio.get supplies the same current-revision values plus the single view addition', async () => {
    const frame = await read('portfolio.get', { portfolioId: 'P-INITIAL' });
    assert.equal(frame.ok, true, frame.detail);
    const detail = frame.result as Record<string, unknown>;

    assert.deepEqual(keysOf(detail), DETAIL_KEYS);
    assert.equal(detail.portfolioId, 'P-INITIAL');
    assert.equal(detail.portfolioName, 'Initial portfolio');
    assert.equal(detail.revision, 1);
    assert.equal(detail.holdingsCount, INITIAL_HOLDINGS.length);
    assert.equal(detail.totalMarketValue, totalOf(INITIAL_HOLDINGS));
    assert.equal(detail.weightSumPercentage, weightSumOf(INITIAL_HOLDINGS));
    assert.equal(detail.provenanceDigest, 'prov-initial');
    assert.equal(detail.isSaved, false);
    assert.equal((detail.holdings as unknown[]).length, INITIAL_HOLDINGS.length);

    // DR-3 / DQ-2: still absent — no claim, no sentinel.
    assert.ok(!('durable' in detail), 'no `durable` field is emitted');
    assert.ok(!('durability' in detail), 'no `durability` field is emitted');
  });

  it('portfolio.revisions supplies the three stored-row values for the current revision', async () => {
    const frame = await read('portfolio.revisions', { portfolioId: 'P-INITIAL' });
    assert.equal(frame.ok, true, frame.detail);
    const entries = frame.result as Array<Record<string, unknown>>;
    assert.equal(entries.length, 1);
    const [entry] = entries;

    assert.deepEqual(keysOf(entry), REVISION_KEYS);
    assert.equal(entry.revision, 1);
    assert.equal(entry.operation, 'INITIAL');
    assert.equal(entry.totalMarketValue, totalOf(INITIAL_HOLDINGS));
    assert.equal(entry.provenanceDigest, 'prov-initial');
    assert.equal(entry.holdingsCount, INITIAL_HOLDINGS.length);

    // `content_digest` is the revision's own computed content hash; the request's
    // `contentDigest` is the contribution-ledger key, not this column. Compare to
    // the stored row rather than assuming which value lands here.
    const storedDigest = db
      .prepare(
        'SELECT content_digest FROM portfolio_revisions WHERE canonical_owner_id = ? AND portfolio_id = ? AND revision = 1',
      )
      .get(OWNER.canonicalOwnerId, 'P-INITIAL') as { content_digest: string };
    assert.equal(entry.contentDigest, storedDigest.content_digest);
    assert.match(String(entry.contentDigest), /^[0-9a-f]{64}$/);
  });

  it('a stored empty provenance digest is passed through as stored, never replaced', async () => {
    const list = await read('portfolio.list');
    const row = summaryOf(list.result, 'P-EMPTY-DIGEST');
    assert.equal(row.provenanceDigest, '', 'the empty string is the stored value');

    const detail = await read('portfolio.get', { portfolioId: 'P-EMPTY-DIGEST' });
    assert.equal((detail.result as Record<string, unknown>).provenanceDigest, '');

    const history = await read('portfolio.revisions', { portfolioId: 'P-EMPTY-DIGEST' });
    assert.equal((history.result as Array<Record<string, unknown>>)[0].provenanceDigest, '');
  });

  /* ---------------- 2. the authorized renames, and no others ---------------- */

  it('keeps the v1 wire names: the three renames exist only at the IRR boundary', async () => {
    const list = await read('portfolio.list');
    const detail = await read('portfolio.get', { portfolioId: 'P-INITIAL' });
    const history = await read('portfolio.revisions', { portfolioId: 'P-INITIAL' });

    for (const [shape, value] of [
      ['portfolio.list', summaryOf(list.result, 'P-INITIAL')],
      ['portfolio.get', detail.result as Record<string, unknown>],
    ] as const) {
      for (const renamed of RENAMED_KEYS_IRR_OWNS) {
        assert.ok(!(renamed in value), `${shape} must not pre-apply the IRR rename ${renamed}`);
      }
      assert.ok('holdingsCount' in value, `${shape} keeps the v1 name holdingsCount`);
    }

    const [entry] = history.result as Array<Record<string, unknown>>;
    assert.ok('committedAt' in entry, 'the revision timestamp keeps the v1 name committedAt');
    assert.ok(!('createdAt' in entry), 'the revision timestamp is not renamed inside IPD');
  });

  it('the seven additions are exactly seven — no extra field was admitted', async () => {
    const v1Summary = ['portfolioId', 'portfolioName', 'revision', 'holdingsCount', 'totalMarketValue', 'lastUpdated'];
    const v1Revision = ['revision', 'operation', 'committedAt', 'contentDigest'];

    const list = await read('portfolio.list');
    const row = summaryOf(list.result, 'P-INITIAL');
    const summaryAdditions = keysOf(row).filter((key) => !v1Summary.includes(key));
    assert.deepEqual(summaryAdditions, ['isSaved', 'provenanceDigest', 'weightSumPercentage']);

    const detail = await read('portfolio.get', { portfolioId: 'P-INITIAL' });
    const viewAdditions = keysOf(detail.result).filter(
      (key) => !v1Summary.includes(key) && key !== 'holdings' && key !== 'contributions',
    );
    assert.deepEqual(viewAdditions, ['isSaved', 'provenanceDigest', 'weightSumPercentage']);

    const history = await read('portfolio.revisions', { portfolioId: 'P-INITIAL' });
    const revisionAdditions = keysOf((history.result as unknown[])[0]).filter((key) => !v1Revision.includes(key));
    assert.deepEqual(revisionAdditions, ['holdingsCount', 'provenanceDigest', 'totalMarketValue']);

    assert.equal(DR2_SEVEN_VALUES.length, 5, 'the seven approved values span three summary, one view and three revision entries');
    assert.deepEqual(
      [...summaryAdditions, ...revisionAdditions],
      ['isSaved', 'provenanceDigest', 'weightSumPercentage', 'holdingsCount', 'provenanceDigest', 'totalMarketValue'],
    );
  });

  /* ---------------- 3. the isSaved lifecycle ---------------- */

  it('isSaved is true exactly for a MERGE current revision', async () => {
    const list = await read('portfolio.list');
    const row = summaryOf(list.result, 'P-MERGED');
    assert.equal(row.revision, 2);
    assert.equal(row.operation, undefined, 'the raw operation is not exposed on the summary');
    assert.equal(row.isSaved, true);

    const detail = await read('portfolio.get', { portfolioId: 'P-MERGED' });
    assert.equal((detail.result as Record<string, unknown>).isSaved, true);
  });

  it('isSaved is true for a REPLACE current revision', async () => {
    const list = await read('portfolio.list');
    assert.equal(summaryOf(list.result, 'P-REPLACED').isSaved, true);

    const detail = await read('portfolio.get', { portfolioId: 'P-REPLACED' });
    assert.equal((detail.result as Record<string, unknown>).isSaved, true);
  });

  it('isSaved is false for an INITIAL current revision', async () => {
    const list = await read('portfolio.list');
    assert.equal(summaryOf(list.result, 'P-INITIAL').isSaved, false);
  });

  it('isSaved is false for a RESET current revision — a positive revision does not imply saved', async () => {
    const list = await read('portfolio.list');
    const row = summaryOf(list.result, 'P-RESET');
    assert.equal(row.revision, 2, 'the revision advanced');
    assert.equal(row.isSaved, false, 'RESET is not saved');
    assert.equal(row.totalMarketValue, 0);
    assert.equal(row.holdingsCount, 1);

    const detail = await read('portfolio.get', { portfolioId: 'P-RESET' });
    const view = detail.result as Record<string, unknown>;
    assert.equal(view.revision, 2);
    assert.equal(view.isSaved, false);
  });

  /* ---------------- 4. tombstoned / missing / foreign ---------------- */

  it('a tombstoned portfolio is unavailable and emits no field, including no isSaved', async () => {
    for (const op of ['portfolio.get', 'portfolio.revisions'] as const) {
      const frame = await read(op, { portfolioId: 'P-TOMBSTONED' });
      assert.equal(frame.ok, false, `${op} must refuse a tombstoned portfolio`);
      assert.equal(frame.outcome, 'RESOURCE_UNAVAILABLE');
      assert.ok(!('result' in frame), 'a refusal carries no result object');
    }
    const list = await read('portfolio.list');
    assert.ok(
      !(list.result as Array<Record<string, unknown>>).some((row) => row.portfolioId === 'P-TOMBSTONED'),
      'a tombstoned portfolio is absent from the list',
    );
  });

  it('a missing portfolio is unavailable and emits no field', async () => {
    for (const op of ['portfolio.get', 'portfolio.revisions'] as const) {
      const frame = await read(op, { portfolioId: 'P-DOES-NOT-EXIST' });
      assert.equal(frame.ok, false);
      assert.equal(frame.outcome, 'RESOURCE_UNAVAILABLE');
      assert.ok(!('result' in frame));
    }
  });

  it('a foreign-owned portfolio is unavailable and byte-identical to the missing case', async () => {
    const outcome = await startServer('foreign');
    assert.equal(outcome.ok, true, outcome.error);
    try {
      const missing = await call(outcome.target!.path, {
        v: 1,
        op: 'portfolio.get',
        payload: { portfolioId: 'P-DOES-NOT-EXIST' },
        requestId: 'same-id',
      });
      const foreign = await call(outcome.target!.path, {
        v: 1,
        op: 'portfolio.get',
        payload: { portfolioId: 'P-FOREIGN' },
        requestId: 'same-id',
      });
      const missingAgain = await call(outcome.target!.path, {
        v: 1,
        op: 'portfolio.get',
        payload: { portfolioId: 'P-DOES-NOT-EXIST' },
        requestId: 'same-id',
      });
      assert.ok(foreign.equals(missingAgain), 'foreign and missing frames are byte-identical');
      assert.equal(parseFrame(foreign).outcome, 'RESOURCE_UNAVAILABLE');
      assert.ok(!('result' in parseFrame(foreign)));
      // The endpoint is one-request-per-connection, so the first frame is used
      // only for the payload comparison above.
      assert.equal(parseFrame(missing).ok, false);
    } finally {
      await outcome.handle!.stop();
    }

    const list = await read('portfolio.list');
    assert.ok(
      !(list.result as Array<Record<string, unknown>>).some((row) => row.portfolioId === 'P-FOREIGN'),
      'the foreign portfolio is never listed under the resolved owner',
    );
  });

  /* ---------------- 5. historical revisions use their own stored rows ---------------- */

  it('each historical revision is projected from its own stored row, never the current one', async () => {
    const frame = await read('portfolio.revisions', { portfolioId: 'P-HISTORY' });
    assert.equal(frame.ok, true, frame.detail);
    const entries = frame.result as Array<Record<string, unknown>>;
    assert.equal(entries.length, 4);

    const stored = db
      .prepare(
        `SELECT revision, operation, created_at, content_digest, total_market_value, provenance_digest, holdings_count
           FROM portfolio_revisions
          WHERE canonical_owner_id = ? AND portfolio_id = ?
          ORDER BY revision`,
      )
      .all(OWNER.canonicalOwnerId, 'P-HISTORY') as unknown as Array<Record<string, unknown>>;
    assert.equal(stored.length, 4);

    for (const [index, entry] of entries.entries()) {
      const row = stored[index];
      assert.deepEqual(keysOf(entry), REVISION_KEYS);
      assert.equal(entry.revision, row.revision, 'the revision number is the stored one');
      assert.equal(entry.operation, row.operation, 'the operation is the stored one');
      assert.equal(entry.committedAt, row.created_at, 'committedAt is THAT row’s stored created_at');
      assert.equal(entry.totalMarketValue, row.total_market_value);
      assert.equal(entry.provenanceDigest, row.provenance_digest);
      assert.equal(entry.holdingsCount, row.holdings_count);
      assert.equal(entry.contentDigest, row.content_digest);
      assert.ok(!('isSaved' in entry), 'the frozen history-entry type never carries isSaved');
    }

    // The four rows genuinely differ, so a current-value shortcut could not
    // coincidentally produce the right answer.
    assert.deepEqual(entries.map((entry) => entry.operation), ['INITIAL', 'MERGE', 'REPLACE', 'RESET']);
    assert.deepEqual(entries.map((entry) => entry.totalMarketValue), [1000, 1500, 700, 0]);
    assert.deepEqual(entries.map((entry) => entry.holdingsCount), [1, 2, 1, 1]);
    assert.deepEqual(entries.map((entry) => entry.provenanceDigest), ['prov-h1', 'prov-h2', 'prov-h3', 'prov-h4']);
  });

  it('the current-revision projection reports only the last history row', async () => {
    const list = await read('portfolio.list');
    const row = summaryOf(list.result, 'P-HISTORY');
    assert.equal(row.revision, 4);
    assert.equal(row.totalMarketValue, 0, 'the current revision is the RESET row');
    assert.equal(row.holdingsCount, 1);
    assert.equal(row.provenanceDigest, 'prov-h4');
    assert.equal(row.isSaved, false, 'the current operation is RESET');
  });

  /* ---------------- 9. compatibility with the IRR adapter's envelope ---------------- */

  it('the real list/get/revisions envelopes are accepted by the IRR adapter rules', async () => {
    for (const portfolioId of ['P-INITIAL', 'P-MERGED', 'P-REPLACED', 'P-RESET', 'P-HISTORY']) {
      const list = await read('portfolio.list');
      const row = summaryOf(list.result, portfolioId);
      const summary = irrMapSummary(row);
      assert.deepEqual(keysOf(summary), [
        'isSaved', 'lastUpdated', 'portfolioId', 'portfolioName', 'provenanceDigest',
        'revision', 'totalHoldingsCount', 'totalMarketValue', 'weightSumPercentage',
      ]);
      assert.equal(summary.totalHoldingsCount, row.holdingsCount, 'the only summary rename is holdingsCount → totalHoldingsCount');
      assert.equal(summary.isSaved, row.isSaved);
      assert.ok(!('holdingsCount' in summary), 'the renamed key is not duplicated');

      const detail = await read('portfolio.get', { portfolioId });
      // DR-2 field conformance is judged on the view shape the IRR adapter admits.
      // A populated contribution ledger is refused by IRR's separate DR-4r / DQ-3
      // guard, which is asserted on its own below.
      if ((detail.result as Record<string, unknown>).contributions instanceof Array &&
          ((detail.result as Record<string, unknown>).contributions as unknown[]).length === 0) {
        const view = irrMapView(detail.result);
        assert.equal(view.totalHoldingsCount, row.holdingsCount);
        assert.equal(view.isSaved, row.isSaved);
        assert.ok(!('durable' in view) && !('durability' in view));
      }

      const history = await read('portfolio.revisions', { portfolioId });
      const historyRows = history.result as Array<Record<string, unknown>>;
      const mapped = historyRows.map(irrMapRevisionEntry);
      assert.equal(mapped.length, historyRows.length);
      for (const [index, entry] of mapped.entries()) {
        assert.deepEqual(keysOf(entry), [
          'createdAt', 'holdingsCount', 'operation', 'provenanceDigest', 'revision', 'totalMarketValue',
        ]);
        assert.equal(entry.createdAt, historyRows[index].committedAt, 'the only revision rename is committedAt → createdAt');
        assert.ok(!('committedAt' in entry), 'the renamed key is not duplicated');
        assert.ok(!('isSaved' in entry), 'history never gains isSaved');
      }
    }
  });

  it('the full view maps to the frozen G2 shape, and the DR-4r contribution boundary is explicit', async () => {
    // (a) An empty contribution ledger: every DR-2 view value maps, and the frozen
    // G2 shape is produced with only the authorized `holdingsCount` rename.
    const admitted = await read('portfolio.get', { portfolioId: 'P-NO-CONTRIBUTIONS' });
    assert.equal(admitted.ok, true, admitted.detail);
    const source = admitted.result as Record<string, unknown>;
    assert.deepEqual(source.contributions, [], 'the provider supplies an actually empty ledger');

    const view = irrMapView(source);
    assert.deepEqual(keysOf(view), [
      'contributions', 'holdings', 'isSaved', 'lastUpdated', 'portfolioId', 'portfolioName',
      'provenanceDigest', 'revision', 'totalHoldingsCount', 'totalMarketValue', 'weightSumPercentage',
    ]);
    assert.equal(view.provenanceDigest, 'prov-no-contributions');
    assert.equal(view.weightSumPercentage, source.weightSumPercentage);
    assert.equal(view.totalMarketValue, source.totalMarketValue);
    assert.equal(view.isSaved, false, 'the current operation is INITIAL');

    // (b) A populated ledger — the ordinary state after a broker import — is refused
    // by IRR's DQ-3 Option B guard, NOT by any DR-2 field. This is the exact
    // cross-repository boundary still open after DR-2: contribution projection is
    // out of scope for the first Gate 5 admission under DR-4r / DQ-3.
    const withLedger = await read('portfolio.get', { portfolioId: 'P-INITIAL' });
    const populated = withLedger.result as Record<string, unknown>;
    assert.ok((populated.contributions as unknown[]).length > 0);
    assert.throws(() => irrMapView(populated), IrrEnvelopeRefusal);
    try {
      irrMapView(populated);
    } catch (error) {
      assert.match(
        (error as Error).message,
        /non-empty contributions outside the authorized DR-4r scope/,
        'the refusal is the DR-4r contribution scope, not a missing DR-2 field',
      );
    }
  });

  it('the IRR adapter refuses the LEGACY pre-DR-2 shapes, so the change is observable', () => {
    // The pre-closure IPD summary (six keys) and revision entry (four keys) are
    // exactly what the published IRR adapter refuses. This pins the gap the
    // provider change closes, so a regression to the old shape cannot pass.
    assert.throws(
      () => irrMapSummary({ portfolioId: 'P-X', portfolioName: 'X', revision: 1, holdingsCount: 1, totalMarketValue: 1, lastUpdated: 'now' }),
      IrrEnvelopeRefusal,
    );
    assert.throws(
      () => irrMapRevisionEntry({ revision: 1, operation: 'INITIAL', committedAt: 'now' }),
      IrrEnvelopeRefusal,
    );
    assert.throws(() => irrMapSummary({}), IrrEnvelopeRefusal);
    assert.throws(() => irrMapRevisionEntry({}), IrrEnvelopeRefusal);
  });

  /* ---------------- 10. frozen interfaces, schema, routes and fences ---------------- */

  it('the migration set and its SQL checksums are unchanged — no schema change', () => {
    assert.deepEqual(
      GATE3_MIGRATIONS.map((migration) => migration.id),
      [
        '001_initial_schema',
        '002_audit_event_sequence',
        '003_local_principal_bindings',
        '004_portfolio_contribution_provenance',
      ],
    );
    assert.deepEqual(
      GATE3_MIGRATIONS.map(migrationChecksum),
      [
        '08e712fd323f547413618f0443ec361015b136285c28b519d967f02b6d9580ab',
        '01892a862c8a877c97403a938123fb575cb43f9445d4c5345aa209f5adae47ed',
        '7967acc06584811df9cf37e05b84d78d6126b6dae979ee79e0523dfce924004e',
        '0dbf90c129154d8c547b6c5876157877c5e12790ebf2b35c741640751ea7b0ac',
      ],
      'the applied schema is byte-frozen: no migration was added, removed or edited',
    );
  });

  it('the closed IPC operation set is unchanged — no new operation or route', () => {
    assert.deepEqual(
      [...IPC_READ_OPERATIONS].sort(),
      ['portfolio.get', 'portfolio.list', 'portfolio.revisions'],
    );
    assert.deepEqual(
      [...IPC_WRITE_OPERATIONS].sort(),
      ['portfolio.create', 'portfolio.delete', 'portfolio.reset', 'portfolio.save'],
    );
    assert.equal(IPC_OPERATIONS.length, 7);
    assert.deepEqual([...IPC_RESERVED_OPERATIONS], ['portfolio.analytics']);
    assert.ok(!(IPC_OPERATIONS as readonly string[]).includes('portfolio.analytics'), 'the reserved operation stays outside the closed set');
  });

  it('no user-portfolio HTTP route exists in this repository — the fence is structural', () => {
    assert.ok(!existsSync(resolve(process.cwd(), 'frontend', 'server')), 'IPD ships no frontend/server route tier');
    const ipcSources = ['src/ipc/dispatch.ts', 'src/ipc/entrypoint.ts', 'src/ipc/protocol.ts'];
    for (const path of ipcSources) {
      const code = stripComments(readRepoSource(path));
      assert.ok(!/user-portfolios?/.test(code), `${path} must not name a user-portfolio route`);
      assert.ok(!/\bexpress\b|\bhttp\.createServer\b|createServer\(\s*\{?\s*port/.test(code), `${path} must not open an HTTP surface`);
    }
  });

  it('the write gate, the durable vocabulary and the read projections keep their boundaries', () => {
    // W-1 remains hard-false: nothing in this pass authorized a write.
    const guard = evaluatePortSaveGuard();
    assert.equal(guard.authorized, false);
    assert.deepEqual(guard.reasons, [
      'W-1(3): Gate 4 qualification not accepted',
      'W-1(4): Gate 5 admission not accepted',
    ]);

    const code = stripComments(readRepoSource('src/persistence/portfolio_store.ts'));
    assert.ok(!/COALESCE\s*\(/.test(code), 'the read projections fabricate no fallback via COALESCE');
    assert.ok(!/\?\?\s*0\b/.test(code), 'no `?? 0` numeric default remains in the store');
    assert.ok(!/\?\?\s*''/.test(code), 'no `?? \'\'` empty-string default remains in the store');
    assert.ok(!/totalHoldingsCount/.test(code), 'the G2 rename is not pre-applied in the provider');
    assert.ok(
      !/readonly\s+totalHoldingsCount|totalHoldingsCount\s*:/.test(code),
      'no duplicate G2-named provider field was introduced',
    );

    // `isSaved` belongs to the current-revision projections only.
    const revisionsBody = /revisions\(owner: OwnerRef, portfolioId: string\): RevisionEntry\[\] \{([\s\S]*?)\n  \}/.exec(code);
    assert.ok(revisionsBody, 'the revisions projection is present');
    assert.ok(!/isSaved/.test(revisionsBody[1]), 'the history projection never emits isSaved');

    // `durability`/`durable` are never emitted by the read paths.
    assert.ok(!/durability\s*:|durable\s*:/.test(code), 'no durability property is emitted by the store');
  });
});

/* ================================================================== *
 * Part 2 — fail-closed refusal on malformed stored values
 *
 * The malformed rows are written directly to a separate fixture store. Every
 * required column is NOT NULL in the frozen schema, so the reachable malformed
 * states are exactly the ones below: a missing current-revision row (NULLs from
 * the LEFT JOIN), SQLite's dynamic-typing escapes (a REAL in an INTEGER column,
 * text in a REAL column, an out-of-range REAL), a blank string, and a stored
 * operation outside the four lifecycle values a materialized state exists for.
 * ================================================================== */

describe('q1 / DR-2 provider refusal: no fabricated zeros, strings or lifecycles', () => {
  let root: string;
  let db: DatabaseSync;
  let databasePath: string;
  let store: DurablePortfolioStore;
  let rootId: number;

  const purge = (portfolioId: string): void => {
    db.prepare('DELETE FROM portfolio_holdings WHERE portfolio_id = ?').run(portfolioId);
    db.prepare('DELETE FROM portfolio_contributions WHERE portfolio_id = ?').run(portfolioId);
    db.prepare('DELETE FROM portfolio_revisions WHERE portfolio_id = ?').run(portfolioId);
    db.prepare('DELETE FROM portfolios WHERE portfolio_id = ?').run(portfolioId);
  };

  const insertPortfolio = (
    portfolioId: string,
    overrides: Record<string, unknown> = {},
    ownerRef: OwnerRef = OWNER,
  ): void => {
    const values = {
      portfolio_id: portfolioId,
      canonical_owner_id: ownerRef.canonicalOwnerId,
      tenant_id: ownerRef.tenantId,
      portfolio_name: `Fixture ${portfolioId}`,
      current_revision: 1,
      status: 'ACTIVE',
      created_at: '2026-10-25T00:00:00.000Z',
      updated_at: '2026-10-25T00:00:00.000Z',
      deleted_at: null,
      ...overrides,
    };
    db.prepare(
      `INSERT INTO portfolios (portfolio_id, canonical_owner_id, tenant_id, portfolio_name,
                               current_revision, status, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      values.portfolio_id,
      values.canonical_owner_id,
      values.tenant_id,
      values.portfolio_name,
      values.current_revision,
      values.status,
      values.created_at,
      values.updated_at,
      values.deleted_at,
    );
  };

  const insertRevision = (
    portfolioId: string,
    overrides: Record<string, unknown> = {},
    ownerRef: OwnerRef = OWNER,
  ): void => {
    const values = {
      portfolio_id: portfolioId,
      canonical_owner_id: ownerRef.canonicalOwnerId,
      revision: 1,
      operation: 'INITIAL',
      total_market_value: 1000,
      weight_sum_percentage: 100,
      holdings_count: 1,
      provenance_digest: 'prov-fixture',
      content_digest: 'digest-fixture',
      created_at: '2026-10-25T00:00:00.000Z',
      ...overrides,
    };
    db.prepare(
      `INSERT INTO portfolio_revisions (portfolio_id, canonical_owner_id, revision, operation,
                                        total_market_value, weight_sum_percentage, holdings_count,
                                        provenance_digest, content_digest, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      values.portfolio_id,
      values.canonical_owner_id,
      values.revision,
      values.operation,
      values.total_market_value,
      values.weight_sum_percentage,
      values.holdings_count,
      values.provenance_digest,
      values.content_digest,
      values.created_at,
    );
  };

  const updateRevision = (portfolioId: string, column: string, value: unknown): void => {
    db.prepare(`UPDATE portfolio_revisions SET ${column} = ? WHERE portfolio_id = ?`).run(value as never, portfolioId);
  };

  const updatePortfolio = (portfolioId: string, column: string, value: unknown): void => {
    db.prepare(`UPDATE portfolios SET ${column} = ? WHERE portfolio_id = ?`).run(value as never, portfolioId);
  };

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'q1-refusal-'));
    databasePath = join(root, 'store', 'ipd.db');
    db = openDatabase(databasePath);
    ensureMigrations(db, GATE3_MIGRATIONS);
    rootId = process.pid;

    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('b-refusal', 'operator', 'ACTIVE', ?, ?, NULL)",
    ).run(now, now);
    db.prepare(
      "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('m-refusal', 'b-refusal', ?, ?, 'ACTIVE', ?, ?, NULL)",
    ).run(OWNER.tenantId, OWNER.canonicalOwnerId, now, now);

    store = new DurablePortfolioStore(db);
  });

  after(() => {
    closeDatabase();
    rmSync(root, { recursive: true, force: true });
  });

  const expectRefusal = (work: () => unknown, label: string): ContractEnvelopeViolationError => {
    let thrown: unknown;
    try {
      work();
    } catch (error) {
      thrown = error;
    }
    assert.ok(thrown !== undefined, `${label}: expected a refusal, but a value was returned`);
    assert.ok(
      thrown instanceof ContractEnvelopeViolationError,
      `${label}: expected ContractEnvelopeViolationError, got ${(thrown as Error)?.name}: ${(thrown as Error)?.message}`,
    );
    assert.ok(
      !(thrown instanceof ResourceUnavailableError),
      `${label}: a malformed store row must not be reported as a missing/foreign/tombstoned resource`,
    );
    return thrown as ContractEnvelopeViolationError;
  };

  it('refuses a portfolio whose current revision row is missing instead of fabricating zeros', () => {
    const id = `P-NO-REVISION-${rootId}`;
    insertPortfolio(id, { current_revision: 7 });
    try {
      const error = expectRefusal(() => store.list(OWNER), 'list with a missing current revision row');
      assert.match(error.message, /holdings_count|total_market_value|weight_sum_percentage|provenance_digest|operation/);
      expectRefusal(() => store.get(OWNER, id), 'get with a missing current revision row');
    } finally {
      purge(id);
    }
  });

  it('refuses null, non-finite, wrong-typed and fractional values in the list projection', () => {
    const scenarios: Array<[string, string, unknown]> = [
      ['non-finite total_market_value', 'total_market_value', Number.POSITIVE_INFINITY],
      ['text total_market_value', 'total_market_value', 'not-a-number'],
      ['fractional holdings_count', 'holdings_count', 1.5],
      ['negative holdings_count', 'holdings_count', -1],
      ['non-finite weight_sum_percentage', 'weight_sum_percentage', Number.POSITIVE_INFINITY],
      // A BLOB is the reachable non-string value: the TEXT column's affinity would
      // convert a bound number back to text, but it leaves a BLOB untouched.
      ['blob provenance_digest', 'provenance_digest', new Uint8Array([0, 255, 1])],
      ['blob total_market_value', 'total_market_value', new Uint8Array([7])],
      // The schema CHECK constrains `operation` to the five contract values, so a
      // blank or unknown operation is not storable; a stored DELETE on an ACTIVE
      // portfolio is the reachable "no lawful isSaved" case.
      ['DELETE current operation', 'operation', 'DELETE'],
    ];

    for (const [label, column, value] of scenarios) {
      const id = `P-LIST-${column}-${scenarios.findIndex((entry) => entry[0] === label)}-${rootId}`;
      insertPortfolio(id);
      insertRevision(id);
      updateRevision(id, column, value);
      try {
        const error = expectRefusal(() => store.list(OWNER), `list / ${label}`);
        assert.match(error.message, new RegExp(column), `the refusal names ${column}`);
        assert.ok(!error.message.includes('fabricated value'), 'no value is fabricated in the message');
      } finally {
        purge(id);
      }
    }
  });

  it('refuses blank or non-string identity and timestamp columns in the base projection', () => {
    const scenarios: Array<[string, string, string, unknown]> = [
      ['blank portfolio_name', 'portfolios', 'portfolio_name', '   '],
      ['blank updated_at', 'portfolios', 'updated_at', ''],
      ['text current_revision', 'portfolios', 'current_revision', 'one'],
      ['negative current_revision', 'portfolios', 'current_revision', -2],
    ];

    for (const [label, table, column, value] of scenarios) {
      const id = `P-BASE-${scenarios.findIndex((entry) => entry[0] === label)}-${rootId}`;
      insertPortfolio(id);
      insertRevision(id);
      try {
        if (table === 'portfolios') updatePortfolio(id, column, value);
        else updateRevision(id, column, value);
        expectRefusal(() => store.list(OWNER), `list / ${label}`);
        expectRefusal(() => store.get(OWNER, id), `get / ${label}`);
      } finally {
        purge(id);
      }
    }
  });

  it('refuses malformed values in the get projection', () => {
    const scenarios: Array<[string, string, unknown]> = [
      ['non-finite total_market_value', 'total_market_value', Number.POSITIVE_INFINITY],
      ['text weight_sum_percentage', 'weight_sum_percentage', 'one hundred'],
      ['fractional holdings_count', 'holdings_count', 2.5],
      ['DELETE current operation', 'operation', 'DELETE'],
      ['blob provenance_digest', 'provenance_digest', new Uint8Array([9, 9])],
    ];

    for (const [label, column, value] of scenarios) {
      const id = `P-GET-${scenarios.findIndex((entry) => entry[0] === label)}-${rootId}`;
      insertPortfolio(id);
      insertRevision(id);
      updateRevision(id, column, value);
      try {
        expectRefusal(() => store.get(OWNER, id), `get / ${label}`);
      } finally {
        purge(id);
      }
    }
  });

  it('refuses malformed values in the history projection', () => {
    const scenarios: Array<[string, string, unknown]> = [
      ['negative revision', 'revision', -1],
      ['fractional holdings_count', 'holdings_count', 1.25],
      ['text total_market_value', 'total_market_value', 'n/a'],
      ['non-finite total_market_value', 'total_market_value', Number.POSITIVE_INFINITY],
      ['blank created_at', 'created_at', '  '],
      ['blob provenance_digest', 'provenance_digest', new Uint8Array([4, 2])],
      ['blob content_digest', 'content_digest', new Uint8Array([1])],
    ];

    for (const [label, column, value] of scenarios) {
      const id = `P-HIST-${scenarios.findIndex((entry) => entry[0] === label)}-${rootId}`;
      insertPortfolio(id);
      insertRevision(id);
      // Keep the current revision readable so the refusal provably comes from the
      // history projection rather than from the availability check.
      insertRevision(id, { revision: 2, operation: 'MERGE' });
      db.prepare('UPDATE portfolios SET current_revision = 2 WHERE portfolio_id = ?').run(id);
      db.prepare(`UPDATE portfolio_revisions SET ${column} = ? WHERE portfolio_id = ? AND revision = 1`).run(value as never, id);
      try {
        expectRefusal(() => store.revisions(OWNER, id), `revisions / ${label}`);
        // The current revision itself still reads, proving the refusal is scoped
        // to the malformed historical row and is not a blanket outage.
        const current = store.get(OWNER, id);
        assert.equal(current.revision, 2);
        assert.equal(current.isSaved, true);
      } finally {
        purge(id);
      }
    }
  });

  it('accepts a NULL content_digest as an absent optional property, not a malformed value', () => {
    const id = `P-NULL-DIGEST-${rootId}`;
    insertPortfolio(id);
    insertRevision(id, { content_digest: null });
    try {
      const entries = store.revisions(OWNER, id);
      assert.equal(entries.length, 1);
      assert.ok(!('contentDigest' in entries[0]), 'a SQL NULL content_digest omits the optional property');
      assert.deepEqual(keysOf(entries[0]), [
        'committedAt', 'holdingsCount', 'operation', 'provenanceDigest', 'revision', 'totalMarketValue',
      ]);
    } finally {
      purge(id);
    }
  });

  it('still reports a missing, foreign or tombstoned portfolio as RESOURCE_UNAVAILABLE, unwidened', () => {
    const foreign = { canonicalOwnerId: 'owner-elsewhere', tenantId: 'tenant-elsewhere' };
    const id = `P-UNCHANGED-${rootId}`;
    insertPortfolio(id);
    insertRevision(id);
    try {
      assert.throws(() => store.get(foreign, id), ResourceUnavailableError);
      assert.deepEqual(store.list(foreign), []);
      assert.throws(() => store.get(OWNER, 'P-ABSENT'), ResourceUnavailableError);
      assert.throws(() => store.revisions(OWNER, 'P-ABSENT'), ResourceUnavailableError);

      updatePortfolio(id, 'status', 'TOMBSTONED');
      assert.throws(() => store.get(OWNER, id), ResourceUnavailableError);
      assert.throws(() => store.revisions(OWNER, id), ResourceUnavailableError);
    } finally {
      purge(id);
    }
  });

  it('fails closed over the endpoint: a malformed row yields Class A UNAVAILABLE with no result', async () => {
    const id = `P-ENDPOINT-REFUSAL-${rootId}`;
    insertPortfolio(id);
    insertRevision(id);
    updateRevision(id, 'total_market_value', Number.POSITIVE_INFINITY);

    const outcome = await startIpcServer({
      env: {
        IIPS_G2_IPC_ENDPOINT: `iips-q1c-refusal-${process.pid}`,
        IIPS_G3_LOCAL_STATE_DIR: join(root, 'state-refusal'),
        IIPS_G3_DATABASE_PATH: databasePath,
      } as NodeJS.ProcessEnv,
      platform: HOST_PLATFORM,
    });
    assert.equal(outcome.ok, true, outcome.error);

    try {
      for (const [op, payload] of [
        ['portfolio.list', undefined],
        ['portfolio.get', { portfolioId: id }],
      ] as const) {
        const envelope: Record<string, unknown> = { v: 1, op, requestId: `q1c-refusal-${op}` };
        if (payload !== undefined) envelope.payload = payload;
        const frame = parseFrame(await call(outcome.target!.path, envelope));
        assert.equal(frame.ok, false, `${op} must refuse`);
        assert.equal(
          frame.outcome,
          'UNAVAILABLE',
          `${op} reports the generic contract-envelope refusal, not RESOURCE_UNAVAILABLE`,
        );
        assert.ok(!('result' in frame), `${op} emits no result object and therefore no fabricated value`);
        assert.equal(frame.detail, 'the request could not be completed', 'the refusal discloses no stored value');
      }
    } finally {
      await outcome.handle!.stop();
      purge(id);
    }
  });
});
