/**
 * Institutional Investment Platform System (IIPS)
 * G-2 / Gate B — Owner-Scoped Portfolio Read / Analytics Operations
 * (L-IPC-1 C1, C3, C6, C11, C12)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Authority: `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-17-01` as rendered by
 * `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-DECISION-2026-10-17-01` (D-4 = ACCEPT).
 *
 * The scope is ALWAYS `{ applicationUserId, tenantId }` supplied by the caller — and the
 * only caller is the IPC dispatcher, which takes it from the provisioned binding. No
 * operation accepts an identity, tenant, owner or scope from the request payload.
 *
 * C11 — the G24 durable store is the ONLY portfolio store. This module creates no cache,
 * no side file and no second store; every read goes through `DurablePortfolioStore`.
 *
 * WRITES ARE NOT AUTHORIZED. `save()` exists so that a write attempt is REFUSED explicitly
 * (rather than reported as an unknown operation) and it always throws. Gate E owns the
 * successful-write policy; no durable write occurs on this path.
 */

import type { DurablePortfolioStore, DurablePortfolioView } from '../portfolio/durable-store.js';
import type {
  BrokerContributionRecord,
} from '../../frontend/src/features/portfolio/portfolio-store.js';
import type { UserHoldingInput } from '../../frontend/src/features/portfolio/import/types.js';

import { UserPortfolioRefusal } from './errors.js';
import type { CanonicalIdentityBoundary, CanonicalResolution } from './canonical_identity.js';

/** The ownership scope. Derived exclusively from the provisioned binding. */
export interface PortfolioScope {
  readonly applicationUserId: string;
  readonly tenantId: string;
}

/** Bounded summary — the list projection. */
export interface PortfolioSummary {
  readonly portfolioId: string;
  readonly portfolioName: string;
  readonly revision: number;
  readonly holdingsCount: number;
  readonly totalMarketValue: number;
  readonly lastUpdated: string;
}

/** Full detail for one owned portfolio. */
export interface PortfolioDetail extends PortfolioSummary {
  readonly holdings: readonly UserHoldingInput[];
  readonly contributions: readonly BrokerContributionRecord[];
  readonly weightSumPercentage: number;
  readonly provenanceDigest: string;
  readonly isSaved: boolean;
}

/** Derived analytics. Computed from the existing view; nothing is persisted. */
export interface PortfolioAnalytics {
  readonly portfolioId: string;
  readonly revision: number;
  readonly holdingsCount: number;
  readonly totalMarketValue: number;
  readonly weightSumPercentage: number;
  readonly largestHoldingWeightPercentage: number;
  readonly provenanceDigest: string;
  readonly contributionsCount: number;
}

/** Resolution is exposed only through the canonical boundary (C12); never inferred here. */
export interface HoldingIdentityResolution {
  readonly resolution: CanonicalResolution;
}

const PORTFOLIO_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

/** The only key any portfolio operation accepts in its payload. */
const ALLOWED_PAYLOAD_KEYS: ReadonlySet<string> = new Set(['portfolioId']);

/**
 * Authority-bearing keys, refused here as well as at the wire (C7: refused, never ignored).
 *
 * The IPC envelope scan is the trust boundary; this second check is defence in depth so an
 * in-process caller cannot smuggle an ownership claim past a layer that merely "ignores"
 * extra fields. `portfolio.list` accepts NO payload key at all, so every key is refused.
 */
const PAYLOAD_AUTHORITY_KEYS: ReadonlySet<string> = new Set([
  'principal',
  'principalid',
  'applicationuser',
  'applicationuserid',
  'user',
  'userid',
  'username',
  'subject',
  'sub',
  'issuer',
  'iss',
  'credential',
  'credentials',
  'token',
  'accesstoken',
  'idtoken',
  'authorization',
  'auth',
  'authheader',
  'owner',
  'ownerid',
  'owneruserid',
  'tenant',
  'tenantid',
  'membership',
  'membershipid',
  'memberships',
  'scope',
  'scopes',
  'requestedscope',
  'requestedtenant',
  'role',
  'roles',
  'permission',
  'permissions',
  'elevated',
  'admin',
  'bypass',
  'operatorbypass',
  'nonproductionoperatorbypass',
  'companyid',
  'runtimecompanyid',
  'companyids',
  'identitystatus',
  'resolutiondisposition',
  'canonicalcompanyid',
  'resolvedcompanyid',
  'session',
  'sessionid',
]);

