/**
 * W-26 — `MarketDataTransportClient.getFreshness` unit & integration tests (offline, synthetic).
 *
 * Verifies:
 *   W26-1: IPD exposes `getFreshness()` on `MarketDataTransportClient` and exports
 *          `validateDhanFreshnessStatus` and freshness transport types on `./dhan-server`.
 *   W26-2: Client and server (`GET /v1/freshness`) response contracts match byte-for-byte
 *          across D01 (`MISS`, `CURRENT`, `STALE`, `UNAVAILABLE`, failure preservation,
 *          W-22 session calendar) and D02 (`NO_OBSERVATION`, W-19 `HISTORICAL_CACHE`,
 *          W-22 trading calendar), for both `securityIdentity` and canonical `securityId`.
 *   W26-3: Production refusal, loopback-only host/protocol/URL guards, bearer-token
 *          preflight and server 401 checks, timeout, network failure, malformed request
 *          and fail-closed malformed response handling match every other client method.
 *   W26-6: W-19 D02 four-timestamp provenance, independent timestampStates, revision
 *          state (`BASELINE` / `UNCHANGED` / `REVISED`), `evidenceSource`, and
 *          `refreshOutcome` are preserved verbatim without fabrication.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, it } from 'node:test';

import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import {
  DhanApiClient,
  type DhanHttpRequest,
  type DhanHttpResponse,
  type DhanHttpTransport,
} from '../src/providers/dhan/dhan_api_client.js';
import { DhanInstrumentRegistry } from '../src/providers/dhan/dhan_instrument_map.js';
import {
  MarketDataTransportClient,
  MARKET_DATA_ROUTES,
  createMarketDataHttpServer,
  type FreshnessRequest,
} from '../src/providers/dhan/dhan_market_data_http.js';
import { DhanMarketDataService } from '../src/providers/dhan/dhan_market_data_service.js';
import {
  DhanBoundedCache,
  DhanHistoricalCache,
  DhanRateLimiter,
} from '../src/providers/dhan/dhan_operational_controls.js';
import {
  validateDhanFreshnessStatus,
  type FreshnessStatus,
} from '../src/providers/dhan/dhan_freshness_status.js';
import * as dhanServerPkg from '../src/providers/dhan/package.js';
import { parseTradingCalendar } from '../src/quality/trading_calendar.js';
import type { CanonicalEnvelope } from '../src/contracts/envelope.js';
import type { MarketQuotePayload } from '../src/contracts/d01_quotes.js';

const TOKEN = 'w26-synthetic-transport-token';
const CLOCK_START = Date.parse('2026-11-20T06:00:00.000Z'); // 11:30 IST (open NSE session)
const CANDLE_START_S = Date.UTC(2026, 10, 19) / 1000; // 2026-11-19T00:00:00.000Z

const ID_INFY = buildD114SecurityIdentity('INE009A01021', 'EQ')!;
const QUOTE_REQ = {
  companyId: 'EQ_INFY_IN',
  exchangeSegment: 'NSE_EQ' as const,
  securityIdentity: ID_INFY,
};
const HIST_REQ = {
  companyId: 'EQ_INFY_IN',
  exchangeSegment: 'NSE_EQ' as const,
  isin: 'INE009A01021',
  interval: '1D' as const,
  fromDate: '2026-11-19',
  toDate: '2026-11-19',
};

const SYNTHETIC_CALENDAR = parseTradingCalendar({
  schemaVersion: 1,
  id: 'w26-synthetic-nse',
  version: 'w26-nse-2026-11',
  reviewedBy: 'w26-test',
  days: [
    {
      exchange: 'NSE',
      date: '2026-11-18',
      status: 'OPEN',
      sessions: [{ opensAt: '2026-11-18T09:15:00+05:30', closesAt: '2026-11-18T15:30:00+05:30' }],
      source: 'SYNTHETIC',
    },
    {
      exchange: 'NSE',
      date: '2026-11-19',
      status: 'OPEN',
      sessions: [{ opensAt: '2026-11-19T09:15:00+05:30', closesAt: '2026-11-19T15:30:00+05:30' }],
      source: 'SYNTHETIC',
    },
    {
      exchange: 'NSE',
      date: '2026-11-20',
      status: 'OPEN',
      sessions: [{ opensAt: '2026-11-20T09:15:00+05:30', closesAt: '2026-11-20T15:30:00+05:30' }],
      source: 'SYNTHETIC',
    },
    { exchange: 'NSE', date: '2026-11-21', status: 'CLOSED', sessions: [], source: 'SYNTHETIC' },
    { exchange: 'NSE', date: '2026-11-22', status: 'CLOSED', sessions: [], source: 'SYNTHETIC' },
    {
      exchange: 'NSE',
      date: '2026-11-23',
      status: 'OPEN',
      sessions: [{ opensAt: '2026-11-23T09:15:00+05:30', closesAt: '2026-11-23T15:30:00+05:30' }],
      source: 'SYNTHETIC',
    },
  ],
});

class ScriptedProviderTransport implements DhanHttpTransport {
  public quoteCalls = 0;
  public historicalCalls = 0;
  public failQuotes = false;
  public failHistorical = false;
  public quoteTradeTime = '20/11/2026 11:29:00';
  public historicalClose = 104;

  public async send(request: DhanHttpRequest): Promise<DhanHttpResponse> {
    if (request.url.endsWith('/charts/historical')) {
      this.historicalCalls += 1;
      if (this.failHistorical) {
        return { status: 500, bodyText: 'SYNTHETIC_SECRET_VENDOR_ERROR' };
      }
      return {
        status: 200,
        bodyText: JSON.stringify({
          open: [100],
          high: [105],
          low: [99],
          close: [this.historicalClose],
          volume: [1200],
          timestamp: [CANDLE_START_S],
        }),
      };
    }

    this.quoteCalls += 1;
    if (this.failQuotes) {
      return { status: 400, bodyText: 'SYNTHETIC_SECRET_QUOTE_ERROR' };
    }
    return {
      status: 200,
      bodyText: JSON.stringify({
        status: 'success',
        data: {
          NSE_EQ: {
            '1594': {
              last_price: 1500.5,
              ohlc: { open: 1495, close: 1490, high: 1510, low: 1485 },
              volume: 10000,
              net_change: 10.5,
              last_trade_time: this.quoteTradeTime,
            },
          },
        },
      }),
    };
  }
}

async function createRig(options: { withCalendar?: boolean; historicalCacheSize?: number } = {}) {
  let nowMs = CLOCK_START;
  const provider = new ScriptedProviderTransport();
  const registry = new DhanInstrumentRegistry();
  registry.register({
    companyId: 'EQ_INFY_IN',
    isin: 'INE009A01021',
    securityId: ID_INFY.securityId,
    exchange: 'NSE',
    exchangeSegment: 'NSE_EQ',
    symbol: 'INFY',
    dhanSecurityId: '1594',
    mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE',
    instrumentType: 'EQUITY',
    active: true,
  });

  const apiClient = new DhanApiClient({
    config: {
      baseUrl: 'https://synthetic.invalid',
      timeoutMs: 1000,
      readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE',
    } as never,
    credentialResolver: {
      resolve: async () => ({ accessToken: 'SECRET_DHAN_ACCESS_TOKEN', clientId: 'SECRET_CLIENT_ID' }),
    } as never,
    transport: provider,
  });

  const quoteCache = new DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>(16);
  const historicalCache = new DhanHistoricalCache(options.historicalCacheSize ?? 16);

  const service = new DhanMarketDataService({
    client: apiClient,
    securityMaster: new SecurityMaster(),
    instrumentRegistry: registry,
    cache: quoteCache,
    historicalCache,
    limiter: new DhanRateLimiter({ maxRequests: 100, windowMs: 1000, now: () => nowMs }),
    now: () => new Date(nowMs),
    ...(options.withCalendar ? { tradingCalendar: SYNTHETIC_CALENDAR } : {}),
  });
  service.start();

  const server = createMarketDataHttpServer({ service, token: TOKEN, env: {} });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const client = new MarketDataTransportClient(baseUrl, TOKEN, { env: {} });

  return {
    service,
    provider,
    quoteCache,
    historicalCache,
    server,
    baseUrl,
    client,
    advance: (ms: number) => {
      nowMs += ms;
    },
    setNow: (ms: number) => {
      nowMs = ms;
    },
    close: async () => {
      service.stop();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

async function directFreshnessGet(baseUrl: string, query: string): Promise<FreshnessStatus> {
  const res = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.freshness}?${query}`, {
    headers: { authorization: `Bearer ${TOKEN}` },
  });
  assert.equal(res.status, 200);
  return (await res.json()) as FreshnessStatus;
}

describe('W-26 MarketDataTransportClient.getFreshness — public contract & parity', () => {
  it('W26-1: exposes getFreshness on MarketDataTransportClient and exports validator on ./dhan-server', () => {
    assert.equal(typeof MarketDataTransportClient.prototype.getFreshness, 'function');
    assert.equal(typeof dhanServerPkg.MarketDataTransportClient.prototype.getFreshness, 'function');
    assert.equal(typeof dhanServerPkg.validateDhanFreshnessStatus, 'function');
    assert.equal(dhanServerPkg.MARKET_DATA_ROUTES.freshness, '/v1/freshness');
  });

  it('W26-2: D01 client.getFreshness matches direct GET /v1/freshness and service.getFreshness across MISS, CURRENT, STALE, UNAVAILABLE, and failure preservation', async () => {
    const rig = await createRig();
    try {
      const query = new URLSearchParams({
        domain: 'D01_QUOTES',
        companyId: QUOTE_REQ.companyId,
        exchangeSegment: QUOTE_REQ.exchangeSegment,
        securityId: ID_INFY.securityId,
      }).toString();

      // 1. MISS (before any quote fetch) — read-only, zero provider calls
      const missViaIdentity = await rig.client.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQ });
      const missViaString = await rig.client.getFreshness({
        domain: 'D01_QUOTES',
        companyId: QUOTE_REQ.companyId,
        exchangeSegment: QUOTE_REQ.exchangeSegment,
        securityId: ID_INFY.securityId,
      });
      const missDirect = await directFreshnessGet(rig.baseUrl, query);
      assert.equal(missViaIdentity.ok, true);
      assert.equal(missViaString.ok, true);
      if (!missViaIdentity.ok || !missViaString.ok) return;
      assert.deepStrictEqual(missViaIdentity.status, missDirect);
      assert.deepStrictEqual(missViaString.status, missDirect);
      assert.equal(missViaIdentity.status.cacheState, 'MISS');
      assert.equal(missViaIdentity.status.verdict, 'UNKNOWN');
      assert.equal(rig.provider.quoteCalls, 0);

      // 2. CURRENT / GOOD after successful quote
      assert.equal((await rig.client.getQuote(QUOTE_REQ)).ok, true);
      const currentViaClient = await rig.client.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQ });
      const currentDirect = await directFreshnessGet(rig.baseUrl, query);
      assert.equal(currentViaClient.ok, true);
      if (!currentViaClient.ok) return;
      assert.deepStrictEqual(currentViaClient.status, currentDirect);
      assert.equal(currentViaClient.status.cacheState, 'CURRENT');
      assert.equal(currentViaClient.status.verdict, 'GOOD');
      assert.equal(currentViaClient.status.lastRefresh.outcome, 'SUCCESS');
      assert.equal(rig.provider.quoteCalls, 1);

      // 3. STALE with concession + failed refresh preserving prior observation
      rig.advance(16 * 60 * 1000);
      rig.provider.failQuotes = true;
      assert.equal((await rig.client.getQuote(QUOTE_REQ)).ok, false);
      const staleViaClient = await rig.client.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQ });
      const staleDirect = await directFreshnessGet(rig.baseUrl, query);
      assert.equal(staleViaClient.ok, true);
      if (!staleViaClient.ok) return;
      assert.deepStrictEqual(staleViaClient.status, staleDirect);
      assert.equal(staleViaClient.status.cacheState, 'STALE');
      assert.equal(staleViaClient.status.verdict, 'STALE');
      assert.equal(staleViaClient.status.staleConcessionActive, true);
      assert.equal(staleViaClient.status.lastRefresh.outcome, 'FAILURE');
      assert.deepStrictEqual(staleViaClient.status.lastRefresh.lastFailure, {
        code: 'REFRESH_FAILED',
        priorPreserved: true,
      });

      // 4. UNAVAILABLE beyond 2x threshold
      rig.advance(16 * 60 * 1000);
      const unavailViaClient = await rig.client.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQ });
      const unavailDirect = await directFreshnessGet(rig.baseUrl, query);
      assert.equal(unavailViaClient.ok, true);
      if (!unavailViaClient.ok) return;
      assert.deepStrictEqual(unavailViaClient.status, unavailDirect);
      assert.equal(unavailViaClient.status.cacheState, 'UNAVAILABLE');
      assert.equal(unavailViaClient.status.verdict, 'UNAVAILABLE');
      assert.equal(unavailViaClient.status.suppressExecution, true);
      assert.equal(unavailViaClient.status.eligibleForUse, false);

      // Read-only guarantee: none of the getFreshness calls invoked the provider
      assert.equal(rig.provider.quoteCalls, 2);
      const serialized = JSON.stringify(unavailViaClient);
      assert.ok(!serialized.includes('SECRET_DHAN_ACCESS_TOKEN'));
      assert.ok(!serialized.includes('SECRET_CLIENT_ID'));
      assert.ok(!serialized.includes(TOKEN));
    } finally {
      await rig.close();
    }
  });

  it('W26-2 & W26-6: D02 client.getFreshness preserves W-19 NO_OBSERVATION, HISTORICAL_CACHE four-timestamp evidence, and revision state identically to the server', async () => {
    const rig = await createRig({ historicalCacheSize: 1 });
    try {
      // 1. Before any historical call: honest NO_OBSERVATION
      const noObsClient = await rig.client.getFreshness({ domain: 'D02_OHLCV' });
      const noObsDirect = await directFreshnessGet(rig.baseUrl, 'domain=D02_OHLCV');
      assert.equal(noObsClient.ok, true);
      if (!noObsClient.ok) return;
      assert.deepStrictEqual(noObsClient.status, noObsDirect);
      assert.equal(noObsClient.status.domain, 'D02_OHLCV');
      assert.equal(noObsClient.status.cacheState, 'NOT_AVAILABLE');
      assert.equal(noObsClient.status.verdict, 'UNKNOWN');
      assert.equal(noObsClient.status.evidenceSource, 'NO_OBSERVATION');
      assert.equal(noObsClient.status.refreshOutcome, 'UNKNOWN');
      assert.equal(noObsClient.status.timestamps?.marketTimestamp, null);
      assert.equal(noObsClient.status.timestamps?.marketTimestampDerivation, 'NO_OBSERVATION');
      assert.deepStrictEqual(noObsClient.status.timestampStates, {
        marketTimestamp: 'NOT_AVAILABLE',
        providerResponseTimestamp: 'NOT_AVAILABLE',
        retrievalTimestamp: 'NOT_AVAILABLE',
        cacheTimestamp: 'NOT_AVAILABLE',
      });
      assert.equal(rig.provider.historicalCalls, 0);

      // 2. After W-19 historical retention: HISTORICAL_CACHE with four independent timestamps + BASELINE revision
      assert.equal((await rig.client.getHistorical(HIST_REQ)).ok, true);
      const retainedClient = await rig.client.getFreshness({ domain: 'D02_OHLCV' });
      const retainedDirect = await directFreshnessGet(rig.baseUrl, 'domain=D02_OHLCV');
      assert.equal(retainedClient.ok, true);
      if (!retainedClient.ok) return;
      assert.deepStrictEqual(retainedClient.status, retainedDirect);
      assert.equal(retainedClient.status.evidenceSource, 'HISTORICAL_CACHE');
      assert.equal(retainedClient.status.refreshOutcome, 'SUCCESS');
      assert.equal(retainedClient.status.asOf, null);
      assert.equal(retainedClient.status.timestampEvidence, 'NOT_AVAILABLE');
      assert.equal(
        retainedClient.status.timestamps?.marketTimestampDerivation,
        'SOURCE_DECLARED_CANDLE_PERIOD_START',
      );
      assert.equal(retainedClient.status.timestamps?.providerResponseTimestamp, null);
      assert.equal(retainedClient.status.timestampStates?.marketTimestamp, 'DECLARED');
      assert.equal(retainedClient.status.timestampStates?.providerResponseTimestamp, 'NOT_DECLARED');
      assert.equal(retainedClient.status.timestampStates?.retrievalTimestamp, 'DECLARED');
      assert.equal(retainedClient.status.timestampStates?.cacheTimestamp, 'DECLARED');
      assert.equal(retainedClient.status.revision?.state, 'BASELINE');
      assert.equal(retainedClient.status.revision?.priorContentDigest, null);

      // 3. Repeated identical historical call hits cache (SKIPPED_FRESH, zero extra vendor calls)
      assert.equal((await rig.client.getHistorical(HIST_REQ)).ok, true);
      assert.equal(rig.provider.historicalCalls, 1);
      const skippedClient = await rig.client.getFreshness({ domain: 'D02_OHLCV' });
      const skippedDirect = await directFreshnessGet(rig.baseUrl, 'domain=D02_OHLCV');
      assert.equal(skippedClient.ok, true);
      if (!skippedClient.ok) return;
      assert.deepStrictEqual(skippedClient.status, skippedDirect);
      assert.equal(skippedClient.status.refreshOutcome, 'SKIPPED_FRESH');

      // 4. Advance beyond 2x D02 threshold (retained entry becomes UNAVAILABLE); then evict
      //    via LRU with a distinct date range and re-fetch HIST_REQ with changed close -> REVISED.
      rig.advance(3 * 86400 * 1000);
      const staleBeforeRefetch = await rig.client.getFreshness({ domain: 'D02_OHLCV' });
      assert.equal(staleBeforeRefetch.ok, true);
      if (!staleBeforeRefetch.ok) return;
      assert.equal(staleBeforeRefetch.status.verdict, 'UNAVAILABLE');
      assert.equal(staleBeforeRefetch.status.suppressExecution, true);

      assert.equal(
        (await rig.client.getHistorical({ ...HIST_REQ, fromDate: '2026-11-18', toDate: '2026-11-19' })).ok,
        true,
      );
      rig.provider.historicalClose = 104.5;
      assert.equal((await rig.client.getHistorical(HIST_REQ)).ok, true);
      const revisedClient = await rig.client.getFreshness({ domain: 'D02_OHLCV' });
      const revisedDirect = await directFreshnessGet(rig.baseUrl, 'domain=D02_OHLCV');
      assert.equal(revisedClient.ok, true);
      if (!revisedClient.ok) return;
      assert.deepStrictEqual(revisedClient.status, revisedDirect);
      assert.equal(revisedClient.status.revision?.state, 'REVISED');
      assert.equal(
        revisedClient.status.revision?.priorContentDigest,
        retainedClient.status.revision?.contentDigest,
      );
      assert.equal(rig.provider.historicalCalls, 3);
    } finally {
      await rig.close();
    }
  });

  it('W26-2: preserves W-22 session-calendar fields for both D01 (ageBasis/sessionState/calendarVersion) and D02 (basis/completedTradingDays)', async () => {
    const rig = await createRig({ withCalendar: true });
    try {
      assert.equal((await rig.client.getQuote(QUOTE_REQ)).ok, true);
      const d01 = await rig.client.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQ });
      const d01Direct = await directFreshnessGet(
        rig.baseUrl,
        new URLSearchParams({
          domain: 'D01_QUOTES',
          companyId: QUOTE_REQ.companyId,
          exchangeSegment: QUOTE_REQ.exchangeSegment,
          securityId: ID_INFY.securityId,
        }).toString(),
      );
      assert.equal(d01.ok, true);
      if (!d01.ok) return;
      assert.deepStrictEqual(d01.status, d01Direct);
      assert.equal(d01.status.calendarMode, 'SESSION_CALENDAR_CONFIGURED');
      assert.equal(d01.status.calendarAssessment, 'COVERED');
      assert.equal(d01.status.ageBasis, 'SESSION_TIME');
      assert.equal(d01.status.sessionState, 'OPEN');
      assert.equal(d01.status.calendarVersion, 'w26-nse-2026-11');

      assert.equal((await rig.client.getHistorical(HIST_REQ)).ok, true);
      const d02 = await rig.client.getFreshness({ domain: 'D02_OHLCV' });
      const d02Direct = await directFreshnessGet(rig.baseUrl, 'domain=D02_OHLCV');
      assert.equal(d02.ok, true);
      if (!d02.ok) return;
      assert.deepStrictEqual(d02.status, d02Direct);
      assert.equal(d02.status.calendarMode, 'SESSION_CALENDAR_CONFIGURED');
      assert.equal(d02.status.calendarAssessment, 'COVERED');
      assert.equal(d02.status.basis, 'COMPLETED_TRADING_DAYS');
      assert.equal(typeof d02.status.completedTradingDays, 'number');
      assert.equal(d02.status.calendarVersion, 'w26-nse-2026-11');
    } finally {
      await rig.close();
    }
  });
});

describe('W-26 MarketDataTransportClient.getFreshness — safeguards & fail-closed validation', () => {
  it('W26-3: refuses production env, non-loopback/malformed baseUrls, and invalid tokens before issuing any fetch', async () => {
    let fetchCalls = 0;
    const trackingFetch: typeof fetch = async () => {
      fetchCalls += 1;
      throw new Error('fetch must not be called');
    };

    const prodClient = new MarketDataTransportClient('http://127.0.0.1:8791', TOKEN, {
      env: { NODE_ENV: 'production' },
      fetchImpl: trackingFetch,
    });
    const prodRes = await prodClient.getFreshness({ domain: 'D02_OHLCV' });
    assert.equal(prodRes.ok, false);
    if (!prodRes.ok) assert.equal(prodRes.failure.code, 'PRODUCTION_NOT_AUTHORIZED');

    for (const badUrl of [
      'not-a-url',
      'https://127.0.0.1:8791',
      'http://10.0.0.5:8791',
      'http://example.com:8791',
      'http://0.0.0.0:8791',
      'http://user:pass@127.0.0.1:8791',
      'http://127.0.0.1:8791?extra=1',
    ]) {
      const c = new MarketDataTransportClient(badUrl, TOKEN, {
        env: {},
        fetchImpl: trackingFetch,
      });
      const r = await c.getFreshness({ domain: 'D02_OHLCV' });
      assert.equal(r.ok, false, `expected ${badUrl} to be refused`);
      if (!r.ok) assert.equal(r.failure.code, 'TRANSPORT_FAILURE');
    }

    for (const badToken of ['', '   ', 'token with space', 'token\nnewline', 'tökën']) {
      const c = new MarketDataTransportClient('http://127.0.0.1:8791', badToken, {
        env: {},
        fetchImpl: trackingFetch,
      });
      const r = await c.getFreshness({ domain: 'D02_OHLCV' });
      assert.equal(r.ok, false, `expected token ${JSON.stringify(badToken)} to be refused`);
      if (!r.ok) assert.equal(r.failure.code, 'UNAUTHENTICATED');
    }

    assert.equal(fetchCalls, 0);
  });

  it('W26-3: rejects malformed freshness requests fail-closed before issuing any fetch', async () => {
    let fetchCalls = 0;
    const client = new MarketDataTransportClient('http://127.0.0.1:8791', TOKEN, {
      env: {},
      fetchImpl: async () => {
        fetchCalls += 1;
        throw new Error('fetch must not be called');
      },
    });

    const badRequests: unknown[] = [
      null,
      undefined,
      [],
      {},
      { domain: 'D99_UNKNOWN' },
      { domain: 'D02_OHLCV', companyId: 'EQ_INFY_IN' },
      { domain: 'D01_QUOTES' },
      { domain: 'D01_QUOTES', companyId: '   ', exchangeSegment: 'NSE_EQ', securityId: ID_INFY.securityId },
      { domain: 'D01_QUOTES', companyId: 'X'.repeat(101), exchangeSegment: 'NSE_EQ', securityId: ID_INFY.securityId },
      { domain: 'D01_QUOTES', companyId: 'EQ_INFY_IN', exchangeSegment: 'MCX', securityId: ID_INFY.securityId },
      { domain: 'D01_QUOTES', companyId: 'EQ_INFY_IN', exchangeSegment: 'NSE_EQ', securityId: 'not-d114' },
      { domain: 'D01_QUOTES', companyId: 'EQ_INFY_IN', exchangeSegment: 'NSE_EQ', securityId: ID_INFY.securityId, securityIdentity: ID_INFY },
      { domain: 'D01_QUOTES', companyId: 'EQ_INFY_IN', exchangeSegment: 'NSE_EQ', securityId: ID_INFY.securityId, extra: true },
    ];

    for (const req of badRequests) {
      const outcome = await client.getFreshness(req as FreshnessRequest);
      assert.equal(outcome.ok, false);
      if (!outcome.ok) assert.equal(outcome.failure.code, 'MALFORMED_REQUEST');
    }
    assert.equal(fetchCalls, 0);
  });

  it('W26-3: maps wrong token (401), timeout (TIMEOUT), network failure (TRANSPORT_FAILURE), and non-JSON/malformed/domain-mismatched payloads (MALFORMED_RESPONSE)', async () => {
    const rig = await createRig();
    try {
      // Wrong token -> server 401 UNAUTHENTICATED
      const wrongTokenClient = new MarketDataTransportClient(rig.baseUrl, 'wrong-token-value', {
        env: {},
      });
      const authRes = await wrongTokenClient.getFreshness({ domain: 'D02_OHLCV' });
      assert.equal(authRes.ok, false);
      if (!authRes.ok) {
        assert.equal(authRes.failure.code, 'UNAUTHENTICATED');
        assert.equal(authRes.failure.httpStatus, 401);
      }

      // Timeout -> TIMEOUT
      const timeoutClient = new MarketDataTransportClient('http://127.0.0.1:8791', TOKEN, {
        env: {},
        timeoutMs: 50,
        fetchImpl: async (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              const err = new Error('aborted');
              err.name = 'TimeoutError';
              reject(err);
            });
          }),
      });
      const timeoutRes = await timeoutClient.getFreshness({ domain: 'D02_OHLCV' });
      assert.equal(timeoutRes.ok, false);
      if (!timeoutRes.ok) assert.equal(timeoutRes.failure.code, 'TIMEOUT');

      // Network failure -> TRANSPORT_FAILURE
      const offlineClient = new MarketDataTransportClient('http://127.0.0.1:8791', TOKEN, {
        env: {},
        fetchImpl: async () => {
          throw new Error('ECONNREFUSED');
        },
      });
      const offlineRes = await offlineClient.getFreshness({ domain: 'D02_OHLCV' });
      assert.equal(offlineRes.ok, false);
      if (!offlineRes.ok) assert.equal(offlineRes.failure.code, 'TRANSPORT_FAILURE');

      // Malformed / non-JSON / domain-mismatched server responses -> MALFORMED_RESPONSE
      let nextBody = 'not-json';
      const stub = createServer((_req, res) => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(nextBody);
      });
      await new Promise<void>((resolve) => stub.listen(0, '127.0.0.1', resolve));
      const stubUrl = `http://127.0.0.1:${(stub.address() as AddressInfo).port}`;
      const stubClient = new MarketDataTransportClient(stubUrl, TOKEN, { env: {} });
      try {
        const nonJson = await stubClient.getFreshness({ domain: 'D02_OHLCV' });
        assert.equal(nonJson.ok, false);
        if (!nonJson.ok) assert.equal(nonJson.failure.code, 'MALFORMED_RESPONSE');

        // Valid D01 payload returned when D02 was requested -> fail closed on domain mismatch
        const d01Valid = rig.service.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQ });
        nextBody = JSON.stringify(d01Valid);
        const mismatch = await stubClient.getFreshness({ domain: 'D02_OHLCV' });
        assert.equal(mismatch.ok, false);
        if (!mismatch.ok) assert.equal(mismatch.failure.code, 'MALFORMED_RESPONSE');

        // Missing calendarMode -> fail closed
        const missingCalendar: Record<string, unknown> = { ...d01Valid };
        delete missingCalendar.calendarMode;
        nextBody = JSON.stringify(missingCalendar);
        const truncated = await stubClient.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQ });
        assert.equal(truncated.ok, false);
        if (!truncated.ok) assert.equal(truncated.failure.code, 'MALFORMED_RESPONSE');

        // Tampered W-19 evidenceSource -> fail closed
        const d02Valid = rig.service.getFreshness({ domain: 'D02_OHLCV' });
        nextBody = JSON.stringify({ ...d02Valid, evidenceSource: 'FABRICATED' });
        const tampered = await stubClient.getFreshness({ domain: 'D02_OHLCV' });
        assert.equal(tampered.ok, false);
        if (!tampered.ok) assert.equal(tampered.failure.code, 'MALFORMED_RESPONSE');
      } finally {
        await new Promise<void>((resolve) => stub.close(() => resolve()));
      }
    } finally {
      await rig.close();
    }
  });

  it('W26-2: validateDhanFreshnessStatus rejects malformed optional W-19 and W-22 fields fail-closed', () => {
    const validBase: FreshnessStatus = {
      calendarMode: 'LEGACY_ELAPSED_UNQUALIFIED',
      calendarAssessment: 'NOT_CONFIGURED',
      domain: 'D02_OHLCV',
      cacheState: 'NOT_AVAILABLE',
      asOf: null,
      timestampEvidence: 'NOT_AVAILABLE',
      receivedAt: null,
      evaluatedAt: '2026-11-20T06:00:00.000Z',
      observationEvaluatedAt: null,
      thresholdSeconds: 86400,
      ageSeconds: null,
      verdict: 'UNKNOWN',
      staleConcessionActive: false,
      suppressExecution: true,
      eligibleForUse: false,
      lastRefresh: { outcome: 'UNKNOWN', lastFailure: null },
    };

    assert.deepStrictEqual(validateDhanFreshnessStatus(validBase), validBase);
    assert.equal(validateDhanFreshnessStatus({ ...validBase, thresholdSeconds: 0 }), null);
    assert.equal(validateDhanFreshnessStatus({ ...validBase, ageSeconds: -1 }), null);
    assert.equal(validateDhanFreshnessStatus({ ...validBase, verdict: 'LIVE' }), null);
    assert.equal(
      validateDhanFreshnessStatus({
        ...validBase,
        lastRefresh: { outcome: 'FAILURE', lastFailure: { code: 'OTHER', priorPreserved: true } },
      }),
      null,
    );
    assert.equal(validateDhanFreshnessStatus({ ...validBase, completedTradingDays: -1 }), null);
    assert.equal(validateDhanFreshnessStatus({ ...validBase, completedTradingDays: 1.5 }), null);
    assert.equal(validateDhanFreshnessStatus({ ...validBase, revision: { state: 'REVISED', contentDigest: '', priorContentDigest: null } }), null);
    assert.equal(
      validateDhanFreshnessStatus({
        ...validBase,
        timestamps: {
          marketTimestamp: null,
          marketTimestampDerivation: 'INVALID',
          providerResponseTimestamp: null,
          retrievalTimestamp: null,
          cacheTimestamp: null,
          evidence: {
            marketTimestamp: 'NOT_AVAILABLE',
            providerResponseTimestamp: 'NOT_AVAILABLE',
            retrievalTimestamp: 'NOT_AVAILABLE',
            cacheTimestamp: 'NOT_AVAILABLE',
          },
        },
      }),
      null,
    );
  });
});
