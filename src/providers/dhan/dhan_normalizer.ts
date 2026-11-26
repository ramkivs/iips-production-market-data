/**
 * Institutional Investment Platform System (IIPS)
 * Dhan -> Canonical Market Data Normalization (DHAN-D1)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-12 / NFR-06
 * Gate: DHAN-D1 PRE-ACCESS PROVIDER FOUNDATION
 *
 * This is the ONLY place where Dhan vendor DTOs are permitted to be read.
 * Output is the EXISTING canonical contract:
 *   CanonicalEnvelope<MarketQuotePayload> (src/contracts)
 * No new canonical contract is introduced, duplicated or replaced.
 */

import { CanonicalEnvelope, createCanonicalEnvelope } from '../../contracts/envelope.js';
import { computeLineageHash, DataProvenanceDTO } from '../../contracts/provenance.js';
import { D01_SCHEMA_VERSION, MarketQuotePayload, validateMarketQuotePayload } from '../../contracts/d01_quotes.js';
import { OperatingMode, QualityState } from '../../contracts/types.js';
import type { TradingCalendar } from '../../quality/trading_calendar.js';
import { evaluateFreshness } from '../../quality/freshness_evaluator.js';
import { DhanQuoteDto, parseDhanTradeTimeToUtcIso } from './dhan_dto.js';
import { DhanInstrumentMapping } from './dhan_instrument_map.js';
import { DhanResult, dhanFailure, dhanOk } from './dhan_failures.js';

const DHAN_CANONICAL_DATA_VERSION = 'v1.0.0-d01-provider-foundation';
/**
 * Schema version stamped on Dhan-emitted D01 envelopes.
 *
 * Per D-5 (approved 2026-11-21) the D01 payload was retyped (`bid`/`ask` became
 * `number | null`), so D01 carries `2.0.0`. Per P01_VERSIONING_COMPATIBILITY V1,
 * `schemaVersion` versions the canonical field schema and *is* the value that
 * must change when a field slot is retyped — so the emitted envelope carries the
 * D01 version, not the legacy envelope default. The previous `'1.0.0'` here was
 * the mismatch that made the declared 2.0.0 unobservable on the wire.
 */
const DHAN_SCHEMA_VERSION = D01_SCHEMA_VERSION;

export interface DhanNormalizationInput {
  quote: DhanQuoteDto;
  tradingCalendar?: TradingCalendar;
  mapping: DhanInstrumentMapping;
  /** Ingress receipt instant (ISO-8601 UTC). */
  receivedAt: string;
  /** Quality evaluation instant (ISO-8601 UTC). Defaults to receivedAt. */
  evaluatedAt?: string;
  mode?: OperatingMode;
  traceId?: string;
  correlationId?: string;
  tenantId?: string;
}

