/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-D3A Normalization Regression Suite (contract compatibility, synthetic only)
 *
 * Gate: DHAN-D3A — Dhan normalization conformance to the EXISTING canonical D01
 * contract. Deterministic SYNTHETIC inputs only; no live Dhan response shape is
 * asserted or implied.
 *
 * Covers: valid normalization, missing required fields, invalid prices, invalid
 * timestamps (incl. impossible calendar dates), missing security identity,
 * malformed/partial responses, stale quotes, unavailable/suppressed quotes,
 * provenance preservation, canonical envelope compatibility, and the
 * previousClose/net_change fail-closed rule.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  CanonicalEnvelope,
  MarketQuotePayload,
  validateEnvelopeStructure,
  validateMarketQuotePayload,
  DhanInstrumentMapping,
  DhanInstrumentRegistry,
  normalizeDhanQuoteToCanonical,
  parseDhanMarketQuoteResponse,
  parseDhanTradeTimeToUtcIso,
  selectDhanQuote,
} from '../src/index.js';
import type { DhanQuoteDto } from '../src/providers/dhan/dhan_dto.js';

const MAPPING: DhanInstrumentMapping = {
  companyId: 'COMP-INFY',
  symbol: 'INFY',
  exchange: 'NSE',
  exchangeSegment: 'NSE_EQ',
  dhanSecurityId: 'SYNTH-NSE-EQ-0001',
  mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE',
};

const RECEIVED_AT = '2026-09-25T10:00:00.000Z';
const EVALUATED_AT = '2026-09-25T10:00:00.000Z';

function validQuote(overrides: Partial<DhanQuoteDto> = {}): DhanQuoteDto {
  return {
    last_price: 1520.35,
    ohlc: { open: 1510.0, close: 1520.35, high: 1530.0, low: 1505.5 },
    volume: 2540000,
    last_trade_time: '25/09/2026 15:29:58',
    average_price: 1518.75,
    net_change: 12.35,
    depth: {
      buy: [{ quantity: 500, orders: 4, price: 1520.25 }],
      sell: [{ quantity: 640, orders: 6, price: 1520.5 }],
    },
    ...overrides,
  };
}

function normalize(quote: DhanQuoteDto, mapping: DhanInstrumentMapping = MAPPING, evaluatedAt = EVALUATED_AT) {
  return normalizeDhanQuoteToCanonical({ quote, mapping, receivedAt: RECEIVED_AT, evaluatedAt });
}

