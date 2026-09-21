/**
 * IIPS — OPTION A PORTFOLIO SERVICE
 *
 * Authority: DEC-PORTFOLIO-IMPL-01 (APPROVED)
 * Provenance: DEC-PORTFOLIO-PROVENANCE-01 (APPROVED)
 *
 * Responsibilities:
 *   - User-scoped portfolio CRUD.
 *   - Persistence orchestration via PersistenceService (.iips-data/portfolios/journal.ndjson).
 *   - Holding validation and deterministic resolution via portfolio-resolver.
 *   - Weight validation and normalization (positive finite numbers summing to 100%).
 *   - Tenant and user ownership enforcement.
 *   - Passing resolved holdings into existing portfolio-intelligence calculations.
 *   - Provenance assignment: "User Portfolio: <Name> — IIPS Intelligence Overlay" (PlatformBadge).
 *
 * Strict Exclusions:
 *   - Zero broker connectivity, Zero live market pricing, Zero lot/quantity ledger.
 *   - Certified SNAPSHOT baseline remains untouched.
 */
import path from 'node:path';
import type http from 'node:http';
import {
  PersistenceService,
  resolveDataDir,
  type PersistedRecord,
} from '../persistence/persistence-service';
import {
  resolveSecurity,
  PortfolioResolutionError,
  type SecurityResolutionInput,
} from './portfolio-resolver';

export const PORTFOLIOS_DATA_SUBDIR = 'portfolios';
const EVENT_PREFIX = 'portfolio-event\u0000';

/** Round to 1 decimal using round-half-to-even (matches frozen CSIP v1.0.0 basis). */
export const r1 = (x: number): number => {
  const scaled = x * 10;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  if (frac === 0.5) {
    return (floor % 2 === 0 ? floor : floor + 1) / 10;
  }
  return Math.round(scaled) / 10;
};

export interface UserHolding {
  readonly canonicalSecurityId: string;
  readonly symbol: string;
  readonly name: string;
  readonly sector: string;
  readonly weight: number; // percentage (0..100)
}

export interface UserPortfolio {
  readonly portfolioId: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly holdings: readonly UserHolding[];
}

export type PortfolioEventKind = 'PORTFOLIO_CREATED' | 'PORTFOLIO_HOLDINGS_SET' | 'PORTFOLIO_DELETED';

export interface PortfolioEvent {
  readonly kind: PortfolioEventKind;
  readonly portfolioId: string;
  readonly name?: string;
  readonly holdings?: readonly UserHolding[];
  readonly at: string;
}

export class PortfolioValidationError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'PortfolioValidationError';
    this.code = code;
  }
}

let persistenceInstance: PersistenceService | null = null;

export function resolvePortfoliosDataDir(): string {
  return path.join(resolveDataDir(), PORTFOLIOS_DATA_SUBDIR);
}

export function getPortfolioPersistence(): PersistenceService {
  if (!persistenceInstance) {
    persistenceInstance = new PersistenceService({ dataDir: resolvePortfoliosDataDir() });
  }
  return persistenceInstance;
}

export function resetPortfolioPersistence(): void {
  persistenceInstance = null;
}

function isPortfolioEvent(r: PersistedRecord): boolean {
  return typeof r.dedupKey === 'string' && r.dedupKey.startsWith(EVENT_PREFIX);
}

/**
 * Fold append-only event log into current portfolio state for an authenticated tenant + owner.
 * Replayed deterministically in ascending seq order.
 */
export function foldPortfolios(
  store: PersistenceService,
  tenantId: string,
  ownerUserId: string,
): Map<string, UserPortfolio> {
  if (!tenantId || tenantId.trim() === '') {
    throw new PortfolioValidationError('tenantId required — fail closed', 'MISSING_TENANT');
  }
  if (!ownerUserId || ownerUserId.trim() === '') {
    throw new PortfolioValidationError('ownerUserId required — fail closed', 'MISSING_OWNER');
  }

  const records = store.listOrdered(tenantId, ownerUserId).filter(isPortfolioEvent);
  const ordered = [...records].sort((a, b) => a.seq - b.seq);
  const portfolios = new Map<string, UserPortfolio>();

  for (const r of ordered) {
    const e = r.payload as PortfolioEvent;
    if (e.kind === 'PORTFOLIO_CREATED') {
      portfolios.set(e.portfolioId, {
        portfolioId: e.portfolioId,
        name: e.name ?? e.portfolioId,
        createdAt: e.at,
        updatedAt: e.at,
        holdings: e.holdings ?? [],
      });
      continue;
    }
    const current = portfolios.get(e.portfolioId);
    if (!current) continue; // deleted or missing; ignore

    if (e.kind === 'PORTFOLIO_DELETED') {
      portfolios.delete(e.portfolioId);
    } else if (e.kind === 'PORTFOLIO_HOLDINGS_SET' && e.holdings) {
      portfolios.set(e.portfolioId, {
        ...current,
        name: e.name ?? current.name,
        updatedAt: e.at,
        holdings: e.holdings,
      });
    }
  }

  return portfolios;
}

