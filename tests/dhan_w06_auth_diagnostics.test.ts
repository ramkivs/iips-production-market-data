/**
 * W-06 correction A — authentication failure observability.
 *
 * Record: docs/integration/DHAN-W06-AUTHENTICATION-DIAGNOSTICS-AND-EXPIRY-CORRECTIONS-2026-11-13.md
 *
 * WHAT THIS PINS
 * The daemon reports 502 for every non-rate-limited provider failure, so before this correction a
 * vendor 401 and a vendor 403 were indistinguishable in the operator's evidence. The correction adds
 * one numeric field — `error.vendorHttpStatus` — and nothing else.
 *
 * Two properties matter and are tested separately:
 *   1. the status is *observable* where a vendor response produced the failure;
 *   2. it is *confined* — not the daemon's status, not free text, not a vendor body, not behind an
 *      unauthenticated route, and not attached to failures that never saw a vendor response.
 *
 * All vendor interactions here are mocked. No test in this file can reach the network: the services
 * are stubs and the only real I/O is loopback HTTP against a server this process started.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { AddressInfo } from 'node:net';
import {
  createMarketDataHttpServer,
  MarketDataTransportClient,
  MARKET_DATA_ROUTES,
} from '../src/providers/dhan/dhan_market_data_http.js';
import type { DhanMarketDataService } from '../src/providers/dhan/dhan_market_data_service.js';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';

/** Canonical P04 identity for the synthetic INFY fixture. */
const IDENTITY = buildD114SecurityIdentity('INE009A01021', 'EQ')!;

const TRANSPORT_TOKEN = 'local-transport-token-w06a';
const DAILY_SCOPE = {
  domain: 'D01_QUOTES' as const,
  companyId: 'COMP_INFY',
  exchangeSegment: 'NSE_EQ' as const,
  securityId: 'ISIN:INE009A01021:EQ',
};

/** A service whose quote call fails with a caller-supplied provider failure. */
function failingService(failure: {
  code: string;
  message: string;
  httpStatus?: number;
}): DhanMarketDataService {
  return {
    getQuote: async () => ({ ok: false as const, failure }),
    health: async () => ({
      service: 'UP' as const,
      providerConfiguration: 'CONFIGURED' as const,
      liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS' as const,
      providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED' as const,
    }),
  } as unknown as DhanMarketDataService;
}

