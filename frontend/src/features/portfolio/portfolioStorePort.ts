/**
 * Institutional Investment Platform System (IIPS)
 * Portfolio Store Port — G-2 bounded UI dependency inversion (BI-07)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / act
 * `np04-g2-portfolio-ui-store-port-2026-10-16-001` (APPROVED 2026-10-16)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
 *
 * The port is the UI's authority for portfolio reads, analytics and saves.
 *
 * IDENTITY / SCOPE DISCIPLINE
 *   The port deliberately carries NO owner, tenant, principal, credential or
 *   authorization-scope parameter, and it refuses any request that supplies such
 *   a claim. Identity and scope (where a future durable implementation needs them)
 *   are established outside the UI and are never accepted from a caller-supplied
 *   claim.
 *
 * DURABILITY DISCIPLINE
 *   The only implementation shipped by this act is the session-scoped adapter over
 *   the existing in-memory `PortfolioStore`. It declares `durability: 'SESSION_ONLY'`
 *   and `durable: false`. Nothing here performs a durable write, and the UI must not
 *   present a session-scoped save as a durable commit.
 *
 * DP-2 OPTION 2F
 *   Unresolved or ambiguous holdings may be previewed and explained, but they are
 *   REFUSED for persistence by this port before any state mutation. No canonical
 *   company identity is ever fabricated to make a save succeed.
 */

import { UserHoldingInput } from './import/types.js';
import {
  getDefaultPortfolioStore,
  PortfolioAnalyticsSummary,
  PortfolioRecord,
  PortfolioSaveOptions,
  PortfolioSaveResult,
  PortfolioStore,
} from './portfolio-store.js';

/* ------------------------------------------------------------------ *
 * Durability declarations
 * ------------------------------------------------------------------ */

export type PortfolioDurability = 'SESSION_ONLY' | 'DURABLE';

/* ------------------------------------------------------------------ *
 * Refusal vocabulary
 * ------------------------------------------------------------------ */

export type PortfolioPortRefusalCode =
  | 'REFUSED_UNRESOLVED_IDENTITY' // DP-2 Option 2F
  | 'REFUSED_STORE_GUARD' // Existing store guards (empty vector, weight sum, invalid fields)
  | 'REVISION_CONFLICT'
  | 'INVALID_REQUEST'
  | 'UNAVAILABLE';

export interface PortfolioPortRefusedHolding {
  symbol: string;
  isin?: string;
  reason: string;
}

/* ------------------------------------------------------------------ *
 * Port contract
 * ------------------------------------------------------------------ */

export interface PortfolioPortSaveRequest {
  portfolioId?: string;
  holdings: UserHoldingInput[];
  options?: PortfolioSaveOptions;
  /**
   * Optional optimistic-concurrency token. On the session adapter this is a
   * session-scoped, non-durable counter (see `getRevision`).
   */
  expectedRevision?: number;
}

export interface PortfolioPortSaveSuccess {
  ok: true;
  durability: PortfolioDurability;
  durable: boolean;
  /** The certified `PortfolioSaveResult` shape produced by the underlying store. */
  result: PortfolioSaveResult;
  revision: number;
}

export interface PortfolioPortSaveRefusal {
  ok: false;
  code: PortfolioPortRefusalCode;
  message: string;
  durability: PortfolioDurability;
  durable: boolean;
  refusedHoldings: PortfolioPortRefusedHolding[];
  /** Unmutated portfolio snapshot for display. */
  portfolio: PortfolioRecord;
  expectedRevision?: number;
  actualRevision?: number;
}

export type PortfolioPortSaveOutcome = PortfolioPortSaveSuccess | PortfolioPortSaveRefusal;

/**
 * Narrow asynchronous port. Reads, analytics and saves only.
 *
 * No method accepts an owner, tenant, principal, credential or authorization
 * scope — by construction, because none exists in this interface.
 */
