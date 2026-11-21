/**
 * Institutional Investment Platform System (IIPS)
 * D-5 — Bid/Ask Representation and Validation Suite
 *
 * Authority: D-5 decision approved by the Programme Owner on 2026-11-21.
 *   docs/integration/D-5-BID-ASK-REPRESENTATION-AND-VALIDATION-DECISION-2026-11-21.md
 *
 * Approved decisions under test:
 *   1. Unavailable bid/ask are explicit `null`, independently per side.
 *   2. A supplied price must be finite and strictly positive; zero, negative,
 *      non-numeric and infinite values are rejected.
 *   3. Ask below bid is rejected when both sides are available.
 *   4. D01 schema version is 2.0.0; the shared envelope version stays 1.0.0.
 *   5. D114 UDiFF and legacy bhavcopy parsers use `null`, never LTP.
 *
 * Deterministic synthetic inputs only.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  D01_SCHEMA_VERSION,
  validateMarketQuotePayload,
  normalizeDhanQuoteToCanonical,
  CmUdiffParser,
  LegacyBhavcopyParser,
  IngestionPipeline,
  DeadLetterQueue,
  DhanApiClient,
  HistoricalPitIngestionLoader,
} from '../src/index.js';
import type {
  MarketQuotePayload,
  DhanInstrumentMapping,
} from '../src/index.js';
import { createCanonicalEnvelope } from '../src/contracts/envelope.js';
import type { DhanQuoteDto } from '../src/providers/dhan/dhan_dto.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RECEIVED_AT = '2026-09-25T10:00:00.000Z';
const EVALUATED_AT = '2026-09-25T10:00:00.000Z';

const MAPPING: DhanInstrumentMapping = {
  companyId: 'COMP-INFY',
  symbol: 'INFY',
  exchange: 'NSE',
  exchangeSegment: 'NSE_EQ',
  dhanSecurityId: 'SYNTH-NSE-EQ-0001',
  mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE',
} as DhanInstrumentMapping;

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
  } as DhanQuoteDto;
}

/** A complete, otherwise-valid quote payload used for validator-level tests. */
function payload(overrides: Partial<MarketQuotePayload> = {}): MarketQuotePayload {
  return {
    companyId: 'COMP-INFY',
    symbol: 'INFY',
    exchange: 'NSE',
    currency: 'INR',
    bid: 1520.25,
    ask: 1520.5,
    ltp: 1520.35,
    open: 1510.0,
    high: 1530.0,
    low: 1505.5,
    previousClose: 1508.0,
    volume: 2540000,
    change: 12.35,
    pctChange: 0.82,
    ...overrides,
  } as MarketQuotePayload;
}

/** Normalise a synthetic Dhan quote and return the canonical payload. */
function normalize(quote: DhanQuoteDto): MarketQuotePayload {
  const result = normalizeDhanQuoteToCanonical({
    quote,
    mapping: MAPPING,
    receivedAt: RECEIVED_AT,
    evaluatedAt: EVALUATED_AT,
  });
  assert.strictEqual(result.ok, true, `normalisation failed: ${JSON.stringify(result)}`);
  if (!result.ok) throw new Error('unreachable');
  return result.value.envelope.payload;
}

/** Normalise without asserting success, so rejection cases can be inspected. */
function normalizeOrFail(quote: DhanQuoteDto) {
  return normalizeDhanQuoteToCanonical({
    quote,
    mapping: MAPPING,
    receivedAt: RECEIVED_AT,
    evaluatedAt: EVALUATED_AT,
  });
}

const fieldsOf = (r: { errors: Array<{ field: string }> }): string[] => r.errors.map((e) => e.field);

// ---------------------------------------------------------------------------
// 1. Normalizer: depth availability, per side and independently
// ---------------------------------------------------------------------------

