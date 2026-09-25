/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-D2 Integration & Qualification Harness Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Gate: DHAN-D2 INTEGRATION & QUALIFICATION HARNESS
 * Mode: PRE_ACCESS / SYNTHETIC / OFFLINE
 *
 * SCOPE OF PROOF:
 *  Deterministic synthetic fixtures only. These tests prove integration correctness of the
 *  provider-neutral path (mapping → canonical → product transport → portfolio → UI state →
 *  historical boundary) under pre-access conditions. They do NOT prove, imply or require
 *  real Dhan authentication, real Dhan connectivity, real Dhan historical coverage or
 *  production readiness.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

import {
  // Existing canonical / product / UI surfaces (reused, unmodified)
  CanonicalEnvelope,
  MarketQuotePayload,
  MarketDataDTO,
  EngineApiAdapter,
  UI11ProvenanceAuditorBuilder,
  AccessibilityEngine,
  SecurityMaster,
  validateOHLCVCandle,
  validateMarketQuotePayload,
  scanDirectoryForSecrets,
  scanTextForSecrets,
  MarketDataSource,
  // Provider-neutral route (DHAN-D2)
  ProviderMarketDataRoute,
  ProviderRouteQuoteResult,
  buildProviderRouteDataStateView,
  deriveMarketDataState,
  PRE_ACCESS_ROUTE_DISCLOSURE,
  // Dhan provider package
  DHAN_ENV_KEYS,
  DhanApiClient,
  DhanCredentialMaterial,
  DhanCredentialResolver,
  DhanHistoricalAdapter,
  DhanHttpRequest,
  DhanHttpResponse,
  DhanHttpTransport,
  DhanInstrumentRegistry,
  DhanInstrumentResolutionService,
  DhanMarketDataSource,
  DhanTransportUnavailableError,
  loadDhanInstrumentMappings,
  resolveDhanProviderConfig,
  validateDhanHistoricalRequest,
  validateDhanInstrumentMappingRow,
} from '../src/index.js';

import {
  revaluePortfolioHoldings,
  UserHoldingInput,
} from '../frontend/src/features/portfolio/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Synthetic fixtures
// ─────────────────────────────────────────────────────────────────────────────

type Scenario = {
  httpStatus?: number;
  body?: unknown;
  bodyTextOverride?: string;
  transportMode?: string;
};

const D1 = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/dhan_d1_fixtures.json'), 'utf-8'));
const D2 = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/dhan_d2_fixtures.json'), 'utf-8'));

const EVAL_INSTANT: string = D2.evaluationInstant;
const QUOTE_SCENARIOS: Record<string, Scenario> = { ...D1.scenarios, ...D2.quoteScenarios };
const HISTORICAL_SCENARIOS: Record<string, Scenario> = D2.historicalScenarios;
const VALID_MAPPING_ROWS: unknown[] = D2.mappingRows.valid;
const HOLDINGS: UserHoldingInput[] = D2.holdings;

const SYNTHETIC_ACCESS_VALUE = 'SYNTHETIC-PRE-ACCESS-PLACEHOLDER-VALUE-0000';
const SYNTHETIC_CLIENT_VALUE = 'SYNTHETIC-CLIENT-PLACEHOLDER-0000';

const CONFIGURED_ENV: Record<string, string> = {
  [DHAN_ENV_KEYS.baseUrl]: 'https://synthetic.invalid/v2',
  [DHAN_ENV_KEYS.timeoutMs]: '50',
  [DHAN_ENV_KEYS.accessTokenSecretPath]: 'vault://market-data/alternate-route/access-token',
  [DHAN_ENV_KEYS.clientIdSecretPath]: 'vault://market-data/alternate-route/client-id',
  [DHAN_ENV_KEYS.secretVaultProvider]: 'LOCAL_MOCK_VAULT',
  [DHAN_ENV_KEYS.secretVersion]: 'v1',
};

class SyntheticCredentialResolver implements DhanCredentialResolver {
  public async resolve(): Promise<DhanCredentialMaterial> {
    return { accessToken: SYNTHETIC_ACCESS_VALUE, clientId: SYNTHETIC_CLIENT_VALUE };
  }
}

/** Serves synthetic quote and historical scenarios by endpoint path. */
class ScenarioTransport implements DhanHttpTransport {
  public readonly requests: DhanHttpRequest[] = [];
  private readonly quoteKey?: string;
  private readonly historicalKey?: string;

  constructor(options: { quote?: string; historical?: string }) {
    this.quoteKey = options.quote;
    this.historicalKey = options.historical;
  }

