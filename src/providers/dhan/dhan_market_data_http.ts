/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Market-Data HTTP Transport (DHAN-P5 / Stage 1) — server-to-server, authenticated
 *
 * The existing IPD IPC endpoint (src/ipc) is portfolio-only by governed
 * contract, so this is a dedicated, minimal node:http transport for market
 * data. It exposes ONLY the composed service — consumers never see Dhan
 * primitives, vendor DTOs, Dhan instrument ids or credentials.
 *
 * Stage 1 non-production admission bounds:
 *   - Local, single-user, non-production execution ONLY (production refused fail-closed).
 *   - Loopback-only HTTP binding (`127.0.0.1`, `::1`, `localhost`).
 *   - `MarketDataTransportClient` returns explicit typed fail-closed outcomes on
 *     every missing/invalid credential, authentication, timeout, validation or
 *     transport failure and never opens direct vendor egress.
 *
 * Routes (all JSON, authenticated):
 *   POST /v1/quotes             { companyId, securityId: 'ISIN:<isin>:<series>', exchangeSegment? } -> D01 envelope or error
 *   POST /v1/historical         { companyId, exchangeSegment?, isin?, interval, fromDate, toDate } -> D02 result or error
 *   GET  /v1/health             -> ServiceHealth (observational; never triggers vendor call)
 *   GET  /v1/diagnostics        -> ServiceDiagnostics (observational; D-7 §4.1 MAY list only)
 *   POST /v1/connection/verify  { mode?: 'LIVE_PROBE' | 'LOCAL_ONLY' } -> ServiceConnectionVerification (single-shot W-08 verify)
 *   GET  /v1/freshness          ?domain=D02_OHLCV | ?domain=D01_QUOTES&companyId=...&exchangeSegment=...&securityId=... -> FreshnessStatus
 *   POST /v1/instruments/search { query } -> offline P4 candidate search (when identityService supplied)
 *   POST /v1/identity/resolve   { companyId, exchange, securityId } -> offline exact D114 identity resolution
 *   POST /v1/identity/qualify   { isin?, exchange, symbol? } -> offline holding identity qualification
 *
 * Auth: `Authorization: Bearer <token>` where the token comes from env
 *   IIPS_MARKET_DATA_TRANSPORT_TOKEN. The transport credential is separate
 *   from Dhan API credentials. Missing/unset token fails CLOSED (server refuses
 *   to start). Constant-time compare. Credentials never appear in URLs,
 *   responses or logs.
 *
 * Limits: request body <= 16 KiB, per-request execution bounded by a timeout,
 * one request per connection handled serially. Errors: {"error":{"code","message"}}.
 */

import { DhanIdentityApiService } from './dhan_identity_api.js';
import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import type { ListenOptions } from 'node:net';
import { timingSafeEqual } from 'node:crypto';
import { CanonicalEnvelope } from '../../contracts/envelope.js';
import { MarketQuotePayload } from '../../contracts/d01_quotes.js';
import {
  buildD114SecurityIdentity,
  isD114SecurityId,
  isD114SecurityIdentity,
  type D114SecurityIdentity,
} from '../../contracts/types.js';
import { isDhanProductionEnvironment, type DhanEnvSource } from './dhan_config.js';
import { DhanFailureCode } from './dhan_failures.js';
import {
  validateDhanFreshnessStatus,
  type FreshnessStatus,
} from './dhan_freshness_status.js';
import { DhanHistoricalNormalizationResult } from './dhan_historical_adapter.js';
import type {
  DhanVerificationMode,
  VerifyProviderConnectionOptions,
} from './dhan_provider_state_recorder.js';
import {
  DhanMarketDataService,
  buildServiceConnectionVerification,
  validateDhanConnectionVerification,
  validateDhanServiceDiagnostics,
  validateDhanServiceHealth,
  QuoteRequest,
  HistoricalServiceRequest,
  ServiceConnectionVerification,
  ServiceDiagnostics,
  ServiceHealth,
} from './dhan_market_data_service.js';

export const MARKET_DATA_TRANSPORT_TOKEN_ENV = 'IIPS_MARKET_DATA_TRANSPORT_TOKEN';
export const MARKET_DATA_ROUTES = {
  quotes: '/v1/quotes',
  historical: '/v1/historical',
  health: '/v1/health',
  diagnostics: '/v1/diagnostics',
  verifyConnection: '/v1/connection/verify',
  freshness: '/v1/freshness',
  instrumentSearch: '/v1/instruments/search',
  identityResolve: '/v1/identity/resolve',
  identityQualify: '/v1/identity/qualify',
} as const;

export const MARKET_DATA_MAX_REQUEST_BYTES = 16 * 1024;
export const MARKET_DATA_REQUEST_TIMEOUT_MS = 10_000;

export type MarketDataTransportFailureCode =
  | DhanFailureCode
  | 'UNAUTHENTICATED'
  | 'MALFORMED_REQUEST'
  | 'REQUEST_TOO_LARGE'
  | 'REQUEST_TIMEOUT'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface MarketDataTransportFailure {
  readonly code: MarketDataTransportFailureCode;
  readonly message: string;
  /**
   * HTTP status of the *daemon's* response. Present whenever the daemon answered at all, so it
   * reports the transport outcome rather than the provider's.
   */
  readonly httpStatus?: number;
  /**
   * Numeric HTTP status the *vendor* returned, when the daemon could attribute one.
   *
   * Separate from {@link httpStatus} by design. `httpStatus` is what the local daemon answered
   * (502 for any non-rate-limited provider failure); this is what Dhan answered. Diagnostic only:
   * it is an integer and never carries vendor response content.
   *
   * The caller must not treat this as an authentication verdict — a credential the vendor accepted
   * and one it refused can both produce a vendor status, and `PROVIDER_STATUS_FAILURE` /
   * `CREDENTIALS_*` failures carry none at all.
   */
  readonly vendorHttpStatus?: number;
}

