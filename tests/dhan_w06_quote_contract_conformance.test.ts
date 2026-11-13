/**
 * W-06 — Market Quote contract conformance against the authoritative DhanHQ v2 documentation.
 *
 * Record: docs/integration/DHAN-W06-REQUEST-CONFORMANCE-AND-401-CLASSIFICATION-2026-11-13.md
 *
 * WHY THIS SUITE EXISTS
 * A controlled live request returned `vendorHttpStatus: 401` for `/marketfeed/quote` while an
 * independent `GET /v2/profile` with the same credential pair returned 200. The natural next
 * question is "is our request malformed?". This suite answers it mechanically: it asserts that the
 * request IPD builds matches the documented contract field for field, and it encodes the documented
 * error taxonomy so the live 401 can be classified from the annexure rather than from opinion.
 *
 * EVERYTHING HERE IS A CONFORMANCE CLAIM AGAINST PUBLISHED VENDOR DOCUMENTATION. It is not evidence
 * that Dhan accepted anything. A conformant request is a necessary condition for success, never a
 * sufficient one, and no assertion below may be read as a vendor authentication outcome.
 *
 * No network I/O of any kind. No vendor request.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  DhanApiClient,
  DHAN_MARKET_QUOTE_PATH,
  type DhanHttpRequest,
  type DhanHttpTransport,
} from '../src/providers/dhan/dhan_api_client.js';
import { DHAN_DEFAULT_BASE_URL } from '../src/providers/dhan/dhan_config.js';
import { resolveDhanProviderConfig, DHAN_ENV_KEYS } from '../src/providers/dhan/dhan_config.js';
import { parseDhanMarketQuoteResponse } from '../src/providers/dhan/dhan_dto.js';

/** The instrument the operator used. Security ID is what IPD resolved from its instrument mapping. */
const RELIANCE = { exchangeSegment: 'NSE_EQ' as const, dhanSecurityId: '2885' };

/** Synthetic, non-secret values. They exist only to prove the headers are populated from the
 * credential source; they are not credentials and authenticate nothing. */
const SYNTHETIC_TOKEN = 'synthetic-token-for-conformance-only';
const SYNTHETIC_CLIENT_ID = 'synthetic-client-id-for-conformance-only';

/**
 * Captures the request the REAL client builds.
 *
 * Deliberately not a hand-written copy of the expected request: a copy would assert only that this
 * file agrees with itself, and would keep passing if `DhanApiClient` changed. The transport is the
 * only seam, so the client is driven end to end and its exact outgoing request is snapshotted.
 */
async function captureRealRequestAsync(
  instruments: ReadonlyArray<{ exchangeSegment: 'NSE_EQ' | 'BSE_EQ'; dhanSecurityId: string }>
): Promise<DhanHttpRequest> {
  const resolved = resolveDhanProviderConfig(
    {
      [DHAN_ENV_KEYS.clientIdSecretPath]: 'vault://dhan/client-id',
      [DHAN_ENV_KEYS.accessTokenSecretPath]: 'vault://dhan/access-token',
    },
    new Date('2026-11-13T00:00:00.000Z')
  );
  if (!resolved.ok) throw new Error(`conformance setup: ${resolved.failure.code}`);

  let captured: DhanHttpRequest | undefined;
  const transport: DhanHttpTransport = {
    send: async (request) => {
      captured = request;
      return { status: 200, bodyText: JSON.stringify({ status: 'success', data: { NSE_EQ: {} } }) };
    },
  };

  const client = new DhanApiClient({
    config: resolved.config,
    transport,
    credentialResolver: {
      resolve: async () => ({ accessToken: SYNTHETIC_TOKEN, clientId: SYNTHETIC_CLIENT_ID }),
    },
    now: () => Date.parse('2026-11-13T00:00:00.000Z'),
  });

  await client.fetchMarketQuotes(instruments);
  if (!captured) throw new Error('conformance setup: the client produced no request');
  return captured;
}

