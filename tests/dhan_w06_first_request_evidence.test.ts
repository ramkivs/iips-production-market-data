/**
 * W-06 — first authorised authenticated request: what the recorded evidence can and cannot prove.
 *
 * Roadmap: docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md (v1.1), W-06
 * Record:  docs/integration/DHAN-W06-FIRST-AUTHENTICATED-REQUEST-EVIDENCE-2026-11-12.md
 *
 * WHY THIS SUITE EXISTS
 * The single authorised vendor request returned HTTP 502 from the local daemon and its response body
 * was lost. The temptation is to read a 502 as "Dhan rejected us" or "Dhan answered". It is neither.
 * This suite pins the structural facts that make the record honest, and it can do so without a
 * vendor call of any kind:
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
  options: { readonly now?: () => Date; readonly resolver?: DhanCredentialResolver } = {}
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

  it('W06-06: the evidence record states the gap, claims nothing, and carries no credential material', () => {
    const record = repoText(RECORD);
    const flat = record.replace(/\s+/g, ' ');

    // It must not be read as a closure of W-06.
    assert.ok(flat.includes('W-06 NOT CLOSED'), 'the record must state the status plainly');
    assert.ok(flat.includes('No second vendor request was made'));
    assert.match(record, /\*\*W-06 is NOT closed\.\*\*/);
    assert.ok(flat.includes('the typed failure code of the one authorised request was never persisted'));

    // It must not assert vendor contact, acceptance or rejection. The only permitted mention of the
    // vendor answering is the open question in the "not established" list ("Whether Dhan accepted…").
    const assertive = [
      /(?<!whether )\bDhan (rejected|accepted|answered)\b/i,
      /\breached Dhan\b/i,
      /\bauthenticated successfully\b/i,
      /\bproves the vendor\b/i,
    ];
    for (const pattern of assertive) {
      const match = flat.match(pattern);
      assert.strictEqual(match, null, `the record must not assert: ${match?.[0] ?? pattern.source}`);
    }
    assert.ok(flat.includes('**Not established — and not inferable:**'));
    assert.ok(flat.includes('Whether Dhan received the request at all'));

    // The recorded observations must be the ones the operator supplied.
    assert.ok(flat.includes('HTTP_STATUS=502'));
    assert.ok(flat.includes('EQ_RELIANCE_IN'));
    assert.ok(flat.includes('ISIN:INE002A01018:EQ'));
    assert.ok(flat.includes('NOT_CHECKED_PRE_ACCESS'));
    assert.ok(flat.includes('vendorEgress=IPD_SERVER_HTTPS'));
    assert.ok(flat.includes('qualifiedMappings=96'));
    assert.ok(flat.includes('UNAUTHENTICATED'));

    // The scoped freshness read, and exactly what it is worth.
    assert.ok(flat.includes('"cacheState": "MISS"'));
    assert.ok(flat.includes('"verdict": "UNKNOWN"'));
    assert.ok(flat.includes('"outcome": "FAILURE"'));
    assert.ok(flat.includes('"code": "REFRESH_FAILED"'));
    assert.ok(flat.includes('"priorPreserved": false'));
    assert.ok(flat.includes('"eligibleForUse": false'));
    assert.ok(flat.includes('"suppressExecution": true'));
    assert.ok(flat.includes('2026-11-12T18:58:23.526Z'));
    assert.ok(flat.includes('entered the provider refresh path and failed there'));
    assert.ok(flat.includes('is a redacted projection, not the code'));
    assert.ok(flat.includes('W06-07'));
    // It must not be presented as having recovered the typed code.
    assert.ok(!/typed (failure )?code (was|has been) recovered/i.test(flat));
    assert.ok(flat.includes('the typed failure code of the one authorised request was never persisted'));

    // No credential-shaped content, no location, no digest.
    assert.ok(!record.includes('eyJ'), 'no JWT may appear');
    assert.ok(!record.includes('sha256:'), 'no fingerprint may appear');
    assert.ok(!/[A-Za-z0-9+/]{60,}={0,2}/.test(record.replace(/\b[0-9a-f]{7,40}\b/g, '<hex>')), 'no encoded blob');
    assert.ok(!/\b1000\d{6}\b/.test(record), 'no Dhan-client-id-shaped number');
    // Backticks stripped first: the record may name the prohibition, never a reference.
    for (const match of record.replace(/`/g, '').match(/vault:\/\/\S+/g) ?? []) {
      assert.fail(`a vault reference must not appear: ${match}`);
    }
    for (const location of ['dhan-secrets', 'dhan-client-id.carrier', 'dhan-access-token.carrier', 'H:\\IIPS']) {
      assert.ok(!record.includes(location), `no carrier location may appear: ${location}`);
    }
  });
});