export type MarketDataTransportQuoteOutcome =
  | {
      readonly ok: true;
      readonly envelope: CanonicalEnvelope<MarketQuotePayload>;
      readonly freshness: 'CURRENT' | 'STALE';
    }
  | { readonly ok: false; readonly failure: MarketDataTransportFailure };

export type MarketDataTransportHistoricalOutcome =
  | { readonly ok: true; readonly result: DhanHistoricalNormalizationResult }
  | { readonly ok: false; readonly failure: MarketDataTransportFailure };

export type MarketDataTransportHealthOutcome =
  | ({ readonly ok: true } & ServiceHealth)
  | { readonly ok: false; readonly service: 'DOWN'; readonly failure: MarketDataTransportFailure };

export type MarketDataTransportDiagnosticsOutcome =
  | ({ readonly ok: true } & ServiceDiagnostics)
  | { readonly ok: false; readonly failure: MarketDataTransportFailure };

export type MarketDataTransportVerifyOutcome =
  | ({ readonly ok: true } & ServiceConnectionVerification)
  | { readonly ok: false; readonly failure: MarketDataTransportFailure };

/**
 * Request scope for `MarketDataTransportClient.getFreshness` (`GET /v1/freshness`).
 *
 * Matches the server route contract:
 *   - `D02_OHLCV`: domain alone (no additional scope parameters).
 *   - `D01_QUOTES`: exact quote scope (`companyId`, `exchangeSegment`, and either
 *     a validated `D114SecurityIdentity` or its canonical `ISIN:<isin>:<series>` string).
 */
export type FreshnessRequest =
  | { readonly domain: 'D02_OHLCV' }
  | {
      readonly domain: 'D01_QUOTES';
      readonly companyId: string;
      readonly exchangeSegment: 'NSE_EQ' | 'BSE_EQ';
      readonly securityIdentity: D114SecurityIdentity;
      readonly securityId?: never;
    }
  | {
      readonly domain: 'D01_QUOTES';
      readonly companyId: string;
      readonly exchangeSegment: 'NSE_EQ' | 'BSE_EQ';
      readonly securityId: string;
      readonly securityIdentity?: never;
    };

export type MarketDataTransportFreshnessOutcome =
  | { readonly ok: true; readonly status: FreshnessStatus }
  | { readonly ok: false; readonly failure: MarketDataTransportFailure };

export interface MarketDataTransportClientOptions {
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
  readonly env?: DhanEnvSource;
}

export interface MarketDataHttpOptions {
  service: DhanMarketDataService;
  identityService?: DhanIdentityApiService;
  /** Transport credential (server-side secret; never a Dhan credential). */
  token?: string;
  host?: string;
  port?: number;
  requestTimeoutMs?: number;
  env?: DhanEnvSource;
}

interface ErrorBody {
  error: {
    code: string;
    message: string;
    /**
     * Numeric HTTP status the *vendor* returned, when the failure came from a vendor response.
     *
     * Why this is separate from the daemon's own status: the daemon reports 502 for every typed
     * provider failure, so without this field a vendor 401 and a vendor 403 are indistinguishable
     * in the operator's evidence (`MarketDataTransportFailure.httpStatus`, by contrast, carries the
     * *daemon's* status — the two must never be conflated).
     *
     * Only the integer is exposed. The vendor's response body, its error code and its message are
     * never propagated: they are uncontrolled third-party content, and an auth error body is
     * exactly the kind of payload that must not be reflected.
     *
     * Deliberately absent when the failure had no vendor HTTP response (credential, configuration,
     * transport, rate-budget and timeout-before-send failures), rather than present-and-null.
     */
    vendorHttpStatus?: number;
  };
}

/**
 * Codes that can only be produced by interpreting a vendor HTTP response, and for which the vendor's
 * numeric status is therefore a meaningful diagnostic.
 *
 * Scoped deliberately narrowly: a vendor status is attached only where a vendor response produced
 * the failure, so a credential-resolution or production-guard failure can never be dressed up with
 * an HTTP status it never received.
 */
const VENDOR_STATUS_BEARING_CODES: ReadonlySet<string> = new Set([
  'AUTHENTICATION_FAILURE',
  'RATE_LIMITED',
  'TIMEOUT',
  'HTTP_ERROR',
  'MALFORMED_RESPONSE',
  'PROVIDER_STATUS_FAILURE',
  'MISSING_REQUIRED_FIELD',
  'INSTRUMENT_NOT_IN_RESPONSE',
  'CANONICAL_VALIDATION_FAILURE',
  'STALE_DATA_SUPPRESSED',
]);

const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(['127.0.0.1', '::1', '[::1]', 'localhost']);

export function isLoopbackTransportHost(host: string): boolean {
  return LOOPBACK_HOSTS.has(host.trim().toLowerCase());
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(text) });
  res.end(text);
}

function sendError(
  res: ServerResponse,
  status: number,
  code: string,
  message: string,
  vendorHttpStatus?: number
): void {
  sendJson(res, status, {
    error: {
      code,
      message,
      // Only a finite integer is ever emitted; anything else is dropped rather than coerced, so a
      // malformed provider value cannot become a diagnostic the operator would trust.
      ...(vendorHttpStatus !== undefined && Number.isInteger(vendorHttpStatus) && vendorHttpStatus > 0
        ? { vendorHttpStatus }
        : {}),
    },
  } satisfies ErrorBody);
}