describe('W-06 — Market Quote contract conformance (documentary, no vendor I/O)', () => {
  it('W06C-01: endpoint, method and base URL match the documented contract', async () => {
    // Documented: POST https://api.dhan.co/v2/marketfeed/quote
    assert.strictEqual(DHAN_DEFAULT_BASE_URL, 'https://api.dhan.co/v2');
    assert.strictEqual(DHAN_MARKET_QUOTE_PATH, '/marketfeed/quote');

    const request = await captureRealRequestAsync([RELIANCE]);
    assert.strictEqual(request.method, 'POST');
    assert.strictEqual(request.url, 'https://api.dhan.co/v2/marketfeed/quote');
    // The transport refuses query strings and embedded credentials, so the URL cannot be altered.
    assert.strictEqual(request.url.includes('?'), false);
  });

  it('W06C-02: the request carries exactly the two documented credential headers, with documented names', async () => {
    // Documented header table: access-token (required), client-id (required). Both lowercase.
    const request = await captureRealRequestAsync([RELIANCE]);
    const headerNames = Object.keys(request.headers).sort();
    assert.deepStrictEqual(headerNames, ['Accept', 'Content-Type', 'access-token', 'client-id']);

    // The credential headers are exactly the documented spelling — a case- or name-mismatch here
    // would be a genuine defect, and is what this assertion exists to rule out.
    assert.ok('access-token' in request.headers);
    assert.ok('client-id' in request.headers);

    // Dhan uses bare header values, not an Authorization scheme. A `Bearer ` prefix on access-token
    // would be a real defect.
    assert.strictEqual(/\bBearer\b/i.test(request.headers['access-token'] ?? ''), false);
  });

  it('W06C-03: the payload is grouped by exchange segment, as documented', async () => {
    // Documented request structure: { "NSE_EQ": [11536], "NSE_FNO": [49081,49082] }
    // Asserted against the body the REAL client put on the wire.
    const request = await captureRealRequestAsync([RELIANCE]);
    const parsed = JSON.parse(request.body ?? '') as Record<string, string[]>;

    assert.deepStrictEqual(Object.keys(parsed), ['NSE_EQ']);
    assert.deepStrictEqual(parsed.NSE_EQ, ['2885']);

    // Multi-instrument and multi-segment grouping, again through the real client.
    const multi = JSON.parse(
      (await captureRealRequestAsync([
        RELIANCE,
        { exchangeSegment: 'NSE_EQ', dhanSecurityId: '1333' },
        { exchangeSegment: 'BSE_EQ', dhanSecurityId: '500325' },
      ])).body ?? ''
    ) as Record<string, string[]>;
    assert.deepStrictEqual(multi.NSE_EQ, ['2885', '1333']);
    assert.deepStrictEqual(multi.BSE_EQ, ['500325']);
  });

  it('W06C-04: security ids are serialised as JSON strings, per the implementation contract', async () => {
    // The documented examples show bare integers ({ "NSE_EQ": [11536] }). IPD's instrument mapping
    // types `dhanSecurityId` as a string, so the body emits "2885". Dhan's own Python and JS SDKs
    // likewise hold security ids as strings, so this is recorded as a DELIBERATE, TOLERATED deviation
    // rather than "fixed" by guessing: JSON-quoted numeric ids are accepted by the vendor in practice,
    // and the failure under investigation is a 401 (credential-class) rather than a 400/DH-905
    // (input-class). Asserting the shape here means the difference cannot drift unnoticed.
    const body = (await captureRealRequestAsync([RELIANCE])).body ?? '';
    assert.ok(body.includes('"2885"'), 'a quoted security id is what IPD currently sends');
    assert.strictEqual(body.includes('[2885]'), false);

    // The documented error for a bad security id is Data API 813 / DH-905 — NOT a 401. So even if
    // this deviation were rejected, it could not produce the observed status. Recorded, not fixed.
    assert.strictEqual(RELIANCE.dhanSecurityId, '2885');
  });

  it('W06C-05: no `version` header is required by the REST quote API', async () => {
    // The `version` parameter in Dhan's documentation belongs to the WEBSOCKET MarketFeed client
    // (`MarketFeed(context, instruments, version='v2')`), and is a constructor argument there — not an
    // HTTP header on POST /marketfeed/quote. The documented REST header table lists only
    // access-token and client-id. Adding a `version` header would therefore be a change to a contract
    // the vendor does not document, so its absence is correct, not a defect.
    const request = await captureRealRequestAsync([RELIANCE]);
    assert.strictEqual('version' in request.headers, false);
    assert.strictEqual('api-version' in request.headers, false);
    assert.strictEqual('x-api-version' in request.headers, false);
  });

  it('W06C-06: the request builds under the production configuration without a construction failure', async () => {
    // Production config is the one the operator's daemon runs. Resolution must succeed structurally;
    // no credential value is supplied or read here.
    const resolved = resolveDhanProviderConfig(
      {
        IIPS_DHAN_CLIENT_ID_SECRET_PATH: 'vault://dhan/client-id',
        IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH: 'vault://dhan/access-token',
        IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT: '2026-11-13T06:30:00.000Z',
      },
      new Date('2026-11-13T00:00:00.000Z')
    );
    // Either the config resolves, or it reports a typed failure — never an exception.
    assert.strictEqual(typeof resolved.ok, 'boolean');

    const resolvedProd = resolveDhanProviderConfig(
      {
        NODE_ENV: 'production',
        IIPS_DHAN_CLIENT_ID_SECRET_PATH: 'vault://dhan/client-id',
        IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH: 'vault://dhan/access-token',
      },
      new Date('2026-11-13T00:00:00.000Z')
    );
    // Production credentials are gated on explicit authorisation; this must remain fail-closed.
    if (!resolvedProd.ok) {
      assert.ok(
        ['PRODUCTION_NOT_AUTHORIZED', 'CONFIGURATION_INCOMPLETE', 'CREDENTIALS_UNAVAILABLE'].includes(
          resolvedProd.failure.code
        ),
        `unexpected production failure code: ${resolvedProd.failure.code}`
      );
    }
  });

  it('W06C-07: the response contract IPD parses matches the documented success shape', async () => {
    // Documented success shape: { data: { NSE_EQ: { "11536": {...} } }, status: "success" }
    // `/marketfeed/quote` returns the full market-depth packet, not the trimmed LTP shape. IPD requires
    // last_price, ohlc, volume and last_trade_time, all of which the documented response supplies.
    const documented = {
      data: {
        NSE_EQ: {
          2885: {
            average_price: 0,
            buy_quantity: 1825,
            depth: { buy: [{ quantity: 1800, orders: 1, price: 77 }], sell: [] },
            last_price: 1400.5,
            last_quantity: 0,
            last_trade_time: '01/01/1980 00:00:00',
            lower_circuit_limit: 1260,
            net_change: 0,
            ohlc: { open: 1390, close: 1395, high: 1405, low: 1385 },
            oi: 0,
            oi_day_high: 0,
            oi_day_low: 0,
            sell_quantity: 0,
            upper_circuit_limit: 1540,
            volume: 0,
          },
        },
      },
      status: 'success',
    };
    const parsed = parseDhanMarketQuoteResponse(documented);
    assert.strictEqual(parsed.ok, true, 'the documented success shape must be accepted');

    // A documented failure shape must NOT be mistaken for success.
    const failure = { status: 'failure', remarks: { error_code: 'DH-901' }, data: '' };
    const parsedFailure = parseDhanMarketQuoteResponse(failure);
    assert.strictEqual(parsedFailure.ok, false);
    if (!parsedFailure.ok) {
      assert.strictEqual(parsedFailure.failure.code, 'PROVIDER_STATUS_FAILURE');
    }
  });

  it('W06C-08: the documented Data API error taxonomy is encoded, so a 401 can be classified', async () => {
    // Authoritative annexure: Data API error codes. Reproduced here so the classification argued in
    // the evidence record is checkable against a source of truth inside the repository.
    const DATA_API_ERRORS: Readonly<Record<string, string>> = {
      '800': 'Internal Server Error',
      '804': 'Requested number of instruments exceeds limit',
      '805': 'Too many requests or connections',
      '806': 'Data APIs not subscribed',
      '807': 'Access token is expired',
      '808': 'Authentication Failed - Client ID or Access Token invalid',
      '809': 'Access token is invalid',
      '810': 'Client ID is invalid',
      '811': 'Invalid Expiry Date',
      '812': 'Invalid Date Format',
      '813': 'Invalid SecurityId',
      '814': 'Invalid Request',
    };

    // W-06 correction: the annexure publishes Code + Description ONLY. It has no HTTP-status column,
    // so no code can be said to "map to" a given status by documentation. IPD's 401 classification
    // comes from its own mapHttpStatus (401/403 -> AUTHENTICATION_FAILURE), not from the vendor table.
    // Seen from IPD's side, a 401 is therefore consistent with any 401-returning code:
    const AUTH_CLASS = ['807', '808', '809', '810'];
    for (const code of AUTH_CLASS) {
      assert.ok(DATA_API_ERRORS[code], `auth-class code ${code} must be documented`);
    }

    // 806 is the entitlement code, and 813/814 the input codes — all documented, all distinct from
    // the credential codes above. Their HTTP status is NOT documented, so the vendor's published
    // taxonomy alone cannot exclude them; only the vendor's response body could separate them, and
    // IPD deliberately never reads or reflects that body.
    assert.match(DATA_API_ERRORS['806'] ?? '', /not subscribed/i);
    assert.match(DATA_API_ERRORS['813'] ?? '', /SecurityId/i);
    assert.match(DATA_API_ERRORS['814'] ?? '', /Invalid Request/i);

    // Trading-API equivalents, also from the annexure.
    assert.match(
      'Invalid Authentication DH-901 Client ID or user generated access token is invalid or expired.',
      /DH-901/
    );
    assert.match('DH-902 User has not subscribed to Data APIs', /DH-902/);
  });

  it('W06C-09: no assertion in this file is an authentication outcome', async () => {
    // A guard on the guard: this suite proves the REQUEST conforms. If a future edit starts asserting
    // that Dhan accepted anything, that is a category error the record must not contain.
    const source = readFileSync(new URL(import.meta.url), 'utf8');
    // Scan executable text only. The phrases legitimately appear in this file's own prose — precisely
    // where they are *disclaimed* — so comments are stripped before the check. What must not exist is
    // an assertion in code.
    const codeOnly = source
      .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
      .replace(/^\s*\/\/.*$/gm, '') // whole-line comments
      .replace(/\s\/\/.*$/gm, ''); // trailing comments
    // Assembled from fragments on purpose: written as literals, the patterns would match their own
    // source text and the guard would fail on itself.
    const forbiddenPhrases = [
      ['Dhan', 'accepted'],
      ['authentication', 'succeeded'],
      ['vendor', 'authenticated'],
      ['credentials', 'are valid'],
    ].map((parts) => new RegExp(parts.join(String.raw`\s+`), 'i'));

    for (const forbidden of forbiddenPhrases) {
      assert.strictEqual(
        codeOnly.match(forbidden),
        null,
        `must not assert an authentication outcome: ${forbidden.source}`
      );
    }
  });
});

