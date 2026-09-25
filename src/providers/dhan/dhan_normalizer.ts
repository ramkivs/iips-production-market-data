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
import { MarketQuotePayload, validateMarketQuotePayload } from '../../contracts/d01_quotes.js';
import { OperatingMode, QualityState } from '../../contracts/types.js';
import { evaluateFreshness } from '../../quality/freshness_evaluator.js';
import { DhanQuoteDto, parseDhanTradeTimeToUtcIso } from './dhan_dto.js';
import { DhanInstrumentMapping } from './dhan_instrument_map.js';
import { DhanResult, dhanFailure, dhanOk } from './dhan_failures.js';

const DHAN_CANONICAL_DATA_VERSION = 'v1.0.0-d01-provider-foundation';
const DHAN_SCHEMA_VERSION = '1.0.0';

export interface DhanNormalizationInput {
  quote: DhanQuoteDto;
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

function topOfBook(levels: Array<{ price: number }> | undefined): number {
  if (!levels || levels.length === 0) return 0;
  const price = levels[0]?.price;
  return typeof price === 'number' && Number.isFinite(price) && price > 0 ? price : 0;
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

  const receivedAt = input.receivedAt;
  if (Number.isNaN(Date.parse(receivedAt))) {
    return dhanFailure('MALFORMED_RESPONSE', 'receivedAt must be a valid ISO-8601 instant', { field: 'receivedAt' });
  }
  const evaluatedAt = input.evaluatedAt && !Number.isNaN(Date.parse(input.evaluatedAt))
    ? input.evaluatedAt
    : receivedAt;

  const previousClose =
    typeof quote.net_change === 'number'
      ? round2(quote.last_price - quote.net_change)
      : quote.ohlc.close;

  const change = typeof quote.net_change === 'number' ? quote.net_change : round2(quote.last_price - previousClose);
  const pctChange = previousClose > 0 ? round2((change / previousClose) * 100) : 0;

  // Field-by-field canonical construction. No vendor key is ever copied across,
  // so the emitted payload key-set is exactly the canonical D01 contract.
  const payload: MarketQuotePayload = {
    companyId: mapping.companyId,
    symbol: mapping.symbol,
    exchange: mapping.exchange,
    currency: 'INR',
    bid: topOfBook(quote.depth?.buy),
    ask: topOfBook(quote.depth?.sell),
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

  const freshness = evaluateFreshness(asOf, 'D01_QUOTES', evaluatedAt);
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
