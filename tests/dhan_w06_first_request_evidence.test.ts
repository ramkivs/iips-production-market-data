/**
 * W-06 — first authorised authenticated request: what the recorded evidence can and cannot prove.
 *
 * Roadmap: docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md (v1.1), W-06
 * Record:  docs/integration/DHAN-W06-FIRST-AUTHENTICATED-REQUEST-EVIDENCE-2026-11-12.md
 *
 * WHY THIS SUITE EXISTS
 * The first authorised vendor request returned HTTP 502 from the local daemon and its body was lost;
 * a 502 on its own is neither "Dhan rejected us" nor "Dhan answered". The second, captured attempt
 * (record §12) returned 502 with `AUTHENTICATION_FAILURE`, and that code has a single producer which
 * runs only on a received 401/403 — so the vendor answered, and it rejected the credential. The suite
 * pins both halves: what the artefacts say, and what the code can and cannot make them mean. No
 * vendor call of any kind is made here:
 *
 *   1. the daemon's error body is `{error:{code,message}}` only — a vendor numeric status has no
 *      channel to reach a caller, so it can never be recovered after the fact;
 *   2. `/v1/health` reports a literal `NOT_CHECKED_PRE_ACCESS` and opens no socket, so it can never
 *      testify about connectivity;
 *   3. `/v1/freshness` is a local, in-memory read that distinguishes "provider path entered and
 *      failed" from "refused before the provider path" — and redacts the provider code by design;
 *   4. the governed registry really does resolve the identity the operator used, which is what
 *      excludes `UNRESOLVED_INSTRUMENT` from the set of explanations for the 502;
 *   5. the request path writes nothing to stdout/stderr, so no log can be mined for the outcome.
 *
 * It touches no network, no credential and no real Dhan endpoint: the only "vendor" here is a stub
 * transport that never leaves the process.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import type { AddressInfo } from 'node:net';

import {
  DhanApiClient,
  type DhanHttpRequest,
  type DhanHttpResponse,
  type DhanHttpTransport,
} from '../src/providers/dhan/dhan_api_client.js';
import {
  DHAN_DEFAULT_BASE_URL,
  type DhanCredentialMaterial,
  type DhanCredentialResolver,
  type DhanProviderConfig,
} from '../src/providers/dhan/dhan_config.js';
import {
  createMarketDataHttpServer,
  MARKET_DATA_ROUTES,
} from '../src/providers/dhan/dhan_market_data_http.js';
import {
  DhanMarketDataService,
  type QuoteRequest,
} from '../src/providers/dhan/dhan_market_data_service.js';
import { DhanIdentityApiService } from '../src/providers/dhan/dhan_identity_api.js';
import {
  DhanRateLimiter,
  isTransientFailure,
} from '../src/providers/dhan/dhan_operational_controls.js';
import { loadGovernedP7InstrumentRegistry } from '../src/providers/dhan/dhan_local_daemon.js';
import { getGovernedBroadSecurityMaster } from '../src/identity/governed_fixture_master.js';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';

const RECORD = 'docs/integration/DHAN-W06-FIRST-AUTHENTICATED-REQUEST-EVIDENCE-2026-11-12.md';
const TRANSPORT_TOKEN = 'W06-SYNTHETIC-TRANSPORT-TOKEN';

/** The exact identity the operator selected from the governed registry. */
const OPERATOR_COMPANY = 'EQ_RELIANCE_IN';
const OPERATOR_SECURITY_ID = 'ISIN:INE002A01018:EQ';
function operatorCanonicalIdentity() {
  const identity = buildD114SecurityIdentity('INE002A01018', 'EQ');
  assert.ok(identity, 'the operator-supplied identity must be canonical');
  return identity;
}
const operatorIdentity = operatorCanonicalIdentity();

