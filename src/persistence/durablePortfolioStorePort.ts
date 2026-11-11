/**
 * Gate 3 — durable PortfolioStorePort adapter.
 *
 * The port is the write-gate boundary: every mutating call first evaluates
 * the frozen Gate E W-1 conjunction and refuses with WriteNotAuthorizedError
 * (zero store effect) while the gates are unmet. Read calls delegate
 * unchanged. The durability vocabulary is literal: this port is DURABLE and
 * must never be mislabeled SESSION_ONLY.
 *
 * AUTHORIZATION CONTEXT (2026-11-09)
 *   `assertWritable` previously evaluated the guard with NO context, so the
 *   explicit local single-user carve-out (`IIPS_LOCAL_PERSONAL_USE=1` plus a
 *   validated local principal binding) was unreachable through this port, and
 *   the durable broker-import write path refused every import with
 *   `WRITE_NOT_AUTHORIZED` regardless of the process configuration.
 *
 *   The port can now be constructed with the server-owned environment and
 *   resolves the authorization context per mutating call from: (a) that
 *   environment, and (b) the ACTIVE local principal binding in the database,
 *   which must equal the owner the write targets. The context is then supplied
 *   to `evaluatePortSaveGuard`.
 *
 *   Default-deny is preserved exactly:
 *     - a port constructed WITHOUT options (every pre-existing caller, and the
 *       whole governed path) supplies no context at all, so the guard returns
 *       its unchanged hard-false Gate 4 / Gate 5 response;
 *     - with options, authorization still requires the pinned switch AND a
 *       matching ACTIVE binding; either alone is refused;
 *     - a binding for a different principal is refused.
 *
 *   Nothing here weakens Gate 4 or Gate 5 for any other caller: the context is
 *   built only from server-owned configuration and the database, never from a
 *   request, and the guard itself is the sole decision-maker.
 */
import type { DatabaseSync } from 'node:sqlite';
import {
  DurablePortfolioStore,
  evaluatePortSaveGuard,
  findCallerSuppliedIdentityKeys,
  computeLineageHash,
  WriteNotAuthorizedError,
  type HoldingInput,
  type OwnerRef,
  type PortfolioSaveRequest,
} from './portfolio_store.js';
import { evaluateLocalSingleUserWrite, type LocalAuthorizationScope } from './localSingleUserAuthorization.js';

export type DurabilityVocabulary = 'SESSION_ONLY' | 'DURABLE';

/**
 * Server-owned construction options. `env` is read from the server process
 * (never from a request frame); `scope` names the write surface whose
 * authorization is recorded for the audit trail.
 */
export interface DurablePortfolioStorePortOptions {
  readonly env?: NodeJS.ProcessEnv;
  readonly scope?: LocalAuthorizationScope;
  /** Forwarded to the store: the personal path raises the revision cap. */
  readonly revisionCap?: number;
  readonly testHooks?: ConstructorParameters<typeof DurablePortfolioStore>[1];
}

export interface PortfolioStorePort {
  readonly durability: DurabilityVocabulary;
  list(owner: OwnerRef): ReturnType<DurablePortfolioStore['list']>;
  get(owner: OwnerRef, portfolioId: string): ReturnType<DurablePortfolioStore['get']>;
  revisions(owner: OwnerRef, portfolioId: string): ReturnType<DurablePortfolioStore['revisions']>;
  contributions(owner: OwnerRef, portfolioId: string): ReturnType<DurablePortfolioStore['contributions']>;
}

export class DurablePortfolioStorePort implements PortfolioStorePort {
  readonly durability: DurabilityVocabulary = 'DURABLE';
  private readonly store: DurablePortfolioStore;
  private readonly db: DatabaseSync;
  private readonly options: DurablePortfolioStorePortOptions | undefined;

  constructor(
    db: DatabaseSync,
    options?: DurablePortfolioStorePortOptions,
  ) {
    this.db = db;
    this.options = options;
    const storeOptions = options?.revisionCap !== undefined ? { revisionCap: options.revisionCap } : undefined;
    this.store = new DurablePortfolioStore(db, options?.testHooks, storeOptions);
  }

  /**
   * Gate E W-1, evaluated exactly once per mutating call, against the owner
   * that call actually targets.
   *
   * A port constructed without options never establishes a context, so the
   * guard takes its unmodified no-context default-deny branch and the refusal
   * is byte-identical to the historical one. With options the context still
   * requires the pinned switch AND a matching ACTIVE binding.
   */
  private assertWritable(owner: OwnerRef): void {
    if (!this.options) {
      const guard = evaluatePortSaveGuard();
      if (!guard.authorized) throw new WriteNotAuthorizedError(guard.reasons.join('; '));
      return;
    }
    const decision = evaluateLocalSingleUserWrite(
      this.db,
      this.options.env ?? process.env,
      { canonicalOwnerId: owner.canonicalOwnerId, tenantId: owner.tenantId },
      this.options.scope ?? 'MANUAL_PERSONAL_PORTFOLIO',
    );
    if (!decision.authorized) {
      throw new WriteNotAuthorizedError(decision.reasons.join('; '));
    }
  }

  list(owner: OwnerRef): ReturnType<DurablePortfolioStore['list']> {
    return this.store.list(owner);
  }

  get(owner: OwnerRef, portfolioId: string): ReturnType<DurablePortfolioStore['get']> {
    return this.store.get(owner, portfolioId);
  }

  revisions(owner: OwnerRef, portfolioId: string): ReturnType<DurablePortfolioStore['revisions']> {
    return this.store.revisions(owner, portfolioId);
  }

  contributions(owner: OwnerRef, portfolioId: string): ReturnType<DurablePortfolioStore['contributions']> {
    return this.store.contributions(owner, portfolioId);
  }

  withBrokerImportTransaction<T>(owner: OwnerRef, work: (writer: this) => T): T {
    this.assertWritable(owner);
    return this.store.withBrokerImportTransaction(owner, () => work(this));
  }

  create(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest): number {
    this.assertWritable(owner);
    return this.store.create(owner, portfolioId, request);
  }

  save(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest, expectedRevision: number): number {
    this.assertWritable(owner);
    return this.store.save(owner, portfolioId, request, expectedRevision);
  }

  reset(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest, expectedRevision: number): number {
    this.assertWritable(owner);
    return this.store.reset(owner, portfolioId, request, expectedRevision);
  }

  restore(owner: OwnerRef, portfolioId: string, expectedRevision: number, idempotencyKey: string): ReturnType<DurablePortfolioStore['restore']> {
    this.assertWritable(owner);
    return this.store.restore(owner, portfolioId, expectedRevision, idempotencyKey);
  }

  delete(owner: OwnerRef, portfolioId: string, expectedRevision: number): void {
    this.assertWritable(owner);
    this.store.delete(owner, portfolioId, expectedRevision);
  }
}

export { findCallerSuppliedIdentityKeys, computeLineageHash, WriteNotAuthorizedError };
export type { HoldingInput, PortfolioSaveRequest, OwnerRef };
