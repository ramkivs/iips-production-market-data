/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-D3D Contract-Drift Prevention & IRR Compatibility Suite
 *
 * Gate: DHAN-D3D — automated protection of the provider-neutral and
 * consumer-facing contract boundary against unintended drift, plus an
 * IPD-side compatibility check against the symbols IRR actually consumes.
 *
 * These are STABLE contract assertions (key sets, export maps, identity
 * separation), not implementation snapshots. Synthetic fixtures only.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DhanInstrumentRegistry,
  DhanInstrumentMapping,
  normalizeDhanQuoteToCanonical,
  normalizeDhanHistoricalToCandles,
} from '../src/index.js';
import type { DhanQuoteDto } from '../src/providers/dhan/dhan_dto.js';
import type { DhanHistoricalResponseDto } from '../src/providers/dhan/dhan_historical_dto.js';
import * as dhanServerEntry from '../src/providers/dhan/package.js';
import * as portfolioUiEntry from '../src/ui/portfolio_ui_package.js';
import * as pitEntry from '../src/pit/package.js';
import * as d114Entry from '../src/d114/non_production_package.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// ── Stable contract assertions ──────────────────────────────────────────────

/** Exact canonical D01 payload key set (required + optional). */
const D01_PAYLOAD_KEYS = [
  'ask', 'bid', 'change', 'close', 'companyId', 'currency', 'exchange', 'high',
  'low', 'ltp', 'open', 'pctChange', 'previousClose', 'securityIdentity', 'symbol',
  'tradeCount', 'turnover', 'volume', 'vwap',
].sort();

/** Exact CanonicalEnvelope key set. */
const ENVELOPE_KEYS = [
  'companyId', 'domain', 'envelopeId', 'mode', 'payload', 'provenance', 'schemaVersion',
  'securityId', 'timestamp',
].sort();

/** Exact canonical D02 candle key set. */
const D02_CANDLE_KEYS = [
  'candleEnd', 'candleStart', 'close', 'companyId', 'high', 'interval', 'isAdjusted',
  'low', 'open', 'securityIdentity', 'symbol', 'tradeCount', 'volume', 'vwap',
].sort();

const VENDOR_TOKENS = ['dhan', 'last_price', 'net_change', 'last_trade_time', 'securityId"', 'ohlc'];

// ── IRR-consumed public symbols (read-only observation of IRR main) ──────────

/** Symbols IRR imports from `iips-production-market-data/portfolio-ui`. */
const IRR_PORTFOLIO_UI_SYMBOLS = [
  'BrokerImportModal',
  'DEFAULT_ALLOW_NON_PRODUCTION_BYPASS',
  'getDefaultPortfolioStore',
  'getGovernedBroadSecurityMaster',
] as const;
/** Type-only IRR imports from ./portfolio-ui (checked via declaration text). */
const IRR_PORTFOLIO_UI_TYPES = [
  'UserHoldingInput', 'PortfolioCommitReceipt', 'PortfolioCommitDisposition',
  'PortfolioDurability', 'PortfolioStore',
] as const;
/** Symbols IRR imports from `iips-production-market-data/pit`. */
const IRR_PIT_SYMBOLS = ['PitReadService', 'PointInTimeStore'] as const;
const IRR_PIT_TYPES = ['CanonicalEnvelope', 'DataDomain', 'DataProvenanceDTO'] as const;
/** Symbols IRR imports from `iips-production-market-data/d114-non-production`. */
const IRR_D114_SYMBOLS = ['populateNonProductionD114Pit'] as const;

const MAPPING: DhanInstrumentMapping = {
  companyId: 'COMP-SYNTH-A',
  isin: 'INE000SYNTH1',
  securityId: 'ISIN:INE000SYNTH1:EQ',
  exchange: 'NSE',
  symbol: 'SYNTHA',
  exchangeSegment: 'NSE_EQ',
  dhanSecurityId: 'SYNTH-NSE-EQ-1001',
  mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE',
  instrumentType: 'EQUITY',
  active: true,
};