describe('DHAN-D3A normalization regression (synthetic)', () => {
  it('D3A-01: valid quote normalizes into the existing canonical D01 envelope', () => {
    const result = normalize(validQuote());
    assert.ok(result.ok, `expected ok, got ${JSON.stringify(result)}`);
    const { envelope, quality } = result.value;
    assert.strictEqual(envelope.domain, 'D01_QUOTES');
    assert.strictEqual(envelope.companyId, 'COMP-INFY');
    assert.strictEqual(envelope.mode, 'SNAPSHOT');
    assert.strictEqual(envelope.schemaVersion, '1.0.0');
    assert.strictEqual(quality, 'GOOD');
    const p = envelope.payload;
    assert.strictEqual(p.companyId, 'COMP-INFY');
    assert.strictEqual(p.symbol, 'INFY');
    assert.strictEqual(p.exchange, 'NSE');
    assert.strictEqual(p.currency, 'INR');
    assert.strictEqual(p.ltp, 1520.35);
    assert.strictEqual(p.bid, 1520.25);
    assert.strictEqual(p.ask, 1520.5);
    assert.strictEqual(p.previousClose, 1508);
    assert.strictEqual(p.change, 12.35);
    assert.strictEqual(p.pctChange, 0.82); // round2(12.35 / 1508 * 100)
    assert.strictEqual(p.vwap, 1518.75);
    assert.strictEqual(p.volume, 2540000);
    assert.strictEqual(envelope.provenance.asOf, '2026-09-25T09:59:58.000Z');
    assert.strictEqual(envelope.provenance.receivedAt, RECEIVED_AT);
    assert.ok(envelope.provenance.lineageHash.length > 0);
    // Envelope itself passes the existing structural validator.
    assert.ok(validateEnvelopeStructure(envelope).isValid);
    assert.ok(validateMarketQuotePayload(p).isValid);
  });

  it('D3A-02: missing net_change fails closed instead of substituting ohlc.close', () => {
    const quote = validQuote();
    delete (quote as unknown as Record<string, unknown>).net_change;
    const result = normalize(quote);
    assert.ok(!result.ok);
    assert.strictEqual(result.failure.code, 'MISSING_REQUIRED_FIELD');
    assert.strictEqual(result.failure.field, 'net_change');
  });

  it('D3A-03: missing required vendor fields fail with explicit field paths', () => {
    for (const key of ['last_price', 'ohlc', 'volume', 'last_trade_time'] as const) {
      const quote = validQuote();
      delete (quote as unknown as Record<string, unknown>)[key];
      const parsed = parseDhanMarketQuoteResponse({ status: 'success', data: { NSE_EQ: { X: quote } } });
      assert.ok(!parsed.ok, `expected parse failure for missing ${key}`);
      assert.ok(['MISSING_REQUIRED_FIELD', 'MALFORMED_RESPONSE'].includes(parsed.failure.code));
    }
  });

  it('D3A-04: invalid price values fail closed at canonical validation', () => {
    for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = normalize(validQuote({ last_price: bad }));
      assert.ok(!result.ok, `expected failure for last_price=${bad}`);
    }
    const highLow = normalize(validQuote({ ohlc: { open: 1510, close: 1520, high: 1500, low: 1510 } }));
    assert.ok(!highLow.ok);
    assert.strictEqual(highLow.failure.code, 'CANONICAL_VALIDATION_FAILURE');
  });

  it('D3A-05: invalid and impossible timestamps fail closed (no silent rollover)', () => {
    for (const t of ['25/09/2026 24:00:00', '31/02/2026 10:00:00', '30/02/2026 10:00:00', '29/02/2027 10:00:00', '15/13/2026 10:00:00', 'not-a-time', '2026-09-25T10:00:00Z']) {
      const r = parseDhanTradeTimeToUtcIso(t);
      assert.ok(!r.ok, `expected rejection of ${t}`);
      assert.strictEqual(r.failure.code, 'MALFORMED_RESPONSE');
      const viaNormalizer = normalize(validQuote({ last_trade_time: t }));
      assert.ok(!viaNormalizer.ok, `normalizer must reject ${t}`);
    }
    // Leap-day valid date still accepted.
    assert.ok(parseDhanTradeTimeToUtcIso('29/02/2028 10:00:00').ok);
    const good = parseDhanTradeTimeToUtcIso('25/09/2026 15:29:58');
    assert.ok(good.ok);
    if (good.ok) assert.strictEqual(good.value, '2026-09-25T09:59:58.000Z');
  });

  it('D3A-06: missing canonical identity never invents identifiers', () => {
    const badMappings = [
      { ...MAPPING, companyId: '' },
      { ...MAPPING, symbol: '' },
    ];
    for (const mapping of badMappings) {
      const result = normalize(validQuote(), mapping);
      assert.ok(!result.ok);
      assert.strictEqual(result.failure.code, 'UNRESOLVED_INSTRUMENT');
    }
  });

  it('D3A-07: malformed and partial provider responses are rejected deterministically', () => {
    for (const raw of [null, 42, 'x', [], { data: {} }, { status: 'failure', data: {} }, { status: 'success' }]) {
      const parsed = parseDhanMarketQuoteResponse(raw);
      assert.ok(!parsed.ok, `expected rejection of ${JSON.stringify(raw)}`);
    }
    const ok = parseDhanMarketQuoteResponse({ status: 'success', data: { NSE_EQ: { 'SYNTH-NSE-EQ-0001': validQuote() } } });
    assert.ok(ok.ok);
    // Partial response: instrument requested but absent -> explicit, not defaulted.
    const missing = selectDhanQuote(ok.value, 'NSE_EQ', 'SYNTH-UNKNOWN');
    assert.ok(!missing.ok);
    assert.strictEqual(missing.failure.code, 'INSTRUMENT_NOT_IN_RESPONSE');
    const wrongSegment = selectDhanQuote(ok.value, 'BSE_EQ', 'SYNTH-NSE-EQ-0001');
    assert.ok(!wrongSegment.ok);
  });

  it('D3A-08: stale quote inside the AD-12 concession band is emitted with STALE quality', () => {
    // 20 min old vs 15 min nominal threshold -> STALE, not suppressed.
    const result = normalize(validQuote({ last_trade_time: '25/09/2026 15:10:00' }));
    // 15:10 IST = 09:40 UTC; evaluated 10:00 UTC -> age 1200s > 900s, <= 1800s.
    assert.ok(result.ok, JSON.stringify(result));
    assert.strictEqual(result.value.quality, 'STALE');
    assert.strictEqual(result.value.staleConcessionActive, true);
    assert.strictEqual(result.value.envelope.provenance.qualityState, 'STALE');
  });

  it('D3A-09: beyond twice the threshold the quote is UNAVAILABLE and suppressed (fail closed)', () => {
    // 40 min old -> age 2400s > 1800s -> suppressed.
    const result = normalize(validQuote({ last_trade_time: '25/09/2026 14:50:00' }));
    assert.ok(!result.ok);
    assert.strictEqual(result.failure.code, 'STALE_DATA_SUPPRESSED');
  });

  it('D3A-10: provenance and envelope metadata are preserved end-to-end', () => {
    const result = normalize(validQuote(), MAPPING, EVALUATED_AT);
    assert.ok(result.ok);
    const env: CanonicalEnvelope<MarketQuotePayload> = result.value.envelope;
    assert.strictEqual(env.timestamp, RECEIVED_AT);
    assert.strictEqual(env.provenance.sourceClassification, 'CANONICAL_MARKET_DATA');
    assert.strictEqual(env.provenance.vendorTier, 'TIER_2_COMMERCIAL'); // vendor identity masked (NFR-06)
    assert.strictEqual(env.provenance.asOf, '2026-09-25T09:59:58.000Z');
    assert.strictEqual(env.provenance.evaluatedAt, EVALUATED_AT);
    assert.ok(!JSON.stringify(env).toLowerCase().includes('dhan'));
    assert.ok(!JSON.stringify(env).includes('last_price'));
  });

  it('D3A-11: SPI identity and classification remain provider-neutral', () => {
    const registry = new DhanInstrumentRegistry();
    registry.register(MAPPING);
    assert.ok(registry.resolve('COMP-INFY').status === 'RESOLVED');
    assert.strictEqual(registry.resolve('COMP-UNKNOWN').status, 'UNRESOLVED');
  });
});
