/**
 * Gate 3 — durable PortfolioStorePort adapter.
 *
 * The port is the write-gate boundary: every mutating call first evaluates
 * the frozen Gate E W-1 conjunction and refuses with WriteNotAuthorizedError
 * (zero store effect) while the gates are unmet. Read calls delegate
 * unchanged. The durability vocabulary is literal: this port is DURABLE and
 * must never be mislabeled SESSION_ONLY.
 */
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

export type DurabilityVocabulary = 'SESSION_ONLY' | 'DURABLE';

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

  constructor(db: ConstructorParameters<typeof DurablePortfolioStore>[0]) {
    this.store = new DurablePortfolioStore(db);
  }

  private assertWritable(): void {
    const guard = evaluatePortSaveGuard();
    if (!guard.authorized) {
      throw new WriteNotAuthorizedError(guard.reasons.join('; '));
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
    this.assertWritable();
    return this.store.withBrokerImportTransaction(owner, () => work(this));
  }

  create(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest): number {
    this.assertWritable();
    return this.store.create(owner, portfolioId, request);
  }

  save(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest, expectedRevision: number): number {
    this.assertWritable();
    return this.store.save(owner, portfolioId, request, expectedRevision);
  }

  reset(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest, expectedRevision: number): number {
    this.assertWritable();
    return this.store.reset(owner, portfolioId, request, expectedRevision);
  }

  delete(owner: OwnerRef, portfolioId: string, expectedRevision: number): void {
    this.assertWritable();
    this.store.delete(owner, portfolioId, expectedRevision);
  }
}

export { findCallerSuppliedIdentityKeys, computeLineageHash, WriteNotAuthorizedError };
export type { HoldingInput, PortfolioSaveRequest, OwnerRef };