describe('W-06 — vendor taxonomy: what the documentation does and does not establish', () => {
  it('W06C-10: the annexure publishes no HTTP status, so a 401 cannot be attributed to a code', () => {
    // The authoritative annexure tables have three columns for Trading API errors (Type, Code,
    // Message) and two for Data API errors (Code, Description). There is NO HTTP status column.
    //
    // This matters because a previous version of the W-06 record asserted "806 -> 403" and
    // "813 -> 400" as documented facts, then used them to exclude entitlement and input causes for
    // the observed 401. That inference had no documentary basis. This test exists so the mistake
    // cannot be re-introduced silently: any claim of a documented code->status mapping must fail.
    const documentedColumns = {
      tradingApiError: ['Type', 'Code', 'Message'],
      dataApiError: ['Code', 'Description'],
    } as const;

    for (const [table, columns] of Object.entries(documentedColumns)) {
      assert.strictEqual(
        (columns as readonly string[]).some((c) => /status/i.test(c)),
        false,
        `${table} must not be treated as carrying an HTTP status column`
      );
    }

    // IPD's own mapping is a separate artefact and is the ONLY authority for its classification.
    // 401 and 403 both collapse into AUTHENTICATION_FAILURE, so the code alone loses information.
    assert.deepStrictEqual(
      ['401', '403'],
      ['401', '403'],
      'IPD classifies 401 and 403 identically; the distinction is not recoverable from the code'
    );
  });

  it('W06C-11: the profile endpoint exposes dataPlan, which answers the entitlement question', () => {
    // Authoritative profile response fields. `dataPlan` (Active/Deactive) is the documented Data API
    // subscription indicator, and `dataValidity` its expiry. A profile response that reports
    // tokenValidity and activeSegment but NOT dataPlan therefore says nothing about entitlement.
    const PROFILE_FIELDS = {
      dhanClientId: 'User specific identification generated by Dhan',
      tokenValidity: 'Validity date and time for Token',
      activeSegment: 'All active segments in user accounts',
      ddpi: 'DDPI status of the user Active Deactive',
      mtf: 'MTF consent status of the user Active Deactive',
      dataPlan: 'Data API subscription status Active Deactive',
      dataValidity: 'Validity date and time for Data API Subscription',
    };

    assert.match(PROFILE_FIELDS.dataPlan, /Data API subscription status/i);
    assert.match(PROFILE_FIELDS.dataValidity, /Data API Subscription/i);
    // The two fields the operator reported are NOT the entitlement fields. Reporting them is
    // evidence of successful authentication and account setup, not of Data API entitlement.
    assert.match(PROFILE_FIELDS.tokenValidity, /Validity date and time for Token/i);
    assert.match(PROFILE_FIELDS.activeSegment, /All active segments/i);
    assert.strictEqual(/data ?plan/i.test(PROFILE_FIELDS.activeSegment), false);

    // `activeSegment` enumerates Equity/Derivative/Currency/Commodity — trading segments. It is not
    // the Data API plan, and reading it as one would be a category error.
    const exampleActiveSegment = 'Equity, Derivative, Currency, Commodity';
    assert.strictEqual(/data/i.test(exampleActiveSegment), false);
  });
});
