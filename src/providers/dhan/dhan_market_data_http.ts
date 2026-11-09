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
 * Routes (all JSON, all POST except health):
 *   POST /v1/quotes      { companyId, securityId: 'ISIN:<isin>:<series>', exchangeSegment? } -> D01 envelope or error
 *   POST /v1/historical  { companyId, exchangeSegment?, isin?, interval, fromDate, toDate } -> D02 result or error
 *   GET  /v1/health      -> ServiceHealth (never implies live connectivity)
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
import { buildD114SecurityIdentity, isD114SecurityId, isD114SecurityIdentity } from '../../contracts/types.js';
import { isDhanProductionEnvironment, type DhanEnvSource } from './dhan_config.js';
import { DhanFailureCode } from './dhan_failures.js';
import { DhanHistoricalNormalizationResult } from './dhan_historical_adapter.js';
import {
  DhanMarketDataService,
  QuoteRequest,
  HistoricalServiceRequest,
  ServiceHealth,
} from './dhan_market_data_service.js';

export const MARKET_DATA_TRANSPORT_TOKEN_ENV = 'IIPS_MARKET_DATA_TRANSPORT_TOKEN';
export const MARKET_DATA_ROUTES = {
  quotes: '/v1/quotes',
  historical: '/v1/historical',
  health: '/v1/health',
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
  readonly httpStatus?: number;
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
  error: { code: string; message: string };
}

const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(['127.0.0.1', '::1', '[::1]', 'localhost']);

export function isLoopbackTransportHost(host: string): boolean {
  return LOOPBACK_HOSTS.has(host.trim().toLowerCase());
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(text) });
  res.end(text);
}

function sendError(res: ServerResponse, status: number, code: string, message: string): void {
  sendJson(res, status, { error: { code, message } } satisfies ErrorBody);
}

function tokenMatches(provided: string | undefined, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
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

  if (!token || !token.trim()) {
    // Fail closed: without a transport credential there is no authenticated endpoint.
    throw new Error(
      `${MARKET_DATA_TRANSPORT_TOKEN_ENV} is not set; refusing to start an unauthenticated market-data transport`
    );
  }

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

      // Auth on every route, before any handling.
      const auth = req.headers.authorization;
      const provided = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
      if (!tokenMatches(provided, token)) {
        sendError(res, 401, 'UNAUTHENTICATED', 'missing or invalid transport credential');
        return;
      }

      if (path === MARKET_DATA_ROUTES.health && req.method === 'GET') {
        sendJson(res, 200, await service.health());
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
      sendError(res, status, result.failure.code, result.failure.message);
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
        return {
          code: code as MarketDataTransportFailureCode,
          message: typeof message === 'string' && message.trim() ? message : 'transport request failed closed',
          httpStatus: status,
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

    const payload = call.json as Partial<ServiceHealth> | null;
    if (
      payload &&
      (payload.service === 'UP' || payload.service === 'DOWN') &&
      (payload.providerConfiguration === 'CONFIGURED' ||
        payload.providerConfiguration === 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE') &&
      payload.liveProviderConnectivity === 'NOT_CHECKED_PRE_ACCESS' &&
      payload.providerQualification === 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED'
    ) {
      return {
        ok: true,
        service: payload.service,
        providerConfiguration: payload.providerConfiguration,
        liveProviderConnectivity: payload.liveProviderConnectivity,
        providerQualification: payload.providerQualification,
      };
    }

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
}
