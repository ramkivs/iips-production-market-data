/**
 * Institutional Investment Platform System (IIPS)
 * Durable Point-in-Time market-data store (REG-06 admission, 2026-11-01)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 *
 * This is the durable counterpart of `PointInTimeStore`. It exists because the
 * in-memory store cannot satisfy a manual-ingestion product capability: a
 * durable write must survive a process restart, and an append must be atomic.
 *
 * ISOLATION FROM THE GATE 3 / GATE A′ SCHEMA — deliberate, not incidental.
 * `gateAPrimeValidation.ts` freezes `DESIGNATED_MIGRATION_BLOBS` for migrations
 * 001–004 and check `V-A2-1` requires *exactly* four ledger rows with matching
 * checksums. Appending a migration to `GATE3_MIGRATIONS`, or writing a fifth
 * ledger row into that database, would fail `V-A2-1` and disturb the pinned
 * Gate A′ provisioning chain. This store therefore opens its **own** database
 * file with its **own** migration ledger and never touches the Gate 3 store.
 *
 * It likewise does not reuse NP-04 `GovernedArtifactStore`: that store persists
 * governed *report artifacts* (`report_id`, `artifact_version`,
 * `supersedes_report_id`), which is a different domain from append-only
 * point-in-time market-data snapshots. Its connection and ledger patterns are
 * reused; its schema is not.
 */

import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute } from 'node:path';

import { CanonicalEnvelope } from '../contracts/envelope.js';
import { DataDomain, isD114SecurityId, isD114SecurityIdentity } from '../contracts/types.js';
import { assertSupportedRuntime } from '../persistence/connection.js';
import { ensureMigrations, type Migration } from '../persistence/migration_ledger.js';
import { buildPitKey, type PITQuery } from './pit_store.js';

/**
 * The PIT market-data schema. Append-only: there is no UPDATE path and no
 * mutable status column. One snapshot per (identity, instant); identity is
 * always series-qualified, so no legacy company-only key can be written here.
 */
export const migrationPit001MarketDataSnapshots: Migration = {
  id: 'pit001_market_data_snapshots',
  sql: `
CREATE TABLE IF NOT EXISTS pit_market_data_snapshots (
  snapshot_digest TEXT PRIMARY KEY,
  pit_key         TEXT    NOT NULL,
  company_id      TEXT    NOT NULL,
  domain          TEXT    NOT NULL,
  security_id     TEXT    NOT NULL,
  as_of           TEXT    NOT NULL,
  as_of_ms        INTEGER NOT NULL,
  envelope_json   TEXT    NOT NULL,
  ingested_at     TEXT    NOT NULL,
  UNIQUE (pit_key, as_of_ms)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_pit_mds_security_asof
  ON pit_market_data_snapshots (security_id, domain, as_of_ms);
`,
};

export const PIT_MARKET_DATA_MIGRATIONS: readonly Migration[] = Object.freeze([
  migrationPit001MarketDataSnapshots,
]);

export class PitDurableStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PitDurableStoreError';
  }
}

/**
 * Raised when a different snapshot already occupies the same identity and
 * instant. Two different values at one instant would make point-in-time
 * retrieval ambiguous, so the store fails closed instead of picking one.
 */
export class PitSnapshotConflictError extends PitDurableStoreError {
  constructor(
    readonly pitKey: string,
    readonly asOf: string,
  ) {
    super(
      `a different snapshot is already durably stored for '${pitKey}' at ${asOf}; ` +
        'point-in-time retrieval would be ambiguous',
    );
    this.name = 'PitSnapshotConflictError';
  }
}

export type PitAppendStatus = 'APPENDED' | 'DUPLICATE';

export interface PitAppendResult {
  readonly status: PitAppendStatus;
  readonly snapshotDigest: string;
  readonly pitKey: string;
}

interface SnapshotRow {
  snapshot_digest: string;
  pit_key: string;
  envelope_json: string;
}

/** Strict UTC validation: `Date.parse` alone rolls 2026-02-30 into March. */
function toUtcMs(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return undefined;
  if (Number(match[4]) > 23 || Number(match[5]) > 59 || Number(match[6]) > 59) return undefined;

  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > (days[month - 1] as number)) return undefined;

  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
}

/**
 * Content-addressable identity of one durably stored snapshot.
 *
 * The digest covers the admitted data — the series-qualified identity
 * coordinates, the vintage instant and the canonical payload — and deliberately
 * excludes the canonicalization nonce fields.
 *
 * Why the nonce fields are excluded: `IngestionPipeline` stamps every envelope
 * with time-derived identity (`envelopeId` as `env-<epoch>-<nonce>`,
 * `provenance.evaluatedAt`, `provenance.dataVersion` and therefore
 * `provenance.lineageHash`). Re-canonicalizing byte-identical source records
 * therefore yields a *different* envelope on every run, so digesting the whole
 * envelope could never report a duplicate: replaying the same operator drop
 * would be misclassified as a conflicting snapshot. Keying on the admitted data
 * gives the property the capability needs — re-ingesting the same content is
 * idempotent, while genuinely different market data at the same identity and
 * instant still fails closed as a conflict.
 */
