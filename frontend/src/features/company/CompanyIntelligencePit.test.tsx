/**
 * D-PIT-WIRE-01 — CompanyIntelligence PIT consumer contract.
 *
 * Proves the one in-scope UI forwards an EXPLICIT URL `asOf` as data selection (never mode),
 * discriminates the PIT success family before SNAPSHOT dereference, and renders the server's
 * requested/resolved vintage + D114 provenance verbatim.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CompanyIntelligence } from './CompanyIntelligence';
import type { PitVintageData } from '../../api/dataMode';

const AS_OF = '2024-07-08T15:30:00.000Z';

const PIT: PitVintageData = {
  surface: 'Company',
  dataMode: 'PIT',
  dataAvailable: true,
  query: { asOf: AS_OF, domain: 'D02', securityId: 'RELIANCE' },
  vintage: {
    found: true,
    requestedAsOf: AS_OF,
    resolvedAsOf: '2024-07-08T09:15:00.000Z',
    asOf: '2024-07-08T09:15:00.000Z',
    snapshotId: 'data-NSE_D114-d114-dualera-v1-2024-07-08T09:15:00.000Z',
    provider: 'NSE_D114',
    dataVersion: 'd114-dualera-v1',
    quality: 'good',
    era: 'CM_UDIFF',
    pitBoundary: '2024-07-08T15:30:00.000Z',
    record: { symbol: 'RELIANCE', close: 2951.2, volume: 4398120 },
  },
  provenance: {
    dataSource: 'NSE historical archives via governed D114 dual-era ingestion',
    freshness: 'PIT', mode: 'PIT',
    archiveRef: 'C:\\IIPS_Data\\NSE_CM_UDiFF_10Y\\archives\\BhavCopy_NSE_CM_0_0_0_20240708_F_0000.csv.zip',
    sha256: '0ef55b77c30c8a57d5451cd371424242ad515f708630736ea6dc44c38d6e1e85',
    sha256ManifestEntry: {
      date: '2024-07-08',
      filename: 'BhavCopy_NSE_CM_0_0_0_20240708_F_0000.csv.zip',
      sha256: '0ef55b77c30c8a57d5451cd371424242ad515f708630736ea6dc44c38d6e1e85',
    },
    acquisitionManifestId: 'd114-manifest-test',
    intakeLineageDigest: 'ab'.repeat(32),
    failureRegisterRef: 'evidence/d114/failure-unavailable-date-register.json',
    corpusId: 'windows-d114-bounded-two-era',
    certification: 'NONE — application verification only; NOT a certification claim',
    transportSemantics: 'Resolved vintage satisfies resolved asOf <= requested asOf. No fallback.',
  },
};

beforeEach(() => {
  globalThis.fetch = vi.fn((input: unknown) => {
    const url = String(input);
    if (url.startsWith('/api/company/RELIANCE?')) {
      return Promise.resolve({ ok: true, json: async () => PIT }) as never;
    }
    if (url.includes('/api/evidence/') || url.includes('/api/replay/')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ surface: 'out-of-scope', dataMode: 'PIT', state: 'PIT_UNAVAILABLE', dataAvailable: false }),
      }) as never;
    }
    if (url.includes('/api/decision-matrix')) {
      return Promise.resolve({ ok: true, json: async () => ({ companies: [] }) }) as never;
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
  }) as never;
});

describe('D-PIT-WIRE-01 — CompanyIntelligence PIT path', () => {
  it('forwards URL asOf to /api/company/:id and renders PIT without SNAPSHOT dereference', async () => {
    render(
      <MemoryRouter initialEntries={[`/research/company/RELIANCE?asOf=${encodeURIComponent(AS_OF)}`]}>
        <Routes>
          <Route path="/research/company/:id" element={<CompanyIntelligence />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('pit-vintage-panel')).toBeInTheDocument();
    const calls = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((c) => String(c[0]));
    expect(calls).toContain(`/api/company/RELIANCE?asOf=${encodeURIComponent(AS_OF)}`);
    expect(screen.getByTestId('pit-vintage-requested-asof')).toHaveTextContent(AS_OF);
    expect(screen.getByTestId('pit-vintage-resolved-asof')).toHaveTextContent('2024-07-08T09:15:00.000Z');
    expect(screen.getByTestId('pit-vintage-era')).toHaveTextContent('CM_UDIFF');
    expect(screen.getByTestId('pit-vintage-sha-manifest-entry')).toHaveTextContent('2024-07-08');
    expect(screen.getByTestId('pit-vintage-acquisition-manifest')).toHaveTextContent('d114-manifest-test');
    expect(screen.queryByTestId('company-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('badge-certified')).not.toBeInTheDocument();
  });
});