export interface PortfolioStorePort {
  readonly durability: PortfolioDurability;
  readonly durable: boolean;
  getPortfolio(portfolioId?: string): Promise<PortfolioRecord | undefined>;
  getAnalytics(portfolioId?: string): Promise<PortfolioAnalyticsSummary>;
  getRevision(portfolioId?: string): Promise<number>;
  saveHoldings(request: PortfolioPortSaveRequest): Promise<PortfolioPortSaveOutcome>;
}

/* ------------------------------------------------------------------ *
 * Caller-supplied identity refusal (fail closed)
 * ------------------------------------------------------------------ */

/**
 * Keys that constitute a caller-supplied identity, tenant, principal, credential
 * or authorization-scope claim. They are refused outright: the browser may not
 * assert who it is or what it is entitled to.
 */
export const CALLER_SUPPLIED_IDENTITY_KEYS: readonly string[] = [
  'owner',
  'ownerId',
  'tenant',
  'tenantId',
  'applicationUserId',
  'applicationUser',
  'userId',
  'user',
  'principal',
  'principalId',
  'membership',
  'membershipId',
  'credential',
  'credentials',
  'password',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'authHeader',
  'claims',
  'scope',
  'scopes',
  'role',
  'roles',
  'identity',
  'sessionId',
  'applicationPrincipal',
];

/**
 * Returns any caller-supplied identity/authorization-scope keys present at the
 * top level of the request or inside its `options` bag (which is index-signature
 * flexible and therefore a possible smuggling route).
 */
export function findCallerSuppliedIdentityKeys(
  request: PortfolioPortSaveRequest | Record<string, unknown> | undefined | null
): string[] {
  const found = new Set<string>();
  const scan = (candidate: unknown): void => {
    if (!candidate || typeof candidate !== 'object') return;
    for (const key of Object.keys(candidate as Record<string, unknown>)) {
      if (CALLER_SUPPLIED_IDENTITY_KEYS.includes(key)) found.add(key);
    }
  };
  scan(request);
  scan((request as PortfolioPortSaveRequest | undefined)?.options);
  return Array.from(found).sort();
}

/* ------------------------------------------------------------------ *
 * Port save guard (DP-2 Option 2F) — pure, reusable by UI + adapter
 * ------------------------------------------------------------------ */

export interface PortfolioPortSaveGuard {
  saveable: boolean;
  disabledReason?: string;
  refusedHoldings: PortfolioPortRefusedHolding[];
}

/**
 * Evaluates whether a holding vector may be persisted through the port.
 * Unresolved or ambiguous identities are refused (DP-2 Option 2F): they may be
 * previewed and explained, never persisted, and never given a fabricated id.
 */
export function evaluatePortSaveGuard(
  holdings: UserHoldingInput[] | undefined | null
): PortfolioPortSaveGuard {
  const vector = holdings ?? [];

  if (vector.length === 0) {
    return {
      saveable: false,
      disabledReason: 'No holdings are available to save.',
      refusedHoldings: [],
    };
  }

  const refusedHoldings: PortfolioPortRefusedHolding[] = [];

  for (const holding of vector) {
    const identityStatus = holding?.identityStatus;
    const companyId = typeof holding?.companyId === 'string' ? holding.companyId.trim() : '';
    const hasCanonicalIdentity = identityStatus === 'RESOLVED' && companyId.length > 0 && companyId !== 'UNKNOWN';

    if (!hasCanonicalIdentity) {
      refusedHoldings.push({
        symbol: holding?.symbol || '(unknown symbol)',
        isin: holding?.isin,
        reason:
          identityStatus === 'RESOLVED'
            ? 'Canonical P04 company identity is missing.'
            : 'Identity unresolved or ambiguous at ingress.',
      });
    }
  }

  if (refusedHoldings.length > 0) {
    return {
      saveable: false,
      disabledReason:
        `DP-2 Option 2F: ${refusedHoldings.length} holding(s) have no single canonical identity. ` +
        'They may be previewed and explained, but they cannot be persisted through this port.',
      refusedHoldings,
    };
  }

  return { saveable: true, refusedHoldings: [] };
}

/* ------------------------------------------------------------------ *
 * Truthful persistence-status wording
 * ------------------------------------------------------------------ */

export type PersistenceState = 'EMPTY' | 'SESSION_ONLY' | 'DURABLE';