/**
 * Why a configured transport credential cannot be used.
 *
 * All three describe the value the *operator configured*, never one a client presented, and all
 * three are operator-facing startup refusals: the daemon will not bind, so none of them can ever
 * be produced by a request. A malformed `Authorization` header never reaches this taxonomy — it
 * gets the same uniform 401 as a wrong token.
 */
export type TransportTokenProblem =
  | 'TRANSPORT_TOKEN_MISSING'
  | 'TRANSPORT_TOKEN_NOT_ASCII'
  | 'TRANSPORT_TOKEN_WHITESPACE';

/**
 * Validates the configured transport credential at startup.
 *
 * The comparison is on the exact bytes of the configured value, so anything invisible — a
 * trailing CR from a file read, a NBSP pasted from a document, a zero-width space — makes the
 * token unmatchable while looking identical to the operator. That failure mode is
 * indistinguishable from a wrong token at request time (the 401 body is deliberately uniform),
 * so it is rejected here instead, where the diagnostic can still name the problem.
 *
 * Returns `null` when the value is usable. Never includes the value, its length or a
 * fingerprint in the returned code.
 */
export function validateTransportToken(token: string | undefined): TransportTokenProblem | null {
  if (!token || !token.trim()) return 'TRANSPORT_TOKEN_MISSING';
  // `Authorization` is an ASCII header field: Node decodes it as latin1 and re-encodes one byte
  // per character, so a code point above U+007F can never match a value a client sends. DEL and
  // the remaining C0 controls are excluded for the same reason — a client cannot transmit them
  // in a header value at all. TAB/CR/LF are set aside from this test so that a stray line ending
  // is reported as the whitespace problem it is rather than as an encoding problem.
  if (/[^\x09\x0a\x0d\x20-\x7e]/.test(token)) return 'TRANSPORT_TOKEN_NOT_ASCII';
  // Whitespace is never part of the credential: it is not trimmed at request time, so any
  // leading, trailing or interior occurrence makes the value unmatchable. Reported separately
  // because the remedy is different (re-enter, do not re-encode).
  if (/[\x09\x0a\x0d ]/.test(token)) return 'TRANSPORT_TOKEN_WHITESPACE';
  return null;
}

/**
 * Splits an `Authorization` header value into the credential it carries.
 *
 * RFC 7235 §2.1 makes the auth-scheme case-insensitive and allows one or more SP/HTAB between
 * the scheme and the credentials. Clients and proxies vary in what they send, so the parser
 * accepts `Bearer`, `bearer`, `BEARER` and any SP/HTAB run. It returns `undefined` — never a
 * partial value — for anything else, so a malformed header can only be rejected, never coerced
 * into something that happens to compare equal.
 */
export function parseBearerAuthorization(header: string | string[] | undefined): string | undefined {
  // A repeated header arrives joined as `a, b`; that is not one credential, and splitting on the
  // comma would accept a header no client means to send.
  if (typeof header !== 'string') return undefined;
  const match = /^[ \t]*([A-Za-z]+)[ \t]+([^ \t]+)[ \t]*$/.exec(header);
  if (!match) return undefined;
  if ((match[1] as string).toLowerCase() !== 'bearer') return undefined;
  const credential = match[2];
  return credential === undefined || credential.length === 0 ? undefined : credential;
}