const FORBIDDEN_VALUE_TOKENS: readonly string[] = ['NON_PRODUCTION_OPERATOR_BYPASS', 'OPERATOR_BYPASS'];

function normalizeKey(key: string): string {
  return key.replace(/[_-]/g, '').toLowerCase();
}

/**
 * Refuses caller-supplied authority anywhere in a payload (keys AND values), then refuses any
 * key outside `allowed`. Throws `CALLER_SUPPLIED_AUTHORITY` / `MALFORMED_REQUEST`.
 */
function assertPayloadShape(payload: unknown, allowed: ReadonlySet<string>, depth = 0): void {
  if (depth > 12) {
    throw new UserPortfolioRefusal('MALFORMED_REQUEST', 'Payload nesting exceeds the permitted depth.');
  }
  if (typeof payload === 'string') {
    const upper = payload.toUpperCase();
    for (const token of FORBIDDEN_VALUE_TOKENS) {
      if (upper.includes(token)) {
        throw new UserPortfolioRefusal('CALLER_SUPPLIED_AUTHORITY', 'A caller-supplied authority token was refused.');
      }
    }
    return;
  }
  if (Array.isArray(payload)) {
    for (const entry of payload) {
      assertPayloadShape(entry, allowed, depth + 1);
    }
    return;
  }
  if (payload !== null && typeof payload === 'object') {
    for (const [key, entry] of Object.entries(payload as Record<string, unknown>)) {
      if (PAYLOAD_AUTHORITY_KEYS.has(normalizeKey(key))) {
        throw new UserPortfolioRefusal('CALLER_SUPPLIED_AUTHORITY', 'A caller-supplied authority field was refused.');
      }
      if (!allowed.has(key)) {
        throw new UserPortfolioRefusal('MALFORMED_REQUEST', 'The payload carries an unsupported field.');
      }
      assertPayloadShape(entry, allowed, depth + 1);
    }
  }
}

/**
 * `portfolio.list` takes no payload. Any key — authority or not — is refused rather than
 * dropped, so a caller cannot send a scope and be silently served someone else's default.
 */
export function assertListPayload(payload: unknown): void {
  if (payload === undefined || payload === null) {
    return;
  }
  if (typeof payload !== 'object' || Array.isArray(payload)) {
    assertPayloadShape(payload, new Set<string>()); // still refuse embedded bypass tokens
    throw new UserPortfolioRefusal('MALFORMED_REQUEST', 'portfolio.list accepts no payload.');
  }
  assertPayloadShape(payload, new Set<string>());
}

function toSummary(view: DurablePortfolioView): PortfolioSummary {
  return {
    portfolioId: view.portfolioId,
    portfolioName: view.portfolioName,
    revision: view.revision,
    holdingsCount: view.totalHoldingsCount,
    totalMarketValue: view.totalMarketValue,
    lastUpdated: view.lastUpdated,
  };
}

/**
 * Read-only owner-scoped operations over the existing durable store.
 *
 * Every "not found" outcome — nonexistent, foreign, other tenant, tombstoned — and every
 * store failure is collapsed onto `RESOURCE_UNAVAILABLE` before it leaves this module, so the
 * IPC layer cannot disclose existence and cannot mistake an outage for an empty result.
 *
 * C7 is enforced HERE as well as at the wire: an ownership or identity field in a payload is
 * refused, never ignored, so no layer can be made to serve another principal's data by
 * simply dropping the field it did not expect.
 */
export class UserPortfolioOperations {
  constructor(
    private readonly store: DurablePortfolioStore,
    private readonly canonical: CanonicalIdentityBoundary
  ) {}

  private assertScope(scope: PortfolioScope): void {
    if (
      scope === null ||
      typeof scope !== 'object' ||
      typeof scope.applicationUserId !== 'string' ||
      scope.applicationUserId.trim() === '' ||
      typeof scope.tenantId !== 'string' ||
      scope.tenantId.trim() === ''
    ) {
      throw new UserPortfolioRefusal('MALFORMED_REQUEST', 'A complete owner scope is required.');
    }
  }