async function withServer<T>(
  service: DhanMarketDataService,
  body: (base: string) => Promise<T>
): Promise<T> {
  const server = createMarketDataHttpServer({
    service,
    token: TRANSPORT_TOKEN,
    host: '127.0.0.1',
    env: {},
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as AddressInfo).port;
  try {
    return await body(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function postQuote(base: string, token: string) {
  const response = await fetch(`${base}${MARKET_DATA_ROUTES.quotes}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({
      companyId: 'COMP_INFY',
      securityId: 'ISIN:INE009A01021:EQ',
      exchangeSegment: 'NSE_EQ',
    }),
  });
  const body = (await response.json()) as { error?: Record<string, unknown> };
  return { status: response.status, body };
}

describe('W-06/A — authentication failure observability', () => {
  it('W06A-01: a vendor 401 stays AUTHENTICATION_FAILURE and the vendor status is observable', async () => {
    const service = failingService({
      code: 'AUTHENTICATION_FAILURE',
      message: 'Dhan rejected the request credentials',
      httpStatus: 401,
    });
    await withServer(service, async (base) => {
      const { status, body } = await postQuote(base, TRANSPORT_TOKEN);
      // Classification is unchanged.
      assert.strictEqual(body.error?.code, 'AUTHENTICATION_FAILURE');
      assert.strictEqual(body.error?.message, 'Dhan rejected the request credentials');
      // The new diagnostic.
      assert.strictEqual(body.error?.vendorHttpStatus, 401);
      // The daemon's own status is unchanged.
      assert.strictEqual(status, 502);
    });
  });

  it('W06A-02: a vendor 403 stays AUTHENTICATION_FAILURE and is distinguishable from 401', async () => {
    const forbidden = failingService({
      code: 'AUTHENTICATION_FAILURE',
      message: 'Dhan rejected the request credentials',
      httpStatus: 403,
    });
    const unauthorized = failingService({
      code: 'AUTHENTICATION_FAILURE',
      message: 'Dhan rejected the request credentials',
      httpStatus: 401,
    });

    const a = await withServer(forbidden, (base) => postQuote(base, TRANSPORT_TOKEN));
    const b = await withServer(unauthorized, (base) => postQuote(base, TRANSPORT_TOKEN));

    assert.strictEqual(a.body.error?.code, b.body.error?.code, 'the classification is identical');
    assert.strictEqual(a.body.error?.message, b.body.error?.message, 'the message is identical');
    // …and this is the whole point of the correction: the outcomes are now distinguishable.
    assert.strictEqual(a.body.error?.vendorHttpStatus, 403);
    assert.strictEqual(b.body.error?.vendorHttpStatus, 401);
    assert.notStrictEqual(
      a.body.error?.vendorHttpStatus,
      b.body.error?.vendorHttpStatus,
      'a vendor 401 and a vendor 403 must be distinguishable'
    );
  });

  it('W06A-03: the daemon HTTP status is unchanged for every provider code', async () => {
    const cases: ReadonlyArray<{ code: string; vendor?: number; expected: number }> = [
      { code: 'AUTHENTICATION_FAILURE', vendor: 401, expected: 502 },
      { code: 'AUTHENTICATION_FAILURE', vendor: 403, expected: 502 },
      { code: 'HTTP_ERROR', vendor: 500, expected: 502 },
      { code: 'TIMEOUT', vendor: 504, expected: 502 },
      { code: 'TRANSPORT_FAILURE', expected: 502 },
      // RATE_LIMITED keeps its dedicated 429: the caller can still tell throttling from failure.
      { code: 'RATE_LIMITED', vendor: 429, expected: 429 },
    ];
    for (const testCase of cases) {
      const service = failingService({
        code: testCase.code,
        message: `${testCase.code} failure`,
        ...(testCase.vendor !== undefined ? { httpStatus: testCase.vendor } : {}),
      });
      const { status } = await withServer(service, (base) => postQuote(base, TRANSPORT_TOKEN));
      assert.strictEqual(status, testCase.expected, `${testCase.code} must still answer ${testCase.expected}`);
    }
  });

  it('W06A-04: non-authentication failures keep their classification', async () => {
    // A vendor 500 must never be laundered into an authentication failure.
    const service = failingService({ code: 'HTTP_ERROR', message: 'Dhan returned a non-success HTTP status (500)', httpStatus: 500 });
    const { body } = await withServer(service, (base) => postQuote(base, TRANSPORT_TOKEN));
    assert.strictEqual(body.error?.code, 'HTTP_ERROR');
    assert.strictEqual(body.error?.vendorHttpStatus, 500);

    // A 429 stays RATE_LIMITED.
    const limited = failingService({ code: 'RATE_LIMITED', message: 'Dhan rate limit exceeded', httpStatus: 429 });
    const out = await withServer(limited, (base) => postQuote(base, TRANSPORT_TOKEN));
    assert.strictEqual(out.body.error?.code, 'RATE_LIMITED');
    assert.strictEqual(out.body.error?.vendorHttpStatus, 429);
  });

  it('W06A-05: no vendor status is fabricated for failures that never reached the vendor', async () => {
    // Credential-resolution and configuration failures happen before any send; attaching an HTTP
    // status to them would invent evidence of a request that was never made.
    for (const code of ['CREDENTIALS_UNAVAILABLE', 'CREDENTIALS_EXPIRED', 'CONFIGURATION_INCOMPLETE']) {
      // Note the deliberately bogus httpStatus on the failure object: even if a caller passes one,
      // the boundary must not emit it for a non-vendor code.
      const service = failingService({ code, message: `${code} failure`, httpStatus: 401 });
      const { body } = await withServer(service, (base) => postQuote(base, TRANSPORT_TOKEN));
      assert.strictEqual(body.error?.code, code);
      assert.strictEqual(
        body.error?.vendorHttpStatus,
        undefined,
        `${code} did not produce a vendor response and must carry no vendor status`
      );
      assert.ok(!JSON.stringify(body).includes('vendorHttpStatus'));
    }
  });

  it('W06A-06: the vendor response body is never exposed, only the integer', async () => {
    // A vendor auth error body is exactly the payload that must not be reflected.
    const vendorBody = '{"errorCode":"DH-901","errorMessage":"Invalid Token","accessToken":"leaked-abc123"}';
    const service = failingService({
      code: 'AUTHENTICATION_FAILURE',
      message: 'Dhan rejected the request credentials',
      httpStatus: 401,
    });
    const { body } = await withServer(service, (base) => postQuote(base, TRANSPORT_TOKEN));
    const serialized = JSON.stringify(body);
    for (const forbidden of ['DH-901', 'Invalid Token', 'leaked-abc123', 'accessToken']) {
      assert.ok(!serialized.includes(forbidden), `the vendor body must not be reflected (${forbidden})`);
    }
    assert.ok(!serialized.includes(vendorBody), 'the raw vendor body must never appear');
  });

  it('W06A-07: credentials and authorization headers are never exposed', async () => {
    const service = failingService({
      code: 'AUTHENTICATION_FAILURE',
      message: 'Dhan rejected the request credentials',
      httpStatus: 401,
    });
    const { body } = await withServer(service, (base) => postQuote(base, TRANSPORT_TOKEN));
    const serialized = JSON.stringify(body);
    assert.ok(!serialized.includes(TRANSPORT_TOKEN), 'the local transport token must not be echoed');
    assert.ok(!/authorization/i.test(serialized), 'no authorization header may appear');
    assert.ok(!/client-id|access-token/i.test(serialized), 'no Dhan header names or values may appear');
    assert.ok(!/vault:\/\//.test(serialized), 'no secret reference may appear');
  });

  it('W06A-08: unauthenticated callers cannot read the diagnostic', async () => {
    const service = failingService({
      code: 'AUTHENTICATION_FAILURE',
      message: 'Dhan rejected the request credentials',
      httpStatus: 401,
    });
    await withServer(service, async (base) => {
      // No credentials at all.
      const anonymous = await fetch(`${base}${MARKET_DATA_ROUTES.quotes}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          companyId: 'COMP_INFY',
          securityId: 'ISIN:INE009A01021:EQ',
          exchangeSegment: 'NSE_EQ',
        }),
      });
      assert.strictEqual(anonymous.status, 401);
      const anonBody = (await anonymous.json()) as { error?: Record<string, unknown> };
      assert.strictEqual(anonBody.error?.code, 'UNAUTHENTICATED');
      assert.strictEqual(anonBody.error?.vendorHttpStatus, undefined, 'no diagnostic before authentication');
      assert.ok(!JSON.stringify(anonBody).includes('401,'), 'the vendor status must not appear');

      // Wrong credential.
      const wrong = await postQuote(base, 'wrong-token');
      assert.strictEqual(wrong.status, 401);
      assert.strictEqual(wrong.body.error?.code, 'UNAUTHENTICATED');
      assert.strictEqual(wrong.body.error?.vendorHttpStatus, undefined);

      // The same request with the right credential does see it — proving the gate, not the service,
      // is what withheld it above.
      const authorised = await postQuote(base, TRANSPORT_TOKEN);
      assert.strictEqual(authorised.body.error?.vendorHttpStatus, 401);
    });
  });

  it('W06A-09: a malformed status from the provider is dropped, not coerced', async () => {
    for (const bogus of [0, -1, 401.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const service = failingService({
        code: 'AUTHENTICATION_FAILURE',
        message: 'Dhan rejected the request credentials',
        httpStatus: bogus,
      });
      const { body } = await withServer(service, (base) => postQuote(base, TRANSPORT_TOKEN));
      assert.strictEqual(
        body.error?.vendorHttpStatus,
        undefined,
        `a non-positive-integer status (${String(bogus)}) must not be emitted`
      );
    }
  });

  it('W06A-10: freshness redaction is unchanged — no status reaches /v1/freshness', async () => {
    // D-7 redaction is deliberate and stays: the freshness projection is a consumer-facing quality
    // view, so it must not start carrying provider diagnostics.
    const service = {
      getQuote: async () => ({
        ok: false as const,
        failure: { code: 'AUTHENTICATION_FAILURE', message: 'Dhan rejected the request credentials', httpStatus: 401 },
      }),
      getFreshness: () => ({
        domain: 'D01_QUOTES' as const,
        cacheState: 'UNAVAILABLE' as const,
        asOf: null,
        timestampEvidence: 'NOT_AVAILABLE' as const,
        receivedAt: null,
        evaluatedAt: '2026-11-12T19:42:05.174Z',
        observationEvaluatedAt: null,
        thresholdSeconds: 60,
        ageSeconds: null,
        verdict: 'UNAVAILABLE' as const,
        staleConcessionActive: false,
        suppressExecution: true,
        eligibleForUse: false,
        lastRefresh: { outcome: 'FAILURE' as const, lastFailure: { code: 'REFRESH_FAILED' as const, priorPreserved: false } },
      }),
      health: async () => ({
        service: 'UP' as const,
        providerConfiguration: 'CONFIGURED' as const,
        liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS' as const,
        providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED' as const,
      }),
    } as unknown as DhanMarketDataService;

    await withServer(service, async (base) => {
      const query = new URLSearchParams({
        domain: 'D01_QUOTES',
        companyId: DAILY_SCOPE.companyId,
        exchangeSegment: DAILY_SCOPE.exchangeSegment,
        securityId: DAILY_SCOPE.securityId,
      });
      const response = await fetch(`${base}${MARKET_DATA_ROUTES.freshness}?${query.toString()}`, {
        headers: { authorization: `Bearer ${TRANSPORT_TOKEN}` },
      });
      assert.strictEqual(response.status, 200);
      const payload = (await response.json()) as Record<string, unknown>;
      const serialized = JSON.stringify(payload);

      // The redaction contract holds exactly.
      assert.deepStrictEqual(
        (payload.lastRefresh as { lastFailure: unknown }).lastFailure,
        { code: 'REFRESH_FAILED', priorPreserved: false }
      );
      // No provider detail of any kind reaches the quality projection.
      assert.ok(!serialized.includes('AUTHENTICATION_FAILURE'), 'the provider code must stay redacted');
      assert.ok(!serialized.includes('Dhan rejected'), 'the provider message must stay redacted');
      assert.strictEqual(payload.vendorHttpStatus, undefined, 'freshness must carry no vendor status');
      assert.ok(!serialized.includes('vendorHttpStatus'), 'no diagnostic field may appear in freshness');
    });
  });

  it('W06A-11: the transport client reads the diagnostic without confusing it with the daemon status', async () => {
    const service = failingService({
      code: 'AUTHENTICATION_FAILURE',
      message: 'Dhan rejected the request credentials',
      httpStatus: 403,
    });
    await withServer(service, async (base) => {
      const client = new MarketDataTransportClient(base, TRANSPORT_TOKEN, { env: {} });
      const outcome = await client.getQuote({
        companyId: 'COMP_INFY',
        securityIdentity: IDENTITY,
      });
      assert.strictEqual(outcome.ok, false);
      if (!outcome.ok) {
        // Two distinct facts, two distinct fields.
        assert.strictEqual(outcome.failure.httpStatus, 502, 'httpStatus is the daemon status');
        assert.strictEqual(outcome.failure.vendorHttpStatus, 403, 'vendorHttpStatus is the vendor status');
        assert.strictEqual(outcome.failure.code, 'AUTHENTICATION_FAILURE');
      }
    });
  });

  it('W06A-12: a non-integer diagnostic from an untrusted response body is discarded by the client', async () => {
    // The daemon is the only writer here, but the client parses a body it does not control, so it
    // must validate rather than trust.
    for (const bogus of ['401', 401.5, -401, null, { status: 401 }]) {
      const service = {
        getQuote: async () => ({ ok: true as const, envelope: {}, freshness: 'CURRENT' as const }),
        health: async () => ({ service: 'UP' as const }),
      } as unknown as DhanMarketDataService;
      const server = createMarketDataHttpServer({ service, token: TRANSPORT_TOKEN, host: '127.0.0.1', env: {} });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
      const port = (server.address() as AddressInfo).port;
      try {
        // A hand-written body, bypassing the daemon's own writer.
        const client = new MarketDataTransportClient(`http://127.0.0.1:${port}`, TRANSPORT_TOKEN, {
          fetchImpl: (async () =>
            new Response(
              JSON.stringify({ error: { code: 'AUTHENTICATION_FAILURE', message: 'x', vendorHttpStatus: bogus } }),
              { status: 502, headers: { 'content-type': 'application/json' } }
            )) as typeof fetch,
          env: {},
        });
        const outcome = await client.getQuote({
          companyId: 'COMP_INFY',
          securityIdentity: IDENTITY,
        });
        assert.strictEqual(outcome.ok, false);
        if (!outcome.ok) {
          assert.strictEqual(
            outcome.failure.vendorHttpStatus,
            undefined,
            `a non-integer diagnostic (${JSON.stringify(bogus)}) must be discarded`
          );
        }
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    }
  });
});
