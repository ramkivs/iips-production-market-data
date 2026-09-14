/**
 * P13-B-06 — UI13 Governed Search tests.
 *
 * Verifies governed C7 results, preserved contract order, and fail-closed behaviour.
 * These tests do NOT certify UI13.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { GovernedSearch } from './GovernedSearch';

const ENVELOPE = {
  apiVersion: '1.0', endpoint: '/api/search', tenantId: 'tenant-a',
  responseGeneratedAt: '2026-09-14T00:00:00.000Z', lineage: 'DUAL',
  transportDisclosure: {
    dualTransport: true, statement: 'Two transports operate; they are NOT interchangeable.',
    p12Scope: 'P12 scope', v2Scope: 'v2 scope', certificationNote: 'No UI surface is certified.',
  },
  governanceLimitations: {
    ad17: {}, security: {}, ui05Certified: false, uiSurfaceCertified: false, productionAuthorized: false,
  },
  provenance: {
    dataSource: 'governed:certified-v2.0-reference-universe', freshness: 'SNAPSHOT',
    calibratedAt: '2026-08-09T00:00:00.000Z', transportSemantics: 'p12-governed-transport',
    asOf: '2026-08-09T00:00:00.000Z', receivedAt: '2026-08-09T00:00:00.000Z',
    dataVersion: 'v1.1-replay-baseline', mode: 'SNAPSHOT', quality: 'good', completenessPct: 100,
    contributingSnapshotIds: ['program-v1.1-replay-baseline'], identityMappingVersion: '1.0',
    namespaceVersion: '1.0', classification: 'CERTIFIED-ENGINE',
  },
  data: {
    query: 'ban', asOf: '2026-08-09T00:00:00.000Z', tenantId: 'tenant-a',
    objectTypes: ['company'], totalMatches: 2, truncated: false,
    results: [
      { objectType: 'company', id: 'Banking-H1', canonicalSecurityId: 'Banking-H1', name: 'Banking', sector: 'Banking', quality: 'good', completenessPct: 100, asOf: '2026-08-09T00:00:00.000Z' },
      { objectType: 'company', id: 'Urban-H1', canonicalSecurityId: 'Urban-H1', name: 'Urban Bank', sector: 'Urban', quality: 'stale', completenessPct: 60, asOf: '2026-08-09T00:00:00.000Z' },
    ],
  },
};

beforeEach(() => { globalThis.fetch = vi.fn() as never; });

async function searchFor(term: string) {
  const user = userEvent.setup();
  render(<MemoryRouter><GovernedSearch /></MemoryRouter>);
  await user.type(screen.getByTestId('search-input'), term);
  await user.click(screen.getByTestId('search-submit'));
}

describe('UI13 Governed Search (P13-B-06)', () => {
  it('renders governed matches from the C7 contract', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ENVELOPE }) as never;
    await searchFor('ban');
    expect(await screen.findByTestId('search-result-count')).toHaveTextContent('2 governed matches');
  });

  it('preserves the contract order (no client re-ranking)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ENVELOPE }) as never;
    await searchFor('ban');
    await screen.findByTestId('search-result-count');
    const text = document.body.textContent ?? '';
    expect(text.indexOf('Banking')).toBeLessThan(text.indexOf('Urban Bank'));
  });

  it('shows governed quality per hit', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ENVELOPE }) as never;
    await searchFor('ban');
    await screen.findByTestId('search-result-count');
    const badges = screen.getAllByTestId('quality-badge');
    expect(badges.some((b) => b.getAttribute('data-quality') === 'stale')).toBe(true);
  });

  it('discloses lineage and non-certification', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ENVELOPE }) as never;
    await searchFor('ban');
    await screen.findByTestId('search-result-count');
    expect(screen.getByTestId('transport-disclosure')).toBeInTheDocument();
    expect(screen.getByTestId('governance-limitations')).toHaveTextContent('not certified');
  });

  it('FAILS CLOSED on a governed refusal', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 404, json: async () => ({ error: 'unresolved symbol — fail-closed', rules: ['OR-2'] }),
    }) as never;
    await searchFor('nope');
    await waitFor(() => expect(screen.getByTestId('search-error')).toBeInTheDocument());
    expect(screen.getByTestId('search-error')).toHaveTextContent('fail-closed');
    expect(screen.queryByTestId('search-result-count')).not.toBeInTheDocument();
  });
});
