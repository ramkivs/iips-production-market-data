/**
 * Institutional Investment Platform System (IIPS)
 * G-2 / Gate B — Canonical Identity Resolution or Refusal (L-IPC-1 C12 / DP-2 Option 2F)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Authority: `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-17-01` as rendered by
 * `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-DECISION-2026-10-17-01` (D-4 = ACCEPT).
 *
 * ── The verified off-main gap, closed here rather than inherited ──────────────────────────
 * The existing write path (`src/server/http-server.ts` → `validateHolding`) defaults
 * `companyId` to `''`, `identityStatus` to `'RESOLVED'` and `resolutionDisposition` to
 * `'CANONICAL_P04'`, and its save guard accepts a `NON_PRODUCTION_OPERATOR_BYPASS` branch.
 * Reusing that guard unchanged would VIOLATE C12. This module therefore NEVER:
 *   - defaults `companyId` to an empty or invented value;
 *   - declares `identityStatus = 'RESOLVED'` before a resolution has actually matched;
 *   - declares `resolutionDisposition = 'CANONICAL_P04'` before a resolution has matched;
 *   - emits, accepts or tolerates the operator bypass.
 * A resolution result exists ONLY as the product of a successful, single-match resolution.
 *
 * The existing mapping capability (`src/identity/mapping_store.ts`) is consumed READ-ONLY;
 * it and `security_master.ts` are byte-unchanged under this act.
 */

import {
  IdentityMappingStore,
  type EffectiveDatedMapping,
  type IdentityQuery,
} from '../identity/mapping_store.js';
import {
  IdentityAmbiguityError,
  type IdentityQuarantineRecord,
} from '../identity/quarantine.js';

import { UserPortfolioRefusal } from './errors.js';

export type CanonicalIdentifierType = IdentityQuery['identifierType'];

/** The ONLY accepted request shape. Anything else — especially identity claims — refuses. */
const ALLOWED_REQUEST_KEYS: ReadonlySet<string> = new Set(['identifierType', 'identifierValue', 'asOf']);

/** Identity/scope keys that must never enter this boundary (C7, re-enforced IPD-side). */
const FORBIDDEN_REQUEST_KEYS: ReadonlySet<string> = new Set([
  'companyId',
  'runtimeCompanyId',
  'identityStatus',
  'resolutionDisposition',
  'principal',
  'principalId',
  'applicationUserId',
  'userId',
  'subject',
  'sub',
  'issuer',
  'credential',
  'token',
  'owner',
  'ownerId',
  'tenant',
  'tenantId',
  'membership',
  'scope',
  'role',
  'permissions',
  'bypass',
  'operatorBypass',
]);

const IDENTIFIER_TYPES: ReadonlySet<string> = new Set([
  'ISIN',
  'CIN',
  'NSE_SYMBOL',
  'BSE_SYMBOL',
  'COMPOSITE_TICKER',
]);

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?)?$/;

/** A canonical identity that has ACTUALLY resolved. The status fields are produced, not defaulted. */
export interface CanonicalResolution {
  readonly companyId: string;
  readonly identifierType: CanonicalIdentifierType;
  readonly identifierValue: string;
  readonly asOf: string;
  /** Set only after a single canonical match. */
  readonly identityStatus: 'RESOLVED';
  /** Set only after a single canonical match; never a bypass, never a caller value. */
  readonly resolutionDisposition: 'CANONICAL_P04';
}

/**
 * Canonical identity boundary.
 *
 * `resolve()` either returns a fully-resolved `CanonicalResolution` or throws
 * `UserPortfolioRefusal('CANONICAL_IDENTITY_UNRESOLVED')` — there is no third outcome and
 * no caller-visible distinction between "unmapped" and "ambiguous" (DP-2 Option 2F requires
 * the refusal, C6 requires it be uniform).
 */
export class CanonicalIdentityBoundary {
  private readonly evidence: IdentityQuarantineRecord[] = [];

  constructor(private readonly store: IdentityMappingStore = new IdentityMappingStore()) {}