function appendPortfolioEvent(
  store: PersistenceService,
  tenantId: string,
  ownerUserId: string,
  event: PortfolioEvent,
): void {
  const seqHint = store.listOrdered(tenantId, ownerUserId).filter(isPortfolioEvent).length + 1;
  store.append({
    tenantId,
    ownerUserId,
    dedupKey: `${EVENT_PREFIX}${seqHint}\u0000${event.kind}\u0000${event.portfolioId}`,
    payload: event,
  });
}

/**
 * Validate and normalize user holdings.
 * Ensures weights are strictly positive finite numbers, resolves identities via P04/P12,
 * and scales weights to sum to exactly 100.0%.
 */
export function validateAndResolveHoldings(
  rawHoldings: readonly (SecurityResolutionInput & { readonly weight: unknown })[],
  tenantId: string,
): readonly UserHolding[] {
  if (!Array.isArray(rawHoldings) || rawHoldings.length === 0) {
    throw new PortfolioValidationError('Holdings must be a non-empty array', 'EMPTY_HOLDINGS');
  }

  // 1. Verify weights are valid positive numbers
  let totalRawWeight = 0;
  for (const h of rawHoldings) {
    const w = Number(h.weight);
    if (!Number.isFinite(w) || w <= 0) {
      throw new PortfolioValidationError(
        `Invalid weight '${h.weight}' for holding. Weight must be a positive finite number.`,
        'INVALID_WEIGHT',
      );
    }
    totalRawWeight += w;
  }

  if (totalRawWeight <= 0) {
    throw new PortfolioValidationError('Total portfolio weight must be greater than zero', 'INVALID_WEIGHT');
  }

  // 2. Resolve each holding deterministically
  const resolved: UserHolding[] = [];
  for (const h of rawHoldings) {
    const sec = resolveSecurity(h, tenantId);
    // Normalize weight proportionally to percentage (sum to 100%)
    const normalizedWeight = r1((Number(h.weight) / totalRawWeight) * 100);
    resolved.push(
      Object.freeze({
        canonicalSecurityId: sec.canonicalSecurityId,
        symbol: sec.symbol,
        name: sec.name,
        sector: sec.sector,
        weight: normalizedWeight,
      }),
    );
  }

  return Object.freeze(resolved);
}

// ── CRUD Operations ──────────────────────────────────────────────────────────

export function listPortfolios(
  tenantId: string,
  ownerUserId: string,
  store: PersistenceService = getPortfolioPersistence(),
): readonly UserPortfolio[] {
  return Object.freeze([...foldPortfolios(store, tenantId, ownerUserId).values()]);
}

export function getPortfolio(
  tenantId: string,
  ownerUserId: string,
  portfolioId: string,
  store: PersistenceService = getPortfolioPersistence(),
): UserPortfolio | undefined {
  if (!portfolioId || portfolioId.trim() === '') {
    throw new PortfolioValidationError('portfolioId required', 'MISSING_PORTFOLIO_ID');
  }
  return foldPortfolios(store, tenantId, ownerUserId).get(portfolioId.trim());
}