export interface PersistenceStatusDescriptor {
  state: PersistenceState;
  label: string;
  detail: string;
  isDurable: boolean;
  tone: 'amber' | 'emerald';
}

/**
 * Maps portfolio state + declared store durability to what the UI may show.
 *
 * Invariant: a durability claim ("COMMITTED") is produced ONLY when the port
 * declares a real durable commit. A session-scoped save is labelled as such.
 */
export function describePersistenceStatus(input: {
  isSaved: boolean;
  durable: boolean;
  lastUpdated?: string;
}): PersistenceStatusDescriptor {
  const updated = input.lastUpdated
    ? `Updated: ${input.lastUpdated.slice(0, 19).replace('T', ' ')}`
    : 'No writes performed';

  if (!input.isSaved) {
    return {
      state: 'EMPTY',
      label: 'EMPTY / INITIAL',
      detail: 'No writes performed',
      isDurable: false,
      tone: 'amber',
    };
  }

  if (!input.durable) {
    return {
      state: 'SESSION_ONLY',
      label: 'SAVED (SESSION ONLY - NOT DURABLE)',
      detail: `${updated} - in-memory session store`,
      isDurable: false,
      tone: 'amber',
    };
  }

  return {
    state: 'DURABLE',
    label: 'COMMITTED (Durable)',
    detail: updated,
    isDurable: true,
    tone: 'emerald',
  };
}

/* ------------------------------------------------------------------ *
 * Session-scoped adapter over the existing in-memory store
 * ------------------------------------------------------------------ */

const SHA256_EMPTY =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

/**
 * Session-only, non-durable implementation of `PortfolioStorePort`.
 *
 * It delegates reads, analytics and the save itself to the existing
 * `PortfolioStore` (arithmetic, consolidation, idempotency and provenance are
 * therefore preserved by construction) and adds only what the port owns:
 *
 *  - the DP-2 Option 2F refusal at the save boundary (before any mutation),
 *  - refusal of caller-supplied identity/authorization-scope claims,
 *  - a session-scoped revision counter for optimistic-concurrency surfacing,
 *  - an explicit, honest durability declaration (`SESSION_ONLY` / `false`).
 */
export class SessionPortfolioStorePort implements PortfolioStorePort {
  public readonly durability: PortfolioDurability = 'SESSION_ONLY';
  public readonly durable: boolean = false;

  private readonly store: PortfolioStore;
  private readonly revisions: Map<string, number> = new Map();

  constructor(store?: PortfolioStore) {
    this.store = store || getDefaultPortfolioStore();
  }

  public async getPortfolio(portfolioId: string = 'DEFAULT_PORTFOLIO'): Promise<PortfolioRecord | undefined> {
    return this.store.getPortfolio(portfolioId);
  }

  public async getAnalytics(portfolioId: string = 'DEFAULT_PORTFOLIO'): Promise<PortfolioAnalyticsSummary> {
    return this.store.getAnalytics(portfolioId);
  }

  public async getRevision(portfolioId: string = 'DEFAULT_PORTFOLIO'): Promise<number> {
    return this.revisions.get(portfolioId) ?? 0;
  }