function tokenMatches(provided: string | undefined, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // Length is full-width by construction (UTF-8 byte counts), so this leaks nothing beyond
  // `timingSafeEqual`'s own requirement that inputs be equal-length.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function readBody(req: IncomingMessage, maxBytes: number): Promise<string | { tooLarge: true }> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > maxBytes) return { tooLarge: true };
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Creates the authenticated market-data HTTP server. `listen` is left to the
 * caller so startup/shutdown stay deterministic and testable, with loopback
 * binding enforced on listen.
 */
export function createMarketDataHttpServer(options: MarketDataHttpOptions): Server {
  const env: DhanEnvSource =
    options.env ?? (typeof process !== 'undefined' && process.env ? process.env : {});

  if (isDhanProductionEnvironment(env)) {
    throw new Error(
      'Production market-data transport is not authorized; Stage 1 scope is restricted to local non-production execution'
    );
  }

  const token = options.token ?? env[MARKET_DATA_TRANSPORT_TOKEN_ENV];
  const timeoutMs = options.requestTimeoutMs ?? MARKET_DATA_REQUEST_TIMEOUT_MS;
  const defaultHost = options.host ?? '127.0.0.1';

  // Fail closed on an unusable credential, and say which kind of unusable it is. The message
  // names the problem only: no value, no length, no fingerprint, no offset.
  const tokenProblem = validateTransportToken(token);
  if (tokenProblem === 'TRANSPORT_TOKEN_MISSING') {
    // Fail closed: without a transport credential there is no authenticated endpoint.
    throw new Error(
      `${MARKET_DATA_TRANSPORT_TOKEN_ENV} is not set; refusing to start an unauthenticated market-data transport`
    );
  }
  if (tokenProblem === 'TRANSPORT_TOKEN_NOT_ASCII') {
    throw new Error(
      `${MARKET_DATA_TRANSPORT_TOKEN_ENV} contains non-ASCII or control characters; ` +
        'the value cannot survive an HTTP Authorization header, so it could never authenticate. ' +
        'Re-enter it as plain ASCII (a pasted non-breaking space or zero-width space is the usual ' +
        'cause). The supplied value is not echoed.'
    );
  }
  if (tokenProblem === 'TRANSPORT_TOKEN_WHITESPACE') {
    throw new Error(
      `${MARKET_DATA_TRANSPORT_TOKEN_ENV} contains whitespace (leading, trailing or interior); ` +
        'whitespace is not part of the credential and cannot be transmitted or compared. ' +
        'Re-enter the value without it. The supplied value is not echoed.'
    );
  }
  const expectedToken = token as string;

  if (!isLoopbackTransportHost(defaultHost)) {
    throw new Error(
      `Market-data transport must bind to local loopback only (127.0.0.1, ::1, or localhost); refusing host '${defaultHost}'`
    );
  }

  const service = options.service;

  const server = createServer((req, res) => {
    void (async () => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const path = url.pathname;

      // Auth on every route, before any handling. Same gate for /v1/health as for every other
      // local endpoint: there is no unauthenticated path to the service, not even a liveness one.
      const provided = parseBearerAuthorization(req.headers.authorization);
      if (!tokenMatches(provided, expectedToken)) {
        sendError(res, 401, 'UNAUTHENTICATED', 'missing or invalid transport credential');
        return;
      }

      if (path === MARKET_DATA_ROUTES.health && req.method === 'GET') {
        sendJson(res, 200, await service.health());
        return;
      }

      if (path === MARKET_DATA_ROUTES.diagnostics && req.method === 'GET') {
        if ((req.url?.length ?? 0) > 2048 || url.searchParams.size > 0) {
          sendError(res, 400, 'MALFORMED_REQUEST', 'diagnostics accepts no query parameters');
          return;
        }
        sendJson(res, 200, await service.getDiagnostics());
        return;
      }

      if (path === MARKET_DATA_ROUTES.freshness && req.method === 'GET') {
        const params = url.searchParams;
        const allowed = new Set(['domain', 'companyId', 'exchangeSegment', 'securityId']);
        if ((req.url?.length ?? 0) > 2048 || [...params.keys()].some(k => !allowed.has(k) || params.getAll(k).length !== 1)) {
          sendError(res, 400, 'MALFORMED_REQUEST', 'invalid freshness query'); return;
        }
        const domain = params.get('domain');
        if (domain === 'D02_OHLCV' && params.size === 1) {
          sendJson(res, 200, service.getFreshness({ domain })); return;
        }
        const companyId = params.get('companyId');
        const segment = params.get('exchangeSegment');
        const securityId = params.get('securityId');
        const parts = securityId?.split(':') ?? [];
        const identity = securityId && isD114SecurityId(securityId) ? buildD114SecurityIdentity(parts[1], parts[2]) : null;
        if (domain !== 'D01_QUOTES' || !companyId?.trim() || companyId.length > 100 ||
            (segment !== 'NSE_EQ' && segment !== 'BSE_EQ') || !identity || securityId!.length > 100) {
          sendError(res, 400, 'MALFORMED_REQUEST', 'freshness requires a valid domain and exact quote scope'); return;
        }
        sendJson(res, 200, service.getFreshness({ domain, companyId, exchangeSegment: segment, securityIdentity: identity })); return;
      }

      if (path === MARKET_DATA_ROUTES.verifyConnection && req.method === 'POST') {
        if ((req.url?.length ?? 0) > 2048 || url.searchParams.size > 0) {
          sendError(res, 400, 'MALFORMED_REQUEST', 'verifyConnection accepts no query parameters');
          return;
        }

        const rawVerifyBody = await readBody(req, MARKET_DATA_MAX_REQUEST_BYTES);
        if (typeof rawVerifyBody !== 'string') {
          sendError(res, 413, 'REQUEST_TOO_LARGE', 'request body exceeds the configured limit');
          return;
        }

        let verifyParsed: unknown = {};
        if (rawVerifyBody.trim() !== '') {
          try {
            verifyParsed = JSON.parse(rawVerifyBody);
          } catch {
            sendError(res, 400, 'MALFORMED_REQUEST', 'request body is not valid JSON');
            return;
          }
        }

        if (typeof verifyParsed !== 'object' || verifyParsed === null || Array.isArray(verifyParsed)) {
          sendError(res, 400, 'MALFORMED_REQUEST', 'request body must be an object');
          return;
        }

        const verifyBody = verifyParsed as Record<string, unknown>;
        if (Object.keys(verifyBody).some((key) => key !== 'mode')) {
          sendError(res, 400, 'MALFORMED_REQUEST', 'unexpected request field');
          return;
        }
        if (
          verifyBody.mode !== undefined &&
          verifyBody.mode !== 'LIVE_PROBE' &&
          verifyBody.mode !== 'LOCAL_ONLY'
        ) {
          sendError(res, 400, 'MALFORMED_REQUEST', 'mode must be LIVE_PROBE or LOCAL_ONLY');
          return;
        }

        const mode: DhanVerificationMode =
          verifyBody.mode === 'LOCAL_ONLY' ? 'LOCAL_ONLY' : 'LIVE_PROBE';
        let verifyTimer: ReturnType<typeof setTimeout> | undefined;
        try {
          const verifyOutcome = await Promise.race([
            (async () => {
              const verification = await service.verifyConnection({ mode });
              const diagnostics = await service.getDiagnostics();
              return buildServiceConnectionVerification(mode, verification, diagnostics);
            })(),
            new Promise<'TIMEOUT'>((resolvePromise) => {
              verifyTimer = setTimeout(() => resolvePromise('TIMEOUT'), timeoutMs);
              verifyTimer.unref?.();
            }),
          ]);
          if (verifyOutcome === 'TIMEOUT') {
            sendError(res, 504, 'REQUEST_TIMEOUT', 'request exceeded the bounded execution time');
            return;
          }
          sendJson(res, 200, verifyOutcome);
          return;
        } finally {
          if (verifyTimer !== undefined) clearTimeout(verifyTimer);
        }
      }

      const identityRoute = path === MARKET_DATA_ROUTES.instrumentSearch || path === MARKET_DATA_ROUTES.identityResolve || path === MARKET_DATA_ROUTES.identityQualify;
      if (req.method !== 'POST' || (path !== MARKET_DATA_ROUTES.quotes && path !== MARKET_DATA_ROUTES.historical && !(identityRoute && options.identityService))) {
        sendError(res, 404, 'NOT_FOUND', 'unknown route');
        return;
      }

      const rawBody = await readBody(req, MARKET_DATA_MAX_REQUEST_BYTES);
      if (typeof rawBody !== 'string') {
        sendError(res, 413, 'REQUEST_TOO_LARGE', 'request body exceeds the configured limit');
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        sendError(res, 400, 'MALFORMED_REQUEST', 'request body is not valid JSON');
        return;
      }

      if (identityRoute && options.identityService) {
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          sendError(res, 400, 'MALFORMED_REQUEST', 'request body must be an object'); return;
        }
        const body = parsed as Record<string, unknown>;
        const keys = path === MARKET_DATA_ROUTES.instrumentSearch ? ['query'] : path === MARKET_DATA_ROUTES.identityResolve ? ['companyId', 'exchange', 'securityId'] : ['isin', 'exchange', 'symbol'];
        if (Object.keys(body).some(key => !keys.includes(key))) {
          sendError(res, 400, 'MALFORMED_REQUEST', 'unexpected request field'); return;
        }
        if (path === MARKET_DATA_ROUTES.instrumentSearch) {
          if (typeof body.query !== 'string' || !body.query.trim() || body.query.length > 100) {
            sendError(res, 400, 'MALFORMED_REQUEST', 'query must be a nonempty string of at most 100 characters'); return;
          }
          sendJson(res, 200, { results: options.identityService.search(body.query) }); return;
        }
        if ((body.exchange !== 'NSE' && body.exchange !== 'BSE') || (body.symbol !== undefined && (typeof body.symbol !== 'string' || body.symbol.length > 100))) {
          sendError(res, 400, 'MALFORMED_REQUEST', 'valid exchange and optional symbol are required'); return;
        }
        if (path === MARKET_DATA_ROUTES.identityQualify) {
          if (body.isin !== undefined && (typeof body.isin !== 'string' || body.isin.length > 100)) {
            sendError(res, 400, 'MALFORMED_REQUEST', 'isin must be a string'); return;
          }
          sendJson(res, 200, options.identityService.qualify({ isin: (body.isin as string | undefined) ?? '', exchange: body.exchange, ...(typeof body.symbol === 'string' ? { symbol: body.symbol } : {}) })); return;
        }
        if (typeof body.companyId !== 'string' || !body.companyId.trim() || body.companyId.length > 100 || typeof body.securityId !== 'string' || body.securityId.length > 100) {
          sendError(res, 400, 'MALFORMED_REQUEST', 'companyId and securityId are required'); return;
        }
        sendJson(res, 200, options.identityService.resolve({ companyId: body.companyId, exchange: body.exchange, securityId: body.securityId })); return;
      }

      // Quote requests must carry the exact canonical P04 security id; a
      // malformed identity is rejected here, before the service (and thus
      // before any provider invocation).
      let quoteRequest: QuoteRequest | undefined;
      if (path === MARKET_DATA_ROUTES.quotes) {
        const body = parsed as Record<string, unknown>;
        const securityId = body?.securityId;
        const parts = typeof securityId === 'string' ? securityId.split(':') : [];
        const identity =
          parts.length === 3 && parts[0] === 'ISIN'
            ? buildD114SecurityIdentity(parts[1] ?? '', parts[2] ?? '')
            : null;
        if (!identity || !isD114SecurityIdentity(identity) || typeof body?.companyId !== 'string') {
          sendError(
            res,
            400,
            'MALFORMED_REQUEST',
            'quotes require companyId and a canonical securityId (ISIN:<isin>:<series>)'
          );
          return;
        }
        quoteRequest = {
          companyId: body.companyId,
          securityIdentity: identity,
          ...(body.exchangeSegment === 'NSE_EQ' || body.exchangeSegment === 'BSE_EQ'
            ? { exchangeSegment: body.exchangeSegment }
            : {}),
        };
      }

      // Bounded execution: a hung handler must not hold the connection forever.
      const result = await Promise.race([
        path === MARKET_DATA_ROUTES.quotes
          ? service.getQuote(quoteRequest as QuoteRequest)
          : service.getHistorical(parsed as HistoricalServiceRequest),
        new Promise<'TIMEOUT'>((resolvePromise) => setTimeout(() => resolvePromise('TIMEOUT'), timeoutMs)),
      ]);

      if (result === 'TIMEOUT') {
        sendError(res, 504, 'REQUEST_TIMEOUT', 'request exceeded the bounded execution time');
        return;
      }
      if (result.ok) {
        sendJson(res, 200, result);
        return;
      }
      const status = result.failure.code === 'RATE_LIMITED' ? 429 : 502;
      // The daemon's status stays exactly as it was; the vendor's numeric status rides alongside it
      // as a separate, clearly named diagnostic, and only for vendor-response failures.
      const vendorHttpStatus = VENDOR_STATUS_BEARING_CODES.has(result.failure.code)
        ? result.failure.httpStatus
        : undefined;
      sendError(res, status, result.failure.code, result.failure.message, vendorHttpStatus);
    })().catch(() => {
      if (!res.headersSent) sendError(res, 500, 'INTERNAL_ERROR', 'unhandled transport error');
    });
  });

  // Enforce loopback-only listener binding on TCP listen calls.
  const rawListen = server.listen.bind(server);
  server.listen = ((...args: unknown[]): Server => {
    const first = args[0];
    if (typeof first === 'number') {
      const second = args[1];
      if (typeof second === 'string') {
        if (!isLoopbackTransportHost(second)) {
          throw new Error(
            `Market-data transport must bind to local loopback only; refusing host '${second}'`
          );
        }
        return (rawListen as (...a: unknown[]) => Server)(...args);
      }
      return (rawListen as (...a: unknown[]) => Server)(first, defaultHost, ...args.slice(1));
    }
    if (typeof first === 'object' && first !== null) {
      const listenOpts = first as ListenOptions;
      if (!listenOpts.path) {
        const host = listenOpts.host ?? defaultHost;
        if (!isLoopbackTransportHost(host)) {
          throw new Error(
            `Market-data transport must bind to local loopback only; refusing host '${host}'`
          );
        }
        return (rawListen as (...a: unknown[]) => Server)({ ...listenOpts, host }, ...args.slice(1));
      }
    }
    return (rawListen as (...a: unknown[]) => Server)(...args);
  }) as Server['listen'];

  return server;
}