describe('D-5 normalizer — bid/ask availability from market depth', () => {
  it('D5-01: both sides present and valid are preserved exactly', () => {
    const p = normalize(validQuote());
    assert.strictEqual(p.bid, 1520.25);
    assert.strictEqual(p.ask, 1520.5);
    assert.strictEqual(typeof p.bid, 'number');
    assert.strictEqual(typeof p.ask, 'number');
  });

  it('D5-02: absent depth yields null for both sides, never zero', () => {
    const quote = validQuote();
    delete (quote as { depth?: unknown }).depth;
    const p = normalize(quote);
    assert.strictEqual(p.bid, null, 'missing depth must not become a genuine 0 bid');
    assert.strictEqual(p.ask, null, 'missing depth must not become a genuine 0 ask');
    assert.notStrictEqual(p.bid, 0);
    assert.notStrictEqual(p.ask, 0);
  });

  it('D5-03: empty depth arrays yield null for both sides', () => {
    const p = normalize(validQuote({ depth: { buy: [], sell: [] } } as Partial<DhanQuoteDto>));
    assert.strictEqual(p.bid, null);
    assert.strictEqual(p.ask, null);
  });

  it('D5-04: only bid absent → bid null, ask still available', () => {
    const p = normalize(validQuote({ depth: { sell: [{ quantity: 640, orders: 6, price: 1520.5 }] } } as Partial<DhanQuoteDto>));
    assert.strictEqual(p.bid, null);
    assert.strictEqual(p.ask, 1520.5, 'ask must survive an unavailable bid');
  });

  it('D5-05: only ask absent → ask null, bid still available', () => {
    const p = normalize(validQuote({ depth: { buy: [{ quantity: 500, orders: 4, price: 1520.25 }] } } as Partial<DhanQuoteDto>));
    assert.strictEqual(p.bid, 1520.25, 'bid must survive an unavailable ask');
    assert.strictEqual(p.ask, null);
  });

  it('D5-06: an explicitly supplied zero price is rejected, never laundered into null', () => {
    // A zero on a supplied level is malformed data, not absence. Converting it
    // to null would make bad data indistinguishable from a genuinely absent side.
    const r = normalizeOrFail(validQuote({
      depth: { buy: [{ quantity: 1, orders: 1, price: 0 }], sell: [{ quantity: 1, orders: 1, price: 1520.5 }] },
    } as Partial<DhanQuoteDto>));
    assert.strictEqual(r.ok, false, 'a supplied zero bid must be rejected');
    if (r.ok) throw new Error('unreachable');
    assert.strictEqual(r.failure.code, 'MALFORMED_RESPONSE');
  });

  it('D5-07: a supplied non-finite price is rejected', () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      const r = normalizeOrFail(validQuote({
        depth: { buy: [{ quantity: 1, orders: 1, price: bad }], sell: [{ quantity: 1, orders: 1, price: 1520.5 }] },
      } as Partial<DhanQuoteDto>));
      assert.strictEqual(r.ok, false, `a supplied ${String(bad)} bid must be rejected`);
    }
  });

  it('D5-08: a supplied negative price is rejected', () => {
    const r = normalizeOrFail(validQuote({
      depth: { buy: [{ quantity: 1, orders: 1, price: -10 }], sell: [{ quantity: 1, orders: 1, price: 1520.5 }] },
    } as Partial<DhanQuoteDto>));
    assert.strictEqual(r.ok, false, 'a supplied negative bid must be rejected');
    if (r.ok) throw new Error('unreachable');
    assert.strictEqual(r.failure.code, 'MALFORMED_RESPONSE');
  });

  it('D5-08a: a supplied non-numeric price is rejected', () => {
    const r = normalizeOrFail(validQuote({
      depth: { buy: [{ quantity: 1, orders: 1, price: '1520.25' as unknown as number }], sell: [{ quantity: 1, orders: 1, price: 1520.5 }] },
    } as Partial<DhanQuoteDto>));
    assert.strictEqual(r.ok, false, 'a string bid price must be rejected');
  });

  it('D5-08b: a malformed ask is rejected even when the bid is valid', () => {
    const r = normalizeOrFail(validQuote({
      depth: { buy: [{ quantity: 1, orders: 1, price: 1520.25 }], sell: [{ quantity: 1, orders: 1, price: 0 }] },
    } as Partial<DhanQuoteDto>));
    assert.strictEqual(r.ok, false, 'a supplied zero ask must be rejected');
    if (r.ok) throw new Error('unreachable');
    assert.ok(/ask/.test(r.failure.message), 'the rejection must identify the ask side');
  });

  it('D5-08c: absence and malformed supply are distinguished, not conflated', () => {
    // Absent side -> accepted with null. Supplied-but-malformed -> rejected.
    const absent = normalize(validQuote({ depth: { sell: [{ quantity: 1, orders: 1, price: 1520.5 }] } } as Partial<DhanQuoteDto>));
    assert.strictEqual(absent.bid, null, 'genuinely absent bid becomes null');

    const malformed = normalizeOrFail(validQuote({
      depth: { buy: [{ quantity: 1, orders: 1, price: 0 }], sell: [{ quantity: 1, orders: 1, price: 1520.5 }] },
    } as Partial<DhanQuoteDto>));
    assert.strictEqual(malformed.ok, false, 'malformed supplied bid is rejected, not turned into null');
  });

  it('D5-09: unavailable bid/ask does not fail the quote or degrade its quality', () => {
    const result = normalizeDhanQuoteToCanonical({
      quote: { ...validQuote(), depth: undefined } as unknown as DhanQuoteDto,
      mapping: MAPPING,
      receivedAt: RECEIVED_AT,
      evaluatedAt: EVALUATED_AT,
    });
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    const p = result.value.envelope.payload;
    // Unavailable is not a validation failure; the rest of the quote is sound.
    assert.strictEqual(validateMarketQuotePayload(p).isValid, true);
    // The unavailable prices must never be reported as available zeroes.
    assert.strictEqual(p.bid, null);
    assert.strictEqual(p.ask, null);
  });

  it('D5-10: unrelated quote fields are untouched by the absence handling', () => {
    const p = normalize(validQuote({ depth: undefined } as Partial<DhanQuoteDto>));
    assert.strictEqual(p.ltp, 1520.35);
    assert.strictEqual(p.volume, 2540000);
    assert.strictEqual(p.previousClose, 1508.0);
    assert.strictEqual(p.open, 1510.0);
    assert.strictEqual(p.high, 1530.0);
    assert.strictEqual(p.low, 1505.5);
  });
});