export interface DhanNormalizationOutput {
  envelope: CanonicalEnvelope<MarketQuotePayload>;
  quality: QualityState;
  ageSeconds: number;
  staleConcessionActive: boolean;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Outcome of reading one depth side.
 *
 * `absent` and `invalid` are deliberately distinct. D-5 (approved 2026-11-21)
 * requires that a missing side is `null`, but that a *supplied* malformed price
 * is rejected — never silently converted into `null`, which would make bad data
 * look like legitimate absence.
 *
 * `absentMarketBook` is the D-5 addendum case (approved 2026-11-25): the vendor
 * returned a fully populated book whose every price, quantity and order count is
 * zero. That is an absent market book, not malformed data, and normalises to
 * `null` exactly like a genuinely absent side.
 */
type TopOfBookResult =
  | { kind: 'present'; price: number }
  | { kind: 'absent' }
  | { kind: 'absentMarketBook' }
  | { kind: 'invalid'; price: unknown };

/**
 * True when a level is a structurally valid, entirely zero-filled entry.
 *
 * D-5 addendum: the vendor emits `{price: 0, quantity: 0, orders: 0}` for every
 * level of a book with no market. Each of the three fields must be the number
 * zero. A non-zero value, a non-numeric value, a missing field or a non-finite
 * value is *not* a zero-filled level and continues down the malformed path.
 */
function isZeroFilledLevel(level: unknown): boolean {
  if (!level || typeof level !== 'object') return false;
  const { price, quantity, orders } = level as { price?: unknown; quantity?: unknown; orders?: unknown };
  return price === 0 && quantity === 0 && orders === 0;
}

/**
 * True when BOTH sides are supplied, non-empty, and every level on every side is
 * entirely zero-filled. Both sides are required: a book with a populated bid and
 * an all-zero ask is not a uniformly absent book, and must stay per-side.
 *
 * Retained for backwards compatibility — the per-side `isZeroFilledSide` now covers
 * the one-sided case as well. A fully zero-filled 5×5 book still satisfies both
 * this check and the per-side check; the two are equivalent for that shape.
 */
function isEntirelyZeroFilledBook(depth: { buy?: readonly unknown[]; sell?: readonly unknown[] }): boolean {
  const buy = depth.buy;
  const sell = depth.sell;
  if (!Array.isArray(buy) || !Array.isArray(sell)) return false;
  if (buy.length === 0 || sell.length === 0) return false;
  return buy.every(isZeroFilledLevel) && sell.every(isZeroFilledLevel);
}

/**
 * True when ONE side is supplied, non-empty, and every level on that side is
 * entirely zero-filled. Per-side unavailable book — D-5 follow-up 2026-11-26:
 * the vendor emits a one-sided zero-filled book (`buy` 5×0, `sell` L1
 * 1396.2/8767/32 + 4×0 in `reliance-depth-20261126.json`), which is an absent
 * side, not malformed data. The whole-book check above remains for the symmetric
 * 5×5 zero case; this check handles the one-sided case before strict validation.
 */
function isZeroFilledSide(levels: readonly unknown[] | undefined): boolean {
  if (!Array.isArray(levels) || levels.length === 0) return false;
  return levels.every(isZeroFilledLevel);
}

/**
 * Returns a view of `levels` with trailing entirely zero-filled entries removed.
 *
 * The vendor appends zero-filled levels after the last real price (e.g. sell
 * side `1396.2` followed by 4×`{0,0,0}` in the 26 Nov Reliance capture). Those
 * trailing zeros are unavailable depth, not malformed data, and must be
 * normalised away before strict per-side validation — otherwise a valid book
 * would be rejected because of unavailable depth appended after it. Only
 * trailing zero-filled levels are removed; a mixed level (`price:0` +
 * positive qty/orders), a leading zero, or any non-zero-filled level is left
 * intact and will still fail strict validation as `MALFORMED_RESPONSE`.
 */
function withoutTrailingZeroLevels(levels: readonly unknown[]): readonly unknown[] {
  let end = levels.length;
  while (end > 0 && isZeroFilledLevel(levels[end - 1])) end--;
  return levels.slice(0, end);
}

/**
 * Reads the best price of one depth side.
 *
 * - no side, or an empty side → `absent` (a genuine absence, reported as null);
 * - a side that is entirely zero-filled (`every` level `{price:0,quantity:0,orders:0}`)
 *   → `absentMarketBook` (an unavailable side, reported as null — D-5 addendum A
 *   for the whole book, extended 2026-11-26 to per-side for the one-sided Reliance
 *   capture buy 5×0 / sell `1396.2`+4×0);
 * - a side with trailing zero-filled levels → trailing zeros are stripped before
 *   validation, so a valid top-of-book followed by unavailable depth (`1396.2`
 *   followed by 4×0) is still `present`;
 * - a supplied price that is a finite, strictly positive number → `present`;
 * - any other supplied price (zero, negative, non-finite, non-numeric, or a
 *   missing price on a supplied level) → `invalid`, to be rejected upstream.
 *
 * D-5: an unavailable side is reported as `null` and is never substituted with
 * `0`, but a malformed supplied price is never laundered into `null` either.
 *
 * The entirely zero-filled book (both sides) is also covered: each side
 * independently satisfies `isZeroFilledSide`, so both resolve to
 * `absentMarketBook` without needing the book-level check. The book-level
 * `isEntirelyZeroFilledBook` is retained for documentation and backwards
 * compatibility but is no longer the sole gate.
 */
function topOfBook(levels: Array<{ price: number }> | undefined): TopOfBookResult {
  if (!levels || levels.length === 0) return { kind: 'absent' };
  if (isZeroFilledSide(levels as readonly unknown[])) return { kind: 'absentMarketBook' };
  const effective = withoutTrailingZeroLevels(levels as readonly unknown[]) as Array<{ price: number }>;
  if (effective.length === 0) return { kind: 'absentMarketBook' };
  const price: unknown = effective[0]?.price;
  if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
    return { kind: 'present', price };
  }
  return { kind: 'invalid', price };
}