function fallbackHttpFailureCode(status: number): MarketDataTransportFailureCode {
  if (status === 401 || status === 403) return 'UNAUTHENTICATED';
  if (status === 400) return 'MALFORMED_REQUEST';
  if (status === 404) return 'NOT_FOUND';
  if (status === 413) return 'REQUEST_TOO_LARGE';
  if (status === 429) return 'RATE_LIMITED';
  if (status === 408 || status === 504) return 'REQUEST_TIMEOUT';
  return 'HTTP_ERROR';
}

function parseErrorPayload(raw: unknown, status: number): MarketDataTransportFailure {
  if (typeof raw === 'object' && raw !== null && 'error' in raw) {
    const errObj = (raw as { error?: unknown }).error;
    if (typeof errObj === 'object' && errObj !== null) {
      const code = (errObj as { code?: unknown }).code;
      const message = (errObj as { message?: unknown }).message;
      if (typeof code === 'string' && code.trim()) {
        // A vendor status is accepted only as a positive integer; a string, a float or a body-shaped
        // object is discarded rather than trusted or coerced.
        const vendorHttpStatus = (errObj as { vendorHttpStatus?: unknown }).vendorHttpStatus;
        return {
          code: code as MarketDataTransportFailureCode,
          message: typeof message === 'string' && message.trim() ? message : 'transport request failed closed',
          httpStatus: status,
          ...(typeof vendorHttpStatus === 'number' && Number.isInteger(vendorHttpStatus) && vendorHttpStatus > 0
            ? { vendorHttpStatus }
            : {}),
        };
      }
    }
  }
  return {
    code: fallbackHttpFailureCode(status),
    message: `market-data transport returned HTTP ${status}`,
    httpStatus: status,
  };
}

