/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-D1 Pre-Access Provider Foundation Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Gate: DHAN-D1 PRE-ACCESS PROVIDER FOUNDATION
 *
 * SCOPE OF PROOF:
 *  These tests exercise the Dhan provider foundation against deterministic
 *  SYNTHETIC fixtures only. They prove pre-access implementation correctness.
 *  They do NOT prove, imply or require real Dhan authentication, real Dhan
 *  connectivity or production readiness.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

import {
  // Canonical (existing) contract surface
  CanonicalEnvelope,
  MarketQuotePayload,
  MarketDataDTO,
  validateEnvelopeStructure,
  validateMarketQuotePayload,
  scanDirectoryForSecrets,
  scanTextForSecrets,
  // Provider-neutral SPI (existing)
  MarketDataSource,
  // Dhan provider foundation (DHAN-D1)
  DHAN_ENV_KEYS,
  DHAN_PROVIDER_ID,
  DhanApiClient,
  DhanCredentialMaterial,
  DhanCredentialResolver,
  DhanHttpRequest,
  DhanHttpResponse,
  DhanHttpTransport,
  DhanInstrumentMapping,
  DhanInstrumentRegistry,
  DhanMarketDataSource,
  DhanProviderError,
  DhanTransportUnavailableError,
  PreAccessNoNetworkTransport,
  describeDhanConfig,
  normalizeDhanQuoteToCanonical,
  parseDhanMarketQuoteResponse,
  parseDhanTradeTimeToUtcIso,
  resolveDhanProviderConfig,
  selectDhanQuote,
} from '../src/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Synthetic fixtures & harness
// ─────────────────────────────────────────────────────────────────────────────

const FIXTURES = JSON.parse(
  fs.readFileSync(path.resolve('tests/fixtures/dhan_d1_fixtures.json'), 'utf-8')
) as {
  evaluationInstant: string;
  syntheticInstrumentMappings: DhanInstrumentMapping[];
  scenarios: Record<string, { httpStatus?: number; body?: unknown; bodyTextOverride?: string; transportMode?: string }>;
};

const EVAL_INSTANT = FIXTURES.evaluationInstant;

/** Synthetic, non-production placeholder values. Never a real credential. */
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

class RecordingTransport implements DhanHttpTransport {
  public readonly requests: DhanHttpRequest[] = [];
  private readonly scenarioKey: string;

  constructor(scenarioKey: string) {
    this.scenarioKey = scenarioKey;
  }

