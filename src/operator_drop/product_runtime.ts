/**
 * Institutional Investment Platform System (IIPS)
 * Operator Drop product runtime (REG-06 admission, 2026-11-01)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 *
 * This is the product runtime path for the admitted manual-ingestion capability.
 * Before REG-06 admission the only caller of `OperatorDropParser` was the
 * internal OQ synthetic failover harness (`src/oq/synthetic_failover.ts`), which
 * returns a report and persists nothing. This runtime is a real composition:
 *
 *     operator drop package
 *       → checksum + canonicalization      (reused `OperatorDropParser`)
 *       → series-qualified identity        (reused `buildD114SecurityIdentity`)
 *       → durable PIT write                (`DurablePointInTimeStore`)
 *       → point-in-time screening read     (reused `PitReadService`)
 *
 * It composes existing components and adds no new ingestion, identity or read
 * semantics of its own.
 *
 * Boundary: non-production, single-operator, operator-local absolute paths.
 * No network listener, no IPC endpoint, no production deployment and no
 * `durable:true` portfolio write is created here.
 */

import { CanonicalEnvelope } from '../contracts/envelope.js';
import type { DataDomain } from '../contracts/types.js';
import { DurablePointInTimeStore } from '../pit/pit_durable_store.js';
import {
  PitReadService,
  type PitReadRequest,
  type PitReadResult,
} from '../pit/pit_read_service.js';
import {
  OperatorDropIngestionService,
  type OperatorDropIngestionReport,
} from './drop_ingestion.js';
import type { OperatorDropPayload } from './parser.js';

export interface OperatorDropRuntimeOptions {
  /** Absolute operator-local path to the durable PIT market-data database. */
  readonly storePath: string;
  /** Domain every record in ingested packages is admitted under. */
  readonly domain: DataDomain;
}

export interface OperatorDropScreeningHit<T> {
  readonly screened: true;
  readonly result: Extract<PitReadResult<T>, { found: true }>;
}

export interface OperatorDropScreeningMiss {
  readonly screened: false;
  readonly reason: Extract<PitReadResult<unknown>, { found: false }>['reason'];
}

export type OperatorDropScreeningOutcome<T> = OperatorDropScreeningHit<T> | OperatorDropScreeningMiss;

export class OperatorDropProductRuntime<T = unknown> {
  private readonly store: DurablePointInTimeStore<T>;
  private readonly ingestion: OperatorDropIngestionService<T>;
  private readonly reader: PitReadService<T>;
  private closed = false;

  constructor(options: OperatorDropRuntimeOptions) {
    this.store = new DurablePointInTimeStore<T>(options.storePath);
    this.ingestion = new OperatorDropIngestionService<T>(this.store, options.domain);
    this.reader = new PitReadService<T>(this.store as DurablePointInTimeStore<unknown>);
  }

  /** Ingests one operator drop package into durable PIT storage. */
  public ingest(drop: OperatorDropPayload): OperatorDropIngestionReport {
    this.assertOpen();
    return this.ingestion.ingest(drop);
  }

  /**
   * Screens one series-qualified identity as at a point in time. The read is
   * served by the reused `PitReadService`, so ambiguity, malformed identity and
   * future-vintage cases fail closed exactly as they do elsewhere.
   */
  public screen(request: PitReadRequest): OperatorDropScreeningOutcome<T> {
    this.assertOpen();
    const result = this.reader.queryAsOf(request);
    return result.found
      ? { screened: true, result: result as Extract<PitReadResult<T>, { found: true }> }
      : { screened: false, reason: result.reason };
  }

  /** Historical vintages for one identity in the inclusive interval [from, to]. */
  public history(
    companyId: string,
    securityId: string,
    domain: DataDomain,
    from: string,
    to: string,
  ): ReadonlyArray<CanonicalEnvelope<T>> {
    this.assertOpen();
    return this.store.queryRange(companyId, domain, from, to, securityId);
  }

  /** Series-qualified identities actually admitted by durable writes. */
  public listAdmittedSeriesKeys(): ReadonlyArray<string> {
    this.assertOpen();
    return this.store.listAdmittedSeriesKeys();
  }

  public getRecordCount(): number {
    this.assertOpen();
    return this.store.getRecordCount();
  }

  public close(): void {
    if (!this.closed) {
      this.store.close();
      this.closed = true;
    }
  }

  private assertOpen(): void {
    if (this.closed) throw new Error('the Operator Drop product runtime is closed');
  }
}
