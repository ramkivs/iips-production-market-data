/**
 * Institutional Investment Platform System (IIPS)
 * Durable Portfolio Store (NP04-G24 / Phase C + Phase J)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01 / BI-08
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * This store EXTENDS the portfolio domain with durable backing. It does not
 * replace it:
 *  - consolidation arithmetic is delegated to the pure, behaviour-preserving
 *    extraction in ./consolidation.ts;
 *  - Dhan ingestion, broker adapters, broker format detection, normalization,
 *    SecurityMaster mapping, UserHoldingInput, MERGE, REPLACE, consolidation,
 *    quantity/cost-basis behaviour, duplicate no-op behaviour, provenance/
 *    lineage, contribution records, and LOCAL_FIXTURE_AND_OFFLINE_DEV
 *    behaviour are all preserved;
 *  - there is exactly ONE portfolio model.
 *
 * Authorization is enforced on every read and write:
 *  - owner isolation (applicationUserId)
 *  - tenant isolation (tenantId)
 *  - tombstoned resources are never disclosed
 *  - unauthorized access is indistinguishable from a missing resource
 *  - optimistic concurrency via expectedRevision
 */

import { randomUUID } from 'node:crypto';
import type { PersistenceConnection } from '../persistence/connection.js';
import {
  ResourceNotFoundError,
  RevisionConflictError,
  ResourceTombstonedError,
} from '../persistence/errors.js';
import type { UserHoldingInput } from '../../frontend/src/features/portfolio/import/types.js';
import type {
  BrokerContributionRecord,
  PortfolioSaveOptions,
  PortfolioSaveResult,
} from '../../frontend/src/features/portfolio/portfolio-store.js';
import {
  consolidatePortfolioSave,
  EMPTY_PROVENANCE_DIGEST,
  type SaveDisposition,
} from './consolidation.js';
import { PortfolioRepository, type PortfolioOperation } from './repository.js';

export interface DurablePortfolioView {
  readonly portfolioId: string;
  readonly portfolioName: string;
  readonly applicationUserId: string;
  readonly tenantId: string;
  readonly revision: number;
  readonly holdings: UserHoldingInput[];
  readonly totalMarketValue: number;
  readonly totalHoldingsCount: number;
  readonly weightSumPercentage: number;
  readonly lastUpdated: string;
  readonly provenanceDigest: string;
  readonly isSaved: boolean;
  readonly contributions: BrokerContributionRecord[];
}

export interface DurableSaveResult {
  readonly success: boolean;
  readonly isDuplicate: boolean;
  readonly disposition: SaveDisposition | 'REJECTED';
  readonly message?: string;
  readonly portfolio: DurablePortfolioView;
  readonly holdingsSavedCount: number;
  readonly totalMarketValue: number;
  readonly weightSumPercentage: number;
  readonly savedAt: string;
  readonly provenanceDigest: string;
  readonly revision: number;
  readonly error?: string;
}

export interface OwnershipScope {
  readonly applicationUserId: string;
  readonly tenantId: string;
}

export interface SaveHoldingsRequest extends OwnershipScope {
  readonly portfolioId: string;
  readonly holdings: readonly UserHoldingInput[];
  readonly options?: PortfolioSaveOptions | Record<string, unknown>;
  /** Optimistic concurrency guard. When supplied it must equal the current revision. */
  readonly expectedRevision?: number;
  /** Injectable timestamp for deterministic tests. */
  readonly savedAt?: string;
}

export class DurablePortfolioStore {
  private readonly repository: PortfolioRepository;

  constructor(private readonly connection: PersistenceConnection) {
    this.repository = new PortfolioRepository(connection);
  }

  private now(): string {
    return new Date().toISOString();
  }

