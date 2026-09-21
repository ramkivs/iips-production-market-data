/**
 * IIPS — BI-03: broker holdings → UserHoldingInput mapper contract.
 *
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03
 *
 * `mapBrokerOutputToUserHoldings` converts the IIPS normalized broker
 * representation (NormalizedBrokerHolding[]) into the existing governed
 * `UserHoldingInput[]` contract (frontend/src/api/portfolio.ts) consumed by
 * `saveUserPortfolio` and the multi-tenant portfolio service.
 *
 * Contract (BI-02 assessment §4 / BI-03 authorization):
 *   1. Accepts normalized broker holdings.
 *   2. Excludes inactive holdings and holdings with non-positive market
 *      value — every exclusion is reported, never silent.
 *   3. Aggregates duplicate securities (same ISIN, else same symbol, else
 *      same instrument name) — the in-memory lot-union rule for exports that
 *      list one row per trade lot (e.g. Dhan equity exports).
 *   4. Derives market-value weights: weight_i = value_i / Σvalue × 100.
 *   5. Normalizes weights to EXACTLY 100.0% — one-decimal precision via
 *      largest-remainder allocation over tenths of a percent (integer
 *      arithmetic: exact, deterministic, no per-row rounding drift). This
 *      matches the governed one-decimal weight basis (`r1`, round-half-to-
 *      even, portfolio-service.ts).
 *   6. Preserves symbol/ISIN identity information verbatim (trimmed).
 *   7. Fails closed — an explicit error result, never a partial portfolio —
 *      whenever required information is unavailable.
 *
 * P04/P12 governance is preserved: the mapper NEVER resolves identity and
 * NEVER invents `canonicalSecurityId`, `figi` or `sector`. It emits only the
 * identifiers the source export actually contains; the existing governed
 * resolver (frontend/server/portfolio/portfolio-resolver.ts) remains the
 * sole authority for canonical resolution and fails closed on unknown
 * securities. No alternative identity system is introduced.
 */
import type { UserHoldingInput } from '../../../api/portfolio';
import type { NormalizedBrokerHolding } from './types';

/** Reason a holding was excluded from the mapped portfolio (reported, not silent). */
export type BrokerExclusionReason = 'INACTIVE' | 'NON_POSITIVE_MARKET_VALUE';

export interface BrokerHoldingExclusion {
  readonly index: number;
  readonly reason: BrokerExclusionReason;
  readonly instrumentName: string;
  readonly symbol?: string;
  readonly isin?: string;
}

/** Machine-readable failure codes. Every failure carries a human-readable detail. */
export type BrokerMappingFailureCode =
  | 'EMPTY_INPUT'
  | 'NO_CONSUMABLE_HOLDINGS'
  | 'NON_FINITE_VALUE'
  | 'UNIDENTIFIABLE_HOLDING'
  | 'WEIGHT_BELOW_MINIMUM';

export type BrokerMappingResult =
  | {
      readonly ok: true;
      readonly holdings: readonly UserHoldingInput[];
      /** Σ marketValue over the consumable (active, positive) holdings, export currency. */
      readonly totalMarketValue: number;
      readonly exclusions: readonly BrokerHoldingExclusion[];
    }
  | {
      readonly ok: false;
      readonly code: BrokerMappingFailureCode;
      readonly detail: string;
    };

/** 100.0% expressed in tenths of a percent — the exact integer allocation target. */
const WEIGHT_TENTHS_TARGET = 1000;

/** Internal working identity (mutated while cleaning); not part of the public contract. */
interface Identity {
  symbol?: string;
  isin?: string;
  instrumentName: string;
}

interface AggregateGroup {
  value: number;
  quantity: number;
  symbol?: string;
  isin?: string;
  instrumentName: string;
}