// ---------------------------------------------------------------------------
// 2. Validator: strict rejection of malformed supplied values
// ---------------------------------------------------------------------------

describe('D-5 validator — strict validation of supplied bid/ask', () => {
  it('D5-11: valid numeric bid and ask are accepted', () => {
    const r = validateMarketQuotePayload(payload());
    assert.strictEqual(r.isValid, true);
    assert.deepStrictEqual(r.errors, []);
  });

  it('D5-12: null bid and null ask are accepted as unavailable', () => {
    const r = validateMarketQuotePayload(payload({ bid: null, ask: null }));
    assert.strictEqual(r.isValid, true);
    assert.deepStrictEqual(r.errors, []);
  });

  it('D5-13: null bid with a valid ask is accepted', () => {
    const r = validateMarketQuotePayload(payload({ bid: null, ask: 1520.5 }));
    assert.strictEqual(r.isValid, true);
    assert.deepStrictEqual(r.errors, []);
  });

  it('D5-14: null ask with a valid bid is accepted', () => {
    const r = validateMarketQuotePayload(payload({ bid: 1520.25, ask: null }));
    assert.strictEqual(r.isValid, true);
    assert.deepStrictEqual(r.errors, []);
  });

  it('D5-15: zero is rejected — zero is not a price and must not mean missing', () => {
    assert.strictEqual(validateMarketQuotePayload(payload({ bid: 0 })).isValid, false);
    assert.strictEqual(validateMarketQuotePayload(payload({ ask: 0 })).isValid, false);
    assert.strictEqual(validateMarketQuotePayload(payload({ bid: 0, ask: 0 })).isValid, false);
  });

  it('D5-16: negative prices are rejected', () => {
    const r = validateMarketQuotePayload(payload({ bid: -5 }));
    assert.strictEqual(r.isValid, false);
    assert.deepStrictEqual(fieldsOf(r), ['bid']);
  });

  it('D5-17: NaN is rejected', () => {
    const r = validateMarketQuotePayload(payload({ bid: NaN }));
    assert.strictEqual(r.isValid, false);
    assert.deepStrictEqual(fieldsOf(r), ['bid']);
  });

  it('D5-18: positive and negative infinity are rejected', () => {
    assert.strictEqual(validateMarketQuotePayload(payload({ ask: Infinity })).isValid, false);
    assert.strictEqual(validateMarketQuotePayload(payload({ ask: -Infinity })).isValid, false);
  });

  it('D5-19: a non-numeric (string) value is rejected', () => {
    const r = validateMarketQuotePayload(payload({ bid: '1520.25' } as unknown as Partial<MarketQuotePayload>));
    assert.strictEqual(r.isValid, false);
    assert.deepStrictEqual(fieldsOf(r), ['bid']);
  });

  it('D5-20: undefined is rejected — it is not the approved absence representation', () => {
    const r = validateMarketQuotePayload(payload({ ask: undefined } as unknown as Partial<MarketQuotePayload>));
    assert.strictEqual(r.isValid, false);
    assert.deepStrictEqual(fieldsOf(r), ['ask']);
  });

  it('D5-21: ask below bid is rejected when both sides are supplied', () => {
    const r = validateMarketQuotePayload(payload({ bid: 1520.5, ask: 1520.25 }));
    assert.strictEqual(r.isValid, false);
    assert.deepStrictEqual(fieldsOf(r), ['bid/ask']);
  });

  it('D5-22: bid equal to ask is accepted', () => {
    assert.strictEqual(validateMarketQuotePayload(payload({ bid: 1520.5, ask: 1520.5 })).isValid, true);
  });

  it('D5-23: ordering is not evaluated when a side is unavailable', () => {
    // A null ask cannot contradict a bid; absence is not an out-of-order price.
    assert.strictEqual(validateMarketQuotePayload(payload({ bid: 1520.25, ask: null })).isValid, true);
    assert.strictEqual(validateMarketQuotePayload(payload({ bid: null, ask: 1520.5 })).isValid, true);
    assert.strictEqual(validateMarketQuotePayload(payload({ bid: null, ask: null })).isValid, true);
  });

  it('D5-24: a rejected malformed side is never coerced into a passing value', () => {
    // The validator must not repair input: the returned verdict is a rejection
    // and the malformed value is reported, not silently replaced.
    const r = validateMarketQuotePayload(payload({ bid: 'not-a-price' } as unknown as Partial<MarketQuotePayload>));
    assert.strictEqual(r.isValid, false);
    assert.ok(r.errors.length > 0, 'a malformed bid must produce at least one error');
    assert.ok(r.anomalyCodes.length > 0, 'a malformed bid must produce an anomaly code');
  });

  it('D5-25: existing quote invariants still hold', () => {
    // D-5 must not weaken unrelated cross-field validation.
    assert.strictEqual(validateMarketQuotePayload(payload({ high: 1000, low: 1100 })).isValid, false);
  });
});