  /**
   * Reconstructs the contribution set that is live for the current revision.
   *
   * This mirrors the in-memory store exactly: MERGE accumulates contributions,
   * while REPLACE and RESET start a new contribution set.
   */
  private currentContributions(portfolioId: string, currentRevision: number): BrokerContributionRecord[] {
    const collected: BrokerContributionRecord[] = [];
    for (let revision = currentRevision; revision >= 0; revision--) {
      const record = this.repository.findRevision(portfolioId, revision);
      if (!record) {
        continue;
      }
      collected.push(...this.repository.listContributions(portfolioId, revision));
      if (record.operation === 'REPLACE' || record.operation === 'RESET' || record.operation === 'INITIAL') {
        break;
      }
    }
    return collected.reverse();
  }

  /** Mirrors the in-memory `isSaved` flag semantics. */
  private computeIsSaved(operation: PortfolioOperation): boolean {
    return operation === 'MERGE' || operation === 'REPLACE';
  }

  private buildView(
    portfolioId: string,
    applicationUserId: string,
    tenantId: string,
    portfolioName: string,
    revision: number
  ): DurablePortfolioView {
    const record = this.repository.findRevision(portfolioId, revision);
    const holdings = this.repository.listHoldings(portfolioId, revision);
    const contributions = this.currentContributions(portfolioId, revision);

    const totalMarketValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const weightSumPercentage =
      Math.round(holdings.reduce((sum, h) => sum + h.weightPercentage, 0) * 10_000) / 10_000;

    return {
      portfolioId,
      portfolioName,
      applicationUserId,
      tenantId,
      revision,
      holdings,
      totalMarketValue,
      totalHoldingsCount: holdings.length,
      weightSumPercentage,
      lastUpdated: record?.created_at ?? new Date(0).toISOString(),
      provenanceDigest: record?.provenance_digest ?? EMPTY_PROVENANCE_DIGEST,
      isSaved: record ? this.computeIsSaved(record.operation as PortfolioOperation) : false,
      contributions,
    };
  }

  /**
   * Authorized read. A missing, foreign, tenant-mismatched or tombstoned
   * portfolio all produce the SAME failure so existence is never disclosed.
   */
  public getPortfolio(request: OwnershipScope & { portfolioId: string }): DurablePortfolioView {
    const portfolio = this.repository.findAuthorizedPortfolio(
      request.portfolioId,
      request.applicationUserId,
      request.tenantId
    );
    if (!portfolio) {
      throw new ResourceNotFoundError();
    }
    return this.buildView(
      portfolio.portfolioId,
      portfolio.applicationUserId,
      portfolio.tenantId,
      portfolio.portfolioName,
      portfolio.currentRevision
    );
  }

  public listPortfolios(scope: OwnershipScope): DurablePortfolioView[] {
    return this.repository
      .listAuthorizedPortfolios(scope.applicationUserId, scope.tenantId)
      .map((p) =>
        this.buildView(
          p.portfolioId,
          p.applicationUserId,
          p.tenantId,
          p.portfolioName,
          p.currentRevision
        )
      );
  }

  public createPortfolio(
    request: OwnershipScope & { portfolioId?: string; portfolioName?: string; now?: string }
  ): DurablePortfolioView {
    const now = request.now ?? this.now();

    return this.connection.immediateTransaction(() => {
      const portfolioId = request.portfolioId ?? randomUUID();
      if (this.repository.findPortfolioRow(portfolioId)) {
        throw new ResourceTombstonedError(`Portfolio "${portfolioId}" already exists.`);
      }

      this.repository.insertPortfolio({
        portfolioId,
        applicationUserId: request.applicationUserId,
        tenantId: request.tenantId,
        portfolioName: request.portfolioName ?? 'Institutional Portfolio',
        now,
      });

      this.repository.insertRevision({
        portfolioId,
        revision: 0,
        operation: 'INITIAL',
        disposition: null,
        totalMarketValue: 0,
        weightSumPercentage: 0,
        holdingsCount: 0,
        provenanceDigest: EMPTY_PROVENANCE_DIGEST,
        contentDigest: null,
        createdAt: now,
      });

      this.repository.insertEvent({
        portfolioId,
        revision: 0,
        eventType: 'PORTFOLIO_CREATED',
        payload: null,
        occurredAt: now,
      });

      return this.buildView(
        portfolioId,
        request.applicationUserId,
        request.tenantId,
        request.portfolioName ?? 'Institutional Portfolio',
        0
      );
    });
  }

