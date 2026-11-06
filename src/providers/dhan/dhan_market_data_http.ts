/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Market-Data HTTP Transport (DHAN-P5) — server-to-server, authenticated
 *
 * The existing IPD IPC endpoint (src/ipc) is portfolio-only by governed
 * contract, so this is a dedicated, minimal node:http transport for market
 * data. It exposes ONLY the composed service — consumers never see Dhan
 * primitives, vendor DTOs, Dhan instrument ids or credentials.
 *
 * Routes (all JSON, all POST except health):
 *   POST /v1/quotes      { companyId, securityId: 'ISIN:<isin>:<series>', exchangeSegment? } -> D01 envelope or error
 *   POST /v1/historical  { companyId, exchangeSegment?, isin?, interval, fromDate, toDate } -> D02 result or error
 *   GET  /v1/health      -> ServiceHealth (never implies live connectivity)
 *
 * Auth: `Authorization: Bearer <token>` where the token comes from env
 *   IIPS_MARKET_DATA_TRANSPORT_TOKEN. The transport credential is separate
 *   from Dhan API credentials. Missing/unset token in a non-development
 *   configuration fails CLOSED (server refuses to start). Constant-time compare.
 *   Credentials never appear in URLs, responses or logs.
 *
 * Limits: request body <= 16 KiB, per-request execution bounded by a timeout,
 * one request per connection handled serially. Errors: {"error":{"code","message"}}.
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import {
  DhanMarketDataService,
  QuoteRequest,
  HistoricalServiceRequest,
} from './dhan_market_data_service.js';
import { buildD114SecurityIdentity, isD114SecurityIdentity } from '../../contracts/types.js';

export const MARKET_DATA_TRANSPORT_TOKEN_ENV = 'IIPS_MARKET_DATA_TRANSPORT_TOKEN';
export const MARKET_DATA_ROUTES = {
  quotes: '/v1/quotes',
  historical: '/v1/historical',
  health: '/v1/health',
} as const;

export const MARKET_DATA_MAX_REQUEST_BYTES = 16 * 1024;
export const MARKET_DATA_REQUEST_TIMEOUT_MS = 10_000;

export interface MarketDataHttpOptions {
  service: DhanMarketDataService;
  /** Transport credential (server-side secret; never a Dhan credential). */
  token?: string;
  host?: string;
  port?: number;
  requestTimeoutMs?: number;
}

interface ErrorBody {
  error: { code: string; message: string };
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
 * caller so startup/shutdown stay deterministic and testable.
 */
export function createMarketDataHttpServer(options: MarketDataHttpOptions): Server {
  const token = options.token ?? process.env[MARKET_DATA_TRANSPORT_TOKEN_ENV];
  const timeoutMs = options.requestTimeoutMs ?? MARKET_DATA_REQUEST_TIMEOUT_MS;

  if (!token) {
    // Fail closed: without a transport credential there is no authenticated endpoint.
    throw new Error(
      `${MARKET_DATA_TRANSPORT_TOKEN_ENV} is not set; refusing to start an unauthenticated market-data transport`
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

      if (req.method !== 'POST' || (path !== MARKET_DATA_ROUTES.quotes && path !== MARKET_DATA_ROUTES.historical)) {
        sendError(res, 404, 'NOT_FOUND', 'unknown route');
        return;
      }

      const body = await readBody(req, MARKET_DATA_MAX_REQUEST_BYTES);
      if (typeof body !== 'string') {
        sendError(res, 413, 'REQUEST_TOO_LARGE', 'request body exceeds the configured limit');
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        sendError(res, 400, 'MALFORMED_REQUEST', 'request body is not valid JSON');
        return;
      }

      // Quote requests must carry the exact canonical P04 security id; a
      // malformed identity is rejected here, before the service (and thus
      // before any provider invocation).
      let quoteRequest: QuoteRequest | undefined;
      if (path === MARKET_DATA_ROUTES.quotes) {
        const body = parsed as Record<string, unknown>;
        const securityId = body?.securityId;
        const identity = typeof securityId === 'string' ? buildD114SecurityIdentity(
          securityId.split(':')[1],
          securityId.split(':')[2],
        ) : null;
        if (!identity || !isD114SecurityIdentity(identity) || typeof body?.companyId !== 'string') {
          sendError(res, 400, 'MALFORMED_REQUEST', 'quotes require companyId and a canonical securityId (ISIN:<isin>:<series>)');
          return;
        }
        quoteRequest = {
          companyId: body.companyId as string,
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

  return server;
}

/** Consumer-side client: IRR calls the transport, never the provider composition. */
export class MarketDataTransportClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string
  ) {}

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.token}` },
      body: JSON.stringify(body),
    });
    return (await response.json()) as T;
  }

  public getQuote(request: QuoteRequest) {
    // The wire carries the canonical securityId string; the full validated
    // identity is reconstructed server-side. No Dhan identifiers ever cross.
    return this.post(MARKET_DATA_ROUTES.quotes, {
      companyId: request.companyId,
      securityId: request.securityIdentity.securityId,
      ...(request.exchangeSegment ? { exchangeSegment: request.exchangeSegment } : {}),
    });
  }

  public getHistorical(request: HistoricalServiceRequest) {
    return this.post(MARKET_DATA_ROUTES.historical, request);
  }

  public async health() {
    const response = await fetch(`${this.baseUrl}${MARKET_DATA_ROUTES.health}`, {
      headers: { authorization: `Bearer ${this.token}` },
    });
    return response.json();
  }
}