  public async send(request: DhanHttpRequest): Promise<DhanHttpResponse> {
    this.requests.push(request);
    const isHistorical = request.url.endsWith('/charts/historical');
    const key = isHistorical ? this.historicalKey : this.quoteKey;
    const scenario = key ? (isHistorical ? HISTORICAL_SCENARIOS[key] : QUOTE_SCENARIOS[key]) : undefined;
    assert.ok(scenario, `Unknown synthetic scenario for ${request.url}`);

    if (scenario.transportMode === 'NEVER_RESOLVES') {
      return new Promise<DhanHttpResponse>(() => {
        /* never settles: exercises the client timeout path */
      });
    }
    if (scenario.transportMode === 'TRANSPORT_UNAVAILABLE') {
      throw new DhanTransportUnavailableError('Synthetic transport unavailable');
    }
    return {
      status: scenario.httpStatus ?? 200,
      bodyText: scenario.bodyTextOverride ?? JSON.stringify(scenario.body),
    };
  }
}

function buildRegistry(rows: unknown[] = VALID_MAPPING_ROWS): DhanInstrumentRegistry {
  const report = loadDhanInstrumentMappings(rows);
  assert.strictEqual(report.rejectedCount, 0, 'Synthetic base mappings must load cleanly');
  return report.registry;
}

function buildClient(transport: ScenarioTransport): DhanApiClient {
  const resolution = resolveDhanProviderConfig(CONFIGURED_ENV);
  assert.strictEqual(resolution.ok, true);
  return new DhanApiClient({
    config: resolution.config,
    transport,
    credentialResolver: new SyntheticCredentialResolver(),
  });
}

function buildSource(
  scenarioKey: string | undefined,
  registry: DhanInstrumentRegistry = buildRegistry()
): { source: DhanMarketDataSource; transport: ScenarioTransport } {
  const transport = new ScenarioTransport({ quote: scenarioKey });
  const source = new DhanMarketDataSource({
    client: buildClient(transport),
    instrumentRegistry: registry,
    now: () => new Date(EVAL_INSTANT),
  });
  return { source, transport };
}

function buildRoute(
  scenarioKey: string | undefined,
  registry?: DhanInstrumentRegistry
): ProviderMarketDataRoute {
  return new ProviderMarketDataRoute(buildSource(scenarioKey, registry).source);
}

function buildSecurityMaster(): SecurityMaster {
  const sm = new SecurityMaster();
  for (const entity of D2.securityMasterEntities) {
    sm.registerEntity(entity);
  }
  return sm;
}

const VENDOR_TOKENS = ['dhan', 'last_price', 'net_change', 'last_trade_time', 'nse_eq', 'synth-nse-eq', 'securityid'];

function assertNoVendorLeakage(serialized: string, label: string): void {
  const lowered = serialized.toLowerCase();
  for (const token of VENDOR_TOKENS) {
    assert.ok(!lowered.includes(token), `${label}: vendor artefact '${token}' leaked`);
  }
  assert.ok(!serialized.includes(SYNTHETIC_ACCESS_VALUE), `${label}: credential leaked`);
  assert.ok(!serialized.includes(SYNTHETIC_CLIENT_VALUE), `${label}: client identifier leaked`);
}

// ─────────────────────────────────────────────────────────────────────────────