/**
 * Transforms one Dhan quote into the existing canonical D01 envelope.
 * Fails closed: structural, identity, canonical-validation and freshness
 * failures all return an explicit failure and never a partial envelope.
 */
export function normalizeDhanQuoteToCanonical(
  input: DhanNormalizationInput
): DhanResult<DhanNormalizationOutput> {
  const { quote, mapping } = input;

  if (!mapping.companyId || !mapping.symbol) {
    return dhanFailure('UNRESOLVED_INSTRUMENT', 'Canonical instrument identity is incomplete for normalization', {
      field: 'mapping.companyId',
    });
  }

  const asOfResult = parseDhanTradeTimeToUtcIso(quote.last_trade_time);
  if (!asOfResult.ok) return asOfResult;
  const asOf = asOfResult.value;

  // Fail closed on non-finite numeric vendor fields even if the DTO parse stage
  // was bypassed: NaN/Infinity compare false against range checks and would
  // otherwise slip through canonical validation.
  const numericFields: Array<[string, number]> = [
    ['last_price', quote.last_price],
    ['ohlc.open', quote.ohlc.open],
    ['ohlc.high', quote.ohlc.high],
    ['ohlc.low', quote.ohlc.low],
    ['ohlc.close', quote.ohlc.close],
    ['volume', quote.volume],
  ];
  for (const [field, value] of numericFields) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return dhanFailure('MALFORMED_RESPONSE', `Dhan ${field} must be a finite number`, { field });
    }
  }

  const receivedAt = input.receivedAt;
  if (Number.isNaN(Date.parse(receivedAt))) {
    return dhanFailure('MALFORMED_RESPONSE', 'receivedAt must be a valid ISO-8601 instant', { field: 'receivedAt' });
  }
  const evaluatedAt = input.evaluatedAt && !Number.isNaN(Date.parse(input.evaluatedAt))
    ? input.evaluatedAt
    : receivedAt;

  // previousClose/change derive from net_change only. Dhan's ohlc.close is the
  // CURRENT session close (≈ last_price), not the previous day's close, so it
  // must never be substituted as previousClose — that would silently zero the
  // day change. Fail closed instead.
  if (typeof quote.net_change !== 'number' || !Number.isFinite(quote.net_change)) {
    return dhanFailure(
      'MISSING_REQUIRED_FIELD',
      'Dhan net_change is required to derive previousClose/change; ohlc.close is not a valid substitute',
      { field: 'net_change' }
    );
  }
  const previousClose = round2(quote.last_price - quote.net_change);
  const change = round2(quote.net_change);
  // Fail closed on an invalid pctChange denominator: a non-finite, zero or
  // negative derived previousClose must never be represented as pctChange = 0.
  if (!Number.isFinite(previousClose) || previousClose <= 0) {
    return dhanFailure(
      'CANONICAL_VALIDATION_FAILURE',
      `Derived previousClose (${previousClose}) must be a positive finite number; refusing to compute pctChange`,
      { field: 'previousClose' }
    );
  }
  const pctChange = round2((change / previousClose) * 100);

  // Depth sides are read before the payload is built so that a supplied but
  // malformed price is rejected rather than laundered into `null`.
  //
  // D-5 addendum A (approved 2026-11-25) + follow-up B (2026-11-26): an ENTIRELY
  // zero-filled order book — now **per side** — is an ABSENT MARKET BOOK, not a
  // malformed response. The vendor returns (a) five buy + five sell levels all
  // `{price:0,quantity:0,orders:0}` after the close (2026-11-23 capture), or
  // (b) one side entirely zero-filled with the other side showing a valid
  // top-of-book followed by trailing zeros (`buy` 5×0 / `sell` 1396.2+4×0 in
  // `reliance-depth-20261126.json` at 2026-11-26T16:37:12.539Z). Each side is
  // classified independently: entirely zero-filled → `absentMarketBook`;
  // otherwise trailing zero-filled levels are stripped before strict validation,
  // so a valid L1 followed by unavailable depth is still `present`. Every other
  // supplied-but-malformed value (zero with positive qty/orders, negative,
  // non-finite, wrong type, missing price) still takes the `invalid` path below
  // and fails closed.
  //
  // The book-level `isEntirelyZeroFilledBook` is retained but no longer the
  // gate: per-side `topOfBook` now handles both the whole-book and one-sided
  // cases. Keeping the helper preserves the documented whole-book invariant.
  const bidSide: TopOfBookResult = topOfBook(quote.depth?.buy);
  const askSide: TopOfBookResult = topOfBook(quote.depth?.sell);
  for (const [field, side] of [['bid', bidSide], ['ask', askSide]] as const) {
    if (side.kind === 'invalid') {
      return dhanFailure(
        'MALFORMED_RESPONSE',
        `Dhan depth ${field} price must be a finite, strictly positive number when supplied `
          + `(got ${String(side.price)}); use an absent side for unavailable depth`,
        { field }
      );
    }
  }

  // Field-by-field canonical construction. No vendor key is ever copied across,
  // so the emitted payload key-set is exactly the canonical D01 contract.
  const payload: MarketQuotePayload = {
    companyId: mapping.companyId,
    symbol: mapping.symbol,
    exchange: mapping.exchange,
    currency: 'INR',
    // `null` means unavailable. Both an absent side and the approved entirely
    // zero-filled book (absent market book) resolve here, per side and
    // independently; neither is ever reported as `0`.
    bid: bidSide.kind === 'present' ? bidSide.price : null,
    ask: askSide.kind === 'present' ? askSide.price : null,
    ltp: quote.last_price,
    open: quote.ohlc.open,
    high: quote.ohlc.high,
    low: quote.ohlc.low,
    close: quote.ohlc.close,
    previousClose,
    volume: quote.volume,
    change,
    pctChange,
  };

  if (typeof quote.average_price === 'number' && quote.average_price > 0) {
    payload.vwap = quote.average_price;
  }

  const validation = validateMarketQuotePayload(payload);
  if (!validation.isValid) {
    const missing = validation.errors.find((e) => e.code === 'MISSING_MANDATORY_FIELD');
    const first = missing || validation.errors[0];
    return dhanFailure(
      missing ? 'MISSING_REQUIRED_FIELD' : 'CANONICAL_VALIDATION_FAILURE',
      `Dhan quote failed canonical D01 validation: ${first.field}: ${first.message}`,
      { field: first.field }
    );
  }

  const freshness = evaluateFreshness(asOf, 'D01_QUOTES', evaluatedAt, input.tradingCalendar ? { kind: 'QUOTE', calendar: input.tradingCalendar, exchange: mapping.exchange } : undefined);
  if (freshness.suppressExecution) {
    return dhanFailure(
      'STALE_DATA_SUPPRESSED',
      `Dhan quote age ${Math.round(freshness.ageSeconds)}s exceeds twice the D01 freshness threshold; execution suppressed`,
      { field: 'last_trade_time' }
    );
  }

  const lineageHash = computeLineageHash(payload, {
    sourceClassification: 'CANONICAL_MARKET_DATA',
    asOf,
    dataVersion: DHAN_CANONICAL_DATA_VERSION,
  });

  const provenance: DataProvenanceDTO = {
    sourceClassification: 'CANONICAL_MARKET_DATA',
    // NFR-06: vendor identity is masked behind a generic commercial tier.
    vendorTier: 'TIER_2_COMMERCIAL',
    asOf,
    receivedAt,
    evaluatedAt,
    dataVersion: DHAN_CANONICAL_DATA_VERSION,
    lineageHash,
    qualityState: freshness.quality,
    traceId: input.traceId,
    correlationId: input.correlationId,
    tenantId: input.tenantId,
  };

  const envelope = createCanonicalEnvelope<MarketQuotePayload>({
    envelopeId: `env-d01-${lineageHash.substring(0, 16)}`,
    domain: 'D01_QUOTES',
    mode: input.mode || 'SNAPSHOT',
    companyId: mapping.companyId,
    payload,
    provenance,
    timestamp: receivedAt,
    schemaVersion: DHAN_SCHEMA_VERSION,
  });

  return dhanOk({
    envelope,
    quality: freshness.quality,
    ageSeconds: freshness.ageSeconds,
    staleConcessionActive: freshness.staleConcessionActive,
  });
}