  /**
   * Durable save. Executes the governed consolidation and, on success, writes
   * exactly one new immutable revision inside a single IMMEDIATE transaction.
   *
   * A duplicate/same-content operation is a durable no-op: no revision is written.
   */
  public saveHoldings(request: SaveHoldingsRequest): DurableSaveResult {
    const savedAt = request.savedAt ?? this.now();

    return this.connection.immediateTransaction(() => {
      const portfolio = this.repository.findAuthorizedPortfolio(
        request.portfolioId,
        request.applicationUserId,
        request.tenantId
      );
      if (!portfolio) {
        throw new ResourceNotFoundError();
      }

      if (
        request.expectedRevision !== undefined &&
        request.expectedRevision !== portfolio.currentRevision
      ) {
        throw new RevisionConflictError(request.expectedRevision, portfolio.currentRevision);
      }

      const currentRevisionRecord = this.repository.findRevision(
        portfolio.portfolioId,
        portfolio.currentRevision
      );
      const currentOperation =
        (currentRevisionRecord?.operation as PortfolioOperation | undefined) ?? 'INITIAL';

      const existingHoldings = this.repository.listHoldings(
        portfolio.portfolioId,
        portfolio.currentRevision
      );
      const existingContributions = this.currentContributions(
        portfolio.portfolioId,
        portfolio.currentRevision
      );

      const outcome = consolidatePortfolioSave({
        portfolioId: portfolio.portfolioId,
        holdings: request.holdings,
        options: request.options,
        existing: {
          isSaved: this.computeIsSaved(currentOperation),
          holdings: existingHoldings,
          contributions: existingContributions,
        },
        savedAt,
      });

      if (!outcome.ok) {
        // Domain-level rejection mirrors the certified in-memory contract.
        const view = this.buildView(
          portfolio.portfolioId,
          portfolio.applicationUserId,
          portfolio.tenantId,
          portfolio.portfolioName,
          portfolio.currentRevision
        );
        return {
          success: false,
          isDuplicate: false,
          disposition: 'REJECTED',
          portfolio: view,
          holdingsSavedCount: 0,
          totalMarketValue: 0,
          weightSumPercentage: outcome.rejection.weightSumPercentage ?? 0,
          savedAt,
          provenanceDigest: '',
          revision: portfolio.currentRevision,
          error: outcome.rejection.error,
        } satisfies DurableSaveResult;
      }

      const consolidated = outcome.value;

      // Idempotent no-op: the durable state already reflects this content.
      if (consolidated.disposition === 'ALREADY_IMPORTED_NO_OP') {
        const view = this.buildView(
          portfolio.portfolioId,
          portfolio.applicationUserId,
          portfolio.tenantId,
          portfolio.portfolioName,
          portfolio.currentRevision
        );
        return {
          success: true,
          isDuplicate: true,
          disposition: 'ALREADY_IMPORTED_NO_OP',
          message: 'Source file already committed to this portfolio. State preserved without duplication.',
          portfolio: view,
          holdingsSavedCount: view.holdings.length,
          totalMarketValue: view.totalMarketValue,
          weightSumPercentage: view.weightSumPercentage,
          savedAt: view.lastUpdated,
          provenanceDigest: view.provenanceDigest,
          revision: view.revision,
        } satisfies DurableSaveResult;
      }

      const mode = ((request.options ?? {}) as PortfolioSaveOptions).mode ?? 'MERGE';
      const operation: PortfolioOperation = mode === 'REPLACE' ? 'REPLACE' : 'MERGE';
      const nextRevision = portfolio.currentRevision + 1;
      const contentDigest = ((request.options ?? {}) as PortfolioSaveOptions).contentDigest ?? null;

      this.repository.insertRevision({
        portfolioId: portfolio.portfolioId,
        revision: nextRevision,
        operation,
        disposition: consolidated.disposition,
        totalMarketValue: consolidated.totalMarketValue,
        weightSumPercentage: consolidated.weightSumPercentage,
        holdingsCount: consolidated.holdingsCount,
        provenanceDigest: consolidated.provenanceDigest,
        contentDigest,
        createdAt: savedAt,
      });

      for (const holding of consolidated.holdings) {
        this.repository.insertHolding(portfolio.portfolioId, nextRevision, holding, savedAt);
      }

      // Only the newly created contribution of this revision is persisted; the
      // historical set is reconstructed by revision walk (mirrors MERGE/REPLACE).
      const newContributions =
        operation === 'REPLACE'
          ? consolidated.contributions.slice(-1)
          : consolidated.contributions.slice(existingContributions.length);

      for (const contribution of newContributions) {
        this.repository.insertContribution(portfolio.portfolioId, nextRevision, contribution);
      }

      this.repository.insertEvent({
        portfolioId: portfolio.portfolioId,
        revision: nextRevision,
        eventType: `PORTFOLIO_${operation}`,
        payload: JSON.stringify({ contentDigest, holdingsCount: consolidated.holdingsCount }),
        occurredAt: savedAt,
      });

      this.repository.updateCurrentRevision(portfolio.portfolioId, nextRevision, savedAt);

      const view = this.buildView(
        portfolio.portfolioId,
        portfolio.applicationUserId,
        portfolio.tenantId,
        portfolio.portfolioName,
        nextRevision
      );

      return {
        success: true,
        isDuplicate: false,
        disposition: consolidated.disposition,
        portfolio: view,
        holdingsSavedCount: consolidated.holdingsCount,
        totalMarketValue: consolidated.totalMarketValue,
        weightSumPercentage: consolidated.weightSumPercentage,
        savedAt,
        provenanceDigest: consolidated.provenanceDigest,
        revision: nextRevision,
      } satisfies DurableSaveResult;
    });
  }