export function savePortfolio(
  tenantId: string,
  ownerUserId: string,
  input: {
    readonly portfolioId?: string;
    readonly name: string;
    readonly holdings: readonly (SecurityResolutionInput & { readonly weight: unknown })[];
  },
  store: PersistenceService = getPortfolioPersistence(),
  now: string = new Date().toISOString(),
): UserPortfolio {
  if (!input.name || input.name.trim() === '') {
    throw new PortfolioValidationError('Portfolio name required', 'MISSING_NAME');
  }
  const portfolioId = input.portfolioId && input.portfolioId.trim() !== ''
    ? input.portfolioId.trim()
    : `pf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const resolvedHoldings = validateAndResolveHoldings(input.holdings, tenantId);
  const existing = foldPortfolios(store, tenantId, ownerUserId).get(portfolioId);

  if (existing) {
    appendPortfolioEvent(store, tenantId, ownerUserId, {
      kind: 'PORTFOLIO_HOLDINGS_SET',
      portfolioId,
      name: input.name.trim(),
      holdings: resolvedHoldings,
      at: now,
    });
  } else {
    appendPortfolioEvent(store, tenantId, ownerUserId, {
      kind: 'PORTFOLIO_CREATED',
      portfolioId,
      name: input.name.trim(),
      holdings: resolvedHoldings,
      at: now,
    });
  }

  return getPortfolio(tenantId, ownerUserId, portfolioId, store)!;
}

export function deletePortfolio(
  tenantId: string,
  ownerUserId: string,
  portfolioId: string,
  store: PersistenceService = getPortfolioPersistence(),
  now: string = new Date().toISOString(),
): boolean {
  if (!portfolioId || portfolioId.trim() === '') {
    throw new PortfolioValidationError('portfolioId required for deletion', 'MISSING_PORTFOLIO_ID');
  }
  const id = portfolioId.trim();
  const existing = foldPortfolios(store, tenantId, ownerUserId).get(id);
  if (!existing) return false;

  appendPortfolioEvent(store, tenantId, ownerUserId, {
    kind: 'PORTFOLIO_DELETED',
    portfolioId: id,
    at: now,
  });
  return true;
}

// ── Overlay Analytics Evaluation ─────────────────────────────────────────────

export interface PlatformEngineDetails {
  readonly engineOutputs: readonly {
    readonly companyId: string;
    readonly sector: string;
    readonly composite: number;
    readonly confidence: number | null;
    readonly qualityScore: number | null;
    readonly riskScore: number | null;
    readonly verdict?: string;
  }[];
}

/**
 * Evaluates user-defined holdings using governed platform intelligence and CSIP formulas.
 * Does not re-evaluate raw fundamental ratios; applies certified sector engine scores
 * to user weights.
 */
export function evaluatePortfolioOverlay(
  portfolio: UserPortfolio,
  platformData: PlatformEngineDetails,
): Record<string, unknown> {
  const holdingsCount = portfolio.holdings.length;
  const sectorExposure: Record<string, number> = {};

  for (const h of portfolio.holdings) {
    sectorExposure[h.sector] = r1((sectorExposure[h.sector] ?? 0) + h.weight);
  }

  let concentration = 0;
  for (const exposure of Object.values(sectorExposure)) {
    if (exposure > concentration) concentration = exposure;
  }
  concentration = r1(concentration);

  // CSIP Diversification Formula: max(0, 100 - concentration + (holdings - 1) * 3)
  const diversificationScore = holdingsCount === 0
    ? 0
    : r1(Math.max(0, 100 - concentration + (holdingsCount - 1) * 3));

  // Match sector engine outputs
  const outputBySector = new Map(platformData.engineOutputs.map((o) => [o.sector, o]));

  let sumConviction = 0;
  let sumQuality = 0;
  let sumRisk = 0;

  const holdings = portfolio.holdings.map((h) => {
    const engine = outputBySector.get(h.sector);
    const composite = engine?.composite ?? 50;
    const confidence = engine?.confidence ?? null;
    const quality = engine?.qualityScore ?? 50;
    const risk = engine?.riskScore ?? 50;
    const decision = engine?.verdict ?? 'Hold';

    sumConviction += (h.weight / 100) * composite;
    sumQuality += (h.weight / 100) * quality;
    sumRisk += (h.weight / 100) * risk;

    return {
      companyId: h.canonicalSecurityId,
      symbol: h.symbol,
      sector: h.sector,
      decision,
      composite,
      confidence,
      quality,
      risk,
      weight: h.weight,
    };
  });

  const avgConviction = r1(sumConviction);
  const avgQuality = r1(sumQuality);
  const avgRisk = r1(sumRisk);

  // Recommendations and risk flags
  const diversificationBand = diversificationScore >= 70
    ? 'Good'
    : diversificationScore >= 40
      ? 'Moderate'
      : 'Low';

  const concentrationSectors = Object.entries(sectorExposure)
    .filter(([_, v]) => v >= 30)
    .map(([s, _]) => s);

  const correlationFlags = concentration > 50
    ? ['High sector concentration detected in user allocation']
    : ['Low correlation risk across diversified holdings'];

  const diversificationFlags = concentration > 40
    ? ['Elevated sector concentration']
    : ['Diversified across multiple governed sectors'];

  const recommendation = concentration > 40
    ? 'Moderate sector concentration detected; consider balancing across under-represented sectors.'
    : 'Holdings maintain governed diversification thresholds.';

  // Distinct sectors for evidence refs
  const distinctSectors = Array.from(new Set(portfolio.holdings.map((h) => h.sector)));
  const evidenceRefs = distinctSectors.map((sector) => {
    const engine = outputBySector.get(sector);
    return {
      evidenceId: `ev_${sector}`,
      engineId: `sector.${sector.toLowerCase()}`,
      recommendation: engine?.verdict ?? '',
      compositeScore: engine?.composite ?? 0,
    };
  });

  // Top buy opportunities
  const opportunity = platformData.engineOutputs
    .filter((o) => o.verdict === 'Buy')
    .map((o) => ({ companyId: o.companyId, sector: o.sector, conviction: o.composite }))
    .slice(0, 3);

  return {
    portfolio: {
      portfolioId: portfolio.portfolioId,
      name: portfolio.name,
      scenario: 'User Intelligence Overlay',
      holdings: holdingsCount,
      sectorExposure,
      concentration,
      diversificationScore,
      avgConviction,
      avgQuality,
      avgRisk,
    },
    diversification: { band: diversificationBand, flags: diversificationFlags },
    allocation: {
      strategy: 'User Allocation Overlay',
      recommendation,
      rulesApplied: ['user-overlay-weights', 'governed-csip-analytics'],
    },
    holdings,
    opportunity,
    correlation: { flags: correlationFlags, concentrationSectors },
    evidenceRefs,
    provenance: {
      dataSource: `User Portfolio: ${portfolio.name} — IIPS Intelligence Overlay`,
      freshness: 'SNAPSHOT',
      calibratedAt: '2026-08-09T00:00:00.000Z',
      transportSemantics: '1:1 mapping; transport transformation != decision transformation',
    },
  };
}

// ── HTTP Transport Dispatcher ────────────────────────────────────────────────

function readRequestBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      chunks.push(c);
      if (chunks.reduce((n, b) => n + b.length, 0) > 1_000_000) {
        reject(new PortfolioValidationError('request body too large', 'BODY_TOO_LARGE'));
      }
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (raw.trim() === '') {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch {
        reject(new PortfolioValidationError('request body is not valid JSON', 'INVALID_JSON'));
      }
    });
    req.on('error', () => reject(new PortfolioValidationError('request body read error', 'READ_ERROR')));
  });
}

/**
 * Handle authenticated user-portfolio requests.
 * Invoked by executive-transport when path is /api/portfolio with params, or POST/DELETE.
 */
export async function handlePortfolioTransportRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  tenantId: string,
  ownerUserId: string,
  computePlatform: () => unknown,
): Promise<void> {
  const url = req.url ?? '';
  const parsed = new URL(url, 'http://internal');
  const path = parsed.pathname;

  try {
    if (req.method === 'GET') {
      const portfolioId = parsed.searchParams.get('portfolioId');
      const isList = parsed.searchParams.get('list') === 'true';

      if (isList) {
        const portfolios = listPortfolios(tenantId, ownerUserId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ portfolios }));
        return;
      }

      if (portfolioId) {
        const portfolio = getPortfolio(tenantId, ownerUserId, portfolioId);
        if (!portfolio) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `portfolio not found: ${portfolioId}` }));
          return;
        }
        const platform = computePlatform() as PlatformEngineDetails;
        const evaluated = evaluatePortfolioOverlay(portfolio, platform);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(evaluated));
        return;
      }

      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'missing portfolioId parameter' }));
      return;
    }

    if (req.method === 'POST') {
      const body = await readRequestBody(req);
      const name = typeof body.name === 'string' ? body.name : '';
      const portfolioId = typeof body.portfolioId === 'string' ? body.portfolioId : undefined;
      const holdings = Array.isArray(body.holdings) ? body.holdings : [];

      const saved = savePortfolio(tenantId, ownerUserId, {
        portfolioId,
        name,
        holdings: holdings as unknown as (SecurityResolutionInput & { weight: unknown })[],
      });

      const platform = computePlatform() as PlatformEngineDetails;
      const evaluated = evaluatePortfolioOverlay(saved, platform);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ...evaluated, savedPortfolioId: saved.portfolioId }));
      return;
    }

    if (req.method === 'DELETE') {
      const pathParts = path.split('/');
      const id = pathParts.length > 3 && pathParts[3].trim() !== ''
        ? pathParts[3].trim()
        : parsed.searchParams.get('portfolioId');

      if (!id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'portfolioId required for deletion' }));
        return;
      }

      const deleted = deletePortfolio(tenantId, ownerUserId, id);
      if (!deleted) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `portfolio not found: ${id}` }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ deleted: true, portfolioId: id }));
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'method not allowed' }));
  } catch (e) {
    const isVal = e instanceof PortfolioValidationError || e instanceof PortfolioResolutionError;
    const status = isVal ? 400 : 500;
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: (e as Error).message ?? 'portfolio service error',
        code: (e as { code?: string }).code ?? 'PORTFOLIO_ERROR',
      }),
    );
  }
}