  public async send(request: DhanHttpRequest): Promise<DhanHttpResponse> {
    this.requests.push(request);
    const scenario = FIXTURES.scenarios[this.scenarioKey];
    assert.ok(scenario, `Unknown synthetic scenario: ${this.scenarioKey}`);

    if (scenario.transportMode === 'NEVER_RESOLVES') {
      return new Promise<DhanHttpResponse>(() => {
        /* deliberately never settles: exercises the client timeout path */
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

function buildRegistry(mappings: DhanInstrumentMapping[] = FIXTURES.syntheticInstrumentMappings): DhanInstrumentRegistry {
  const registry = new DhanInstrumentRegistry();
  registry.registerAll(mappings);
  return registry;
}

function buildSource(
  scenarioKey: string,
  options: { registry?: DhanInstrumentRegistry; credentialResolver?: DhanCredentialResolver } = {}
): { source: DhanMarketDataSource; transport: RecordingTransport } {
  const resolution = resolveDhanProviderConfig(CONFIGURED_ENV);
  assert.strictEqual(resolution.ok, true, 'Synthetic configuration must resolve');
  const transport = new RecordingTransport(scenarioKey);
  const client = new DhanApiClient({
    config: resolution.config,
    transport,
    credentialResolver: options.credentialResolver ?? new SyntheticCredentialResolver(),
  });
  const source = new DhanMarketDataSource({
    client,
    instrumentRegistry: options.registry ?? buildRegistry(),
    now: () => new Date(EVAL_INSTANT),
  });
  return { source, transport };
}

async function expectProviderError(fn: () => Promise<unknown>): Promise<DhanProviderError> {
  try {
    await fn();
  } catch (err) {
    assert.ok(err instanceof DhanProviderError, `Expected DhanProviderError, received: ${String(err)}`);
    return err as DhanProviderError;
  }
  throw new Error('Expected the provider call to fail closed, but it resolved');
}

const CANONICAL_QUOTE_KEYS = new Set([
  'companyId',
  'symbol',
  'exchange',
  'currency',
  'bid',
  'ask',
  'ltp',
  'open',
  'high',
  'low',
  'close',
  'previousClose',
  'volume',
  'vwap',
  'turnover',
  'change',
  'pctChange',
  'tradeCount',
]);

// ─────────────────────────────────────────────────────────────────────────────

describe('DHAN-D1: Pre-Access Provider Foundation (synthetic fixtures only)', () => {
  it('DHAN-D1-01: configuration defaults to an explicit pre-access, credentials-unavailable state', () => {
    const resolution = resolveDhanProviderConfig({});
    assert.strictEqual(resolution.ok, false);
    assert.strictEqual(resolution.config.readiness, 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE');
    if (!resolution.ok) {
      assert.strictEqual(resolution.failure.code, 'CREDENTIALS_UNAVAILABLE');
    }
    assert.ok(resolution.config.missingKeys.includes(DHAN_ENV_KEYS.accessTokenSecretPath));
    assert.ok(resolution.config.missingKeys.includes(DHAN_ENV_KEYS.clientIdSecretPath));
    assert.strictEqual(resolution.config.accessTokenRef, undefined);
    assert.strictEqual(resolution.config.clientIdRef, undefined);
  });

  it('DHAN-D1-02: configuration accepts external SecretRef pointers and never holds credential values', () => {
    const resolution = resolveDhanProviderConfig(CONFIGURED_ENV);
    assert.strictEqual(resolution.ok, true);
    assert.strictEqual(resolution.config.readiness, 'CREDENTIAL_REFERENCES_CONFIGURED');
    assert.strictEqual(resolution.config.accessTokenRef?.keyPath, CONFIGURED_ENV[DHAN_ENV_KEYS.accessTokenSecretPath]);
    assert.strictEqual(resolution.config.providerId, DHAN_PROVIDER_ID);

    const described = JSON.stringify(describeDhanConfig(resolution.config));
    assert.ok(!described.includes(SYNTHETIC_ACCESS_VALUE));
    assert.ok(!described.includes(SYNTHETIC_CLIENT_VALUE));
    assert.ok(described.includes('vault://'));
    assert.strictEqual(JSON.stringify(resolution.config).includes(SYNTHETIC_ACCESS_VALUE), false);
  });

  it('DHAN-D1-03: without credentials the client fails closed and never touches the transport', async () => {
    const resolution = resolveDhanProviderConfig({});
    const transport = new RecordingTransport('validQuote');
    const client = new DhanApiClient({ config: resolution.config, transport });

    const result = await client.fetchMarketQuotes([
      { exchangeSegment: 'NSE_EQ', dhanSecurityId: 'SYNTH-NSE-EQ-0001' },
    ]);

    assert.strictEqual(result.ok, false);
    if (!result.ok) assert.strictEqual(result.failure.code, 'CREDENTIALS_UNAVAILABLE');
    assert.strictEqual(transport.requests.length, 0, 'No request may be attempted without credentials');
  });

  it('DHAN-D1-04: the default transport performs no network activity in the pre-access gate', async () => {
    const resolution = resolveDhanProviderConfig(CONFIGURED_ENV);
    const client = new DhanApiClient({
      config: resolution.config,
      transport: new PreAccessNoNetworkTransport(),
      credentialResolver: new SyntheticCredentialResolver(),
    });
    const result = await client.fetchMarketQuotes([
      { exchangeSegment: 'NSE_EQ', dhanSecurityId: 'SYNTH-NSE-EQ-0001' },
    ]);
    assert.strictEqual(result.ok, false);
    if (!result.ok) assert.strictEqual(result.failure.code, 'TRANSPORT_FAILURE');
  });

  it('DHAN-D1-05: adapter accepts the expected provider response shape and injects credential headers per request', async () => {
    const { source, transport } = buildSource('validQuote');
    await source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' });

    assert.strictEqual(transport.requests.length, 1);
    const request = transport.requests[0];
    assert.strictEqual(request.method, 'POST');
    assert.ok(request.url.endsWith('/marketfeed/quote'));
    assert.strictEqual(request.headers['access-token'], SYNTHETIC_ACCESS_VALUE);
    assert.strictEqual(request.headers['client-id'], SYNTHETIC_CLIENT_VALUE);
    assert.deepStrictEqual(JSON.parse(request.body as string), { NSE_EQ: ['SYNTH-NSE-EQ-0001'] });
  });

  it('DHAN-D1-06: valid synthetic data normalizes into the EXISTING canonical contract', async () => {
    const { source } = buildSource('validQuote');
    const envelope: CanonicalEnvelope<MarketQuotePayload> = await source.fetchSnapshot({
      companyId: 'INFY',
      domain: 'D01_QUOTES',
    });

    assert.strictEqual(validateEnvelopeStructure(envelope).isValid, true);
    assert.strictEqual(validateMarketQuotePayload(envelope.payload).isValid, true);
    assert.strictEqual(envelope.domain, 'D01_QUOTES');
    assert.strictEqual(envelope.companyId, 'INFY');
    assert.strictEqual(envelope.payload.symbol, 'INFY');
    assert.strictEqual(envelope.payload.exchange, 'NSE');
    assert.strictEqual(envelope.payload.currency, 'INR');
    assert.strictEqual(envelope.payload.ltp, 1520.35);
    assert.strictEqual(envelope.payload.previousClose, 1508);
    assert.strictEqual(envelope.payload.change, 12.35);
    assert.strictEqual(envelope.payload.pctChange, 0.82);
    assert.strictEqual(envelope.payload.bid, 1520.25);
    assert.strictEqual(envelope.payload.ask, 1520.5);
    assert.strictEqual(envelope.payload.vwap, 1518.75);
    // 25/09/2026 15:29:58 IST == 2026-09-25T09:59:58Z
    assert.strictEqual(envelope.provenance.asOf, '2026-09-25T09:59:58.000Z');
    assert.strictEqual(envelope.provenance.sourceClassification, 'CANONICAL_MARKET_DATA');
    assert.strictEqual(envelope.provenance.qualityState, 'GOOD');
    assert.strictEqual(envelope.provenance.lineageHash.length, 64);
  });

  it('DHAN-D1-07: no Dhan-specific DTO field or vendor identity leaks into the canonical envelope', async () => {
    const { source } = buildSource('validQuote');
    const envelope = await source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' });

    for (const key of Object.keys(envelope.payload)) {
      assert.ok(CANONICAL_QUOTE_KEYS.has(key), `Non-canonical key leaked into payload: ${key}`);
    }

    const serialized = JSON.stringify(envelope);
    const lowered = serialized.toLowerCase();
    for (const vendorToken of ['dhan', 'last_price', 'net_change', 'last_trade_time', 'nse_eq', 'synth-nse-eq', 'securityid']) {
      assert.ok(!lowered.includes(vendorToken), `Vendor artefact '${vendorToken}' leaked downstream`);
    }
    assert.strictEqual(envelope.provenance.vendorTier, 'TIER_2_COMMERCIAL');
  });

  it('DHAN-D1-08: canonical output is consumable by the existing downstream product transport', async () => {
    const { source } = buildSource('validQuote');
    const envelope = await source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' });

    const dto: MarketDataDTO = {
      companyId: envelope.payload.companyId,
      symbol: envelope.payload.symbol,
      exchange: envelope.payload.exchange,
      ltp: envelope.payload.ltp,
      open: envelope.payload.open,
      high: envelope.payload.high,
      low: envelope.payload.low,
      close: envelope.payload.close,
      previousClose: envelope.payload.previousClose,
      change: envelope.payload.change,
      pctChange: envelope.payload.pctChange,
      volume: envelope.payload.volume,
      vwap: envelope.payload.vwap,
      mode: 'SNAPSHOT',
      quality: envelope.provenance.qualityState,
      provenance: {
        sourceClassification: envelope.provenance.sourceClassification,
        asOf: envelope.provenance.asOf,
        evaluatedAt: envelope.provenance.evaluatedAt,
        dataVersion: envelope.provenance.dataVersion,
        lineageDigest: envelope.provenance.lineageHash,
        quality: envelope.provenance.qualityState,
        replayConstraintApplied: false,
      },
    };

    assert.strictEqual(dto.companyId, 'INFY');
    assert.ok(!JSON.stringify(dto).toLowerCase().includes('dhan'));
  });

  it('DHAN-D1-09: the adapter satisfies the provider-neutral SPI contract', async () => {
    const { source } = buildSource('validQuote');
    const spi: MarketDataSource<MarketQuotePayload> = source;
    assert.strictEqual(spi.providerId, DHAN_PROVIDER_ID);
    assert.strictEqual(spi.getSourceClassification(), 'CANONICAL_MARKET_DATA');

    // Streaming is explicitly unsupported pre-access rather than silently inert.
    assert.throws(
      () => spi.subscribeStream({ subscriptionId: 's1', companyIds: ['INFY'], domain: 'D01_QUOTES' }, () => undefined),
      (err: unknown) => err instanceof DhanProviderError && err.code === 'UNSUPPORTED_PRE_ACCESS_OPERATION'
    );
  });

  it('DHAN-D1-10: stale-but-conceded quotes are emitted with STALE quality (AD-12)', async () => {
    const { source } = buildSource('staleQuoteConcession');
    const envelope = await source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' });
    assert.strictEqual(envelope.provenance.qualityState, 'STALE');
    assert.strictEqual(validateEnvelopeStructure(envelope).isValid, true);
  });

  it('DHAN-D1-11: quotes beyond the suppression threshold fail closed and never produce market data', async () => {
    const { source } = buildSource('staleQuoteSuppressed');
    const err = await expectProviderError(() => source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' }));
    assert.strictEqual(err.code, 'STALE_DATA_SUPPRESSED');
  });

  it('DHAN-D1-12: malformed provider responses are rejected deterministically', async () => {
    const { source } = buildSource('malformedResponse');
    const err = await expectProviderError(() => source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' }));
    assert.strictEqual(err.code, 'MALFORMED_RESPONSE');

    // Direct DTO-boundary checks
    assert.strictEqual(parseDhanMarketQuoteResponse('not-an-object').ok, false);
    assert.strictEqual(parseDhanMarketQuoteResponse({ data: {} }).ok, false);
    const statusFailure = parseDhanMarketQuoteResponse({ status: 'failure', data: {} });
    assert.strictEqual(statusFailure.ok, false);
    if (!statusFailure.ok) assert.strictEqual(statusFailure.failure.code, 'PROVIDER_STATUS_FAILURE');
  });

  it('DHAN-D1-13: missing required provider fields are rejected with an explicit field path', async () => {
    const missingVolume = await expectProviderError(() =>
      buildSource('missingRequiredField').source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' })
    );
    assert.strictEqual(missingVolume.code, 'MISSING_REQUIRED_FIELD');
    assert.ok(missingVolume.failure.field?.endsWith('.volume'));

    const missingOhlc = await expectProviderError(() =>
      buildSource('missingOhlcField').source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' })
    );
    assert.strictEqual(missingOhlc.code, 'MISSING_REQUIRED_FIELD');
    assert.ok(missingOhlc.failure.field?.endsWith('ohlc.low'));
  });

  it('DHAN-D1-14: unknown/unresolved instruments never silently produce market data', async () => {
    // (a) No mapping data loaded at all (the shipped pre-access default).
    const emptyRegistry = new DhanInstrumentRegistry();
    assert.strictEqual(emptyRegistry.isEmpty(), true);
    const unloaded = emptyRegistry.resolve('INFY');
    assert.strictEqual(unloaded.status, 'UNRESOLVED');
    if (unloaded.status === 'UNRESOLVED') assert.strictEqual(unloaded.reason, 'NO_MAPPING_DATA_LOADED');

    const noMappingSource = buildSource('validQuote', { registry: emptyRegistry });
    const errA = await expectProviderError(() =>
      noMappingSource.source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' })
    );
    assert.strictEqual(errA.code, 'UNRESOLVED_INSTRUMENT');
    assert.strictEqual(noMappingSource.transport.requests.length, 0);

    // (b) Mapping data loaded but the requested company is unmapped.
    const errB = await expectProviderError(() =>
      buildSource('validQuote').source.fetchSnapshot({ companyId: 'UNKNOWN_CO', domain: 'D01_QUOTES' })
    );
    assert.strictEqual(errB.code, 'UNRESOLVED_INSTRUMENT');

    // (c) Mapped instrument absent from an otherwise valid provider response.
    const errC = await expectProviderError(() =>
      buildSource('instrumentAbsentFromResponse').source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' })
    );
    assert.strictEqual(errC.code, 'INSTRUMENT_NOT_IN_RESPONSE');
  });

  it('DHAN-D1-15: authentication, throttling, HTTP, timeout and transport failures are deterministic', async () => {
    const auth = await expectProviderError(() =>
      buildSource('authenticationFailure').source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' })
    );
    assert.strictEqual(auth.code, 'AUTHENTICATION_FAILURE');
    assert.strictEqual(auth.failure.httpStatus, 401);

    const throttled = await expectProviderError(() =>
      buildSource('rateLimited').source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' })
    );
    assert.strictEqual(throttled.code, 'RATE_LIMITED');

    const serverError = await expectProviderError(() =>
      buildSource('serverError').source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' })
    );
    assert.strictEqual(serverError.code, 'HTTP_ERROR');

    const timedOut = await expectProviderError(() =>
      buildSource('transportTimeout').source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' })
    );
    assert.strictEqual(timedOut.code, 'TIMEOUT');

    const transportFailure = await expectProviderError(() =>
      buildSource('transportFailure').source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' })
    );
    assert.strictEqual(transportFailure.code, 'TRANSPORT_FAILURE');

    const providerStatus = await expectProviderError(() =>
      buildSource('providerStatusFailure').source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' })
    );
    assert.strictEqual(providerStatus.code, 'PROVIDER_STATUS_FAILURE');
  });

  it('DHAN-D1-16: health is never reported HEALTHY while credentials are unavailable', async () => {
    const preAccessResolution = resolveDhanProviderConfig({});
    const preAccessSource = new DhanMarketDataSource({
      client: new DhanApiClient({ config: preAccessResolution.config }),
      instrumentRegistry: new DhanInstrumentRegistry(),
      now: () => new Date(EVAL_INSTANT),
    });
    assert.strictEqual((await preAccessSource.healthCheck()).status, 'DOWN');

    const { source } = buildSource('validQuote');
    assert.strictEqual((await source.healthCheck()).status, 'DEGRADED');
    await source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' });
    assert.strictEqual((await source.healthCheck()).status, 'HEALTHY');
  });

  it('DHAN-D1-17: unsupported domains are rejected rather than partially served', async () => {
    const { source } = buildSource('validQuote');
    const err = await expectProviderError(() => source.fetchSnapshot({ companyId: 'INFY', domain: 'D02_OHLCV' }));
    assert.strictEqual(err.code, 'UNSUPPORTED_DOMAIN');
  });

  it('DHAN-D1-18: vendor timestamp conversion is deterministic and fails closed', () => {
    const ok = parseDhanTradeTimeToUtcIso('25/09/2026 15:29:58');
    assert.strictEqual(ok.ok, true);
    if (ok.ok) assert.strictEqual(ok.value, '2026-09-25T09:59:58.000Z');

    for (const bad of ['', 'not-a-time', '2026-09-25T09:59:58Z', '32/09/2026 15:29:58', '25/09/2026 25:00:00']) {
      assert.strictEqual(parseDhanTradeTimeToUtcIso(bad).ok, false, `Expected rejection for '${bad}'`);
    }
  });

  it('DHAN-D1-19: normalization rejects canonically invalid vendor values (fail closed)', () => {
    const mapping = FIXTURES.syntheticInstrumentMappings[0];
    const parsed = parseDhanMarketQuoteResponse(FIXTURES.scenarios.validQuote.body);
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) return;

    const selected = selectDhanQuote(parsed.value, 'NSE_EQ', mapping.dhanSecurityId);
    assert.strictEqual(selected.ok, true);
    if (!selected.ok) return;

    const corrupted = { ...selected.value, ohlc: { ...selected.value.ohlc, high: 1, low: 9999 } };
    const result = normalizeDhanQuoteToCanonical({
      quote: corrupted,
      mapping,
      receivedAt: EVAL_INSTANT,
      evaluatedAt: EVAL_INSTANT,
    });
    assert.strictEqual(result.ok, false);
    if (!result.ok) assert.strictEqual(result.failure.code, 'CANONICAL_VALIDATION_FAILURE');

    const negativeVolume = normalizeDhanQuoteToCanonical({
      quote: { ...selected.value, volume: -5 },
      mapping,
      receivedAt: EVAL_INSTANT,
      evaluatedAt: EVAL_INSTANT,
    });
    assert.strictEqual(negativeVolume.ok, false);
  });

  it('DHAN-D1-20: no credential material is emitted in errors, envelopes, config summaries or console output', async () => {
    const captured: string[] = [];
    const original = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };
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
      const { source } = buildSource('validQuote');
      emitted.push(JSON.stringify(await source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' })));
      emitted.push(JSON.stringify(describeDhanConfig(source.getConfig())));

      for (const scenario of ['authenticationFailure', 'transportFailure', 'transportTimeout', 'malformedResponse']) {
        const err = await expectProviderError(() =>
          buildSource(scenario).source.fetchSnapshot({ companyId: 'INFY', domain: 'D01_QUOTES' })
        );
        emitted.push(err.message);
        emitted.push(JSON.stringify(err.failure));
      }
    } finally {
      console.log = original.log;
      console.error = original.error;
      console.warn = original.warn;
      console.info = original.info;
      console.debug = original.debug;
    }

    const allOutput = [...emitted, ...captured].join('\n');
    assert.ok(!allOutput.includes(SYNTHETIC_ACCESS_VALUE), 'Credential value leaked into emitted output');
    assert.ok(!allOutput.includes(SYNTHETIC_CLIENT_VALUE), 'Client identifier leaked into emitted output');
    assert.strictEqual(captured.length, 0, 'Provider foundation must not write to the console');
    assert.deepStrictEqual(scanTextForSecrets(allOutput), []);
  });

  it('DHAN-D1-21: the Dhan provider source tree and fixtures contain zero plaintext credentials', () => {
    const providerReport = scanDirectoryForSecrets(path.resolve('src/providers'));
    assert.strictEqual(
      providerReport.passed,
      true,
      `Secrets detected in src/providers: ${JSON.stringify(providerReport.violations)}`
    );
    assert.ok(providerReport.scannedFiles >= 7);

    const fixtureText = fs.readFileSync(path.resolve('tests/fixtures/dhan_d1_fixtures.json'), 'utf-8');
    assert.deepStrictEqual(scanTextForSecrets(fixtureText, 'tests/fixtures/dhan_d1_fixtures.json'), []);
    assert.ok(!/access[-_]?token"\s*:\s*"[^"]+"/i.test(fixtureText), 'Fixtures must not carry token fields');
  });
});
