/**
 * W-25 — Configurable Freshness Thresholds
 *
 * Proves, against the real resolver, the real evaluator and the real composed service:
 *   1. defaults are preserved exactly when nothing is configured;
 *   2. a valid override is applied and reported as the effective value;
 *   3. an invalid or out-of-range override is rejected per domain and falls back to default;
 *   4. boundary values are judged inclusively and one bad key never discards the others;
 *   5. effective-value resolution is single-sourced (report and classification agree);
 *   6. the diagnostics payload exposes the effective values, fail-closed on validation;
 *   7. D02 classification and the served `/v1/freshness` follow the configured threshold;
 *   8. the W-19 freshness contract and the D02 evidence rules are unchanged.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEFAULT_FRESHNESS_CONFIG, evaluateFreshness } from '../src/quality/index.js';
import type { DataDomain } from '../src/contracts/types.js';
import {
  FRESHNESS_DOMAINS,
  FRESHNESS_THRESHOLD_ENV_PREFIX,
  MIN_FRESHNESS_THRESHOLD_SECONDS,
  freshnessThresholdEnvKey,
  maxFreshnessThresholdSeconds,
  resolveFreshnessThresholds,
} from '../src/quality/freshness_thresholds.js';
import {
  D02_NOMINAL_THRESHOLD_SECONDS,
  projectHistoricalFreshness,
} from '../src/providers/dhan/dhan_historical_freshness.js';
import { freshnessStatus } from '../src/providers/dhan/dhan_freshness_status.js';
import {
  DHAN_DIAGNOSTICS_CONTRACT_VERSION,
  DhanMarketDataService,
  validateDhanDiagnosticsFreshness,
  validateDhanServiceDiagnostics,
} from '../src/providers/dhan/dhan_market_data_service.js';
import { DhanApiClient, type DhanHttpRequest, type DhanHttpResponse, type DhanHttpTransport } from '../src/providers/dhan/dhan_api_client.js';
import { resolveDhanProviderConfig } from '../src/providers/dhan/dhan_config.js';
import { DhanInstrumentRegistry } from '../src/providers/dhan/dhan_instrument_map.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import { DhanHistoricalCache } from '../src/providers/dhan/dhan_operational_controls.js';
import {
  dhanFreshnessTimestamps,
  type DhanHistoricalProvenance,
} from '../src/providers/dhan/dhan_historical_provenance.js';
import { MARKET_DATA_ROUTES, MarketDataTransportClient, createMarketDataHttpServer } from '../src/providers/dhan/dhan_market_data_http.js';
import { parseTradingCalendar } from '../src/quality/trading_calendar.js';
import { readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';

// ── Fixtures ────────────────────────────────────────────────────────────────

const TOKEN = 'W25_SYNTHETIC_TRANSPORT_TOKEN';
const CLOCK = Date.parse('2026-11-25T06:00:00.000Z');
const MAPPING = {
  companyId: 'EQ_INFY_IN',
  isin: 'INE009A01021',
  securityId: 'ISIN:INE009A01021:EQ',
  exchange: 'NSE' as const,
  symbol: 'INFY',
  exchangeSegment: 'NSE_EQ' as const,
  dhanSecurityId: '1594',
  series: 'EQ',
  mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE' as const,
  instrumentType: 'EQUITY' as const,
  active: true,
};

class NoNetworkTransport implements DhanHttpTransport {
  public calls: DhanHttpRequest[] = [];
  public async send(request: DhanHttpRequest): Promise<DhanHttpResponse> {
    this.calls.push(request);
    throw new Error('W-25 must never reach the vendor');
  }
}

function buildService(options: {
  freshnessThresholds?: Partial<Record<DataDomain, number>>;
  freshnessEnv?: Record<string, string | undefined>;
  historicalCache?: DhanHistoricalCache;
  now?: () => Date;
} = {}) {
  const transport = new NoNetworkTransport();
  const registry = new DhanInstrumentRegistry();
  registry.register(MAPPING);
  const securityMaster = new SecurityMaster();
  const client = new DhanApiClient({
    config: resolveDhanProviderConfig({}).config,
    transport,
    credentialResolver: { resolve: async () => ({ accessToken: 'SYNTHETIC_TOKEN', clientId: 'SYNTHETIC_CLIENT' }) } as never,
    now: () => CLOCK,
  });
  const service = new DhanMarketDataService({
    client,
    securityMaster,
    instrumentRegistry: registry,
    now: options.now ?? (() => new Date(CLOCK)),
    ...(options.historicalCache ? { historicalCache: options.historicalCache } : {}),
    ...(options.freshnessThresholds ? { freshnessThresholds: options.freshnessThresholds } : {}),
    ...(options.freshnessEnv ? { freshnessEnv: options.freshnessEnv } : {}),
  });
  service.start();
  return { service, transport };
}

const domains = FRESHNESS_DOMAINS;

// ── 1. Defaults preserved ───────────────────────────────────────────────────

describe('W25-1: defaults are preserved exactly when nothing is configured', () => {
  it('W25-101: an unresolved environment reproduces every compiled default', () => {
    const { thresholds, overrides } = resolveFreshnessThresholds({}, {});
    for (const domain of domains) {
      assert.equal(thresholds[domain], DEFAULT_FRESHNESS_CONFIG[domain], `${domain} must keep its default`);
    }
    assert.deepEqual(overrides, [], 'nothing was configured, so nothing is reported as an override');
  });

  it('W25-102: the compiled default table is untouched by this work item', () => {
    assert.deepEqual(DEFAULT_FRESHNESS_CONFIG, {
      D01_QUOTES: 900,
      D02_OHLCV: 86400,
      D03_FUNDAMENTALS: 105 * 24 * 60 * 60,
      D04_CORPORATE_ACTIONS: 7 * 24 * 60 * 60,
      D05_SECURITY_MASTER: 30 * 24 * 60 * 60,
      D06_NEWS: 6 * 60 * 60,
      D07_ESTIMATES: 30 * 24 * 60 * 60,
      D08_MACRO: 45 * 24 * 60 * 60,
      D09_ALTDATA: 14 * 24 * 60 * 60,
    });
    assert.equal(D02_NOMINAL_THRESHOLD_SECONDS, 86400, 'the compiled D02 reference stays 24h');
  });

  it('W25-103: an unconfigured service reports the compiled defaults and no overrides', async () => {
    const { service } = buildService();
    const diag = await service.getDiagnostics();
    assert.equal(diag.contractVersion, 2);
    for (const domain of domains) {
      assert.equal(diag.freshness.thresholds[domain], DEFAULT_FRESHNESS_CONFIG[domain]);
    }
    assert.deepEqual(diag.freshness.overrides, []);
  });

  it('W25-104: an unconfigured evaluation is byte-identical to the pre-W-25 result', () => {
    const timestamp = new Date(CLOCK - 20 * 60 * 1000).toISOString();
    const at = new Date(CLOCK).toISOString();
    for (const domain of domains) {
      const bare = evaluateFreshness(timestamp, domain, at);
      const explicit = evaluateFreshness(timestamp, domain, at, undefined, { ...DEFAULT_FRESHNESS_CONFIG });
      assert.deepEqual(explicit, bare, `${domain}: passing the default map must change nothing`);
      assert.equal(bare.nominalThresholdSeconds, DEFAULT_FRESHNESS_CONFIG[domain]);
    }
  });
});

// ── 2. Valid overrides ──────────────────────────────────────────────────────

describe('W25-2: a valid override is applied and reported', () => {
  it('W25-201: environment overrides are applied and attributed to ENVIRONMENT', () => {
    const { thresholds, overrides } = resolveFreshnessThresholds({
      IIPS_FRESHNESS_THRESHOLD_SECONDS_D01_QUOTES: '300',
      IIPS_FRESHNESS_THRESHOLD_SECONDS_D02_OHLCV: '43200',
    });
    assert.equal(thresholds.D01_QUOTES, 300);
    assert.equal(thresholds.D02_OHLCV, 43200);
    assert.deepEqual(overrides.map((o) => [o.domain, o.seconds, o.source, o.issue]), [
      ['D01_QUOTES', 300, 'ENVIRONMENT', null],
      ['D02_OHLCV', 43200, 'ENVIRONMENT', null],
    ]);
  });

  it('W25-202: option overrides win over the environment for the same domain', () => {
    const { thresholds, overrides } = resolveFreshnessThresholds(
      { IIPS_FRESHNESS_THRESHOLD_SECONDS_D01_QUOTES: '300' },
      { D01_QUOTES: 600 }
    );
    assert.equal(thresholds.D01_QUOTES, 600);
    assert.equal(overrides.length, 1);
    assert.equal(overrides[0]!.source, 'OPTION');
    assert.equal(overrides[0]!.raw, '600');
  });

  it('W25-203: surrounding whitespace is tolerated and the applied value is the number', () => {
    const { thresholds } = resolveFreshnessThresholds({ IIPS_FRESHNESS_THRESHOLD_SECONDS_D06_NEWS: ' 10800 ' });
    assert.equal(thresholds.D06_NEWS, 10800);
  });

  it('W25-204: the env key is pure concatenation of prefix and domain', () => {
    assert.equal(FRESHNESS_THRESHOLD_ENV_PREFIX, 'IIPS_FRESHNESS_THRESHOLD_SECONDS_');
    for (const domain of domains) {
      assert.equal(freshnessThresholdEnvKey(domain), `IIPS_FRESHNESS_THRESHOLD_SECONDS_${domain}`);
    }
  });
});

// ── 3. Invalid configuration ────────────────────────────────────────────────

describe('W25-3: an invalid override is rejected per domain and never applied', () => {
  const rejected: Array<[string, 'INVALID_NUMBER' | 'OUT_OF_RANGE']> = [
    ['abc', 'INVALID_NUMBER'],
    ['', 'INVALID_NUMBER'],
    ['1.5', 'INVALID_NUMBER'],
    ['1e3', 'INVALID_NUMBER'],
    ['NaN', 'INVALID_NUMBER'],
    ['Infinity', 'INVALID_NUMBER'],
    ['0x10', 'INVALID_NUMBER'],
    ['0', 'OUT_OF_RANGE'],
    ['-5', 'OUT_OF_RANGE'],
    ['604801', 'OUT_OF_RANGE'],
  ];

  it('W25-301: every malformed literal falls back to the default with an explicit reason', () => {
    for (const [raw, expectedIssue] of rejected) {
      const key = freshnessThresholdEnvKey('D01_QUOTES');
      const { thresholds, overrides } = resolveFreshnessThresholds({ [key]: raw });
      assert.equal(thresholds.D01_QUOTES, 900, `'${raw}' must not be applied`);
      assert.equal(overrides.length, 1);
      const report = overrides[0]!;
      assert.equal(report.issue, expectedIssue, `'${raw}' must report ${expectedIssue}`);
      assert.equal(report.source, 'DEFAULT', 'a rejected value is never attributed to a source');
      assert.equal(report.seconds, 900, 'the report states the value that actually applies');
      assert.equal(report.raw, raw, 'the supplied literal is echoed so the operator sees what was ignored');
    }
  });

  it('W25-302: a non-integer or non-numeric option value is rejected', () => {
    for (const value of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const { thresholds, overrides } = resolveFreshnessThresholds({}, { D01_QUOTES: value });
      assert.equal(thresholds.D01_QUOTES, 900);
      assert.equal(overrides[0]!.issue, value === 0 || value === -1 ? 'OUT_OF_RANGE' : 'INVALID_NUMBER');
    }
    // A string smuggled through a loosely-typed caller is not a number and is rejected.
    const smuggled = resolveFreshnessThresholds({}, { D01_QUOTES: '900' as never });
    assert.equal(smuggled.thresholds.D01_QUOTES, 900);
    assert.equal(smuggled.overrides[0]!.issue, 'INVALID_NUMBER');
  });

  it('W25-303: one bad key never discards the other nine decisions', () => {
    const { thresholds, overrides } = resolveFreshnessThresholds({
      IIPS_FRESHNESS_THRESHOLD_SECONDS_D01_QUOTES: 'nonsense',
      IIPS_FRESHNESS_THRESHOLD_SECONDS_D02_OHLCV: '43200',
      IIPS_FRESHNESS_THRESHOLD_SECONDS_D06_NEWS: '10800',
    });
    assert.equal(thresholds.D01_QUOTES, 900, 'the bad key falls back');
    assert.equal(thresholds.D02_OHLCV, 43200, 'the good keys still apply');
    assert.equal(thresholds.D06_NEWS, 10800);
    assert.equal(overrides.filter((o) => o.issue === null).length, 2);
    assert.equal(overrides.filter((o) => o.issue !== null).length, 1);
  });

  it('W25-304: an unknown key is ignored entirely and never becomes a domain', () => {
    const { thresholds, overrides } = resolveFreshnessThresholds({ IIPS_FRESHNESS_THRESHOLD_SECONDS_D99_FAKE: '60' });
    assert.equal(overrides.length, 0);
    assert.deepEqual(Object.keys(thresholds).sort(), [...domains].sort());
  });

  it('W25-305: a rejected override still yields a runnable service (rejection is non-fatal)', async () => {
    const { service } = buildService({ freshnessEnv: { IIPS_FRESHNESS_THRESHOLD_SECONDS_D02_OHLCV: '-1' } });
    const diag = await service.getDiagnostics();
    assert.equal(diag.service, 'UP');
    assert.equal(diag.freshness.thresholds.D02_OHLCV, 86400);
    assert.equal(diag.freshness.overrides[0]!.issue, 'OUT_OF_RANGE');
  });
});

// ── 4. Boundaries ───────────────────────────────────────────────────────────

describe('W25-4: boundaries are inclusive and the horizon is per domain class', () => {
  it('W25-401: the minimum accepted threshold is 1 second, inclusive', () => {
    assert.equal(MIN_FRESHNESS_THRESHOLD_SECONDS, 1);
    const { thresholds } = resolveFreshnessThresholds({ IIPS_FRESHNESS_THRESHOLD_SECONDS_D01_QUOTES: '1' });
    assert.equal(thresholds.D01_QUOTES, 1);
  });

  it('W25-402: the maximum is inclusive and class-dependent', () => {
    const intradayMax = maxFreshnessThresholdSeconds('D02_OHLCV');
    const calendarMax = maxFreshnessThresholdSeconds('D03_FUNDAMENTALS');
    assert.equal(intradayMax, 7 * 24 * 60 * 60);
    assert.equal(calendarMax, 365 * 24 * 60 * 60);

    // Exactly at the maximum: accepted.
    assert.equal(
      resolveFreshnessThresholds({ IIPS_FRESHNESS_THRESHOLD_SECONDS_D02_OHLCV: String(intradayMax) }).thresholds.D02_OHLCV,
      intradayMax
    );
    assert.equal(
      resolveFreshnessThresholds({ IIPS_FRESHNESS_THRESHOLD_SECONDS_D03_FUNDAMENTALS: String(calendarMax) }).thresholds.D03_FUNDAMENTALS,
      calendarMax
    );
    // One past: rejected, and the default applies.
    const past = resolveFreshnessThresholds({ IIPS_FRESHNESS_THRESHOLD_SECONDS_D02_OHLCV: String(intradayMax + 1) });
    assert.equal(past.thresholds.D02_OHLCV, 86400);
    assert.equal(past.overrides[0]!.issue, 'OUT_OF_RANGE');
  });

  it('W25-403: a calendar-class horizon is rejected for an intraday domain', () => {
    // 365 days is legal for fundamentals but not for quotes: quoting nothing for a year is
    // not a tuning decision, so the bound follows the domain class rather than one global max.
    const { thresholds, overrides } = resolveFreshnessThresholds({
      IIPS_FRESHNESS_THRESHOLD_SECONDS_D01_QUOTES: String(365 * 24 * 60 * 60),
    });
    assert.equal(thresholds.D01_QUOTES, 900);
    assert.equal(overrides[0]!.issue, 'OUT_OF_RANGE');
  });
});

// ── 5. Effective-value resolution ───────────────────────────────────────────

describe('W25-5: the effective threshold is resolved once and reported consistently', () => {
  const at = new Date(CLOCK).toISOString();
  const timestamp = new Date(CLOCK - 10 * 60 * 1000).toISOString(); // 600s old

  it('W25-501: the classification edge follows the override', () => {
    assert.equal(evaluateFreshness(timestamp, 'D01_QUOTES', at).quality, 'GOOD', '600s is inside the 900s default');

    const tight = { ...DEFAULT_FRESHNESS_CONFIG, D01_QUOTES: 300 };
    const evaluation = evaluateFreshness(timestamp, 'D01_QUOTES', at, undefined, tight);
    assert.equal(evaluation.quality, 'STALE', '600s is past a configured 300s threshold');
    assert.equal(evaluation.nominalThresholdSeconds, 300, 'the reported threshold is the effective one');
    assert.equal(evaluation.staleConcessionActive, true);
  });

  it('W25-502: both AD-12 edges move together — 2× is derived, never separately configured', () => {
    const thresholds = { ...DEFAULT_FRESHNESS_CONFIG, D01_QUOTES: 300 };
    const age = (seconds: number) => new Date(CLOCK - seconds * 1000).toISOString();

    assert.equal(evaluateFreshness(age(300), 'D01_QUOTES', at, undefined, thresholds).quality, 'GOOD');
    assert.equal(evaluateFreshness(age(301), 'D01_QUOTES', at, undefined, thresholds).quality, 'STALE');
    assert.equal(evaluateFreshness(age(600), 'D01_QUOTES', at, undefined, thresholds).quality, 'STALE');
    assert.equal(evaluateFreshness(age(601), 'D01_QUOTES', at, undefined, thresholds).quality, 'UNAVAILABLE');
    assert.equal(evaluateFreshness(age(601), 'D01_QUOTES', at, undefined, thresholds).suppressExecution, true);
  });

  it('W25-503: the invalid-timestamp path reports the SAME effective threshold as the classifying path', () => {
    // Pre-W-25 these two returns disagreed: the early return read the raw default table while
    // the classifying return read `table[domain] || 3600`. One resolution removes the split.
    const thresholds = { ...DEFAULT_FRESHNESS_CONFIG, D01_QUOTES: 300 };
    const invalid = evaluateFreshness('not-a-timestamp', 'D01_QUOTES', at, undefined, thresholds);
    const valid = evaluateFreshness(timestamp, 'D01_QUOTES', at, undefined, thresholds);
    assert.equal(invalid.quality, 'UNAVAILABLE');
    assert.equal(invalid.nominalThresholdSeconds, 300);
    assert.equal(invalid.nominalThresholdSeconds, valid.nominalThresholdSeconds);
  });

  it('W25-504: the invalid-session path reports the same effective threshold', () => {
    // An observation date the calendar does not cover: the session evaluation fails, and the
    // early return must still state the configured threshold rather than the compiled one.
    const calendar = parseTradingCalendar(JSON.parse(readFileSync('tests/fixtures/w22-calendar.json', 'utf8')));
    const thresholds = { ...DEFAULT_FRESHNESS_CONFIG, D02_OHLCV: 3600 };
    const evaluation = evaluateFreshness('2026-11-12T18:30:00.000Z', 'D02_OHLCV', at, {
      kind: 'DAILY_CLOSE',
      calendar,
      exchange: 'NSE',
      observationDate: '2026-11-12',
      completed: true,
    }, thresholds);
    assert.equal(evaluation.quality, 'UNAVAILABLE');
    assert.ok(evaluation.calendarIssue !== undefined, 'the session evidence is reported as invalid');
    assert.equal(evaluation.nominalThresholdSeconds, 3600);
  });

  it('W25-505: a hand-built map cannot make the evaluator invent a threshold', () => {
    const broken = { ...DEFAULT_FRESHNESS_CONFIG, D01_QUOTES: Number.NaN } as Record<DataDomain, number>;
    const evaluation = evaluateFreshness(timestamp, 'D01_QUOTES', at, undefined, broken);
    assert.equal(evaluation.nominalThresholdSeconds, 900, 'an unevaluable entry degrades to the compiled default');
  });

  it('W25-506: the resolver output is frozen so a later mutation cannot change behaviour', () => {
    const { thresholds } = resolveFreshnessThresholds({ IIPS_FRESHNESS_THRESHOLD_SECONDS_D01_QUOTES: '300' });
    assert.throws(() => {
      (thresholds as unknown as Record<DataDomain, number>).D01_QUOTES = 1;
    }, TypeError);
  });
});

// ── 6. Diagnostics exposure ─────────────────────────────────────────────────

describe('W25-6: diagnostics expose the effective values and validate fail-closed', () => {
  it('W25-601: the payload carries every domain plus the override dispositions', async () => {
    const { service } = buildService({
      freshnessEnv: {
        IIPS_FRESHNESS_THRESHOLD_SECONDS_D02_OHLCV: '43200',
        IIPS_FRESHNESS_THRESHOLD_SECONDS_D06_NEWS: '0',
      },
    });
    const diag = await service.getDiagnostics();

    assert.deepEqual(Object.keys(diag.freshness.thresholds).sort(), [...domains].sort());
    assert.equal(diag.freshness.thresholds.D02_OHLCV, 43200);
    assert.equal(diag.freshness.thresholds.D06_NEWS, DEFAULT_FRESHNESS_CONFIG.D06_NEWS);

    const byDomain = new Map(diag.freshness.overrides.map((o) => [o.domain, o]));
    assert.equal(byDomain.get('D02_OHLCV')!.issue, null);
    assert.equal(byDomain.get('D02_OHLCV')!.source, 'ENVIRONMENT');
    assert.equal(byDomain.get('D06_NEWS')!.issue, 'OUT_OF_RANGE');
    assert.equal(byDomain.get('D06_NEWS')!.source, 'DEFAULT');
    assert.equal(byDomain.has('D01_QUOTES'), false, 'an unmentioned domain is not a rejected override');
  });

  it('W25-602: the published values are exactly what the evaluator applies', async () => {
    const { service } = buildService({ freshnessThresholds: { D01_QUOTES: 120 } });
    const diag = await service.getDiagnostics();
    const published = diag.freshness.thresholds.D01_QUOTES;
    const evaluation = evaluateFreshness(new Date(CLOCK - 600_000).toISOString(), 'D01_QUOTES', new Date(CLOCK).toISOString(), undefined, diag.freshness.thresholds);
    assert.equal(published, 120);
    assert.equal(evaluation.nominalThresholdSeconds, published);
  });

  it('W25-603: no credential-adjacent material appears in the freshness block', async () => {
    const { service } = buildService({ freshnessEnv: { IIPS_FRESHNESS_THRESHOLD_SECONDS_D01_QUOTES: 'SYNTHETIC_TOKEN' } });
    const diag = await service.getDiagnostics();
    const serialized = JSON.stringify(diag.freshness);
    assert.ok(!serialized.includes('SYNTHETIC_TOKEN_SECRET_PATH'));
    assert.ok(!serialized.includes('vault://'));
    assert.ok(!serialized.includes('/'), 'no path-like separator may appear');
    // The rejected literal IS echoed — that is the point of `raw` — but it is a scalar only.
    assert.equal(diag.freshness.overrides[0]!.raw, 'SYNTHETIC_TOKEN');
  });

  it('W25-604: the validator rejects a version-1 payload and any partial or invented map', async () => {
    const { service } = buildService();
    const valid = await service.getDiagnostics();
    assert.notStrictEqual(validateDhanServiceDiagnostics(valid), null);
    assert.strictEqual(validateDhanServiceDiagnostics({ ...valid, contractVersion: 1 }), null);

    const bad: unknown[] = [
      undefined,
      null,
      [],
      {},
      { overrides: [] },
      { thresholds: {}, overrides: [] },
      { thresholds: { ...valid.freshness.thresholds, D01_QUOTES: 0 }, overrides: [] },
      { thresholds: { ...valid.freshness.thresholds, D01_QUOTES: 1.5 }, overrides: [] },
      { thresholds: { ...valid.freshness.thresholds, D01_QUOTES: '900' }, overrides: [] },
      { thresholds: { ...valid.freshness.thresholds, D99_FAKE: 60 }, overrides: [] },
      { thresholds: valid.freshness.thresholds, overrides: 'none' },
      { thresholds: valid.freshness.thresholds, overrides: [{ domain: 'D01_QUOTES' }] },
      {
        thresholds: valid.freshness.thresholds,
        overrides: [{ domain: 'D01_QUOTES', seconds: 900, source: 'MAGIC', raw: '900', issue: null }],
      },
      {
        // Reported value must agree with the map, or the payload describes two configurations.
        thresholds: { ...valid.freshness.thresholds, D01_QUOTES: 300 },
        overrides: [{ domain: 'D01_QUOTES', seconds: 900, source: 'ENVIRONMENT', raw: '900', issue: null }],
      },
      {
        // A rejected override must not claim a source.
        thresholds: valid.freshness.thresholds,
        overrides: [{ domain: 'D01_QUOTES', seconds: 900, source: 'ENVIRONMENT', raw: '0', issue: 'OUT_OF_RANGE' }],
      },
    ];
    for (const payload of bad) {
      assert.strictEqual(validateDhanDiagnosticsFreshness(payload), null, `must reject ${JSON.stringify(payload)}`);
    }
  });

  it('W25-605: the validator rejects a duplicate domain in overrides', async () => {
    const { service } = buildService();
    const valid = await service.getDiagnostics();
    const duplicated = {
      thresholds: valid.freshness.thresholds,
      overrides: [
        { domain: 'D01_QUOTES', seconds: 900, source: 'ENVIRONMENT', raw: '900', issue: null },
        { domain: 'D01_QUOTES', seconds: 900, source: 'OPTION', raw: '900', issue: null },
      ],
    };
    assert.strictEqual(validateDhanDiagnosticsFreshness(duplicated), null);
  });

  it('W25-606: a valid block round-trips through the validator unchanged', async () => {
    const { service } = buildService({ freshnessThresholds: { D02_OHLCV: 43200 } });
    const valid = await service.getDiagnostics();
    const validated = validateDhanDiagnosticsFreshness(valid.freshness);
    assert.notStrictEqual(validated, null);
    assert.deepEqual(validated!.thresholds, valid.freshness.thresholds);
    assert.deepEqual(validated!.overrides, [{ domain: 'D02_OHLCV', seconds: 43200, source: 'OPTION', raw: '43200', issue: null }]);
  });

  it('W25-607: the contract version is 2 and the validator agrees with it', () => {
    assert.equal(DHAN_DIAGNOSTICS_CONTRACT_VERSION, 2);
  });
});

// ── 7. D02 integration ──────────────────────────────────────────────────────

describe('W25-7: D02 classification and the served freshness response follow the threshold', () => {
  function seedHistoricalObservation(cache: DhanHistoricalCache, observedAt: string) {
    const timestamps = dhanFreshnessTimestamps({
      marketTimestamp: observedAt,
      marketTimestampDerivation: 'SOURCE_DECLARED_CANDLE_PERIOD_START',
      retrievalTimestamp: observedAt,
      cacheTimestamp: null,
    });
    const provenance: DhanHistoricalProvenance = {
      domain: 'D02_OHLCV',
      observationScope: { companyId: 'EQ_INFY_IN', exchangeSegment: 'NSE_EQ', isin: 'INE009A01021', interval: '1d' },
      retrievalTimestamp: observedAt,
      providerResponseTimestamp: null,
      timestamps,
      revision: { state: 'BASELINE', contentDigest: 'synthetic-digest', priorContentDigest: null },
      servedFromCache: false,
      isAdjusted: false,
      coverageClaim: 'ACCESS_PENDING_UNVERIFIED',
    };
    cache.set('W25-SEEDED', {
        candles: [
          {
            companyId: 'EQ_INFY_IN',
            symbol: 'INFY',
            interval: '1d',
            candleStart: observedAt,
            candleEnd: observedAt,
            open: 100,
            high: 105,
            low: 99,
            close: 104,
            volume: 1200,
            isAdjusted: false,
          },
        ],
        requestedFromDate: '2026-11-25',
        requestedToDate: '2026-11-25',
        returnedCandleCount: 1,
        coverageClaim: 'ACCESS_PENDING_UNVERIFIED',
        provenance,
      } as never,
      observedAt,
      provenance);
  }

  it('W25-701: the retained-evidence projection applies the configured threshold', () => {
    const cache = new DhanHistoricalCache(4);
    // 2 hours old: inside the 24h default, outside a configured 3600s threshold.
    const observedAt = new Date(CLOCK - 2 * 60 * 60 * 1000).toISOString();
    seedHistoricalObservation(cache, observedAt);

    const at = new Date(CLOCK).toISOString();
    const defaulted = projectHistoricalFreshness(cache.peek('W25-SEEDED'), observedAt, at, undefined, null);
    const configured = projectHistoricalFreshness(cache.peek('W25-SEEDED'), observedAt, at, undefined, null, {
      ...DEFAULT_FRESHNESS_CONFIG,
      D02_OHLCV: 3600,
    });

    assert.equal(defaulted!.verdict, 'GOOD');
    assert.equal(configured!.verdict, 'STALE', 'a 2h-old close is stale under a 3600s D02 threshold');
    assert.equal(configured!.staleConcessionActive, true);
    assert.equal(configured!.eligibleForUse, true, 'STALE is concessional, not suppressed');
  });

  it('W25-702: the served /v1/freshness reports the effective threshold, not the compiled one', () => {
    const { service } = buildService({ freshnessThresholds: { D02_OHLCV: 3600 } });
    const status = service.getFreshness({ domain: 'D02_OHLCV' });
    assert.equal(status.thresholdSeconds, 3600);
    assert.equal(status.evidenceSource, 'NO_OBSERVATION', 'no observation is still honestly unknown');
    assert.equal(status.verdict, 'UNKNOWN');
  });

  it('W25-703: an unconfigured service still reports the D02 compiled default verbatim', () => {
    const { service } = buildService();
    assert.equal(service.getFreshness({ domain: 'D02_OHLCV' }).thresholdSeconds, D02_NOMINAL_THRESHOLD_SECONDS);
  });

  it('W25-704: a real D02 fetch is retained, then classified and reported under the same threshold', async () => {
    // End to end through the real adapter: the observation is 2h old at the harness clock,
    // which is GOOD under the 24h default and STALE under a configured 3600s threshold.
    const observedAt = new Date(CLOCK - 2 * 60 * 60 * 1000).toISOString();
    const candleStartS = Date.parse(observedAt) / 1000;
    const transport = {
      calls: [] as DhanHttpRequest[],
      async send(request: DhanHttpRequest): Promise<DhanHttpResponse> {
        this.calls.push(request);
        return {
          status: 200,
          bodyText: JSON.stringify({
            open: [100],
            high: [105],
            low: [99],
            close: [104],
            volume: [1200],
            timestamp: [candleStartS],
          }),
        };
      },
    };

    function serviceWithThreshold(threshold?: number) {
      const registry = new DhanInstrumentRegistry();
      registry.register(MAPPING);
      const client = new DhanApiClient({
        config: resolveDhanProviderConfig({}).config,
        transport,
        credentialResolver: { resolve: async () => ({ accessToken: 'SYNTHETIC_TOKEN', clientId: 'SYNTHETIC_CLIENT' }) } as never,
        now: () => CLOCK,
      });
      const service = new DhanMarketDataService({
        client,
        securityMaster: new SecurityMaster(),
        instrumentRegistry: registry,
        now: () => new Date(CLOCK),
        ...(threshold !== undefined ? { freshnessThresholds: { D02_OHLCV: threshold } } : {}),
      });
      service.start();
      return service;
    }

    const request = {
      companyId: 'EQ_INFY_IN',
      exchangeSegment: 'NSE_EQ' as const,
      isin: 'INE009A01021',
      interval: '1D' as const,
      fromDate: '2026-11-25',
      toDate: '2026-11-25',
    };

    const defaulted = serviceWithThreshold();
    const defaultedFetch = await defaulted.getHistorical(request);
    assert.equal(defaultedFetch.ok, true, JSON.stringify(defaultedFetch));
    const defaultedStatus = defaulted.getFreshness({ domain: 'D02_OHLCV' });
    assert.equal(defaultedStatus.thresholdSeconds, 86400);
    assert.equal(defaultedStatus.cacheState, 'CURRENT');
    assert.equal(defaultedStatus.verdict, 'GOOD');

    const configured = serviceWithThreshold(3600);
    const configuredFetch = await configured.getHistorical(request);
    assert.equal(configuredFetch.ok, true, JSON.stringify(configuredFetch));
    const configuredStatus = configured.getFreshness({ domain: 'D02_OHLCV' });
    assert.equal(configuredStatus.thresholdSeconds, 3600, 'the report states the effective threshold');
    assert.equal(configuredStatus.cacheState, 'STALE', 'and the classification agrees with it');
    assert.equal(configuredStatus.verdict, 'STALE');
    assert.equal(configuredStatus.eligibleForUse, true, 'concession, not suppression');
  });

  it('W25-705: the D01 quote path honours a configured D01 threshold through freshnessStatus', () => {
    const thresholds = { ...DEFAULT_FRESHNESS_CONFIG, D01_QUOTES: 60 };
    const at = new Date(CLOCK).toISOString();
    const status = freshnessStatus('D01_QUOTES', null, at, { outcome: 'UNKNOWN', lastFailure: null }, undefined, thresholds);
    assert.equal(status.thresholdSeconds, 60, 'even with no evidence, the effective value is stated');
    assert.equal(status.verdict, 'UNKNOWN', 'stating a threshold is not an observation claim');
  });
});

// ── 8. W-19 and transport contracts unchanged ───────────────────────────────

describe('W25-8: existing freshness and transport contracts are unchanged', () => {
  it('W25-801: /v1/freshness over loopback serves the effective threshold end to end', async () => {
    const { service } = buildService({ freshnessThresholds: { D02_OHLCV: 43200 } });
    service.start();
    const server = createMarketDataHttpServer({ service, token: TOKEN, host: '127.0.0.1', env: {} });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as AddressInfo).port;
    try {
      const res = await fetch(`http://127.0.0.1:${port}${MARKET_DATA_ROUTES.freshness}?domain=D02_OHLCV`, {
        headers: { authorization: `Bearer ${TOKEN}` },
      });
      assert.equal(res.status, 200);
      const body = (await res.json()) as { thresholdSeconds: number; verdict: string; evidenceSource: string };
      assert.equal(body.thresholdSeconds, 43200);
      assert.equal(body.verdict, 'UNKNOWN');
      assert.equal(body.evidenceSource, 'NO_OBSERVATION');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('W25-802: the transport client reads the same value with no shape change', async () => {
    const { service } = buildService({ freshnessThresholds: { D02_OHLCV: 43200 } });
    const server = createMarketDataHttpServer({ service, token: TOKEN, host: '127.0.0.1', env: {} });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as AddressInfo).port;
    const client = new MarketDataTransportClient(`http://127.0.0.1:${port}`, TOKEN, { env: {} });
    try {
      const diag = await client.diagnostics();
      assert.equal(diag.ok, true);
      if (diag.ok) {
        assert.equal(diag.freshness.thresholds.D02_OHLCV, 43200);
        assert.equal(diag.contractVersion, 2);
        assert.equal(diag.service, 'UP');
      }
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('W25-803: configuring a threshold issues no vendor request and reads no credential', async () => {
    const { service, transport } = buildService({ freshnessEnv: { IIPS_FRESHNESS_THRESHOLD_SECONDS_D01_QUOTES: '120' } });
    await service.getDiagnostics();
    service.getFreshness({ domain: 'D02_OHLCV' });
    assert.deepEqual(transport.calls, [], 'configuration is inert: it never reaches the provider');
  });
});