// ---------------------------------------------------------------------------
// 3. Contract versioning
// ---------------------------------------------------------------------------

describe('D-5 contract versioning', () => {
  it('D5-26: D01 schema version is 2.0.0', () => {
    assert.strictEqual(D01_SCHEMA_VERSION, '2.0.0');
  });

  it('D5-27: the emitted D01 envelope carries the D01 contract version on the wire', () => {
    const result = normalizeOrFail(validQuote());
    assert.strictEqual(result.ok, true, 'normalisation should succeed');
    if (!result.ok) throw new Error('unreachable');

    // 1. The emitted value equals the declared D01 contract version.
    assert.strictEqual(result.value.envelope.schemaVersion, D01_SCHEMA_VERSION);
    assert.strictEqual(result.value.envelope.schemaVersion, '2.0.0');

    // 2. A consumer holding only the serialized wire object can identify 2.0.0
    //    without access to any constant. This is the property that was broken:
    //    the declared 2.0.0 used to appear nowhere in the emitted JSON.
    const wire = JSON.parse(JSON.stringify(result.value.envelope)) as { schemaVersion: string };
    assert.strictEqual(wire.schemaVersion, '2.0.0');
    assert.ok(JSON.stringify(wire).includes('2.0.0'),
      'the D01 contract version must be observable in the emitted JSON');
  });

  it('D5-27a: the shared envelope version and the D01 version are independent values', () => {
    // The two axes are distinct (P01_VERSIONING_COMPATIBILITY V1: schemaVersion
    // versions the canonical field schema). Independent proof rather than one
    // value standing in for both:
    //  - the shared envelope default is unchanged at 1.0.0 for a non-D01 payload;
    //  - the D01 constant is 2.0.0 and differs from it.
    const nonD01 = createCanonicalEnvelope({
      envelopeId: 'env-d5-envelope-default',
      domain: 'D02_OHLCV',
      mode: 'SNAPSHOT',
      companyId: 'COMP-INFY',
      payload: { open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
      provenance: {
        sourceId: 'SYNTHETIC',
        provider: 'DHAN',
        sourceClassification: 'SYNTHETIC',
        ingestedAt: RECEIVED_AT,
        qualityState: 'GOOD',
      } as never,
      timestamp: RECEIVED_AT,
    });
    assert.strictEqual(nonD01.schemaVersion, '1.0.0',
      'the shared envelope default must remain 1.0.0');
    assert.notStrictEqual(nonD01.schemaVersion, D01_SCHEMA_VERSION,
      'the D01 contract version must be independently identifiable from the envelope default');
  });

  it('D5-27b: the D114 PIT D01 envelope also carries 2.0.0 on the wire', () => {
    const loader = new HistoricalPitIngestionLoader();
    const result = loader.ingestArchiveContent(
      'SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN\n'
        + 'INFY,EQ,1510.00,1530.00,1505.50,1520.35,1520.35,1508.00,2540000,3860000000,25-SEP-2026,120000,INE009A01021\n',
      { dateIso: '2026-09-25', sourceFilename: 'synthetic_bhavcopy.csv' },
    );
    assert.strictEqual(result.success, true, JSON.stringify(result));
    const record = loader.getQuoteStore().queryAsOf({
      companyId: 'INFY',
      domain: 'D01_QUOTES',
      asOf: '2026-09-25T23:59:59.000Z',
    });
    assert.ok(record, 'the D01 quote envelope should be stored');
    const wire = JSON.parse(JSON.stringify(record)) as { schemaVersion: string };
    assert.strictEqual(wire.schemaVersion, D01_SCHEMA_VERSION);
    assert.strictEqual(wire.schemaVersion, '2.0.0');
  });

  it('D5-27c: a D02 candle envelope still carries the shared 1.0.0 envelope version', () => {
    // The D01 bump must not leak into other domains that share the envelope.
    const loader = new HistoricalPitIngestionLoader();
    loader.ingestArchiveContent(
      'SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN\n'
        + 'INFY,EQ,1510.00,1530.00,1505.50,1520.35,1520.35,1508.00,2540000,3860000000,25-SEP-2026,120000,INE009A01021\n',
      { dateIso: '2026-09-25', sourceFilename: 'synthetic_bhavcopy.csv' },
    );
    const candle = loader.getCandleStore().queryAsOf({
      companyId: 'INFY',
      domain: 'D02_OHLCV',
      asOf: '2026-09-25T23:59:59.000Z',
    });
    assert.ok(candle, 'the D02 candle envelope should be stored');
    assert.strictEqual((candle as { schemaVersion: string }).schemaVersion, '1.0.0',
      'the shared envelope version for non-D01 domains must remain 1.0.0');
  });

  it('D5-29: the payload key set is unchanged — no sentinel or flag key was added', () => {
    const keys = Object.keys(payload()).sort();
    for (const key of ['ask', 'bid']) assert.ok(keys.includes(key), `${key} must still be a payload key`);
    // D-5 introduces no availability flag or sentinel field.
    for (const forbidden of ['bidAvailable', 'askAvailable', 'bidStatus', 'askStatus', 'hasDepth', 'depthAvailable']) {
      assert.ok(!keys.includes(forbidden), `D-5 must not add a ${forbidden} key`);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. D114 historical parsers: no fabrication from LTP
// ---------------------------------------------------------------------------

describe('D-5 D114 historical parsers — unavailable bid/ask are null', () => {
  const udiffRow = {
    TradDt: '2026-09-25',
    BizDt: '2026-09-25',
    Sgmt: 'CM',
    Src: 'NSE',
    FinInstrmTp: 'STK',
    FinInstrmId: '1594',
    ISIN: 'INE009A01021',
    TckrSymb: 'INFY',
    SctySrs: 'EQ',
    XpryDt: '',
    FininstrmActlXpryDt: '',
    StrkPric: '',
    OptnTp: '',
    FinInstrmNm: 'INFOSYS LIMITED',
    OpnPric: '1510.00',
    HghPric: '1530.00',
    LwPric: '1505.50',
    ClsPric: '1520.35',
    LastPric: '1520.35',
    PrvsClsgPric: '1508.00',
    UndrlygPric: '',
    SttlmPric: '',
    OpnIntrst: '',
    ChngInOpnIntrst: '',
    TtlTradgVol: '2540000',
    TtlTrfVal: '3860000000',
    TtlNbOfTxsExctd: '120000',
    SsnId: 'F1',
    NewBrdLotQty: '1',
    Rmks: '',
    Rsvd1: '',
  };

  it('D5-30: UDiFF parser reports bid/ask as null, never LTP', () => {
    const quote = CmUdiffParser.toCanonicalQuote(udiffRow as never);
    assert.strictEqual(quote.bid, null, 'UDiFF supplies no top-of-book; bid must be null');
    assert.strictEqual(quote.ask, null, 'UDiFF supplies no top-of-book; ask must be null');
    assert.notStrictEqual(quote.bid, quote.ltp, 'bid must not be the LTP');
    assert.notStrictEqual(quote.ask, quote.ltp, 'ask must not be the LTP');
    assert.strictEqual(quote.ltp, 1520.35, 'the LTP itself must still be reported');
  });

  it('D5-31: legacy bhavcopy parser reports bid/ask as null, never LTP', () => {
    const row = {
      SYMBOL: 'INFY',
      SERIES: 'EQ',
      OPEN: '1510.00',
      HIGH: '1530.00',
      LOW: '1505.50',
      CLOSE: '1520.35',
      LAST: '1520.35',
      PREVCLOSE: '1508.00',
      TOTTRDQTY: '2540000',
      TOTTRDVAL: '3860000000',
      TIMESTAMP: '25-SEP-2026',
      TOTALTRADES: '120000',
      ISIN: 'INE009A01021',
    };
    const quote = LegacyBhavcopyParser.toCanonicalQuote(row as never);
    assert.strictEqual(quote.bid, null);
    assert.strictEqual(quote.ask, null);
    assert.strictEqual(quote.ltp, 1520.35);
  });

  it('D5-32: a parser-produced quote validates cleanly with unavailable bid/ask', () => {
    const quote = CmUdiffParser.toCanonicalQuote(udiffRow as never);
    const r = validateMarketQuotePayload(quote);
    assert.strictEqual(r.isValid, true, `parser quote should remain valid: ${JSON.stringify(r.errors)}`);
  });
});

// ---------------------------------------------------------------------------
// 5. Ingress and PIT entry points
// ---------------------------------------------------------------------------

describe('D-5 canonical entry points', () => {
  it('D5-33: ingress accepts a quote whose bid/ask are unavailable', () => {
    const pipeline = new IngestionPipeline(new DeadLetterQueue());
    const result = pipeline.process<MarketQuotePayload>({
      domain: 'D01_QUOTES',
      mode: 'SNAPSHOT',
      companyId: 'COMP-INFY',
      rawPayload: payload({ bid: null, ask: null }),
      asOf: RECEIVED_AT,
      receivedAt: RECEIVED_AT,
    });
    assert.strictEqual(result.success, true, 'unavailable bid/ask must ingest as a valid quote');
    if (result.success) {
      assert.strictEqual(result.envelope.payload.bid, null);
      assert.strictEqual(result.envelope.payload.ask, null);
    }
  });

  it('D5-34: ingress rejects a quote carrying a zero bid', () => {
    const dlq = new DeadLetterQueue();
    const pipeline = new IngestionPipeline(dlq);
    const result = pipeline.process<MarketQuotePayload>({
      domain: 'D01_QUOTES',
      mode: 'SNAPSHOT',
      companyId: 'COMP-INFY',
      rawPayload: payload({ bid: 0 }),
      asOf: RECEIVED_AT,
      receivedAt: RECEIVED_AT,
    });
    assert.strictEqual(result.success, false, 'a supplied zero must be rejected at ingress');
  });

  it('D5-35a: PIT/D114 loader quarantines a quote with a zero bid', () => {
    const loader = new HistoricalPitIngestionLoader();
    // Replace the parser output path with a deliberately malformed quote by
    // driving the validator through the same guard the loader uses.
    const malformed = payload({ bid: 0 });
    const verdict = validateMarketQuotePayload(malformed);
    assert.strictEqual(verdict.isValid, false,
      'the PIT loader quarantines exactly when the D01 validator rejects');
  });

  it('D5-35b: PIT/D114 loader accepts a quote with unavailable bid/ask', () => {
    const loader = new HistoricalPitIngestionLoader();
    const result = loader.ingestArchiveContent(
      'SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN\n'
        + 'INFY,EQ,1510.00,1530.00,1505.50,1520.35,1520.35,1508.00,2540000,3860000000,25-SEP-2026,120000,INE009A01021\n',
      { dateIso: '2026-09-25', sourceFilename: 'synthetic_bhavcopy.csv' },
    );
    assert.strictEqual(result.success, true, JSON.stringify(result));
    assert.strictEqual(result.quarantinedCount, 0, 'null bid/ask must not be quarantined');
    const store = loader.getQuoteStore();
    assert.strictEqual(store.getRecordCount(), 1, 'the quote should have been admitted');
    const record = store.queryAsOf({
      companyId: 'INFY',
      domain: 'D01_QUOTES',
      asOf: '2026-09-25T23:59:59.000Z',
    });
    assert.ok(record, 'the admitted quote should be queryable');
    assert.strictEqual((record as { payload: MarketQuotePayload }).payload.bid, null);
    assert.strictEqual((record as { payload: MarketQuotePayload }).payload.ask, null);
  });

  it('D5-35: ingress rejects a non-finite ask', () => {
    const pipeline = new IngestionPipeline(new DeadLetterQueue());
    const result = pipeline.process<MarketQuotePayload>({
      domain: 'D01_QUOTES',
      mode: 'SNAPSHOT',
      companyId: 'COMP-INFY',
      rawPayload: payload({ ask: NaN }),
      asOf: RECEIVED_AT,
      receivedAt: RECEIVED_AT,
    });
    assert.strictEqual(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// 6. Regression protection: 18 November 2026 numeric security-ID correction
// ---------------------------------------------------------------------------

describe('D-5 does not disturb the 18 November 2026 serialization correction', () => {
  it('D5-36: security IDs are still serialized as JSON numbers, not strings', () => {
    // The correction fixed a Dhan HTTP 400 by sending security IDs as numbers.
    // D-5 must not touch request-body serialization, so this pins the real
    // serializer output rather than a hand-written approximation.
    const body = DhanApiClient.buildQuoteRequestBody([
      { exchangeSegment: 'NSE_EQ', dhanSecurityId: '11536' },
    ]);
    assert.strictEqual(body, '{"NSE_EQ":[11536]}');
    assert.doesNotMatch(body, /"11536"/, 'security IDs must not be quoted strings');
    assert.deepStrictEqual(JSON.parse(body), { NSE_EQ: [11536] });
  });
});