  /** Seeds authoritative mappings. Read-only w.r.t. the store's resolution semantics. */
  public seed(mappings: readonly EffectiveDatedMapping[]): void {
    for (const mapping of mappings) {
      this.store.addMapping(mapping);
    }
  }

  /**
   * Resolves, or refuses BEFORE any serialization, port call or persistence.
   *
   * Caller-supplied identity is refused FIRST — before the mapping store is consulted — so
   * a caller cannot probe resolutions by attaching claims.
   */
  public resolve(request: unknown): CanonicalResolution {
    if (request === null || typeof request !== 'object' || Array.isArray(request)) {
      throw new UserPortfolioRefusal('MALFORMED_REQUEST', 'Canonical identity request must be an object.');
    }

    const record = request as Record<string, unknown>;

    for (const key of Object.keys(record)) {
      if (FORBIDDEN_REQUEST_KEYS.has(key)) {
        throw new UserPortfolioRefusal(
          'CALLER_SUPPLIED_AUTHORITY',
          'Caller-supplied identity or scope was refused at the canonical-identity boundary.'
        );
      }
      if (!ALLOWED_REQUEST_KEYS.has(key)) {
        throw new UserPortfolioRefusal('MALFORMED_REQUEST', 'Canonical identity request carries an unsupported field.');
      }
    }

    const identifierType = record.identifierType;
    const identifierValue = record.identifierValue;

    if (typeof identifierType !== 'string' || !IDENTIFIER_TYPES.has(identifierType)) {
      throw new UserPortfolioRefusal('MALFORMED_REQUEST', 'identifierType is not a governed identifier type.');
    }
    if (typeof identifierValue !== 'string' || identifierValue.trim() === '' || identifierValue.length > 64) {
      throw new UserPortfolioRefusal('MALFORMED_REQUEST', 'identifierValue must be a non-empty bounded string.');
    }
    if (record.asOf !== undefined) {
      if (typeof record.asOf !== 'string' || !ISO_DATE_PATTERN.test(record.asOf) || Number.isNaN(Date.parse(record.asOf))) {
        throw new UserPortfolioRefusal('MALFORMED_REQUEST', 'asOf must be an ISO-8601 instant when present.');
      }
    }

    const query: IdentityQuery = {
      identifierType: identifierType as CanonicalIdentifierType,
      identifierValue: identifierValue,
      ...(record.asOf !== undefined ? { asOf: record.asOf as string } : {}),
    };

    try {
      const companyId = this.store.resolveCompanyId(query);

      // Defensive: a resolution that yields nothing is a refusal, never an empty-id success.
      if (typeof companyId !== 'string' || companyId.trim() === '') {
        throw new UserPortfolioRefusal('CANONICAL_IDENTITY_UNRESOLVED', 'Canonical resolution produced no identifier.');
      }

      return {
        companyId,
        identifierType: query.identifierType,
        identifierValue: query.identifierValue,
        asOf: query.asOf ?? new Date().toISOString(),
        identityStatus: 'RESOLVED',
        resolutionDisposition: 'CANONICAL_P04',
      };
    } catch (error) {
      if (error instanceof IdentityAmbiguityError) {
        // Quarantine evidence is retained LOCALLY for tests/operator diagnosis. It is not
        // returned to the caller and never becomes a wire field.
        this.evidence.push(error.quarantineRecord);
        throw new UserPortfolioRefusal(
          'CANONICAL_IDENTITY_UNRESOLVED',
          `Canonical identity refused (${error.quarantineRecord.reason}).`
        );
      }
      if (error instanceof UserPortfolioRefusal) {
        throw error;
      }
      throw new UserPortfolioRefusal('CANONICAL_IDENTITY_UNRESOLVED', 'Canonical identity could not be resolved.');
    }
  }

  /** Local quarantine evidence gathered by refused resolutions. Never transmitted. */
  public quarantineEvidence(): readonly IdentityQuarantineRecord[] {
    return this.evidence.slice();
  }

  public clearEvidence(): void {
    this.evidence.length = 0;
    this.store.clearQuarantine();
  }
}