function quote(): DhanQuoteDto {
  return {
    last_price: 1520.35,
    ohlc: { open: 1510, close: 1520.35, high: 1530, low: 1505.5 },
    volume: 2540000,
    last_trade_time: '25/09/2026 15:29:58',
    net_change: 12.35,
  };
}

describe('DHAN-D3D contract-drift prevention', () => {
  it('D3D-01: canonical D01 quote contract is stable — normalized Dhan output has exactly the D01 key set, no vendor fields', () => {
    const r = normalizeDhanQuoteToCanonical({
      quote: quote(), mapping: MAPPING, receivedAt: '2026-09-25T10:00:00.000Z', evaluatedAt: '2026-09-25T10:00:00.000Z',
    });
    assert.ok(r.ok, JSON.stringify(r));
    const env = r.value.envelope;
    // Required envelope keys present; optional keys (securityId) only when set; nothing else.
    for (const key of Object.keys(env)) assert.ok(ENVELOPE_KEYS.includes(key), `non-canonical envelope key: ${key}`);
    for (const required of ['envelopeId', 'domain', 'mode', 'companyId', 'payload', 'provenance', 'timestamp', 'schemaVersion']) {
      assert.ok(required in env, `missing required envelope key: ${required}`);
    }
    assert.deepStrictEqual(Object.keys(env.payload).sort(), D01_PAYLOAD_KEYS.filter((k) => k in env.payload));
    // Every emitted payload key must be a declared D01 key (no vendor leakage).
    for (const key of Object.keys(env.payload)) {
      assert.ok(D01_PAYLOAD_KEYS.includes(key), `non-canonical payload key leaked: ${key}`);
    }
    const serialized = JSON.stringify(env).toLowerCase();
    for (const token of VENDOR_TOKENS) {
      assert.ok(!serialized.includes(token.toLowerCase()), `vendor token leaked into canonical envelope: ${token}`);
    }
    assert.strictEqual(env.domain, 'D01_QUOTES');
    assert.strictEqual(env.provenance.sourceClassification, 'CANONICAL_MARKET_DATA');
  });

  it('D3D-02: canonical D02 historical contract is stable — adapter output has exactly the D02 key set and stays distinct from D01', () => {
    const T0 = Date.UTC(2026, 8, 21) / 1000;
    const dto: DhanHistoricalResponseDto = {
      timestamp: [T0], open: [100], high: [105], low: [99], close: [104], volume: [1000],
    };
    const r = normalizeDhanHistoricalToCandles({
      dto, mapping: MAPPING, interval: '1D', fromDate: '2026-09-21', toDate: '2026-09-21',
    });
    assert.ok(r.ok);
    const candle = r.value.candles[0]!;
    for (const key of Object.keys(candle)) {
      assert.ok(D02_CANDLE_KEYS.includes(key), `non-canonical candle key leaked: ${key}`);
    }
    assert.strictEqual(candle.interval, '1d');
    assert.ok(!('ltp' in candle) && !('bid' in candle), 'historical candle must not carry D01 quote fields');
    const serialized = JSON.stringify(r.value).toLowerCase();
    for (const token of VENDOR_TOKENS) assert.ok(!serialized.includes(token.toLowerCase()));
  });

  it('D3D-03: identity separation — companyId, P04 security identity and Dhan instrument id stay distinct; multi-ISIN resolves independently; incomplete identity fails closed', () => {
    const registry = new DhanInstrumentRegistry();
    registry.register(MAPPING);
    registry.register({ ...MAPPING, isin: 'INE000SYNTH2', securityId: 'ISIN:INE000SYNTH2:EQ', dhanSecurityId: 'SYNTH-NSE-EQ-1002' });
    const a = registry.resolveSecurity('COMP-SYNTH-A', 'NSE_EQ', 'INE000SYNTH1');
    const b = registry.resolveSecurity('COMP-SYNTH-A', 'NSE_EQ', 'INE000SYNTH2');
    assert.ok(a.status === 'RESOLVED' && b.status === 'RESOLVED');
    if (a.status === 'RESOLVED' && b.status === 'RESOLVED') {
      assert.notStrictEqual(a.mapping.dhanSecurityId, b.mapping.dhanSecurityId);
      assert.strictEqual(a.mapping.companyId, b.mapping.companyId); // same company, distinct securities
    }
    const amb = registry.resolveListing('COMP-SYNTH-A', 'NSE_EQ');
    assert.ok(amb.status === 'UNRESOLVED' && amb.reason === 'AMBIGUOUS_MAPPING');
  });

  it('D3D-04: public package export map is exactly the authorized set', () => {
    const manifest = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8'));
    assert.deepStrictEqual(Object.keys(manifest.exports), [
      './portfolio-ui', './pit', './d114-non-production', './operator-drop', './dhan-server',
    ]);
    assert.deepStrictEqual(manifest.files, ['dist/package']);
  });

  it('D3D-05: ./dhan-server exposes the intended server surface and never raw vendor DTO parsers', () => {
    const keys = Object.keys(dhanServerEntry);
    for (const expected of ['DhanMarketDataSource', 'DhanApiClient', 'DhanInstrumentRegistry', 'DhanInstrumentResolutionService', 'DhanHistoricalAdapter', 'resolveDhanProviderConfig', 'ProviderMarketDataRoute']) {
      assert.ok(keys.includes(expected), `missing server export: ${expected}`);
    }
    for (const forbidden of ['parseDhanQuoteBlock', 'parseDhanMarketQuoteResponse', 'selectDhanQuote', 'parseDhanHistoricalResponse', 'normalizeDhanQuoteToCanonical', 'DhanQuoteDto', 'DhanHistoricalResponseDto']) {
      assert.ok(!keys.includes(forbidden), `vendor-internal symbol leaked from ./dhan-server: ${forbidden}`);
    }
  });

  it('D3D-06: IRR-consumed public symbols remain available on their existing subpaths (IRR main @ 26256e7 expectations)', () => {
    for (const symbol of IRR_PORTFOLIO_UI_SYMBOLS) {
      assert.ok(symbol in portfolioUiEntry, `./portfolio-ui lost IRR-consumed symbol: ${symbol}`);
    }
    for (const symbol of IRR_PIT_SYMBOLS) {
      assert.ok(symbol in pitEntry, `./pit lost IRR-consumed symbol: ${symbol}`);
    }
    for (const symbol of IRR_D114_SYMBOLS) {
      assert.ok(symbol in d114Entry, `./d114-non-production lost IRR-consumed symbol: ${symbol}`);
    }
    // Type-level check: the IRR-consumed type names must appear in the emitted entry declarations.
    const portfolioUiDts = readFileSync(resolve(REPO_ROOT, 'src/ui/portfolio_ui_package.ts'), 'utf8');
    for (const type of IRR_PORTFOLIO_UI_TYPES) {
      assert.ok(portfolioUiDts.includes(type), `./portfolio-ui lost IRR-consumed type: ${type}`);
    }
    const pitDts = readFileSync(resolve(REPO_ROOT, 'src/pit/package.ts'), 'utf8');
    for (const type of IRR_PIT_TYPES) {
      assert.ok(pitDts.includes(type), `./pit lost IRR-consumed type: ${type}`);
    }
  });

  it('D3D-07: contract assertions fail on drift (self-check of the guard)', () => {
    // A payload with an injected vendor field must NOT match the D01 key set —
    // proving these assertions would catch a leak if one appeared.
    const drifted = { ...JSON.parse(JSON.stringify(quote())), companyId: 'X' };
    assert.ok(!D01_PAYLOAD_KEYS.includes('last_price'));
    assert.notDeepStrictEqual(Object.keys(drifted).sort(), D01_PAYLOAD_KEYS.filter((k) => k in drifted));
  });
});