function repoText(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

function configuredProviderConfig(): DhanProviderConfig {
  return {
    providerId: 'dhan',
    baseUrl: DHAN_DEFAULT_BASE_URL,
    timeoutMs: 1000,
    readiness: 'CREDENTIAL_REFERENCES_CONFIGURED',
    missingKeys: [],
  };
}

/** Synthetic credential material: the stub transport never leaves the process. */
const syntheticCredentials = {
  resolve: async (): Promise<DhanCredentialMaterial> => ({
    clientId: 'W06-SYNTHETIC-CLIENT-ID',
    accessToken: 'W06-SYNTHETIC-ACCESS-TOKEN',
    expiresAt: '2099-01-01T00:00:00.000Z',
  }),
};

interface CountingTransport extends DhanHttpTransport {
  readonly calls: readonly DhanHttpRequest[];
}

function countingTransport(respond: (request: DhanHttpRequest) => DhanHttpResponse): CountingTransport {
  const calls: DhanHttpRequest[] = [];
  return {
    calls,
    send: async (request: DhanHttpRequest): Promise<DhanHttpResponse> => {
      calls.push(request);
      return respond(request);
    },
  };
}

function governedService(
  transport: DhanHttpTransport,
  options: {
    readonly now?: () => Date;
    readonly resolver?: DhanCredentialResolver;
    readonly limiter?: DhanRateLimiter;
  } = {}
): DhanMarketDataService {
  const service = new DhanMarketDataService({
    client: new DhanApiClient({
      config: configuredProviderConfig(),
      transport,
      credentialResolver: options.resolver ?? syntheticCredentials,
    }),
    securityMaster: getGovernedBroadSecurityMaster(),
    instrumentRegistry: loadGovernedP7InstrumentRegistry(),
    ...(options.now ? { now: options.now } : {}),
    ...(options.limiter ? { limiter: options.limiter } : {}),
  });
  service.start();
  return service;
}

const operatorQuoteRequest: QuoteRequest = {
  companyId: OPERATOR_COMPANY,
  securityIdentity: operatorIdentity,
  exchangeSegment: 'NSE_EQ',
};

describe('W-06 — first authenticated request evidence', () => {
  it('W06-01: a provider failure reaches the caller as a code and a message only — never a vendor status', async () => {
    // The service layer carries the provider's numeric status on the failure object… (the stub says 503)
    const stubService = {
      getQuote: async () => ({
        ok: false as const,
        failure: {
          code: 'TRANSPORT_FAILURE' as const,
          message: 'Dhan HTTPS vendor request failed closed',
          httpStatus: 503,
        },
      }),
      health: async () => ({
        service: 'UP' as const,
        providerConfiguration: 'CONFIGURED' as const,
        liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS' as const,
        providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED' as const,
      }),
    } as unknown as DhanMarketDataService;

    const server = createMarketDataHttpServer({
      service: stubService,
      token: TRANSPORT_TOKEN,
      host: '127.0.0.1',
      env: {},
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as AddressInfo).port;
    try {
      const response = await fetch(`http://127.0.0.1:${port}${MARKET_DATA_ROUTES.quotes}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${TRANSPORT_TOKEN}`,
        },
        body: JSON.stringify({
          companyId: OPERATOR_COMPANY,
          securityId: OPERATOR_SECURITY_ID,
          exchangeSegment: 'NSE_EQ',
        }),
      });

      // The daemon's own status for any non-rate-limited typed failure.
      assert.strictEqual(response.status, 502);

      const body = (await response.json()) as { error?: Record<string, unknown> };
      assert.deepStrictEqual(Object.keys(body), ['error']);
      assert.deepStrictEqual(
        Object.keys(body.error ?? {}).sort(),
        ['code', 'message'],
        'the error body must carry only a code and a message'
      );
      assert.strictEqual(body.error?.code, 'TRANSPORT_FAILURE');
      // The vendor's numeric status has no channel to the caller: it is not in the body at all.
      assert.ok(!JSON.stringify(body).includes('503'), 'the vendor status must not leak into the body');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('W06-02: /v1/health opens no socket and reports connectivity as a literal, not as an observation', async () => {
    const transport = countingTransport(() => ({ status: 200, bodyText: '{}' }));
    const service = governedService(transport);

    const health = await service.health();
    assert.deepStrictEqual(health, {
      service: 'UP',
      providerConfiguration: 'CONFIGURED',
      liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS',
      providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED',
    });
    assert.deepStrictEqual(transport.calls, [], 'health must never touch the vendor transport');

    // And it is a literal in the service, not a value derived from an earlier call.
    const serviceSource = repoText('src/providers/dhan/dhan_market_data_service.ts');
    assert.match(serviceSource, /liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS'/);
    const sourceSource = repoText('src/providers/dhan/dhan_market_data_source.ts');
    assert.match(
      sourceSource,
      /Reports provider health WITHOUT performing any network call/,
      'the no-network guarantee must stay documented where it is implemented'
    );
  });

  it('W06-03: /v1/freshness can say "the provider path ran and failed" but never which failure', async () => {
    // 1. A vendor answer (401) travels the full provider path.
    const rejecting = countingTransport(() => ({ status: 401, bodyText: '{"errorMessage":"denied"}' }));
    const providerService = governedService(rejecting);
    const quote = await providerService.getQuote(operatorQuoteRequest);
    assert.strictEqual(quote.ok, false);
    if (!quote.ok) {
      assert.strictEqual(quote.failure.code, 'AUTHENTICATION_FAILURE');
      assert.strictEqual(quote.failure.httpStatus, 401);
    }
    assert.strictEqual(rejecting.calls.length, 1, 'exactly one vendor call for one quote request');

    const freshness = providerService.getFreshness({
      domain: 'D01_QUOTES',
      companyId: OPERATOR_COMPANY,
      exchangeSegment: 'NSE_EQ',
      securityIdentity: operatorIdentity,
    });
    assert.strictEqual(freshness.lastRefresh.outcome, 'FAILURE');
    assert.deepStrictEqual(freshness.lastRefresh.lastFailure, {
      code: 'REFRESH_FAILED',
      priorPreserved: false,
    });
    // The provider's code is redacted on the read-only surface (D-7 disclosure).
    assert.ok(
      !JSON.stringify(freshness).includes('AUTHENTICATION_FAILURE'),
      'the freshness read must not disclose the provider failure code'
    );

    // 2. A request refused before the provider path leaves no refresh record at all.
    const untouched = countingTransport(() => ({ status: 200, bodyText: '{}' }));
    const identityService = governedService(untouched);
    const unknown = await identityService.getQuote({
      companyId: 'EQ_NOT_A_GOVERNED_COMPANY',
      securityIdentity: operatorIdentity,
      exchangeSegment: 'NSE_EQ',
    });
    assert.strictEqual(unknown.ok, false);
    if (!unknown.ok) {
      assert.strictEqual(unknown.failure.code, 'UNRESOLVED_INSTRUMENT');
    }
    assert.deepStrictEqual(untouched.calls, [], 'an unresolvable identity must not reach the vendor');
    assert.strictEqual(
      identityService.getFreshness({
        domain: 'D01_QUOTES',
        companyId: 'EQ_NOT_A_GOVERNED_COMPANY',
        exchangeSegment: 'NSE_EQ',
        securityIdentity: operatorIdentity,
      }).lastRefresh.outcome,
      'UNKNOWN'
    );
  });

  it('W06-04: the governed registry reproduces the operator’s discovery, so the identity was not the failure', () => {
    const registry = loadGovernedP7InstrumentRegistry();
    const api = new DhanIdentityApiService(getGovernedBroadSecurityMaster(), registry);

    const hits = api.search('RELIANCE');
    assert.strictEqual(hits.length, 2, 'the operator recorded two qualified mappings');
    const nse = hits.find((hit) => hit.exchange === 'NSE');
    assert.ok(nse, 'the selected mapping was the NSE one');
    assert.strictEqual(nse.exchange, 'NSE');
    assert.strictEqual(nse.result.status, 'QUALIFIED');
    if (nse.result.status === 'QUALIFIED') {
      assert.strictEqual(nse.result.companyId, OPERATOR_COMPANY);
      assert.strictEqual(nse.result.securityIdentity.securityId, OPERATOR_SECURITY_ID);
      assert.strictEqual(nse.result.isinAuthority, 'NON_AUTHORITATIVE');
    }

    // Deterministic: the very identity the request carried resolves to a provider mapping, which is
    // why `UNRESOLVED_INSTRUMENT` / `IDENTITY_RESOLUTION_FAILURE` are excluded as explanations.
    const transport = countingTransport(() => ({ status: 200, bodyText: '{"data":{}}' }));
    const service = governedService(transport);
    const resolution = (
      service as unknown as {
        resolution: { resolveExactIdentity: (c: string, s: string, i: unknown) => { ok: boolean } };
      }
    ).resolution.resolveExactIdentity(OPERATOR_COMPANY, 'NSE_EQ', operatorIdentity);
    assert.strictEqual(resolution.ok, true);
    assert.deepStrictEqual(transport.calls, [], 'resolution is local; it must not call the vendor');
  });

  it('W06-05: the request path emits no console output, so no log can carry the outcome', () => {
    const requestPathFiles = [
      'src/providers/dhan/dhan_market_data_http.ts',
      'src/providers/dhan/dhan_market_data_service.ts',
      'src/providers/dhan/dhan_market_data_source.ts',
      'src/providers/dhan/dhan_api_client.ts',
      'src/providers/dhan/dhan_server_egress.ts',
      'src/providers/dhan/dhan_normalizer.ts',
    ];
    for (const file of requestPathFiles) {
      const source = repoText(file);
      assert.ok(!/\bconsole\.(log|error|warn|info|debug)\b/.test(source), `${file} must stay silent`);
      assert.ok(!/process\.(stdout|stderr)/.test(source), `${file} must not write to a stream`);
    }
    // The daemon writes only at startup and on signals — the record depends on that.
    const daemonSource = repoText('src/providers/dhan/dhan_local_daemon.ts');
    assert.ok(
      /received \$\{sig\}, shutting down cleanly/.test(daemonSource),
      'the daemon’s only runtime writes are lifecycle lines, not request outcomes'
    );
  });

  it('W06-07: a credential failure and a vendor rejection produce the identical freshness projection', async () => {
    // The recorded read (§4.1) reproduced exactly, at the operator's own evaluatedAt instant.
    const observedAt = new Date('2026-11-12T18:58:23.526Z');
    const observed = {
      domain: 'D01_QUOTES',
      cacheState: 'MISS',
      verdict: 'UNKNOWN',
      lastRefresh: { outcome: 'FAILURE', lastFailure: { code: 'REFRESH_FAILED', priorPreserved: false } },
      eligibleForUse: false,
      suppressExecution: true,
      evaluatedAt: '2026-11-12T18:58:23.526Z',
    };

    // (a) the vendor answers 401 — one vendor call.
    const rejecting = countingTransport(() => ({ status: 401, bodyText: '{"errorMessage":"denied"}' }));
    const vendorService = governedService(rejecting, { now: () => observedAt });
    const vendorQuote = await vendorService.getQuote(operatorQuoteRequest);
    assert.strictEqual(vendorQuote.ok, false);
    if (!vendorQuote.ok) assert.strictEqual(vendorQuote.failure.code, 'AUTHENTICATION_FAILURE');
    assert.strictEqual(rejecting.calls.length, 1);

    // (b) credentials cannot be resolved locally — zero vendor calls.
    const unseen = countingTransport(() => ({ status: 200, bodyText: '{}' }));
    const noCredentials: DhanCredentialResolver = { resolve: async () => null };
    const credentialService = governedService(unseen, { now: () => observedAt, resolver: noCredentials });
    const credentialQuote = await credentialService.getQuote(operatorQuoteRequest);
    assert.strictEqual(credentialQuote.ok, false);
    if (!credentialQuote.ok) assert.strictEqual(credentialQuote.failure.code, 'CREDENTIALS_UNAVAILABLE');
    assert.deepStrictEqual(unseen.calls, [], 'a credential failure must not reach the vendor');

    const projection = (service: DhanMarketDataService) => {
      const full = service.getFreshness({
        domain: 'D01_QUOTES',
        companyId: OPERATOR_COMPANY,
        exchangeSegment: 'NSE_EQ',
        securityIdentity: operatorIdentity,
      });
      return {
        domain: full.domain,
        cacheState: full.cacheState,
        verdict: full.verdict,
        lastRefresh: full.lastRefresh,
        eligibleForUse: full.eligibleForUse,
        suppressExecution: full.suppressExecution,
        evaluatedAt: full.evaluatedAt,
      };
    };

    assert.deepStrictEqual(projection(vendorService), observed);
    assert.deepStrictEqual(projection(credentialService), observed);
    assert.deepStrictEqual(
      projection(vendorService),
      projection(credentialService),
      'the freshness read must not distinguish a credential failure from a vendor rejection'
    );

    // The no-observation branch, not the stale-data branch: there is no observation to evaluate.
    const full = vendorService.getFreshness({
      domain: 'D01_QUOTES',
      companyId: OPERATOR_COMPANY,
      exchangeSegment: 'NSE_EQ',
      securityIdentity: operatorIdentity,
    });
    assert.strictEqual(full.asOf, null);
    assert.strictEqual(full.ageSeconds, null);
    assert.strictEqual(full.timestampEvidence, 'NOT_AVAILABLE');
    assert.strictEqual(full.thresholdSeconds, 900, 'D01 nominal threshold, in seconds');
  });

  it('W06-08: the capture procedure uses only the implemented routes, body and capture seams', () => {
    const record = repoText(RECORD);

    // Routes: the procedure names the implemented paths, nothing invented.
    assert.ok(record.includes(MARKET_DATA_ROUTES.health));
    assert.ok(record.includes(MARKET_DATA_ROUTES.quotes));
    assert.ok(record.includes(MARKET_DATA_ROUTES.freshness));
    for (const route of record.match(/\/v1\/[a-z/]+/g) ?? []) {
      assert.ok(
        Object.values(MARKET_DATA_ROUTES).includes(route as never),
        `the procedure must not invent a route: ${route}`
      );
    }

    // Body: exactly the operator request, with only the keys the quotes handler reads.
    const bodyLine = record.match(/\$QuoteBody = '([^']+)'/)?.[1];
    assert.ok(bodyLine, 'the procedure must define the request body once');
    const parsedBody = JSON.parse(bodyLine) as Record<string, unknown>;
    assert.deepStrictEqual(Object.keys(parsedBody).sort(), ['companyId', 'exchangeSegment', 'securityId']);
    assert.deepStrictEqual(parsedBody, {
      companyId: OPERATOR_COMPANY,
      securityId: OPERATOR_SECURITY_ID,
      exchangeSegment: 'NSE_EQ',
    });

    // Credential handling: the token is expanded from the environment, never written as a value.
    assert.ok(record.includes('$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN'));
    assert.ok(!/Bearer\s+[A-Za-z0-9._-]{16,}/.test(record), 'a literal bearer value must never be documented');

    // Capture seams that the first attempt lacked.
    assert.ok(record.includes('-SkipHttpErrorCheck'), 'PowerShell 7 must be captured without throwing');
    assert.ok(record.includes('$_.ErrorDetails.Message'), 'PowerShell 5.1 bodies must be read from ErrorDetails');
    assert.ok(record.includes('GetResponseStream'), 'a stream fallback must exist');
    assert.ok(record.includes('[math]::Floor($status / 100)'), 'the status class must be derived, not guessed');

    // The retry bound the stop table depends on.
    assert.ok(/at most \*\*3\*\*/.test(record), 'the procedure must state the retry bound');
    for (const code of ['RATE_LIMITED', 'TIMEOUT', 'TRANSPORT_FAILURE', 'HTTP_ERROR']) {
      assert.ok(record.includes(code), `${code} must be named as a transient code`);
    }
    assert.ok(record.includes('never retried'), 'the procedure must state that auth/expiry are not retried');
  });

  it('W06-09: the decisive codes cannot arise without a vendor answer; the ambiguous ones can', async () => {
    // Non-transient: never retried, one send, decisive.
    const rejecting = countingTransport(() => ({ status: 401, bodyText: '{"errorMessage":"denied"}' }));
    const authService = governedService(rejecting);
    const authQuote = await authService.getQuote(operatorQuoteRequest);
    assert.strictEqual(authQuote.ok, false);
    if (!authQuote.ok) assert.strictEqual(authQuote.failure.code, 'AUTHENTICATION_FAILURE');
    assert.strictEqual(rejecting.calls.length, 1, 'an auth failure is never retried');

    // Transient 5xx: bounded retry, three sends — the "one request, up to three vendor sends" fact.
    const failing = countingTransport(() => ({ status: 500, bodyText: '{"errorMessage":"boom"}' }));
    const serverErrorService = governedService(failing);
    const serverErrorQuote = await serverErrorService.getQuote(operatorQuoteRequest);
    assert.strictEqual(serverErrorQuote.ok, false);
    if (!serverErrorQuote.ok) assert.strictEqual(serverErrorQuote.failure.code, 'HTTP_ERROR');
    assert.strictEqual(failing.calls.length, 3, 'a transient failure is retried to the bound of three');

    // 200 with an unparseable body: the vendor answered, so the code is decisive without retrying.
    const unparseable = countingTransport(() => ({ status: 200, bodyText: 'not-json' }));
    const malformedQuote = await governedService(unparseable).getQuote(operatorQuoteRequest);
    assert.strictEqual(malformedQuote.ok, false);
    if (!malformedQuote.ok) assert.strictEqual(malformedQuote.failure.code, 'MALFORMED_RESPONSE');
    assert.strictEqual(unparseable.calls.length, 1);

    // Ambiguous: a local pre-flight refusal and a local rate-limit denial both answer without a send.
    const untouched = countingTransport(() => ({ status: 200, bodyText: '{}' }));
    const credentialFailure = await governedService(untouched, {
      resolver: { resolve: async () => null },
    }).getQuote(operatorQuoteRequest);
    assert.strictEqual(credentialFailure.ok, false);
    if (!credentialFailure.ok) assert.strictEqual(credentialFailure.failure.code, 'CREDENTIALS_UNAVAILABLE');
    assert.deepStrictEqual(untouched.calls, []);

    const exhaustedBudget = new DhanRateLimiter({
      maxRequests: 0,
      windowMs: 60_000,
      now: () => Date.parse('2026-11-12T18:58:23.526Z'),
    });
    const rateLimited = await governedService(untouched, { limiter: exhaustedBudget }).getQuote(
      operatorQuoteRequest
    );
    assert.strictEqual(rateLimited.ok, false);
    if (!rateLimited.ok) assert.strictEqual(rateLimited.failure.code, 'RATE_LIMITED');
    assert.deepStrictEqual(untouched.calls, [], 'a local rate-limit denial never reaches the vendor');

    // The retry contract the procedure quotes, asserted directly.
    assert.strictEqual(isTransientFailure('AUTHENTICATION_FAILURE'), false);
    assert.strictEqual(isTransientFailure('CREDENTIALS_UNAVAILABLE'), false);
    assert.strictEqual(isTransientFailure('CREDENTIALS_EXPIRED'), false);
    assert.strictEqual(isTransientFailure('STALE_DATA_SUPPRESSED'), false);
    assert.strictEqual(isTransientFailure('MALFORMED_RESPONSE'), false);
    assert.strictEqual(isTransientFailure('RATE_LIMITED'), true);
    assert.strictEqual(isTransientFailure('TIMEOUT'), true);
    assert.strictEqual(isTransientFailure('TRANSPORT_FAILURE'), true);
    assert.strictEqual(isTransientFailure('HTTP_ERROR', 500), true);
    assert.strictEqual(isTransientFailure('HTTP_ERROR', 400), false);
  });

  it('W06-06: the record states the verdict, claims nothing past it, and carries no credential material', () => {
    const record = repoText(RECORD);
    const flat = record.replace(/\s+/g, ' ');

    // The verdict, stated plainly, and expressly not a closure of the milestone.
    assert.ok(flat.includes("W-06's evidence clause is satisfied"), 'the evidence verdict must be stated');
    assert.ok(flat.includes('M1 is NOT satisfied'), 'the milestone must be stated as unmet');
    assert.ok(flat.includes('W-06 remains open'), 'W-06 must not be reported as closed');
    assert.ok(!/\bW-06 is (now )?closed\b/i.test(flat));
    assert.ok(!/\bM1 is satisfied\b/.test(flat));
    assert.ok(!/\bmilestone M1 (?:is )?(?:met|closed|satisfied)\b/i.test(flat));

    // It may assert a rejection only because the captured code forces it; it must not promote that
    // into a named vendor status, a vendor message, or a success.
    assert.ok(flat.includes('vendor therefore answered, and it rejected the credentials'));
    assert.ok(flat.includes('401` or `403'));
    for (const pattern of [
      /\bthe vendor (?:returned|answered with|responded with|sent) (?:a )?401\b/i,
      /\bthe vendor (?:returned|answered with|responded with|sent) (?:a )?403\b/i,
      /\bDhan (?:accepted|approved) the (?:request )?credentials\b/i,
      /\bauthenticated successfully\b/i,
      /\bQuotes is qualified\b/i,
      /\bquote qualification (?:is|was) (?:established|achieved|proven)\b/i,
      /\bproduction[- ]readiness (?:is|was) (?:established|achieved|proven)\b/i,
      /\bhistory (?:is|was) qualified\b/i,
    ]) {
      const match = flat.match(pattern);
      assert.strictEqual(match, null, `the record must not assert: ${match?.[0] ?? pattern.source}`);
    }
    // The vendor's own error text is never claimed either.
    assert.ok(flat.includes('the vendor\'s own error text, are not in the capture'));
    assert.ok(flat.includes('of those two statuses it was'));

    // Attempt #1's limits survive the update: its code was never persisted and is not filled in.
    assert.ok(flat.includes('typed failure code was never persisted'));
    assert.ok(flat.includes('**Not established — and not inferable:**'));
    assert.ok(flat.includes('Whether Dhan received the request at all'));
    assert.ok(flat.includes('entered the provider refresh path and failed inside it'));
    assert.ok(flat.includes('is a redacted projection, not the code'));
    assert.ok(flat.includes('W06-07'));

    // The recorded observations must be the ones the operator supplied.
    assert.ok(flat.includes('HTTP_STATUS=502'));
    assert.ok(flat.includes('EQ_RELIANCE_IN'));
    assert.ok(flat.includes('ISIN:INE002A01018:EQ'));
    assert.ok(flat.includes('NOT_CHECKED_PRE_ACCESS'));
    assert.ok(flat.includes('vendorEgress=IPD_SERVER_HTTPS'));
    assert.ok(flat.includes('qualifiedMappings=96'));
    assert.ok(flat.includes('UNAUTHENTICATED'));
    assert.ok(flat.includes('2026-11-12T19:42:05.1740778Z'));
    assert.ok(flat.includes('5,893 ms'));
    assert.ok(flat.includes('Dhan rejected the request credentials'));

    // The scoped freshness reads, and exactly what they are worth.
    assert.ok(flat.includes('"cacheState": "MISS"'));
    assert.ok(flat.includes('"verdict": "UNKNOWN"'));
    assert.ok(flat.includes('"outcome": "FAILURE"'));
    assert.ok(flat.includes('"code": "REFRESH_FAILED"'));
    assert.ok(flat.includes('"priorPreserved": false'));
    assert.ok(flat.includes('"eligibleForUse": false'));
    assert.ok(flat.includes('"suppressExecution": true'));
    assert.ok(flat.includes('2026-11-12T18:58:23.526Z'));
    assert.ok(flat.includes('2026-11-12T19:42:14.375Z'));

    // The redaction pattern lists — §10.5 and §12.4 — necessarily spell the patterns they define.
    // Every fenced block that does so is replaced; every other byte must be clean.
    const patternLists = [...record.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].filter((match) =>
      /-Pattern|Select-String/.test(match[1] ?? '')
    );
    assert.ok(patternLists.length >= 2, 'both redaction steps must be documented');
    const scannable = patternLists.reduce(
      (text, match) => text.replace(match[0], '<pattern-list>'),
      record
    );

    assert.ok(!scannable.includes('eyJ'), 'no JWT may appear outside the search patterns');
    assert.ok(!scannable.includes('dhan-secrets'), 'no store path may appear outside the search patterns');
    assert.ok(!record.includes('sha256:'), 'no fingerprint may appear');
    assert.ok(
      !/[A-Za-z0-9+/]{60,}={0,2}/.test(record.replace(/\b[0-9a-f]{7,40}\b/g, '<hex>')),
      'no encoded blob'
    );
    assert.ok(!/\b1000\d{6}\b/.test(record), 'no Dhan-client-id-shaped number');
    for (const location of ['dhan-client-id.carrier', 'dhan-access-token.carrier', 'H:\\IIPS']) {
      assert.ok(!record.includes(location), `no carrier location may appear: ${location}`);
    }
    // A secret-reference pointer needs an identifier after the scheme; the pattern literal does not.
    assert.deepStrictEqual(
      scannable.replace(/`/g, '').match(/vault:\/\/[A-Za-z0-9]/g) ?? [],
      [],
      'no vault reference may appear'
    );
  });

  it('W06-10: every artefact in §12.1 is reproduced field for field', () => {
    const record = repoText(RECORD);
    const sectionStart = record.indexOf('### 12.1 The artefacts');
    const sectionEnd = record.indexOf('### 12.2');
    assert.ok(sectionStart > 0 && sectionEnd > sectionStart, '§12.1 must exist');

    const artefacts = [...record.slice(sectionStart, sectionEnd).matchAll(/```json\n([\s\S]*?)```/g)].map(
      (match) => JSON.parse(match[1] ?? '') as Record<string, unknown>
    );
    assert.strictEqual(artefacts.length, 5, 'all five probes must be reproduced');

    const expected: readonly [string, string, number, number, string, string][] = [
      ['w06-01-health-before', '2026-11-12T19:41:59.1168539Z', 68, 200, '2xx', 'HEALTH'],
      ['w06-02-freshness-before', '2026-11-12T19:41:59.2286663Z', 29, 200, '2xx', 'FAILURE'],
      ['w06-03-quotes-attempt1', '2026-11-12T19:42:05.1740778Z', 5893, 502, '5xx', 'AUTHENTICATION_FAILURE'],
      ['w06-04-health-after', '2026-11-12T19:42:05.3305256Z', 67, 200, '2xx', 'HEALTH'],
      ['w06-05-freshness-after', '2026-11-12T19:42:14.4035727Z', 29, 200, '2xx', 'FAILURE'],
    ];
    expected.forEach(([probe, atUtc, elapsedMs, httpStatus, statusClass, typedCode], index) => {
      const artefact = artefacts[index];
      assert.ok(artefact, `artefact ${index} present`);
      assert.strictEqual(artefact.probe, probe);
      assert.strictEqual(artefact.atUtc, atUtc);
      assert.strictEqual(artefact.elapsedMs, elapsedMs);
      assert.strictEqual(artefact.httpStatus, httpStatus);
      assert.strictEqual(artefact.statusClass, statusClass);
      assert.strictEqual(artefact.typedCode, typedCode);
    });

    // The decisive probe: the daemon's own body, and the framework's reason phrase.
    const quotes = artefacts[2] as { body: string; exceptionMessage: string; message: string };
    assert.deepStrictEqual(JSON.parse(quotes.body), {
      error: {
        code: 'AUTHENTICATION_FAILURE',
        message: 'Dhan rejected the request credentials',
      },
    });
    assert.strictEqual(quotes.message, 'Dhan rejected the request credentials');
    assert.strictEqual(quotes.exceptionMessage, 'The remote server returned an error: (502) Bad Gateway.');

    // The after-read is the same projection as the before-read, at a later clock.
    const freshnessAfter = artefacts[4] as { body: string };
    const freshnessPayload = JSON.parse(freshnessAfter.body) as {
      evaluatedAt: string;
      cacheState: string;
      verdict: string;
      lastRefresh: { outcome: string; lastFailure: { code: string } };
    };
    assert.strictEqual(freshnessPayload.evaluatedAt, '2026-11-12T19:42:14.375Z');
    assert.strictEqual(freshnessPayload.cacheState, 'MISS');
    assert.strictEqual(freshnessPayload.verdict, 'UNKNOWN');
    assert.strictEqual(freshnessPayload.lastRefresh.outcome, 'FAILURE');
    assert.strictEqual(freshnessPayload.lastRefresh.lastFailure.code, 'REFRESH_FAILED');
  });

  it('W06-11: only a received 401/403 can produce the captured code', () => {
    const authFailure = (status: number) => {
      const mapped = DhanApiClient.mapHttpStatus(status);
      assert.ok(mapped, `${status} must map to a failure`);
      assert.strictEqual(mapped.ok, false);
      return mapped.failure;
    };

    for (const status of [401, 403]) {
      const failure = authFailure(status);
      assert.strictEqual(failure.code, 'AUTHENTICATION_FAILURE');
      assert.strictEqual(failure.message, 'Dhan rejected the request credentials');
      assert.strictEqual(failure.httpStatus, status, 'the vendor status is kept internally, not published');
    }

    // No other status produces that code, and none of them is "no response".
    for (const status of [400, 404, 418, 500, 502, 503]) {
      assert.strictEqual(authFailure(status).code, 'HTTP_ERROR', `${status} must be HTTP_ERROR`);
    }
    assert.strictEqual(authFailure(408).code, 'TIMEOUT');
    assert.strictEqual(authFailure(504).code, 'TIMEOUT');
    assert.strictEqual(authFailure(429).code, 'RATE_LIMITED');
    for (const status of [200, 201, 204]) {
      assert.strictEqual(DhanApiClient.mapHttpStatus(status), null, `${status} is not a failure`);
    }
  });
});