  /**
   * RESET preserves portfolio identity and creates the governed empty revision.
   * History is retained.
   */
  public resetPortfolio(
    request: OwnershipScope & { portfolioId: string; expectedRevision?: number; now?: string }
  ): DurablePortfolioView {
    const now = request.now ?? this.now();

    return this.connection.immediateTransaction(() => {
      const portfolio = this.repository.findAuthorizedPortfolio(
        request.portfolioId,
        request.applicationUserId,
        request.tenantId
      );
      if (!portfolio) {
        throw new ResourceNotFoundError();
      }
      if (
        request.expectedRevision !== undefined &&
        request.expectedRevision !== portfolio.currentRevision
      ) {
        throw new RevisionConflictError(request.expectedRevision, portfolio.currentRevision);
      }

      const nextRevision = portfolio.currentRevision + 1;

      this.repository.insertRevision({
        portfolioId: portfolio.portfolioId,
        revision: nextRevision,
        operation: 'RESET',
        disposition: null,
        totalMarketValue: 0,
        weightSumPercentage: 0,
        holdingsCount: 0,
        provenanceDigest: EMPTY_PROVENANCE_DIGEST,
        contentDigest: null,
        createdAt: now,
      });

      this.repository.insertEvent({
        portfolioId: portfolio.portfolioId,
        revision: nextRevision,
        eventType: 'PORTFOLIO_RESET',
        payload: null,
        occurredAt: now,
      });

      this.repository.updateCurrentRevision(portfolio.portfolioId, nextRevision, now);

      return this.buildView(
        portfolio.portfolioId,
        portfolio.applicationUserId,
        portfolio.tenantId,
        portfolio.portfolioName,
        nextRevision
      );
    });
  }

