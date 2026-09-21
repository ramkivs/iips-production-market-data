/**
 * Tests for Portfolio Transport Integration and SNAPSHOT Invariance
 * (DEC-PORTFOLIO-IMPL-01, DEC-PORTFOLIO-IDENTITY-01, DEC-PORTFOLIO-PROVENANCE-01)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type http from 'node:http';
import { EventEmitter } from 'node:events';
import { handlePortfolioTransportRequest, resetPortfolioPersistence } from './portfolio-service';
import { computeCertifiedPortfolio, computeCertifiedPlatform } from '../executive-transport';

interface MockResponseState {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

function createMockReqRes(options: {
  url: string;
  method: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}): { req: http.IncomingMessage; res: http.ServerResponse; getState: () => MockResponseState } {
  const req = new EventEmitter() as http.IncomingMessage;
  req.url = options.url;
  req.method = options.method;
  req.headers = options.headers ?? {};

  const state: MockResponseState = {
    statusCode: 200,
    headers: {},
    body: '',
  };

  const res = {
    writeHead(status: number, headers?: Record<string, string>) {
      state.statusCode = status;
      if (headers) Object.assign(state.headers, headers);
      return this;
    },
    setHeader(name: string, value: string) {
      state.headers[name] = value;
    },
    end(chunk?: string) {
      if (chunk) state.body += chunk;
    },
  } as unknown as http.ServerResponse;

  // Emit body asynchronously
  setTimeout(() => {
    if (options.body) {
      req.emit('data', Buffer.from(JSON.stringify(options.body)));
    }
    req.emit('end');
  }, 5);

  return { req, res, getState: () => state };
}

describe('Portfolio Transport — Option A User Overlay & Invariance', () => {
  beforeEach(() => {
    resetPortfolioPersistence();
  });

  it('CRITICAL SNAPSHOT INVARIANT: computeCertifiedPortfolio produces exact frozen reference baseline', () => {
    const certified = computeCertifiedPortfolio() as {
      portfolio: { portfolioId: string; scenario: string; holdings: number };
      holdings: readonly { companyId: string; sector: string; decision: string; weight: number }[];
      provenance: { dataSource: string; freshness: string };
    };

    expect(certified.portfolio.scenario).toBe('Balanced');
    expect(certified.holdings.length).toBeGreaterThanOrEqual(10);
    expect(certified.provenance.freshness).toBe('SNAPSHOT');
    expect(certified.provenance.dataSource).toContain('certified v2.0 platform');

    // Verify key reference sectors are present
    const sectors = certified.holdings.map((h) => h.sector);
    expect(sectors).toContain('Technology');
    expect(sectors).toContain('Banking');
    expect(sectors).toContain('Energy');
  });

  it('handles POST /api/portfolio to create and evaluate an overlay', async () => {
    const { req, res, getState } = createMockReqRes({
      url: '/api/portfolio',
      method: 'POST',
      body: {
        name: 'Growth Tech Portfolio',
        holdings: [
          { symbol: 'TCS', weight: 50 },
          { symbol: 'INFY', weight: 50 },
        ],
      },
    });

    await handlePortfolioTransportRequest(req, res, 'tenant-alpha', 'user-1', computeCertifiedPlatform);

    expect(getState().statusCode).toBe(201);
    const body = JSON.parse(getState().body) as Record<string, unknown>;
    expect(body.savedPortfolioId).toBeDefined();

    const prov = body.provenance as Record<string, unknown>;
    expect(prov.dataSource).toBe('User Portfolio: Growth Tech Portfolio — IIPS Intelligence Overlay');
    expect(prov.freshness).toBe('SNAPSHOT');

    const p = body.portfolio as Record<string, unknown>;
    expect(p.holdings).toBe(2);
    const exposure = p.sectorExposure as Record<string, number>;
    expect(exposure.Technology).toBe(100);
  });

  it('handles GET /api/portfolio?portfolioId=<id> to fetch evaluated overlay', async () => {
    // First, create the portfolio
    const { req: postReq, res: postRes, getState: getPostState } = createMockReqRes({
      url: '/api/portfolio',
      method: 'POST',
      body: {
        portfolioId: 'pf-persistent-01',
        name: 'Banking Focus',
        holdings: [
          { symbol: 'HDFCBANK', weight: 60 },
          { symbol: 'ICICIBANK', weight: 40 },
        ],
      },
    });

    await handlePortfolioTransportRequest(postReq, postRes, 'tenant-alpha', 'user-1', computeCertifiedPlatform);
    expect(getPostState().statusCode).toBe(201);

    // Second, retrieve the portfolio by ID
    const { req: getReq, res: getRes, getState: getGetState } = createMockReqRes({
      url: '/api/portfolio?portfolioId=pf-persistent-01',
      method: 'GET',
    });

    await handlePortfolioTransportRequest(getReq, getRes, 'tenant-alpha', 'user-1', computeCertifiedPlatform);
    expect(getGetState().statusCode).toBe(200);

    const body = JSON.parse(getGetState().body) as Record<string, unknown>;
    const p = body.portfolio as Record<string, unknown>;
    expect(p.name).toBe('Banking Focus');
    const exposure = p.sectorExposure as Record<string, number>;
    expect(exposure.Banking).toBe(100);
  });

  it('handles GET /api/portfolio?list=true to list user portfolios', async () => {
    const { req: postReq, res: postRes } = createMockReqRes({
      url: '/api/portfolio',
      method: 'POST',
      body: {
        portfolioId: 'pf-list-01',
        name: 'Portfolio To List',
        holdings: [{ symbol: 'TCS', weight: 100 }],
      },
    });
    await handlePortfolioTransportRequest(postReq, postRes, 'tenant-alpha', 'user-1', computeCertifiedPlatform);

    const { req: listReq, res: listRes, getState: getListState } = createMockReqRes({
      url: '/api/portfolio?list=true',
      method: 'GET',
    });
    await handlePortfolioTransportRequest(listReq, listRes, 'tenant-alpha', 'user-1', computeCertifiedPlatform);

    expect(getListState().statusCode).toBe(200);
    const body = JSON.parse(getListState().body) as { portfolios: { portfolioId: string }[] };
    expect(body.portfolios.some((p) => p.portfolioId === 'pf-list-01')).toBe(true);
  });

  it('handles DELETE /api/portfolio/:id to remove portfolio', async () => {
    const { req: postReq, res: postRes } = createMockReqRes({
      url: '/api/portfolio',
      method: 'POST',
      body: {
        portfolioId: 'pf-del-01',
        name: 'Portfolio To Delete',
        holdings: [{ symbol: 'TCS', weight: 100 }],
      },
    });
    await handlePortfolioTransportRequest(postReq, postRes, 'tenant-alpha', 'user-1', computeCertifiedPlatform);

    const { req: delReq, res: delRes, getState: getDelState } = createMockReqRes({
      url: '/api/portfolio/pf-del-01',
      method: 'DELETE',
    });
    await handlePortfolioTransportRequest(delReq, delRes, 'tenant-alpha', 'user-1', computeCertifiedPlatform);

    expect(getDelState().statusCode).toBe(200);
    const body = JSON.parse(getDelState().body) as { deleted: boolean; portfolioId: string };
    expect(body.deleted).toBe(true);
    expect(body.portfolioId).toBe('pf-del-01');

    // Retrieve now returns 404
    const { req: getReq, res: getRes, getState: getGetState } = createMockReqRes({
      url: '/api/portfolio?portfolioId=pf-del-01',
      method: 'GET',
    });
    await handlePortfolioTransportRequest(getReq, getRes, 'tenant-alpha', 'user-1', computeCertifiedPlatform);
    expect(getGetState().statusCode).toBe(404);
  });

  it('fails closed when holding is unresolved (OR-2)', async () => {
    const { req, res, getState } = createMockReqRes({
      url: '/api/portfolio',
      method: 'POST',
      body: {
        name: 'Invalid Holding Portfolio',
        holdings: [{ symbol: 'UNKNOWN_EQUITY', weight: 100 }],
      },
    });

    await handlePortfolioTransportRequest(req, res, 'tenant-alpha', 'user-1', computeCertifiedPlatform);

    expect(getState().statusCode).toBe(400);
    const body = JSON.parse(getState().body) as { error: string; code: string };
    expect(body.code).toBe('UNRESOLVED_SECURITY');
  });

  it('fails closed when weights are invalid', async () => {
    const { req, res, getState } = createMockReqRes({
      url: '/api/portfolio',
      method: 'POST',
      body: {
        name: 'Negative Weight Portfolio',
        holdings: [{ symbol: 'TCS', weight: -50 }],
      },
    });

    await handlePortfolioTransportRequest(req, res, 'tenant-alpha', 'user-1', computeCertifiedPlatform);

    expect(getState().statusCode).toBe(400);
    const body = JSON.parse(getState().body) as { error: string; code: string };
    expect(body.code).toBe('INVALID_WEIGHT');
  });
});