/** Deterministic duplicate key: ISIN > symbol > instrument name. */
function identityKey(h: NormalizedBrokerHolding): string {
  const isin = h.isin === undefined ? undefined : h.isin.trim().toUpperCase();
  if (isin !== undefined && isin !== '') return `ISIN:${isin}`;
  const symbol = h.symbol === undefined ? undefined : h.symbol.trim().toUpperCase();
  if (symbol !== undefined && symbol !== '') return `SYMBOL:${symbol}`;
  return `NAME:${h.instrumentName.trim().toLowerCase()}`;
}

function cleanIdentity(h: NormalizedBrokerHolding): Identity {
  const identity: Identity = { instrumentName: h.instrumentName === undefined ? '' : h.instrumentName.trim() };
  if (h.symbol !== undefined && h.symbol.trim() !== '') identity.symbol = h.symbol.trim();
  if (h.isin !== undefined && h.isin.trim() !== '') identity.isin = h.isin.trim();
  return identity;
}

function hasAnyIdentity(identity: Identity): boolean {
  return (
    (identity.symbol !== undefined && identity.symbol !== '') ||
    (identity.isin !== undefined && identity.isin !== '') ||
    identity.instrumentName !== ''
  );
}

function isFiniteNumeric(h: NormalizedBrokerHolding): boolean {
  return Number.isFinite(h.quantity) && Number.isFinite(h.currentPrice) && Number.isFinite(h.marketValue);
}

function label(h: NormalizedBrokerHolding, index: number): string {
  const identity = cleanIdentity(h);
  const ident = identity.symbol ?? identity.isin ?? (identity.instrumentName === '' ? '(unnamed)' : identity.instrumentName);
  return `holding[${index}] ${ident}`;
}

function exclusionFor(index: number, reason: BrokerExclusionReason, identity: Identity): BrokerHoldingExclusion {
  return Object.freeze({
    index,
    reason,
    instrumentName: identity.instrumentName,
    ...(identity.symbol !== undefined ? { symbol: identity.symbol } : {}),
    ...(identity.isin !== undefined ? { isin: identity.isin } : {}),
  });
}

/**
 * Map normalized broker holdings to the governed `UserHoldingInput[]`
 * contract. Pure and deterministic; never throws — every outcome is a
 * `BrokerMappingResult` (fail-closed by construction).
 */