describe('DHAN-D2: Integration & Qualification Harness (PRE_ACCESS / SYNTHETIC / OFFLINE)', () => {
  // ── TASK 2: instrument mapping integration ────────────────────────────────

  it('DHAN-D2-01: valid synthetic mappings load and are reported as pre-access only', () => {
    const report = loadDhanInstrumentMappings(VALID_MAPPING_ROWS);
    assert.strictEqual(report.acceptedCount, 2);
    assert.strictEqual(report.rejectedCount, 0);
    assert.strictEqual(report.syntheticCount, 2);
    assert.strictEqual(report.instrumentMasterCount, 0);

    const service = new DhanInstrumentResolutionService(buildSecurityMaster(), report.registry);
    const coverage = service.describeCoverage();
    assert.strictEqual(coverage.totalMappings, 2);
    assert.strictEqual(coverage.preAccessOnly, true);
    assert.deepStrictEqual(coverage.companyIds, ['INFY', 'TCS']);
    assertNoVendorLeakage(JSON.stringify(coverage), 'coverage report');
  });

  it('DHAN-D2-02: malformed mapping rows are rejected deterministically with field paths', () => {
    for (const testCase of D2.mappingRows.malformed) {
      const result = validateDhanInstrumentMappingRow(testCase.row);
      assert.strictEqual(result.ok, false, `${testCase._case} must be rejected`);
      if (!result.ok) {
        assert.strictEqual(result.failure.code, 'MALFORMED_INSTRUMENT_MAPPING', testCase._case);
        if (testCase.expectedField) {
          assert.strictEqual(result.failure.field, testCase.expectedField, testCase._case);
        }
      }
    }

    const report = loadDhanInstrumentMappings(D2.mappingRows.malformed.map((c: { row: unknown }) => c.row));
    assert.strictEqual(report.acceptedCount, 0);
    assert.strictEqual(report.rejectedCount, D2.mappingRows.malformed.length);
    assert.ok(report.registry.isEmpty());
  });

  it('DHAN-D2-03: duplicate and conflicting mappings fail closed; identical rows are idempotent', () => {
    const conflicts = D2.mappingRows.conflicting;

    const remapped = loadDhanInstrumentMappings([...VALID_MAPPING_ROWS, conflicts.companyIdRemapped]);
    assert.strictEqual(remapped.acceptedCount, 2);
    assert.strictEqual(remapped.rejections[0].code, 'CONFLICTING_INSTRUMENT_MAPPING');

    const reused = loadDhanInstrumentMappings([...VALID_MAPPING_ROWS, conflicts.securityIdReused]);
    assert.strictEqual(reused.acceptedCount, 2);
    assert.strictEqual(reused.rejections[0].code, 'CONFLICTING_INSTRUMENT_MAPPING');
    assert.strictEqual(reused.registry.resolve('WIPRO').status, 'UNRESOLVED');

    const idempotent = loadDhanInstrumentMappings([...VALID_MAPPING_ROWS, conflicts.identicalDuplicate]);
    assert.strictEqual(idempotent.rejectedCount, 0);
    assert.strictEqual(idempotent.registry.size, 2);
  });

  it('DHAN-D2-04: missing mapping data and unknown instruments both fail closed', () => {
    const empty = new DhanInstrumentRegistry();
    const emptyService = new DhanInstrumentResolutionService(buildSecurityMaster(), empty);
    const noData = emptyService.resolveProviderMapping('INFY');
    assert.strictEqual(noData.ok, false);
    if (!noData.ok) assert.strictEqual(noData.failure.code, 'UNRESOLVED_INSTRUMENT');
    assert.ok(empty.resolve('INFY').status === 'UNRESOLVED');

    const service = new DhanInstrumentResolutionService(buildSecurityMaster(), buildRegistry());
    const unknown = service.resolveProviderMapping('UNKNOWN_CO');
    assert.strictEqual(unknown.ok, false);
    if (!unknown.ok) assert.strictEqual(unknown.failure.code, 'UNRESOLVED_INSTRUMENT');
  });

  it('DHAN-D2-05: identity resolves through the existing P04 SecurityMaster without exposing provider ids', () => {
    const service = new DhanInstrumentResolutionService(buildSecurityMaster(), buildRegistry());

    const resolved = service.resolveCanonicalIdentity({ identifierType: 'ISIN', identifierValue: 'INE009A01021' });
    assert.strictEqual(resolved.ok, true);
    if (resolved.ok) {
      assert.deepStrictEqual(resolved.value, { companyId: 'INFY', symbol: 'INFY', exchange: 'NSE' });
      assert.strictEqual(Object.keys(resolved.value).includes('dhanSecurityId'), false);
      assertNoVendorLeakage(JSON.stringify(resolved.value), 'canonical identity');
    }

    const unmapped = service.resolveCanonicalIdentity({ identifierType: 'ISIN', identifierValue: 'INE000X00000' });
    assert.strictEqual(unmapped.ok, false);
    if (!unmapped.ok) assert.strictEqual(unmapped.failure.code, 'IDENTITY_RESOLUTION_FAILURE');
  });

  // ── TASK 3: CURRENT / STALE / UNAVAILABLE ─────────────────────────────────

  it('DHAN-D2-06: valid fresh synthetic data resolves to CURRENT through the provider-neutral route', async () => {
    const route = buildRoute('validQuote');
    assert.strictEqual(route.providerRouteId, 'DHAN_PROVIDER');

    const result = await route.getQuote('INFY');
    assert.strictEqual(result.state, 'CURRENT');
    assert.strictEqual(result.quality, 'GOOD');
    assert.ok(result.marketData, 'CURRENT results must carry the canonical product DTO');
    assert.strictEqual(result.marketData?.ltp, 1520.35);
    assert.strictEqual(result.asOf, '2026-09-25T09:59:58.000Z');
    assert.strictEqual(validateMarketQuotePayload((result.envelope as CanonicalEnvelope<MarketQuotePayload>).payload).isValid, true);
  });

  it('DHAN-D2-07: expired freshness resolves to STALE and can never present as CURRENT', async () => {
    const result = await buildRoute('staleQuoteConcession').getQuote('INFY');
    assert.strictEqual(result.state, 'STALE');
    assert.strictEqual(result.quality, 'STALE');
    assert.notStrictEqual(result.state, 'CURRENT');

    const view = buildProviderRouteDataStateView(result);
    assert.strictEqual(view.state, 'STALE');
    assert.strictEqual(view.isDegraded, true);
    assert.strictEqual(view.qualityIndicator.isDegraded, true);
    assert.strictEqual(view.qualityIndicator.state, 'STALE');
  });

  it('DHAN-D2-08: suppressed and absent data resolve to UNAVAILABLE with no market data attached', async () => {
    const suppressed = await buildRoute('staleQuoteSuppressed').getQuote('INFY');
    assert.strictEqual(suppressed.state, 'UNAVAILABLE');
    assert.strictEqual(suppressed.failureCode, 'STALE_DATA_SUPPRESSED');
    assert.strictEqual(suppressed.marketData, undefined);
    assert.strictEqual(suppressed.envelope, undefined);

    const absent = await buildRoute('instrumentAbsentFromResponse').getQuote('INFY');
    assert.strictEqual(absent.state, 'UNAVAILABLE');
    assert.strictEqual(absent.failureCode, 'INSTRUMENT_NOT_IN_RESPONSE');

    assert.strictEqual(deriveMarketDataState('PARTIAL'), 'UNAVAILABLE');
    assert.strictEqual(deriveMarketDataState('UNAVAILABLE'), 'UNAVAILABLE');
  });

  it('DHAN-D2-09: invalid data is rejected rather than surfaced, and the route never throws', async () => {
    for (const [scenario, expected] of [
      ['missingRequiredField', 'MISSING_REQUIRED_FIELD'],
      ['invalidPriceQuote', 'CANONICAL_VALIDATION_FAILURE'],
      ['crossFieldViolationQuote', 'CANONICAL_VALIDATION_FAILURE'],
      ['invalidTimestampQuote', 'MALFORMED_RESPONSE'],
    ] as const) {
      const result = await buildRoute(scenario).getQuote('INFY');
      assert.strictEqual(result.state, 'UNAVAILABLE', scenario);
      assert.strictEqual(result.failureCode, expected, scenario);
      assert.strictEqual(result.marketData, undefined, scenario);
    }
  });

  // ── TASK 4: portfolio integration ─────────────────────────────────────────

  it('DHAN-D2-10: the existing portfolio path consumes canonical market data end to end', async () => {
    const route = buildRoute('twoInstrumentQuote');
    const results = await route.getQuotes(['INFY', 'TCS', 'UNMAPPEDCO']);
    const marketData = results.map((r) => r.marketData).filter((d): d is MarketDataDTO => d !== undefined);
    assert.strictEqual(marketData.length, 2);

    const revaluation = revaluePortfolioHoldings({
      holdings: HOLDINGS,
      marketData,
      evaluatedAt: EVAL_INSTANT,
    });

    const infy = revaluation.positions.find((p) => p.companyId === 'INFY')!;
    assert.strictEqual(infy.ltp, 1520.35);
    assert.strictEqual(infy.previousClose, 1508);
    assert.strictEqual(infy.dayChangePerShare, 12.35);
    assert.strictEqual(infy.dayChangeValue, 1235);
    assert.strictEqual(infy.currentValue, 152035);
    assert.strictEqual(infy.investedValue, 145050);
    assert.strictEqual(infy.unrealizedPnl, 6985);
    assert.strictEqual(infy.unrealizedPnlPct, 4.82);
    assert.strictEqual(infy.marketDataState, 'CURRENT');
    assert.strictEqual(infy.asOf, '2026-09-25T09:59:58.000Z');
    assert.strictEqual(infy.sourceClassification, 'CANONICAL_MARKET_DATA');
    assert.strictEqual(infy.lineageDigest?.length, 64);

    const tcs = revaluation.positions.find((p) => p.companyId === 'TCS')!;
    assert.strictEqual(tcs.currentValue, 192525);
    assert.strictEqual(tcs.unrealizedPnl, 2525);
    assert.strictEqual(tcs.dayChangeValue, 2025);

    assert.strictEqual(revaluation.totalCurrentValue, 344560);
    assert.strictEqual(revaluation.totalInvestedValue, 336050);
    assert.strictEqual(revaluation.totalUnrealizedPnl, 9510);
    assert.strictEqual(revaluation.totalDayChangeValue, 3260);
    assert.strictEqual(revaluation.pricedPositionCount, 2);
    assert.strictEqual(revaluation.unpricedPositionCount, 1);
    assert.strictEqual(
      Math.round((infy.weightPercentage! + tcs.weightPercentage!) * 100) / 100,
      100
    );
  });

  it('DHAN-D2-11: stale market data degrades the portfolio state instead of presenting as current', async () => {
    const route = buildRoute('twoInstrumentStaleQuote');
    const results = await route.getQuotes(['INFY', 'TCS']);
    const marketData = results.map((r) => r.marketData!).filter(Boolean);

    const revaluation = revaluePortfolioHoldings({
      holdings: HOLDINGS.slice(0, 2),
      marketData,
      evaluatedAt: EVAL_INSTANT,
    });

    assert.strictEqual(revaluation.allPositionsPriced, true);
    assert.strictEqual(revaluation.portfolioState, 'STALE');
    assert.ok(revaluation.positions.every((p) => p.marketDataState === 'STALE'));
    assert.ok(revaluation.positions.every((p) => p.currentValue !== null));
  });

  it('DHAN-D2-12: unpriced positions are never valued at cost and degrade the portfolio to UNAVAILABLE', async () => {
    const unavailable = await buildRoute('authenticationFailure').getQuote('INFY');
    assert.strictEqual(unavailable.marketData, undefined);

    const revaluation = revaluePortfolioHoldings({
      holdings: HOLDINGS,
      marketData: [],
      evaluatedAt: EVAL_INSTANT,
    });

    assert.strictEqual(revaluation.pricedPositionCount, 0);
    assert.strictEqual(revaluation.portfolioState, 'UNAVAILABLE');
    assert.strictEqual(revaluation.totalCurrentValue, 0);
    assert.strictEqual(revaluation.totalUnrealizedPnl, 0);
    for (const position of revaluation.positions) {
      assert.strictEqual(position.currentValue, null);
      assert.strictEqual(position.ltp, null);
      assert.strictEqual(position.unrealizedPnl, null);
      assert.strictEqual(position.disposition, 'UNPRICED_NO_MARKET_DATA');
      assert.ok(position.investedValue > 0, 'cost basis remains visible but is never treated as a market price');
    }
  });

  it('DHAN-D2-13: the portfolio binding is provider-neutral (identical behaviour for non-Dhan canonical data)', () => {
    const genericQuote: MarketQuotePayload = {
      companyId: 'INFY',
      symbol: 'INFY',
      exchange: 'NSE',
      currency: 'INR',
      bid: 1520.25,
      ask: 1520.5,
      ltp: 1520.35,
      open: 1510,
      high: 1530,
      low: 1505.5,
      close: 1508,
      previousClose: 1508,
      volume: 2540000,
      change: 12.35,
      pctChange: 0.82,
    };
    const dto = EngineApiAdapter.createMarketDataDTO({
      quote: genericQuote,
      mode: 'SNAPSHOT',
      asOf: '2026-09-25T09:59:58.000Z',
      quality: 'GOOD',
    });

    const revaluation = revaluePortfolioHoldings({
      holdings: HOLDINGS.slice(0, 1),
      marketData: [dto],
      evaluatedAt: EVAL_INSTANT,
    });

    assert.strictEqual(revaluation.positions[0].currentValue, 152035);
    assert.strictEqual(revaluation.portfolioState, 'CURRENT');
    assertNoVendorLeakage(JSON.stringify(revaluation), 'portfolio revaluation');
  });

  // ── TASK 5: UI / data-state integration ───────────────────────────────────

  it('DHAN-D2-14: the product data-state view represents provider, state, price and timestamp', async () => {
    const result = await buildRoute('validQuote').getQuote('INFY');
    const view = buildProviderRouteDataStateView(result);

    assert.strictEqual(view.providerRouteId, 'DHAN_PROVIDER');
    assert.strictEqual(view.providerDisplayLabel, 'DHAN');
    assert.strictEqual(view.state, 'CURRENT');
    assert.strictEqual(view.displayPrice, 1520.35);
    assert.strictEqual(view.displayTimestamp, '2026-09-25T09:59:58.000Z');
    assert.strictEqual(view.symbol, 'INFY');
    assert.strictEqual(view.isDegraded, false);
    assert.strictEqual(view.disclosure, PRE_ACCESS_ROUTE_DISCLOSURE);
    assert.deepStrictEqual(view.qualityIndicator, AccessibilityEngine.getQualityIndicator('GOOD'));
  });

  it('DHAN-D2-15: STALE and UNAVAILABLE states are representable through the existing indicators', async () => {
    const stale = buildProviderRouteDataStateView(await buildRoute('staleQuoteConcession').getQuote('INFY'));
    assert.strictEqual(stale.state, 'STALE');
    assert.strictEqual(stale.displayPrice, 1519);
    assert.strictEqual(stale.qualityIndicator.label, 'Stale Data');

    const unavailable = buildProviderRouteDataStateView(await buildRoute('transportFailure').getQuote('INFY'));
    assert.strictEqual(unavailable.state, 'UNAVAILABLE');
    assert.strictEqual(unavailable.displayPrice, null);
    assert.strictEqual(unavailable.displayTimestamp, null);
    assert.strictEqual(unavailable.unavailableReason, 'TRANSPORT_FAILURE');
    assert.strictEqual(unavailable.qualityIndicator.state, 'UNAVAILABLE');
  });

  it('DHAN-D2-16: existing UI view-model builders consume the canonical representation only', async () => {
    const result = await buildRoute('validQuote').getQuote('INFY');
    const dto = result.marketData as MarketDataDTO;

    const vm = UI11ProvenanceAuditorBuilder.build({
      provenance: dto.provenance,
      companyId: dto.companyId,
      companyName: 'Synthetic Infosys Test Entity',
      vendorTier: 'TIER_2_COMMERCIAL',
    });

    assert.strictEqual(vm.surfaceId, 'UI11_PROVENANCE_AUDITOR');
    assert.strictEqual(vm.sourceClassification, 'CANONICAL_MARKET_DATA');
    assert.strictEqual(vm.vendorTier, 'TIER_2_COMMERCIAL');
    assert.strictEqual(vm.qualityIndicator.state, 'GOOD');
    assert.strictEqual(vm.lineageHash.length, 64);
    assertNoVendorLeakage(JSON.stringify(vm), 'UI11 view model');
  });

  // ── TASK 6: historical adapter preparation ────────────────────────────────

  it('DHAN-D2-17: synthetic historical payloads normalize into the existing canonical D02 contract', async () => {
    const transport = new ScenarioTransport({ historical: 'validSeries' });
    const adapter = new DhanHistoricalAdapter({
      client: buildClient(transport),
      instrumentRegistry: buildRegistry(),
    });

    const result = await adapter.fetchDailyCandles({
      companyId: 'INFY',
      interval: 'DAY',
      fromDate: '2026-09-21',
      toDate: '2026-09-23',
    });

    assert.strictEqual(result.ok, true);
    if (!result.ok) return;
    assert.strictEqual(result.value.returnedCandleCount, 3);
    assert.strictEqual(result.value.coverageClaim, 'ACCESS_PENDING_UNVERIFIED');
    assert.deepStrictEqual(
      result.value.candles.map((c) => c.candleStart),
      D2.historicalScenarios.validSeries.expectedCandleStarts
    );
    for (const candle of result.value.candles) {
      assert.strictEqual(validateOHLCVCandle(candle).isValid, true);
      assert.strictEqual(candle.interval, '1d');
      assert.strictEqual(candle.isAdjusted, false);
      assert.strictEqual(candle.companyId, 'INFY');
    }
    assertNoVendorLeakage(JSON.stringify(result.value.candles), 'canonical candles');
  });

  it('DHAN-D2-18: the historical request/date-range model fails closed on invalid input', () => {
    const cases: Array<[Record<string, string>, string]> = [
      [{ companyId: 'INFY', interval: 'DAY', fromDate: '2026-09-23', toDate: '2026-09-21' }, 'INVALID_DATE_RANGE'],
      [{ companyId: 'INFY', interval: 'DAY', fromDate: '21-09-2026', toDate: '2026-09-23' }, 'INVALID_DATE_RANGE'],
      [{ companyId: 'INFY', interval: 'DAY', fromDate: '2000-01-01', toDate: '2026-09-23' }, 'INVALID_DATE_RANGE'],
      [{ companyId: 'INFY', interval: 'MINUTE', fromDate: '2026-09-21', toDate: '2026-09-23' }, 'UNSUPPORTED_INTERVAL'],
      [{ companyId: '', interval: 'DAY', fromDate: '2026-09-21', toDate: '2026-09-23' }, 'MISSING_REQUIRED_FIELD'],
    ];

    for (const [request, expected] of cases) {
      const result = validateDhanHistoricalRequest(request as never);
      assert.strictEqual(result.ok, false, JSON.stringify(request));
      if (!result.ok) assert.strictEqual(result.failure.code, expected, JSON.stringify(request));
    }

    const valid = validateDhanHistoricalRequest({
      companyId: 'INFY',
      interval: 'DAY',
      fromDate: '2026-09-21',
      toDate: '2026-09-23',
    });
    assert.strictEqual(valid.ok, true);
    if (valid.ok) assert.strictEqual(valid.value.spanDays, 3);
  });

  it('DHAN-D2-19: historical transport, structural and canonical failures are deterministic', async () => {
    const expectations: Array<[string, string]> = [
      ['raggedSeries', 'MALFORMED_RESPONSE'],
      ['missingSeries', 'MISSING_REQUIRED_FIELD'],
      ['emptySeries', 'EMPTY_HISTORICAL_SERIES'],
      ['invalidPriceSeries', 'CANONICAL_VALIDATION_FAILURE'],
      ['invalidTimestampSeries', 'MALFORMED_RESPONSE'],
      ['authenticationFailure', 'AUTHENTICATION_FAILURE'],
    ];

    for (const [scenario, expected] of expectations) {
      const adapter = new DhanHistoricalAdapter({
        client: buildClient(new ScenarioTransport({ historical: scenario })),
        instrumentRegistry: buildRegistry(),
      });
      const result = await adapter.fetchDailyCandles({
        companyId: 'INFY',
        interval: 'DAY',
        fromDate: '2026-09-21',
        toDate: '2026-09-23',
      });
      assert.strictEqual(result.ok, false, scenario);
      if (!result.ok) assert.strictEqual(result.failure.code, expected, scenario);
    }

    // Unresolved instrument: no historical request may be attempted.
    const transport = new ScenarioTransport({ historical: 'validSeries' });
    const unresolved = await new DhanHistoricalAdapter({
      client: buildClient(transport),
      instrumentRegistry: new DhanInstrumentRegistry(),
    }).fetchDailyCandles({ companyId: 'INFY', interval: 'DAY', fromDate: '2026-09-21', toDate: '2026-09-23' });
    assert.strictEqual(unresolved.ok, false);
    if (!unresolved.ok) assert.strictEqual(unresolved.failure.code, 'UNRESOLVED_INSTRUMENT');
    assert.strictEqual(transport.requests.length, 0);

    // Pre-access (no credentials): deterministic short-circuit before transport.
    const preAccessTransport = new ScenarioTransport({ historical: 'validSeries' });
    const preAccessClient = new DhanApiClient({
      config: resolveDhanProviderConfig({}).config,
      transport: preAccessTransport,
    });
    const preAccess = await new DhanHistoricalAdapter({
      client: preAccessClient,
      instrumentRegistry: buildRegistry(),
    }).fetchDailyCandles({ companyId: 'INFY', interval: 'DAY', fromDate: '2026-09-21', toDate: '2026-09-23' });
    assert.strictEqual(preAccess.ok, false);
    if (!preAccess.ok) assert.strictEqual(preAccess.failure.code, 'CREDENTIALS_UNAVAILABLE');
    assert.strictEqual(preAccessTransport.requests.length, 0);
  });

  // ── TASK 7: failure / resilience matrix ───────────────────────────────────

  it('DHAN-D2-20: full downstream failure matrix stays deterministic and fail-closed', async () => {
    const matrix: Array<{ label: string; scenario?: string; emptyRegistry?: boolean; preAccess?: boolean; expected: string }> = [
      { label: 'authentication failure', scenario: 'authenticationFailure', expected: 'AUTHENTICATION_FAILURE' },
      { label: 'timeout', scenario: 'transportTimeout', expected: 'TIMEOUT' },
      { label: 'transport failure', scenario: 'transportFailure', expected: 'TRANSPORT_FAILURE' },
      { label: 'HTTP failure', scenario: 'serverError', expected: 'HTTP_ERROR' },
      { label: 'rate limited', scenario: 'rateLimited', expected: 'RATE_LIMITED' },
      { label: 'malformed response', scenario: 'malformedResponse', expected: 'MALFORMED_RESPONSE' },
      { label: 'provider status failure', scenario: 'providerStatusFailure', expected: 'PROVIDER_STATUS_FAILURE' },
      { label: 'missing required field', scenario: 'missingRequiredField', expected: 'MISSING_REQUIRED_FIELD' },
      { label: 'unresolved instrument', scenario: 'validQuote', emptyRegistry: true, expected: 'UNRESOLVED_INSTRUMENT' },
      { label: 'stale data suppressed', scenario: 'staleQuoteSuppressed', expected: 'STALE_DATA_SUPPRESSED' },
      { label: 'instrument absent (unavailable)', scenario: 'instrumentAbsentFromResponse', expected: 'INSTRUMENT_NOT_IN_RESPONSE' },
      { label: 'invalid timestamp', scenario: 'invalidTimestampQuote', expected: 'MALFORMED_RESPONSE' },
      { label: 'invalid price', scenario: 'invalidPriceQuote', expected: 'CANONICAL_VALIDATION_FAILURE' },
      { label: 'canonical validation failure', scenario: 'crossFieldViolationQuote', expected: 'CANONICAL_VALIDATION_FAILURE' },
      { label: 'credentials unavailable', preAccess: true, expected: 'CREDENTIALS_UNAVAILABLE' },
    ];

    for (const entry of matrix) {
      let result: ProviderRouteQuoteResult;

      if (entry.preAccess) {
        const transport = new ScenarioTransport({ quote: 'validQuote' });
        const source = new DhanMarketDataSource({
          client: new DhanApiClient({ config: resolveDhanProviderConfig({}).config, transport }),
          instrumentRegistry: buildRegistry(),
          now: () => new Date(EVAL_INSTANT),
        });
        result = await new ProviderMarketDataRoute(source).getQuote('INFY');
        assert.strictEqual(transport.requests.length, 0, entry.label);
      } else {
        const registry = entry.emptyRegistry ? new DhanInstrumentRegistry() : buildRegistry();
        result = await buildRoute(entry.scenario, registry).getQuote('INFY');
      }

      assert.strictEqual(result.state, 'UNAVAILABLE', entry.label);
      assert.strictEqual(result.failureCode, entry.expected, entry.label);
      assert.strictEqual(result.marketData, undefined, entry.label);

      // No failure may become valid portfolio or UI data.
      const revaluation = revaluePortfolioHoldings({
        holdings: HOLDINGS.slice(0, 1),
        marketData: result.marketData ? [result.marketData] : [],
        evaluatedAt: EVAL_INSTANT,
      });
      assert.strictEqual(revaluation.pricedPositionCount, 0, entry.label);
      assert.strictEqual(revaluation.portfolioState, 'UNAVAILABLE', entry.label);

      const view = buildProviderRouteDataStateView(result);
      assert.strictEqual(view.state, 'UNAVAILABLE', entry.label);
      assert.strictEqual(view.displayPrice, null, entry.label);
    }
  });

  // ── TASK 8: provider leakage / contract boundary ──────────────────────────

  it('DHAN-D2-21: vendor DTOs never cross the provider boundary on the full downstream path', async () => {
    const route = buildRoute('twoInstrumentQuote');
    const results = await route.getQuotes(['INFY', 'TCS']);
    const marketData = results.map((r) => r.marketData!).filter(Boolean);

    for (const result of results) {
      assertNoVendorLeakage(JSON.stringify(result.envelope), 'canonical envelope');
      assertNoVendorLeakage(JSON.stringify(result.marketData), 'product transport DTO');
    }

    const revaluation = revaluePortfolioHoldings({
      holdings: HOLDINGS.slice(0, 2),
      marketData,
      evaluatedAt: EVAL_INSTANT,
    });
    assertNoVendorLeakage(JSON.stringify(revaluation), 'portfolio revaluation');

    const vm = UI11ProvenanceAuditorBuilder.build({
      provenance: marketData[0].provenance,
      companyId: 'INFY',
      companyName: 'Synthetic Infosys Test Entity',
      vendorTier: 'TIER_2_COMMERCIAL',
    });
    assertNoVendorLeakage(JSON.stringify(vm), 'UI view model');

    // The vendor label exists ONLY as route-level operator metadata, sourced from the
    // symbolic SPI provider id — never inside a consumer contract.
    const view = buildProviderRouteDataStateView(results[0]);
    assert.strictEqual(view.providerDisplayLabel, 'DHAN');
    const { providerRouteId, providerDisplayLabel, ...consumerFacing } = view;
    assert.ok(providerRouteId.length > 0 && providerDisplayLabel.length > 0);
    assertNoVendorLeakage(JSON.stringify(consumerFacing), 'data-state view (consumer fields)');
  });

  it('DHAN-D2-22: consumers are typed against the provider-neutral SPI and canonical contracts', async () => {
    const { source } = buildSource('validQuote');
    const spi: MarketDataSource<MarketQuotePayload> = source;
    const route = new ProviderMarketDataRoute(spi);

    const result = await route.getQuote('INFY');
    const payloadKeys = Object.keys((result.envelope as CanonicalEnvelope<MarketQuotePayload>).payload);
    assert.ok(payloadKeys.every((k) => !k.includes('_')), 'canonical payload must not carry vendor snake_case keys');

    const dtoKeys = Object.keys(result.marketData as MarketDataDTO).sort();
    assert.deepStrictEqual(
      dtoKeys,
      [
        'change', 'close', 'companyId', 'exchange', 'high', 'low', 'ltp', 'mode', 'open',
        'pctChange', 'previousClose', 'provenance', 'quality', 'symbol', 'tradeCount',
        'turnover', 'volume', 'vwap',
      ],
      'MarketDataDTO must expose exactly the existing canonical product transport key-set'
    );
  });

  // ── TASK 9: security validation ───────────────────────────────────────────

  it('DHAN-D2-23: zero credentials in sources, fixtures, evidence or emitted output', async () => {
    for (const dir of ['src/providers', 'frontend/src/features/portfolio/market-data', 'evidence/dhan-d1']) {
      const report = scanDirectoryForSecrets(path.resolve(dir), ['.ts', '.js', '.json', '.md']);
      assert.strictEqual(report.passed, true, `Secrets detected in ${dir}: ${JSON.stringify(report.violations)}`);
    }

    const fixtureText = fs.readFileSync(path.resolve('tests/fixtures/dhan_d2_fixtures.json'), 'utf-8');
    assert.deepStrictEqual(scanTextForSecrets(fixtureText, 'dhan_d2_fixtures.json'), []);
    assert.ok(fixtureText.includes('SYNTH-NSE-EQ-'), 'synthetic identifiers must remain visibly synthetic');
    assert.ok(!/"access[-_]?token"\s*:/i.test(fixtureText));

    const captured: string[] = [];
    const original = { log: console.log, error: console.error, warn: console.warn, info: console.info, debug: console.debug };
    const capture = (...args: unknown[]) => {
      captured.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    };
    console.log = capture;
    console.error = capture;
    console.warn = capture;
    console.info = capture;
    console.debug = capture;

    const emitted: string[] = [];
    try {
      const results = await buildRoute('twoInstrumentQuote').getQuotes(['INFY', 'TCS']);
      emitted.push(JSON.stringify(results));
      emitted.push(
        JSON.stringify(
          revaluePortfolioHoldings({
            holdings: HOLDINGS,
            marketData: results.map((r) => r.marketData!).filter(Boolean),
            evaluatedAt: EVAL_INSTANT,
          })
        )
      );
      emitted.push(JSON.stringify(results.map((r) => buildProviderRouteDataStateView(r))));

      const failing = await buildRoute('authenticationFailure').getQuote('INFY');
      emitted.push(JSON.stringify(failing));

      const historical = await new DhanHistoricalAdapter({
        client: buildClient(new ScenarioTransport({ historical: 'authenticationFailure' })),
        instrumentRegistry: buildRegistry(),
      }).fetchDailyCandles({ companyId: 'INFY', interval: 'DAY', fromDate: '2026-09-21', toDate: '2026-09-23' });
      emitted.push(JSON.stringify(historical));
    } finally {
      console.log = original.log;
      console.error = original.error;
      console.warn = original.warn;
      console.info = original.info;
      console.debug = original.debug;
    }

    const allOutput = [...emitted, ...captured].join('\n');
    assert.ok(!allOutput.includes(SYNTHETIC_ACCESS_VALUE), 'credential leaked into emitted output');
    assert.ok(!allOutput.includes(SYNTHETIC_CLIENT_VALUE), 'client identifier leaked into emitted output');
    assert.strictEqual(captured.length, 0, 'the integration path must not write to the console');
    assert.deepStrictEqual(scanTextForSecrets(allOutput), []);
  });
});