  public async saveHoldings(request: PortfolioPortSaveRequest): Promise<PortfolioPortSaveOutcome> {
    const portfolioId = request?.portfolioId || 'DEFAULT_PORTFOLIO';
    const actualRevision = this.revisions.get(portfolioId) ?? 0;
    const snapshot = this.store.getPortfolio(portfolioId) ?? this.emptyRecord(portfolioId);

    // 1. Caller-supplied identity / authorization scope is refused outright.
    const identityKeys = findCallerSuppliedIdentityKeys(request);
    if (identityKeys.length > 0) {
      return this.refuse({
        code: 'INVALID_REQUEST',
        message:
          'Caller-supplied identity or authorization scope is refused by the portfolio store port ' +
          `(keys: ${identityKeys.join(', ')}).`,
        portfolio: snapshot,
        actualRevision,
        expectedRevision: request?.expectedRevision,
      });
    }

    // 2. DP-2 Option 2F: unresolved/ambiguous holdings are refused before any mutation.
    const guard = evaluatePortSaveGuard(request?.holdings);
    if (!guard.saveable) {
      return this.refuse({
        code: (request?.holdings?.length ?? 0) > 0 ? 'REFUSED_UNRESOLVED_IDENTITY' : 'REFUSED_STORE_GUARD',
        message: guard.disabledReason || 'Holdings are not saveable through this port.',
        refusedHoldings: guard.refusedHoldings,
        portfolio: snapshot,
        actualRevision,
        expectedRevision: request?.expectedRevision,
      });
    }

    // 3. Optimistic-concurrency check (session-scoped revision).
    if (typeof request.expectedRevision === 'number' && request.expectedRevision !== actualRevision) {
      return this.refuse({
        code: 'REVISION_CONFLICT',
        message:
          `Revision conflict: expected revision ${request.expectedRevision} but the session store is at ` +
          `revision ${actualRevision}. Refresh the workspace and retry.`,
        portfolio: snapshot,
        actualRevision,
        expectedRevision: request.expectedRevision,
      });
    }

    // 4. Delegate the save itself to the existing store (governed arithmetic preserved).
    let result: PortfolioSaveResult;
    try {
      result = this.store.saveHoldings(portfolioId, request.holdings, request.options ?? {});
    } catch (error: unknown) {
      return this.refuse({
        code: 'UNAVAILABLE',
        message: `Port save failed: ${error instanceof Error ? error.message : String(error)}`,
        portfolio: snapshot,
        actualRevision,
        expectedRevision: request?.expectedRevision,
      });
    }

    if (!result.success) {
      return this.refuse({
        code: 'REFUSED_STORE_GUARD',
        message: result.error || 'The portfolio store refused the save.',
        portfolio: snapshot,
        actualRevision,
        expectedRevision: request?.expectedRevision,
      });
    }

    // 5. Advance the session revision only on a real state change (idempotent
    //    re-imports are no-ops and must not advance it).
    const revision = result.isDuplicate ? actualRevision : actualRevision + 1;
    this.revisions.set(portfolioId, revision);

    return {
      ok: true,
      durability: this.durability,
      durable: this.durable,
      result,
      revision,
    };
  }

  private refuse(params: {
    code: PortfolioPortRefusalCode;
    message: string;
    portfolio: PortfolioRecord;
    refusedHoldings?: PortfolioPortRefusedHolding[];
    expectedRevision?: number;
    actualRevision?: number;
  }): PortfolioPortSaveRefusal {
    return {
      ok: false,
      code: params.code,
      message: params.message,
      durability: this.durability,
      durable: this.durable,
      refusedHoldings: params.refusedHoldings ?? [],
      portfolio: params.portfolio,
      expectedRevision: params.expectedRevision,
      actualRevision: params.actualRevision,
    };
  }

  private emptyRecord(portfolioId: string): PortfolioRecord {
    return {
      portfolioId,
      portfolioName: 'Institutional Flagship Portfolio',
      holdings: [],
      totalMarketValue: 0,
      totalHoldingsCount: 0,
      weightSumPercentage: 0.0,
      lastUpdated: new Date().toISOString(),
      provenanceDigest: SHA256_EMPTY,
      isSaved: false,
      contributions: [],
    };
  }
}

/* ------------------------------------------------------------------ *
 * Default (application-lifetime) session port
 * ------------------------------------------------------------------ */

let defaultPortfolioStorePortInstance: SessionPortfolioStorePort | null = null;

/**
 * Module-level singleton session port, so the application shell, workspace and
 * modal share one adapter (and therefore one session revision sequence) over the
 * one in-memory store.
 */
export function getDefaultPortfolioStorePort(): SessionPortfolioStorePort {
  if (!defaultPortfolioStorePortInstance) {
    defaultPortfolioStorePortInstance = new SessionPortfolioStorePort(getDefaultPortfolioStore());
  }
  return defaultPortfolioStorePortInstance;
}

export function resetDefaultPortfolioStorePort(): void {
  defaultPortfolioStorePortInstance = null;
}
