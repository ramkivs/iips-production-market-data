/**
 * Institutional Investment Platform System (IIPS)
 * Additive IPD-Owned HTTP Boundary (NP04-G24 / §15)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Responsibilities:
 *   configuration -> authentication -> authorization -> request validation ->
 *   portfolio read/write boundary -> error mapping -> startup -> shutdown
 *
 * Startup order (NP04 governing decision):
 *   1. validate configuration
 *   2. establish database connection
 *   3. apply migrations
 *   4. verify migration state
 *   5. only THEN start HTTP listening
 *
 * This server is additive and separate from the IRR `/api/portfolio` boundary
 * and separate from PIT. It never exposes internal persistence structures.
 */

import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Socket } from 'node:net';

import { IdentityService } from '../app_identity/service.js';
import { OidcVerifier } from '../auth/oidc-verifier.js';
import { loadOidcTrustConfig } from '../auth/config.js';
import type { VerifiedOidcCredential } from '../auth/oidc-verifier.js';
import type { PersistenceHandle } from '../persistence/bootstrap.js';
import { initializePersistence } from '../persistence/bootstrap.js';
import { DurablePortfolioStore } from '../portfolio/durable-store.js';
import type { UserHoldingInput } from '../../frontend/src/features/portfolio/import/types.js';
import { PortfolioAuthorizer } from './authorization.js';
import { badRequest, HttpError, mapDomainError } from './errors.js';
import { loadIpdHttpConfig, MAX_BODY_BYTES, type IpdHttpConfig } from './config.js';

export interface IpdServerDependencies {
  readonly persistence: PersistenceHandle;
  readonly verifier: OidcVerifier;
  readonly http?: IpdHttpConfig;
}

interface JsonResponse {
  status: number;
  body: unknown;
}

export class IpdHttpServer {
  private readonly server: http.Server;
  private readonly store: DurablePortfolioStore;
  private readonly identityService: IdentityService;
  private readonly authorizer: PortfolioAuthorizer;
  private readonly sockets = new Set<Socket>();
  private listening = false;

  constructor(private readonly dependencies: IpdServerDependencies) {
    this.store = new DurablePortfolioStore(dependencies.persistence.connection);
    this.identityService = new IdentityService(dependencies.persistence.connection);
    this.authorizer = new PortfolioAuthorizer(this.identityService, this.store);
    this.server = http.createServer((req, res) => {
      void this.handle(req, res);
    });
    this.server.on('connection', (socket) => {
      this.sockets.add(socket);
      socket.on('close', () => this.sockets.delete(socket));
    });
  }

  public get port(): number | null {
    const address = this.server.address();
    return address && typeof address === 'object' ? (address as AddressInfo).port : null;
  }

  public get isListening(): boolean {
    return this.listening;
  }

  /** Starts listening. Persistence is already initialized before this is called. */
  public async listen(config?: IpdHttpConfig): Promise<number> {
    const resolved = config ?? this.dependencies.http ?? loadIpdHttpConfig();
    return new Promise<number>((resolve, reject) => {
      this.server.once('error', reject);
      this.server.listen(resolved.port, resolved.host, () => {
        this.listening = true;
        this.server.removeListener('error', reject);
        resolve(this.port ?? resolved.port);
      });
    });
  }

  /** Graceful shutdown: stop accepting, drain sockets, close persistence last. */
  public async close(): Promise<void> {
    if (!this.listening) {
      this.dependencies.persistence.close();
      return;
    }
    await new Promise<void>((resolve, reject) => {
      this.server.close((error) => (error ? reject(error) : resolve()));
      for (const socket of this.sockets) {
        socket.destroy();
      }
      this.sockets.clear();
    });
    this.listening = false;
    this.dependencies.persistence.close();
  }

  // ---------------------------------------------------------------- routing

  private async handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const method = (req.method ?? 'GET').toUpperCase();
      const url = new URL(req.url ?? '/', 'http://ipd.local');
      const pathname = url.pathname.replace(/\/+$/, '') || '/';

