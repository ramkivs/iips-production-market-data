/**
 * Program v3.0 — N+2 hardening: read API clients attach the in-memory Bearer token.
 * Verifies Bearer propagation for every governed read client (never fabricated).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchExecutiveData } from './executive';
import { fetchPortfolioData } from './portfolio';
import { fetchCompanyData } from './company';
import { fetchCrossSectorData } from './crossSector';
import { fetchDecisionMatrixData } from './decisionMatrix';
import { fetchEvidenceData } from './evidence';
import { fetchReplayData } from './replay';

vi.mock('../core/auth/oidcClient', () => ({
  getAccessToken: vi.fn(async () => 'at-123'),
  dispatchUnauthorized: vi.fn(),
  dispatchForbidden: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.fetch = vi.fn(async () => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })) as never;
});

function lastFetchAuthHeader(): string | null {
  const fm = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
  const init = fm.mock.calls[0]?.[1] as RequestInit | undefined;
  return new Headers(init?.headers).get('Authorization');
}

describe('read API clients — Bearer propagation (N+2)', () => {
  it('fetchExecutiveData attaches Authorization: Bearer', async () => {
    await fetchExecutiveData();
    expect(lastFetchAuthHeader()).toBe('Bearer at-123');
  });

  it('fetchPortfolioData attaches Authorization: Bearer', async () => {
    await fetchPortfolioData();
    expect(lastFetchAuthHeader()).toBe('Bearer at-123');
  });

  it('fetchCompanyData attaches Authorization: Bearer', async () => {
    await fetchCompanyData('Banking');
    expect(lastFetchAuthHeader()).toBe('Bearer at-123');
  });

  it('fetchCrossSectorData attaches Authorization: Bearer', async () => {
    await fetchCrossSectorData();
    expect(lastFetchAuthHeader()).toBe('Bearer at-123');
  });

  it('fetchDecisionMatrixData attaches Authorization: Bearer', async () => {
    await fetchDecisionMatrixData();
    expect(lastFetchAuthHeader()).toBe('Bearer at-123');
  });

  it('fetchEvidenceData attaches Authorization: Bearer', async () => {
    await fetchEvidenceData('Banking');
    expect(lastFetchAuthHeader()).toBe('Bearer at-123');
  });

  it('fetchReplayData attaches Authorization: Bearer', async () => {
    await fetchReplayData('Banking');
    expect(lastFetchAuthHeader()).toBe('Bearer at-123');
  });
});