export function mapBrokerOutputToUserHoldings(
  holdings: readonly NormalizedBrokerHolding[],
): BrokerMappingResult {
  if (!Array.isArray(holdings) || holdings.length === 0) {
    return { ok: false, code: 'EMPTY_INPUT', detail: 'No broker holdings supplied.' };
  }

  const exclusions: BrokerHoldingExclusion[] = [];
  const groups = new Map<string, AggregateGroup>();

  for (let i = 0; i < holdings.length; i += 1) {
    const h = holdings[i];

    if (!isFiniteNumeric(h)) {
      return {
        ok: false,
        code: 'NON_FINITE_VALUE',
        detail:
          `${label(h, i)} carries a non-finite quantity, price or market value. ` +
          'The batch is rejected rather than partially mapped.',
      };
    }

    const identity = cleanIdentity(h);

    if (!hasAnyIdentity(identity)) {
      return {
        ok: false,
        code: 'UNIDENTIFIABLE_HOLDING',
        detail:
          `${label(h, i)} carries no symbol, ISIN or instrument name; ` +
          'no governed P04/P12 resolution could be attempted. The batch is rejected.',
      };
    }

    if (!h.active) {
      exclusions.push(exclusionFor(i, 'INACTIVE', identity));
      continue;
    }

    if (h.marketValue <= 0) {
      exclusions.push(exclusionFor(i, 'NON_POSITIVE_MARKET_VALUE', identity));
      continue;
    }

    const key = identityKey(h);
    const existing = groups.get(key);
    if (existing === undefined) {
      const group: AggregateGroup = {
        value: h.marketValue,
        quantity: h.quantity,
        instrumentName: identity.instrumentName,
      };
      if (identity.symbol !== undefined) group.symbol = identity.symbol;
      if (identity.isin !== undefined) group.isin = identity.isin;
      groups.set(key, group);
    } else {
      existing.value += h.marketValue;
      existing.quantity += h.quantity;
      // First non-empty identifier wins: within one export a repeated
      // instrument repeats with identical identifiers.
      if (existing.symbol === undefined) existing.symbol = identity.symbol;
      if (existing.isin === undefined) existing.isin = identity.isin;
      if (existing.instrumentName === '') existing.instrumentName = identity.instrumentName;
    }
  }

  if (groups.size === 0) {
    return {
      ok: false,
      code: 'NO_CONSUMABLE_HOLDINGS',
      detail:
        `All ${holdings.length} holding(s) were excluded (${exclusions.length} exclusion(s)); ` +
        'no active holding with positive market value remains.',
    };
  }

  const entries = [...groups.entries()];
  const totalMarketValue = entries.reduce((sum, [, g]) => sum + g.value, 0);
  if (!Number.isFinite(totalMarketValue) || totalMarketValue <= 0) {
    return {
      ok: false,
      code: 'NO_CONSUMABLE_HOLDINGS',
      detail: 'Total consumable market value is not a positive finite number.',
    };
  }

  // ── Largest-remainder allocation over tenths of a percent ─────────────────
  // weight_i = value_i / total × 1000 tenths, floored; the deficit (always <
  // number of groups) is distributed one tenth at a time to the largest
  // remainders (ties broken by input order). The result sums to EXACTLY
  // 1000 tenths = 100.0% — integer arithmetic, no per-row rounding drift.
  const scaled = entries.map(([, g]) => (g.value / totalMarketValue) * WEIGHT_TENTHS_TARGET);
  const tenths = scaled.map((s) => Math.floor(s));
  let allocated = tenths.reduce((sum, t) => sum + t, 0);
  const byRemainder = scaled
    .map((s, i) => ({ i, remainder: s - tenths[i] }))
    .sort((a, b) => (b.remainder - a.remainder) || (a.i - b.i));
  for (const { i } of byRemainder) {
    if (allocated >= WEIGHT_TENTHS_TARGET) break;
    tenths[i] += 1;
    allocated += 1;
  }

  // Fail-closed invariant: the allocation must land exactly on target. For
  // positive finite inputs this cannot drift, but the contract must never
  // emit a weight set that does not sum to exactly 100.0%.
  if (allocated !== WEIGHT_TENTHS_TARGET) {
    return {
      ok: false,
      code: 'WEIGHT_BELOW_MINIMUM',
      detail: 'Internal weight allocation did not land on the 100.0% target; refusing to emit.',
    };
  }

  // One-decimal precision admits a minimum positive weight of 0.1%. A holding
  // that rounds to 0.0 would be rejected by the governed service
  // (INVALID_WEIGHT — strictly positive weights required); fail closed here
  // with the reason instead.
  const belowMinimum = entries
    .map(([key, g], i) => ({ key, group: g, tenths: tenths[i] }))
    .filter((e) => e.tenths === 0);
  if (belowMinimum.length > 0) {
    const names = belowMinimum.map((e) => e.group.symbol ?? e.group.isin ?? e.group.instrumentName).join(', ');
    return {
      ok: false,
      code: 'WEIGHT_BELOW_MINIMUM',
      detail:
        `Holding(s) ${names} round to a weight below the 0.1% minimum representable at one-decimal ` +
        'precision; the governed portfolio service rejects zero weights. Split or remove the position and retry.',
    };
  }

  const mapped = entries.map(([key, g], i) => {
    const input: UserHoldingInput = Object.freeze({
      ...(g.symbol !== undefined ? { symbol: g.symbol } : {}),
      ...(g.isin !== undefined ? { isin: g.isin } : {}),
      weight: tenths[i] / 10,
    });
    return { input, tenths: tenths[i], key };
  });

  // Deterministic output order: descending weight, then identity key.
  mapped.sort((a, b) => (b.tenths - a.tenths) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  return {
    ok: true,
    holdings: Object.freeze(mapped.map((m) => m.input)),
    totalMarketValue,
    exclusions: Object.freeze(exclusions),
  };
}