      if (method === 'GET' && pathname === '/api/ipd/health') {
        return this.send(res, {
          status: 200,
          body: { status: 'UP', mode: 'NON_PRODUCTION', persistence: 'CONNECTED' },
        });
      }

      if (!pathname.startsWith('/api/ipd/')) {
        return this.send(res, { status: 404, body: { error: 'NOT_FOUND' } });
      }

      // Authentication: every /api/ipd/* route requires a verified credential.
      const credential = await this.dependencies.verifier.verifyAuthorizationHeader(
        req.headers.authorization
      );

      const tenantHeader = req.headers['x-ipd-tenant-id'];
      const requestedTenantId =
        typeof tenantHeader === 'string' && tenantHeader.trim() !== ''
          ? tenantHeader.trim()
          : undefined;

      const segments = pathname.split('/').filter((s) => s.length > 0); // ['api','ipd', ...]

      if (segments[2] !== 'portfolios') {
        return this.send(res, { status: 404, body: { error: 'NOT_FOUND' } });
      }

      const portfolioId = segments[3] ? decodeURIComponent(segments[3]) : undefined;

      // --- collection routes ---
      if (!portfolioId) {
        if (method !== 'GET' && method !== 'POST') {
          return this.send(res, { status: 405, body: { error: 'METHOD_NOT_ALLOWED' } });
        }
        const scope = this.authorizer.authorizeScope(credential, requestedTenantId);

        if (method === 'GET') {
          const portfolios = this.store.listPortfolios(scope);
          return this.send(res, {
            status: 200,
            body: {
              portfolios: portfolios.map((p) => ({
                portfolioId: p.portfolioId,
                portfolioName: p.portfolioName,
                revision: p.revision,
                totalMarketValue: p.totalMarketValue,
                totalHoldingsCount: p.totalHoldingsCount,
                weightSumPercentage: p.weightSumPercentage,
                lastUpdated: p.lastUpdated,
                provenanceDigest: p.provenanceDigest,
                isSaved: p.isSaved,
              })),
            },
          });
        }

        const body = (await this.readJson(req)) as { portfolioName?: unknown } | null;
        const portfolioName = typeof body?.portfolioName === 'string' ? body.portfolioName : undefined;
        const created = this.store.createPortfolio({
          applicationUserId: scope.applicationUserId,
          tenantId: scope.tenantId,
          portfolioName,
        });
        return this.send(res, { status: 201, body: { portfolio: presentPortfolio(created) } });
      }

      // --- item routes (authorized: owner + tenant + lifecycle) ---
      const context = this.authorizer.authorize(credential, portfolioId, requestedTenantId);

      if (method === 'GET' && segments[4] === undefined) {
        const portfolio = this.store.getPortfolio({
          applicationUserId: context.applicationUserId,
          tenantId: context.tenantId,
          portfolioId,
        });
        return this.send(res, { status: 200, body: { portfolio: presentPortfolio(portfolio) } });
      }

      if (method === 'GET' && segments[4] === 'revisions') {
        const history = this.store.revisionHistory({
          applicationUserId: context.applicationUserId,
          tenantId: context.tenantId,
          portfolioId,
        });
        return this.send(res, { status: 200, body: { revisions: history } });
      }

      if (method === 'PUT' && segments[4] === 'holdings') {
        const body = (await this.readJson(req)) as SaveHoldingsBody | null;
        const parsed = parseSaveHoldingsBody(body);
        const result = this.store.saveHoldings({
          applicationUserId: context.applicationUserId,
          tenantId: context.tenantId,
          portfolioId,
          holdings: parsed.holdings,
          options: parsed.options,
          expectedRevision: parsed.expectedRevision,
        });
        if (!result.success) {
          return this.send(res, {
            status: 400,
            body: {
              error: 'SAVE_GUARD_VIOLATION',
              message: result.error ?? 'Save rejected.',
            },
          });
        }
        return this.send(res, {
          status: result.isDuplicate ? 200 : 201,
          body: {
            success: true,
            isDuplicate: result.isDuplicate,
            disposition: result.disposition,
            revision: result.revision,
            holdingsSavedCount: result.holdingsSavedCount,
            totalMarketValue: result.totalMarketValue,
            weightSumPercentage: result.weightSumPercentage,
            savedAt: result.savedAt,
            provenanceDigest: result.provenanceDigest,
            portfolio: presentPortfolio(result.portfolio),
          },
        });
      }