  private readPortfolioId(payload: unknown): string {
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new UserPortfolioRefusal('MALFORMED_REQUEST', 'A payload object carrying portfolioId is required.');
    }
    // C7 — a claim is refused here too, not ignored, even though the wire already refuses it.
    assertPayloadShape(payload, ALLOWED_PAYLOAD_KEYS);
    const record = payload as Record<string, unknown>;
    const portfolioId = record.portfolioId;
    if (typeof portfolioId !== 'string' || !PORTFOLIO_ID_PATTERN.test(portfolioId)) {
      throw new UserPortfolioRefusal('MALFORMED_REQUEST', 'portfolioId is not a permitted identifier.');
    }
    return portfolioId;
  }

  /** Lists ONLY the portfolios owned by the bound principal under its tenant. */
  public list(scope: PortfolioScope): readonly PortfolioSummary[] {
    this.assertScope(scope);
    let views: DurablePortfolioView[];
    try {
      views = this.store.listPortfolios({
        applicationUserId: scope.applicationUserId,
        tenantId: scope.tenantId,
      });
    } catch {
      // An unavailable store is a refusal, never an empty success (C6/C9).
      throw new UserPortfolioRefusal('RESOURCE_UNAVAILABLE', 'No portfolio is available to this principal.');
    }
    return views.map(toSummary);
  }

  /** Returns one owned portfolio, or refuses indistinguishably. */
  public get(scope: PortfolioScope, payload: unknown): PortfolioDetail {
    this.assertScope(scope);
    const portfolioId = this.readPortfolioId(payload);
    const view = this.readAuthorizedView(scope, portfolioId);
    return {
      ...toSummary(view),
      holdings: view.holdings.slice(),
      contributions: view.contributions.slice(),
      weightSumPercentage: view.weightSumPercentage,
      provenanceDigest: view.provenanceDigest,
      isSaved: view.isSaved,
    };
  }

  /** Derived analytics over the same authorized view. Nothing is persisted. */
  public analytics(scope: PortfolioScope, payload: unknown): PortfolioAnalytics {
    this.assertScope(scope);
    const portfolioId = this.readPortfolioId(payload);
    const view = this.readAuthorizedView(scope, portfolioId);
    const largest = view.holdings.reduce(
      (max, holding) => Math.max(max, Number(holding.weightPercentage ?? 0)),
      0
    );
    return {
      portfolioId: view.portfolioId,
      revision: view.revision,
      holdingsCount: view.totalHoldingsCount,
      totalMarketValue: view.totalMarketValue,
      weightSumPercentage: view.weightSumPercentage,
      largestHoldingWeightPercentage: largest,
      provenanceDigest: view.provenanceDigest,
      contributionsCount: view.contributions.length,
    };
  }

  /**
   * Gate E owns successful writes. This method exists so a write attempt is an explicit,
   * uniform refusal rather than an "unknown operation" surprise — and it NEVER writes.
   */
  public save(_scope: PortfolioScope, _payload: unknown): never {
    throw new UserPortfolioRefusal(
      'WRITE_NOT_AUTHORIZED',
      'Portfolio writes are not authorized on this path; the write policy is Gate E.'
    );
  }

  /**
   * C12 — canonical resolution or refusal, re-enforced at this boundary.
   * Never defaults an identity, never emits a bypass.
   */
  public resolveHoldingIdentity(request: unknown): HoldingIdentityResolution {
    return { resolution: this.canonical.resolve(request) };
  }

  private readAuthorizedView(scope: PortfolioScope, portfolioId: string): DurablePortfolioView {
    try {
      return this.store.getPortfolio({
        applicationUserId: scope.applicationUserId,
        tenantId: scope.tenantId,
        portfolioId,
      });
    } catch {
      // Missing ≡ foreign ≡ other tenant ≡ tombstoned. One refusal, no disclosure.
      throw new UserPortfolioRefusal('RESOURCE_UNAVAILABLE', 'No such portfolio is available to this principal.');
    }
  }
}