  /**
   * DELETE tombstones the portfolio. Historical revisions are preserved and the
   * portfolio can never be resurrected through the write paths, because every
   * authorized lookup excludes tombstoned rows.
   */
  public deletePortfolio(
    request: OwnershipScope & { portfolioId: string; expectedRevision?: number; now?: string }
  ): { portfolioId: string; deletedAt: string; revision: number } {
    const now = request.now ?? this.now();

    return this.connection.immediateTransaction(() => {
      const portfolio = this.repository.findAuthorizedPortfolio(
        request.portfolioId,
        request.applicationUserId,
        request.tenantId
      );
      if (!portfolio) {
        throw new ResourceNotFoundError();
      }
      if (
        request.expectedRevision !== undefined &&
        request.expectedRevision !== portfolio.currentRevision
      ) {
        throw new RevisionConflictError(request.expectedRevision, portfolio.currentRevision);
      }

      const nextRevision = portfolio.currentRevision + 1;

      this.repository.insertRevision({
        portfolioId: portfolio.portfolioId,
        revision: nextRevision,
        operation: 'DELETE',
        disposition: null,
        totalMarketValue: 0,
        weightSumPercentage: 0,
        holdingsCount: 0,
        provenanceDigest: EMPTY_PROVENANCE_DIGEST,
        contentDigest: null,
        createdAt: now,
      });

      this.repository.insertEvent({
        portfolioId: portfolio.portfolioId,
        revision: nextRevision,
        eventType: 'PORTFOLIO_DELETED',
        payload: null,
        occurredAt: now,
      });

      this.repository.tombstonePortfolio(portfolio.portfolioId, now);

      return { portfolioId: portfolio.portfolioId, deletedAt: now, revision: nextRevision };
    });
  }

  /** Full immutable revision history of a portfolio (authorized). */
  public revisionHistory(
    request: OwnershipScope & { portfolioId: string }
  ): Array<{
    revision: number;
    operation: PortfolioOperation;
    totalMarketValue: number;
    provenanceDigest: string;
    holdingsCount: number;
    createdAt: string;
  }> {
    const portfolio = this.repository.findAuthorizedPortfolio(
      request.portfolioId,
      request.applicationUserId,
      request.tenantId
    );
    if (!portfolio) {
      throw new ResourceNotFoundError();
    }

    const history: Array<{
      revision: number;
      operation: PortfolioOperation;
      totalMarketValue: number;
      provenanceDigest: string;
      holdingsCount: number;
      createdAt: string;
    }> = [];

    for (let revision = 0; revision <= portfolio.currentRevision; revision++) {
      const record = this.repository.findRevision(portfolio.portfolioId, revision);
      if (!record) {
        continue;
      }
      history.push({
        revision: record.revision,
        operation: record.operation as PortfolioOperation,
        totalMarketValue: record.total_market_value,
        provenanceDigest: record.provenance_digest,
        holdingsCount: record.holdings_count,
        createdAt: record.created_at,
      });
    }

    return history;
  }

  /**
   * Adapts a durable save result to the certified in-memory result shape.
   * Provided so existing consumers and parity assertions can compare directly.
   */
  public static toPortfolioSaveResult(result: DurableSaveResult): PortfolioSaveResult {
    return {
      success: result.success,
      isDuplicate: result.isDuplicate,
      disposition:
        result.disposition === 'REJECTED' ? undefined : (result.disposition as SaveDisposition),
      message: result.message,
      portfolio: {
        portfolioId: result.portfolio.portfolioId,
        portfolioName: result.portfolio.portfolioName,
        holdings: result.portfolio.holdings,
        totalMarketValue: result.portfolio.totalMarketValue,
        totalHoldingsCount: result.portfolio.totalHoldingsCount,
        weightSumPercentage: result.portfolio.weightSumPercentage,
        lastUpdated: result.portfolio.lastUpdated,
        provenanceDigest: result.portfolio.provenanceDigest,
        isSaved: result.portfolio.isSaved,
        contributions: result.portfolio.contributions,
      },
      holdingsSavedCount: result.holdingsSavedCount,
      totalMarketValue: result.totalMarketValue,
      weightSumPercentage: result.weightSumPercentage,
      savedAt: result.savedAt,
      provenanceDigest: result.provenanceDigest,
      error: result.error,
    };
  }
}