      if (method === 'POST' && segments[4] === 'reset') {
        const body = (await this.readJson(req)) as { expectedRevision?: unknown } | null;
        const expectedRevision =
          typeof body?.expectedRevision === 'number' ? body.expectedRevision : undefined;
        const portfolio = this.store.resetPortfolio({
          applicationUserId: context.applicationUserId,
          tenantId: context.tenantId,
          portfolioId,
          expectedRevision,
        });
        return this.send(res, { status: 200, body: { portfolio: presentPortfolio(portfolio) } });
      }

      if (method === 'DELETE' && segments[4] === undefined) {
        const body = (await this.readJson(req)) as { expectedRevision?: unknown } | null;
        const expectedRevision =
          typeof body?.expectedRevision === 'number' ? body.expectedRevision : undefined;
        const deleted = this.store.deletePortfolio({
          applicationUserId: context.applicationUserId,
          tenantId: context.tenantId,
          portfolioId,
          expectedRevision,
        });
        return this.send(res, {
          status: 200,
          body: { portfolioId: deleted.portfolioId, deletedAt: deleted.deletedAt },
        });
      }

      return this.send(res, { status: 404, body: { error: 'NOT_FOUND' } });
    } catch (error) {
      const mapped = error instanceof HttpError ? error : mapDomainError(error);
      return this.send(res, {
        status: mapped.status,
        body: { error: mapped.code, message: mapped.message },
      });
    }
  }

  private async readJson(req: http.IncomingMessage): Promise<unknown | null> {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      const buffer = chunk as Buffer;
      size += buffer.length;
      if (size > MAX_BODY_BYTES) {
        throw badRequest('PAYLOAD_TOO_LARGE', 'Request body exceeds the permitted size.');
      }
      chunks.push(buffer);
    }
    if (chunks.length === 0) {
      return null;
    }
    const raw = Buffer.concat(chunks).toString('utf8').trim();
    if (raw === '') {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      throw badRequest('INVALID_JSON', 'Request body is not valid JSON.');
    }
  }

  private send(res: http.ServerResponse, response: JsonResponse): void {
    if (res.headersSent) {
      return;
    }
    const payload = JSON.stringify(response.body);
    res.writeHead(response.status, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': Buffer.byteLength(payload),
      'cache-control': 'no-store',
    });
    res.end(payload);
  }
}

// ------------------------------------------------------------------- helpers

interface SaveHoldingsBody {
  mode?: unknown;
  holdings?: unknown;
  sourceBroker?: unknown;
  fileName?: unknown;
  contentDigest?: unknown;
  lineageDigest?: unknown;
  expectedRevision?: unknown;
}

function parseSaveHoldingsBody(body: SaveHoldingsBody | null): {
  holdings: UserHoldingInput[];
  options: Record<string, unknown>;
  expectedRevision?: number;
} {
  if (!body || !Array.isArray(body.holdings)) {
    throw badRequest('INVALID_REQUEST', 'A holdings array is required.');
  }

  const holdings = body.holdings.map((entry, index) => validateHolding(entry, index));

  const options: Record<string, unknown> = {};
  if (body.mode === 'MERGE' || body.mode === 'REPLACE') {
    options['mode'] = body.mode;
  } else if (body.mode !== undefined) {
    throw badRequest('INVALID_REQUEST', 'mode must be MERGE or REPLACE.');
  }
  if (typeof body.sourceBroker === 'string') options['sourceBroker'] = body.sourceBroker;
  if (typeof body.fileName === 'string') options['fileName'] = body.fileName;
  if (typeof body.contentDigest === 'string') options['contentDigest'] = body.contentDigest;
  if (typeof body.lineageDigest === 'string') options['lineageDigest'] = body.lineageDigest;

  const expectedRevision =
    typeof body.expectedRevision === 'number' && Number.isInteger(body.expectedRevision)
      ? body.expectedRevision
      : undefined;

  return { holdings, options, expectedRevision };
}