/**
 * Consumer-side client: IRR calls IPD's local server-to-server transport via
 * this provider-neutral client and never instantiates Dhan provider primitives
 * or handles Dhan credentials. Every failure path returns an explicit typed
 * fail-closed outcome rather than throwing raw network exceptions.
 */
export class MarketDataTransportClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly envOverride?: DhanEnvSource;

  constructor(baseUrl: string, token: string, options: MarketDataTransportClientOptions = {}) {
    this.baseUrl = (baseUrl ?? '').trim().replace(/\/+$/, '');
    this.token = token ?? '';
    this.timeoutMs =
      typeof options.timeoutMs === 'number' && Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
        ? options.timeoutMs
        : MARKET_DATA_REQUEST_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
    if (options.env !== undefined) {
      this.envOverride = options.env;
    }
  }

  private preflightCheck(): MarketDataTransportFailure | null {
    const env: DhanEnvSource =
      this.envOverride ?? (typeof process !== 'undefined' && process.env ? process.env : {});
    if (isDhanProductionEnvironment(env)) {
      return {
        code: 'PRODUCTION_NOT_AUTHORIZED',
        message: 'Production market-data transport is not authorized',
      };
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(this.baseUrl);
    } catch {
      return {
        code: 'TRANSPORT_FAILURE',
        message: 'MarketDataTransportClient baseUrl is malformed',
      };
    }

    if (
      parsedUrl.protocol !== 'http:' ||
      !isLoopbackTransportHost(parsedUrl.hostname) ||
      parsedUrl.username !== '' ||
      parsedUrl.password !== '' ||
      parsedUrl.search !== ''
    ) {
      return {
        code: 'TRANSPORT_FAILURE',
        message:
          'MarketDataTransportClient is restricted to local loopback http:// server-to-server endpoints',
      };
    }

    if (!this.token || !this.token.trim()) {
      return {
        code: 'UNAUTHENTICATED',
        message: 'missing or empty transport credential',
      };
    }

    // A value the server would reject at startup can never authenticate, so refuse it here
    // rather than spending a request on a guaranteed 401. Same rules, same words as the server.
    const tokenProblem = validateTransportToken(this.token);
    if (tokenProblem !== null) {
      return {
        code: 'UNAUTHENTICATED',
        message:
          tokenProblem === 'TRANSPORT_TOKEN_NOT_ASCII'
            ? 'transport credential contains non-ASCII or control characters and cannot be sent'
            : 'transport credential contains whitespace and cannot match the daemon value',
      };
    }

    return null;
  }

  private async requestJson(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown
  ): Promise<{ ok: true; status: number; json: unknown } | { ok: false; failure: MarketDataTransportFailure }> {
    const preflight = this.preflightCheck();
    if (preflight) return { ok: false, failure: preflight };

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: {
          accept: 'application/json',
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
          authorization: `Bearer ${this.token}`,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        redirect: 'error',
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err: unknown) {
      const name = (err as { name?: unknown } | null)?.name;
      if (name === 'TimeoutError' || name === 'AbortError') {
        return {
          ok: false,
          failure: {
            code: 'TIMEOUT',
            message: `market-data transport request exceeded ${this.timeoutMs}ms timeout`,
          },
        };
      }
      return {
        ok: false,
        failure: {
          code: 'TRANSPORT_FAILURE',
          message: 'market-data transport request failed closed before receiving a response',
        },
      };
    }

    let rawText: string;
    try {
      rawText = await response.text();
    } catch {
      return {
        ok: false,
        failure: {
          code: 'TRANSPORT_FAILURE',
          message: 'failed to read market-data transport response body',
          httpStatus: response.status,
        },
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return {
        ok: false,
        failure: {
          code: 'MALFORMED_RESPONSE',
          message: 'market-data transport response is not valid JSON',
          httpStatus: response.status,
        },
      };
    }

    if (response.status < 200 || response.status >= 300) {
      return { ok: false, failure: parseErrorPayload(parsed, response.status) };
    }

    return { ok: true, status: response.status, json: parsed };
  }

  public async getQuote(request: QuoteRequest): Promise<MarketDataTransportQuoteOutcome> {
    if (
      !request ||
      typeof request.companyId !== 'string' ||
      !request.companyId.trim() ||
      !isD114SecurityIdentity(request.securityIdentity)
    ) {
      return {
        ok: false,
        failure: {
          code: 'MALFORMED_REQUEST',
          message: 'quotes require companyId and a canonical D114 securityIdentity (ISIN:<isin>:<series>)',
        },
      };
    }

    // The wire carries the canonical securityId string; the full validated
    // identity is reconstructed server-side. No Dhan identifiers ever cross.
    const call = await this.requestJson('POST', MARKET_DATA_ROUTES.quotes, {
      companyId: request.companyId,
      securityId: request.securityIdentity.securityId,
      ...(request.exchangeSegment ? { exchangeSegment: request.exchangeSegment } : {}),
    });
    if (!call.ok) return call;

    const payload = call.json as Partial<MarketDataTransportQuoteOutcome> | null;
    if (
      payload &&
      payload.ok === true &&
      payload.envelope !== undefined &&
      (payload.freshness === 'CURRENT' || payload.freshness === 'STALE')
    ) {
      return { ok: true, envelope: payload.envelope, freshness: payload.freshness };
    }

    return {
      ok: false,
      failure: {
        code: 'MALFORMED_RESPONSE',
        message: 'market-data transport returned a malformed quote envelope',
        httpStatus: call.status,
      },
    };
  }

  public async getHistorical(
    request: HistoricalServiceRequest
  ): Promise<MarketDataTransportHistoricalOutcome> {
    if (!request || typeof request.companyId !== 'string' || !request.companyId.trim()) {
      return {
        ok: false,
        failure: {
          code: 'MALFORMED_REQUEST',
          message: 'historical requests require a non-empty companyId',
        },
      };
    }

    const call = await this.requestJson('POST', MARKET_DATA_ROUTES.historical, request);
    if (!call.ok) return call;

    const payload = call.json as Partial<MarketDataTransportHistoricalOutcome> | null;
    if (payload && payload.ok === true && payload.result !== undefined) {
      return { ok: true, result: payload.result };
    }

    return {
      ok: false,
      failure: {
        code: 'MALFORMED_RESPONSE',
        message: 'market-data transport returned a malformed historical response',
        httpStatus: call.status,
      },
    };
  }

  public async health(): Promise<MarketDataTransportHealthOutcome> {
    const call = await this.requestJson('GET', MARKET_DATA_ROUTES.health);
    if (!call.ok) {
      return { ok: false, service: 'DOWN', failure: call.failure };
    }

    const payload = validateDhanServiceHealth(call.json);
    if (payload) return { ok: true, ...payload };

    return {
      ok: false,
      service: 'DOWN',
      failure: {
        code: 'MALFORMED_RESPONSE',
        message: 'market-data transport returned a malformed health payload',
        httpStatus: call.status,
      },
    };
  }

  /**
   * Read-only authenticated loopback `/v1/diagnostics` read (W-09 / D-7 §4.1).
   * Validates every field fail-closed and never triggers vendor calls or state mutation.
   */
  public async diagnostics(): Promise<MarketDataTransportDiagnosticsOutcome> {
    const call = await this.requestJson('GET', MARKET_DATA_ROUTES.diagnostics);
    if (!call.ok) {
      return { ok: false, failure: call.failure };
    }

    const payload = validateDhanServiceDiagnostics(call.json);
    if (payload) return { ok: true, ...payload };

    return {
      ok: false,
      failure: {
        code: 'MALFORMED_RESPONSE',
        message: 'market-data transport returned a malformed diagnostics payload',
        httpStatus: call.status,
      },
    };
  }

  /**
   * Explicit operator-initiated single-shot connection verification over loopback
   * (`POST /v1/connection/verify`, D-7 §3 / W-08 / W-10).
   * Issues at most ONE HTTP request, performs no automatic retry, and validates
   * the returned D-7 verification payload fail-closed.
   */
  public async verifyConnection(
    options?: VerifyProviderConnectionOptions
  ): Promise<MarketDataTransportVerifyOutcome> {
    if (options !== undefined) {
      if (typeof options !== 'object' || options === null || Array.isArray(options)) {
        return {
          ok: false,
          failure: {
            code: 'MALFORMED_REQUEST',
            message: 'verifyConnection options must be an object when provided',
          },
        };
      }
      const rawOpts = options as Record<string, unknown>;
      if (Object.keys(rawOpts).some((k) => k !== 'mode')) {
        return {
          ok: false,
          failure: {
            code: 'MALFORMED_REQUEST',
            message: 'verifyConnection options allow only optional mode',
          },
        };
      }
      if (
        rawOpts.mode !== undefined &&
        rawOpts.mode !== 'LIVE_PROBE' &&
        rawOpts.mode !== 'LOCAL_ONLY'
      ) {
        return {
          ok: false,
          failure: {
            code: 'MALFORMED_REQUEST',
            message: 'verifyConnection mode must be LIVE_PROBE or LOCAL_ONLY',
          },
        };
      }
    }

    const body = options?.mode !== undefined ? { mode: options.mode } : {};
    const call = await this.requestJson('POST', MARKET_DATA_ROUTES.verifyConnection, body);
    if (!call.ok) {
      return { ok: false, failure: call.failure };
    }

    const payload = validateDhanConnectionVerification(call.json);
    if (payload) return { ok: true, ...payload };

    return {
      ok: false,
      failure: {
        code: 'MALFORMED_RESPONSE',
        message: 'market-data transport returned a malformed connection verification payload',
        httpStatus: call.status,
      },
    };
  }

  /**
   * Read-only authenticated loopback `/v1/freshness` read (W-26 / IPD-P5 / W-19 / W-22).
   * Enforces the same production, loopback, bearer-token, timeout and fail-closed
   * validation guards as every other transport method, never mutates cache state or
   * invokes the vendor, and returns the validated IPD `FreshnessStatus` verbatim
   * (including W-19 D02 four-timestamp/revision evidence and W-22 calendar fields).
   */
  public async getFreshness(
    request: FreshnessRequest
  ): Promise<MarketDataTransportFreshnessOutcome> {
    if (typeof request !== 'object' || request === null || Array.isArray(request)) {
      return {
        ok: false,
        failure: {
          code: 'MALFORMED_REQUEST',
          message: 'freshness request must be an object specifying domain D01_QUOTES or D02_OHLCV',
        },
      };
    }

    const rawReq = request as unknown as Record<string, unknown>;
    const domain = rawReq.domain;
    let path: string;

    if (domain === 'D02_OHLCV') {
      if (Object.keys(rawReq).some((k) => k !== 'domain')) {
        return {
          ok: false,
          failure: {
            code: 'MALFORMED_REQUEST',
            message: 'D02_OHLCV freshness accepts the domain field alone',
          },
        };
      }
      path = `${MARKET_DATA_ROUTES.freshness}?domain=D02_OHLCV`;
    } else if (domain === 'D01_QUOTES') {
      const allowedKeys = new Set([
        'domain',
        'companyId',
        'exchangeSegment',
        'securityIdentity',
        'securityId',
      ]);
      if (Object.keys(rawReq).some((k) => !allowedKeys.has(k))) {
        return {
          ok: false,
          failure: {
            code: 'MALFORMED_REQUEST',
            message:
              'D01_QUOTES freshness allows only domain, companyId, exchangeSegment, and securityIdentity or securityId',
          },
        };
      }

      const companyId = rawReq.companyId;
      const exchangeSegment = rawReq.exchangeSegment;
      const hasIdentity = rawReq.securityIdentity !== undefined;
      const hasSecurityId = rawReq.securityId !== undefined;

      if (
        typeof companyId !== 'string' ||
        !companyId.trim() ||
        companyId.length > 100 ||
        (exchangeSegment !== 'NSE_EQ' && exchangeSegment !== 'BSE_EQ') ||
        hasIdentity === hasSecurityId
      ) {
        return {
          ok: false,
          failure: {
            code: 'MALFORMED_REQUEST',
            message:
              'D01_QUOTES freshness requires companyId, exchangeSegment (NSE_EQ or BSE_EQ), and an exact canonical D114 securityIdentity or securityId',
          },
        };
      }

      let resolvedSecurityId: string | null = null;
      if (hasIdentity) {
        if (
          isD114SecurityIdentity(rawReq.securityIdentity) &&
          rawReq.securityIdentity.securityId.length <= 100
        ) {
          resolvedSecurityId = rawReq.securityIdentity.securityId;
        }
      } else if (
        typeof rawReq.securityId === 'string' &&
        rawReq.securityId.length <= 100 &&
        isD114SecurityId(rawReq.securityId)
      ) {
        const parts = rawReq.securityId.split(':');
        if (buildD114SecurityIdentity(parts[1], parts[2]) !== null) {
          resolvedSecurityId = rawReq.securityId;
        }
      }

      if (resolvedSecurityId === null) {
        return {
          ok: false,
          failure: {
            code: 'MALFORMED_REQUEST',
            message:
              'D01_QUOTES freshness requires a canonical D114 security identity (ISIN:<isin>:<series>)',
          },
        };
      }

      const params = new URLSearchParams({
        domain: 'D01_QUOTES',
        companyId,
        exchangeSegment,
        securityId: resolvedSecurityId,
      });
      path = `${MARKET_DATA_ROUTES.freshness}?${params.toString()}`;
      if (path.length > 2048) {
        return {
          ok: false,
          failure: {
            code: 'MALFORMED_REQUEST',
            message: 'freshness request URL exceeds maximum allowed length',
          },
        };
      }
    } else {
      return {
        ok: false,
        failure: {
          code: 'MALFORMED_REQUEST',
          message: 'freshness requires a domain of D01_QUOTES or D02_OHLCV',
        },
      };
    }

    const call = await this.requestJson('GET', path);
    if (!call.ok) {
      return { ok: false, failure: call.failure };
    }

    const payload = validateDhanFreshnessStatus(call.json);
    if (payload !== null && payload.domain === domain) {
      return { ok: true, status: payload };
    }

    return {
      ok: false,
      failure: {
        code: 'MALFORMED_RESPONSE',
        message: 'market-data transport returned a malformed freshness payload',
        httpStatus: call.status,
      },
    };
  }
}