export function computeSnapshotDigest(params: {
  pitKey: string;
  asOf: string;
  envelope: { payload?: unknown };
}): string {
  const canonical = JSON.stringify([params.pitKey, params.asOf, params.envelope.payload]);
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export class DurablePointInTimeStore<T = unknown> {
  private readonly db: DatabaseSync;
  private closed = false;

  /**
   * @param filePath absolute operator-local path. Must not be the Gate 3 store;
   *   this store owns its file and its migration ledger.
   */
  constructor(filePath: string, version: string = process.versions.node) {
    assertSupportedRuntime(version);
    if (typeof filePath !== 'string' || filePath.trim().length === 0) {
      throw new PitDurableStoreError('the PIT store path must be a non-empty absolute operator-local path');
    }
    if (!isAbsolute(filePath)) {
      throw new PitDurableStoreError(`the PIT store path must be absolute, received: ${filePath}`);
    }

    mkdirSync(dirname(filePath), { recursive: true });
    const db = new DatabaseSync(filePath);
    db.exec('PRAGMA foreign_keys = ON;');
    // WAL is intentionally not used: DELETE journaling plus synchronous=FULL
    // keeps durability obvious and leaves no sidecar files behind on close.
    db.exec('PRAGMA journal_mode = DELETE;');
    db.exec('PRAGMA synchronous = FULL;');
    this.db = db;

    ensureMigrations(db, PIT_MARKET_DATA_MIGRATIONS);
  }

  private assertOpen(): void {
    if (this.closed) throw new PitDurableStoreError('the PIT store is closed');
  }

  /**
   * Durably appends one immutable snapshot.
   *
   * Fail-closed rules, all enforced before any write:
   *   - the identity must be series-qualified `ISIN:<isin>:<series>`; a bare
   *     ISIN, a missing series or a legacy company-only record is rejected and
   *     never degrades to an ambiguous key;
   *   - `provenance.asOf` must be a real UTC instant;
   *   - a differing snapshot at the same identity and instant is a conflict.
   *
   * The write and its commit are one `BEGIN IMMEDIATE` transaction, so a
   * failure leaves no partial row.
   */
  public append(envelope: CanonicalEnvelope<T>): PitAppendResult {
    this.assertOpen();

    if (envelope === null || typeof envelope !== 'object') {
      throw new PitDurableStoreError('PIT append requires an envelope object');
    }
    if (typeof envelope.companyId !== 'string' || envelope.companyId.trim().length === 0) {
      throw new PitDurableStoreError('PIT append requires a non-empty companyId');
    }
    if (typeof envelope.domain !== 'string' || envelope.domain.trim().length === 0) {
      throw new PitDurableStoreError('PIT append requires a non-empty domain');
    }
    if (envelope.securityId === undefined) {
      throw new PitDurableStoreError(
        'durable PIT market data requires an explicit series-qualified securityId; ' +
          'a company-only record is not admitted and no series is inferred',
      );
    }
    if (!isD114SecurityId(envelope.securityId)) {
      throw new PitDurableStoreError(
        'PIT securityId must use the exact ISIN:<isin>:<series> grammar',
      );
    }
    const securityId: string = envelope.securityId;

    const asOf = envelope.provenance?.asOf;
    const asOfMs = toUtcMs(asOf);
    if (asOfMs === undefined) {
      throw new PitDurableStoreError(`PIT provenance.asOf must be a valid UTC instant, received: ${String(asOf)}`);
    }

    // Parity with `PointInTimeStore.append`: when the payload carries an
    // explicit series identity it must agree with the envelope's. An absent
    // payload identity is legacy and permitted; a present one is checked.
    const payloadIdentity =
      typeof envelope.payload === 'object' && envelope.payload !== null
        ? (envelope.payload as { securityIdentity?: unknown }).securityIdentity
        : undefined;
    if (payloadIdentity !== undefined) {
      if (!isD114SecurityIdentity(payloadIdentity)) {
        throw new PitDurableStoreError('PIT payload securityIdentity is malformed');
      }
      if (payloadIdentity.securityId !== securityId) {
        throw new PitDurableStoreError('PIT envelope and payload security identities conflict');
      }
    }

    const frozen = Object.freeze(JSON.parse(JSON.stringify(envelope))) as CanonicalEnvelope<T>;
    const pitKey = buildPitKey(frozen.companyId, frozen.domain, securityId);
    const digest = computeSnapshotDigest({ pitKey, asOf: frozen.provenance.asOf, envelope: frozen });

    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const existing = this.db
        .prepare('SELECT snapshot_digest FROM pit_market_data_snapshots WHERE snapshot_digest = ?')
        .get(digest) as unknown as { snapshot_digest: string } | undefined;
      if (existing) {
        this.db.exec('COMMIT;');
        return { status: 'DUPLICATE', snapshotDigest: digest, pitKey };
      }

      const occupant = this.db
        .prepare('SELECT snapshot_digest FROM pit_market_data_snapshots WHERE pit_key = ? AND as_of_ms = ?')
        .get(pitKey, asOfMs) as unknown as { snapshot_digest: string } | undefined;
      if (occupant) {
        throw new PitSnapshotConflictError(pitKey, frozen.provenance.asOf);
      }

      this.db
        .prepare(
          `INSERT INTO pit_market_data_snapshots
             (snapshot_digest, pit_key, company_id, domain, security_id, as_of, as_of_ms, envelope_json, ingested_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          digest,
          pitKey,
          frozen.companyId,
          frozen.domain,
          securityId,
          frozen.provenance.asOf,
          asOfMs,
          JSON.stringify(frozen),
          new Date().toISOString(),
        );

      this.db.exec('COMMIT;');
      return { status: 'APPENDED', snapshotDigest: digest, pitKey };
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    }
  }

  private resolvePitKey(companyId: string, domain: DataDomain, securityId?: string): string | undefined {
    if (securityId !== undefined) return buildPitKey(companyId, domain, securityId);

    // A legacy company/domain query is answered only when exactly one
    // series-qualified key exists; several series are ambiguous and throw.
    const prefix = `${buildPitKey(companyId, domain)}:`;
    const rows = this.db
      .prepare(
        'SELECT DISTINCT pit_key FROM pit_market_data_snapshots WHERE pit_key LIKE ? ORDER BY pit_key',
      )
      .all(`${prefix}%`) as unknown as Array<{ pit_key: string }>;

    if (rows.length === 0) return undefined;
    if (rows.length > 1) {
      throw new PitDurableStoreError(
        `Ambiguous PIT identity for '${companyId}:${domain}': ${rows.length} admitted series; ` +
          'an explicit securityId is required',
      );
    }
    return rows[0].pit_key;
  }

  private hydrate(row: SnapshotRow): CanonicalEnvelope<T> {
    return Object.freeze(JSON.parse(row.envelope_json)) as CanonicalEnvelope<T>;
  }

  /** Returns the newest snapshot whose provenance.asOf <= query.asOf. */
  public queryAsOf(query: PITQuery): CanonicalEnvelope<T> | undefined {
    this.assertOpen();
    const key = this.resolvePitKey(query.companyId, query.domain, query.securityId);
    if (key === undefined) return undefined;

    const targetMs = toUtcMs(query.asOf);
    if (targetMs === undefined) {
      throw new PitDurableStoreError(`Invalid asOf timestamp: ${query.asOf}`);
    }

    const row = this.db
      .prepare(
        `SELECT snapshot_digest, pit_key, envelope_json FROM pit_market_data_snapshots
          WHERE pit_key = ? AND as_of_ms <= ?
          ORDER BY as_of_ms DESC LIMIT 1`,
      )
      .get(key, targetMs) as unknown as SnapshotRow | undefined;

    return row === undefined ? undefined : this.hydrate(row);
  }

  /** Queries historical snapshots in the inclusive interval [from, to]. */
  public queryRange(
    companyId: string,
    domain: DataDomain,
    from: string,
    to: string,
    securityId?: string,
  ): Array<CanonicalEnvelope<T>> {
    this.assertOpen();
    const key = this.resolvePitKey(companyId, domain, securityId);
    if (key === undefined) return [];

    const fromMs = toUtcMs(from);
    const toMs = toUtcMs(to);
    if (fromMs === undefined || toMs === undefined) {
      throw new PitDurableStoreError('queryRange requires valid UTC from/to timestamps');
    }

    const rows = this.db
      .prepare(
        `SELECT snapshot_digest, pit_key, envelope_json FROM pit_market_data_snapshots
          WHERE pit_key = ? AND as_of_ms >= ? AND as_of_ms <= ?
          ORDER BY as_of_ms ASC`,
      )
      .all(key, fromMs, toMs) as unknown as SnapshotRow[];

    return rows.map((row) => this.hydrate(row));
  }

  public getRecordCount(): number {
    this.assertOpen();
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM pit_market_data_snapshots')
      .get() as unknown as { n: number | bigint };
    return Number(row.n);
  }

  /** Read-only, lexically ordered enumeration of actual admitted keys. */
  public listAdmittedSeriesKeys(): ReadonlyArray<string> {
    this.assertOpen();
    const rows = this.db
      .prepare('SELECT DISTINCT pit_key FROM pit_market_data_snapshots ORDER BY pit_key')
      .all() as unknown as Array<{ pit_key: string }>;
    return rows.map((row) => row.pit_key);
  }

  /** Removes every snapshot. Retained for parity with the in-memory store. */
  public clear(): void {
    this.assertOpen();
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      this.db.exec('DELETE FROM pit_market_data_snapshots;');
      this.db.exec('COMMIT;');
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    }
  }

  public close(): void {
    if (!this.closed) {
      this.db.close();
      this.closed = true;
    }
  }
}