function validateHolding(entry: unknown, index: number): UserHoldingInput {
  if (typeof entry !== 'object' || entry === null) {
    throw badRequest('INVALID_REQUEST', `holdings[${index}] must be an object.`);
  }
  const raw = entry as Record<string, unknown>;

  const stringField = (name: string): string | undefined =>
    typeof raw[name] === 'string' ? (raw[name] as string) : undefined;
  const numberField = (name: string): number | undefined =>
    typeof raw[name] === 'number' && Number.isFinite(raw[name]) ? (raw[name] as number) : undefined;

  const symbol = stringField('symbol');
  if (!symbol) {
    throw badRequest('INVALID_REQUEST', `holdings[${index}].symbol is required.`);
  }

  const holding: UserHoldingInput = {
    symbol,
    companyId: stringField('companyId') ?? '',
    isin: stringField('isin'),
    exchange: (stringField('exchange') as 'NSE' | 'BSE' | undefined) ?? undefined,
    quantity: numberField('quantity') ?? 0,
    averageBuyPrice: numberField('averageBuyPrice') ?? 0,
    currentPrice: numberField('currentPrice') ?? 0,
    marketValue: numberField('marketValue') ?? 0,
    weightPercentage: numberField('weightPercentage') ?? 0,
    active: raw['active'] === undefined ? true : raw['active'] === true,
    sourceBroker: (stringField('sourceBroker') as UserHoldingInput['sourceBroker']) ?? 'GENERIC',
    lineageDigest: stringField('lineageDigest') ?? '',
    identityStatus: (stringField('identityStatus') as 'RESOLVED' | 'UNRESOLVED' | undefined) ?? 'RESOLVED',
    resolutionDisposition:
      (stringField('resolutionDisposition') as
        | 'CANONICAL_P04'
        | 'NON_PRODUCTION_OPERATOR_BYPASS'
        | undefined) ?? 'CANONICAL_P04',
  };

  return holding;
}

function presentPortfolio(portfolio: {
  portfolioId: string;
  portfolioName: string;
  revision: number;
  holdings: UserHoldingInput[];
  totalMarketValue: number;
  totalHoldingsCount: number;
  weightSumPercentage: number;
  lastUpdated: string;
  provenanceDigest: string;
  isSaved: boolean;
  contributions: unknown[];
}): Record<string, unknown> {
  return {
    portfolioId: portfolio.portfolioId,
    portfolioName: portfolio.portfolioName,
    revision: portfolio.revision,
    holdings: portfolio.holdings,
    totalMarketValue: portfolio.totalMarketValue,
    totalHoldingsCount: portfolio.totalHoldingsCount,
    weightSumPercentage: portfolio.weightSumPercentage,
    lastUpdated: portfolio.lastUpdated,
    provenanceDigest: portfolio.provenanceDigest,
    isSaved: portfolio.isSaved,
    contributions: portfolio.contributions,
  };
}

/**
 * Full startup sequence:
 *   validate configuration -> connect -> migrate -> verify -> listen.
 *
 * If any earlier step fails, HTTP listening never starts (fail closed).
 */
export async function startIpdServer(
  env: NodeJS.ProcessEnv = process.env
): Promise<IpdHttpServer> {
  const httpConfig = loadIpdHttpConfig(env);
  const oidcConfig = loadOidcTrustConfig(env);

  // Persistence initialization runs first: configuration, connection and
  // migrations must all succeed before the boundary accepts traffic.
  const persistence = initializePersistence(env);

  const server = new IpdHttpServer({
    persistence,
    verifier: new OidcVerifier(oidcConfig),
    http: httpConfig,
  });

  await server.listen(httpConfig);
  return server;
}

export type { VerifiedOidcCredential };
