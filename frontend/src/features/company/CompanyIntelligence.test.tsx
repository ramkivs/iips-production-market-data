/**
 * Program v3.0 — N+5 (+ N+12): Company Intelligence tests (governed three-call composition
 * + governed sector reachability).
 *
 * Verifies the vertical slice: decision header + overrides + pillars + certified inputs +
 * inline governed Evidence chain + inline Replay result + provenance, and (N+12) the governed
 * sector selector sourced ONLY from /api/decision-matrix. No fabrication (null
 * confidence/pillars stay unavailable). Deterministic URL-aware fetch mocks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { CompanyIntelligence } from './CompanyIntelligence';
import type { CompanyData } from '../../api/company';
import type { EvidenceData } from '../../api/evidence';
import type { ReplayData } from '../../api/replay';
import type { DecisionMatrixData } from '../../api/decisionMatrix';

const PROVENANCE = {
  dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1',
} as const;

const COMPANY_TECH: CompanyData = {
  companyId: 'Technology-H1', sector: 'Technology',
  decision: { verdict: 'Buy', composite: 76.3, confidence: 0.8 },
  overrides: [], pillars: { quality: 85, growth: 75, risk: 60, profitability: 82, valuation: 60 },
  resolvedSubsegment: 'software-saas', resolvedArchetype: 'subscription', calibrationVersion: '1.0.0',
  inputs: [{ key: 'revenueGrowth', value: 22 }, { key: 'debtEbitda', value: 1.5 }],
  evidence: { evidenceId: 'ev_Tech', engineId: 'sector.technology', recommendation: 'Buy', compositeScore: 76.3 },
  provenance: PROVENANCE,
};

const COMPANY_BANK: CompanyData = {
  companyId: 'Banking-H1', sector: 'Banking',
  decision: { verdict: 'Watch', composite: 47.1, confidence: null },
  overrides: [], pillars: null,
  resolvedSubsegment: null, resolvedArchetype: null, calibrationVersion: null,
  inputs: [{ key: 'BM-001', value: 0.55 }],
  evidence: { evidenceId: 'ev_Bank', engineId: 'sector.banking', recommendation: 'Watch', compositeScore: 47.1 },
  provenance: PROVENANCE,
};

const SECTORS: DecisionMatrixData = {
  matrixType: 'scatter',
  note: 'presentational scatter; no classification computed',
  companies: [
    { companyId: 'Banking-H1', sector: 'Banking', verdict: 'Watch', composite: 47.1, quality: 40, valuation: 50 },
    { companyId: 'Technology-H1', sector: 'Technology', verdict: 'Buy', composite: 76.3, quality: 85, valuation: 60 },
  ],
  universe: { avgConviction: 60, avgQuality: 57, holdings: 2 },
  provenance: PROVENANCE,
};

function evidenceFor(sector: string, composite: number): EvidenceData {
  return {
    decision: { verdict: 'Buy', composite, confidence: 0.8 },
    evidence: {
      evidenceId: `ev_${sector}`, engineId: `sector.${sector.toLowerCase()}`, recommendation: 'Buy', compositeScore: composite,
      confidence: 0.55, keyMetrics: [],
      supportingScores: [{ id: 'asset-quality', name: 'Asset Quality', value: 62 }],
      calibrationVersion: '1.0.0', decisionRulesApplied: ['pillar-floor'], replayReference: `snap_${sector}`,
      provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: '1.0', snapshotId: `snap_${sector}` },
      generatedAt: '2026-08-01T00:00:00.000Z',
    },
    snapshot: { snapshotId: `snap_${sector}`, engineId: `sector.${sector.toLowerCase()}`, schemaVersion: '1.0', generatedAt: '2026-08-01T00:00:00.000Z', verdict: 'Buy', scores: {} },
    replay: { snapshotId: `snap_${sector}`, reproduced: true, byteIdentical: true, evidenceRefs: [`ev_${sector}`] },
    provenance: PROVENANCE,
  };
}

function replayFor(sector: string, byteIdentical: boolean): ReplayData {
  return {
    original: {
      snapshotId: `snap_${sector}`, engineId: `sector.${sector.toLowerCase()}`, schemaVersion: '1.0', calibrationVersion: '1.0.0',
      generatedAt: '2026-08-01T00:00:00.000Z', verdict: 'Buy', composite: 76.3, confidence: 0.8,
      provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: '1.0', snapshotId: `snap_${sector}` },
    },
    replay: { snapshotId: `snap_${sector}`, reproduced: true, byteIdentical, evidenceRefs: [`ev_${sector}`] },
    differenceAvailable: false,
    note: byteIdentical ? 'Replay reproduced successfully; byte-identical: MATCH' : 'Replay reproduced; outputs differ',
    evidenceRefs: [`ev_${sector}`],
    provenance: PROVENANCE,
  };
}

interface MockOpts {
  replayBIdentical?: boolean;
  sectorListFails?: boolean;
  companyFails?: boolean;
  sectorsOverride?: DecisionMatrixData;
  advisoryFails?: boolean;
}

/** G-AI-IMPL (T5/T6) — the governed advisory DTO for a host sector key. */
function aiAdvisoryFor(sector: string) {
  return {
    adviceId: 'A1B2C3D4',
    engineResultId: sector,
    kind: 'explanation',
    text: 'This is a supplementary advisory explanation. It is not a certified engine result and does not alter the certified result.',
    grounded: true,
    nonAuthoritative: true,
    model: 'iips-deterministic-advisor',
    modelVersion: '1.0.0',
    engineResultRef: 'SNAP_F3F53B67',
    label: 'AI EXPLANATION ≠ CERTIFIED RESULT',
    freshness: 'SNAPSHOT',
    unavailable: ['timestamp', 'tenant', 'provider', 'confidence', 'citations', 'decision'],
  };
}

function urlAwareMock(opts: MockOpts = {}): ReturnType<typeof vi.fn> {
  return vi.fn((input: unknown) => {
    const url = String(input);
    if (url.includes('/api/decision-matrix')) {
      if (opts.sectorListFails) return Promise.reject(new Error('sector list down')) as never;
      return Promise.resolve({ ok: true, json: async () => (opts.sectorsOverride ?? SECTORS) }) as never;
    }
    if (url.includes('/api/company/')) {
      if (opts.companyFails) return Promise.reject(new Error('company down')) as never;
      const sector = url.includes('/api/company/Technology') ? 'Technology' : 'Banking';
      return Promise.resolve({ ok: true, json: async () => (sector === 'Technology' ? COMPANY_TECH : COMPANY_BANK) }) as never;
    }
    if (url.includes('/api/evidence/')) {
      const sector = url.includes('/api/evidence/Technology') ? 'Technology' : 'Banking';
      return Promise.resolve({ ok: true, json: async () => evidenceFor(sector, sector === 'Technology' ? 76.3 : 47.1) }) as never;
    }
    if (url.includes('/api/replay/')) {
      const sector = url.includes('/api/replay/Technology') ? 'Technology' : 'Banking';
      return Promise.resolve({ ok: true, json: async () => replayFor(sector, opts.replayBIdentical ?? true) }) as never;
    }
    // G-AI-IMPL (T5/T6): the embedded advisory surface, bound to the host's sector key.
    if (url.includes('/api/ai-advisory/')) {
      if (opts.advisoryFails) return Promise.resolve({ ok: false, status: 503, json: async () => ({ error: 'advisory unavailable', code: 'advisory-unavailable' }) }) as never;
      const sector = decodeURIComponent(url.slice(url.indexOf('/api/ai-advisory/') + '/api/ai-advisory/'.length));
      return Promise.resolve({ ok: true, json: async () => aiAdvisoryFor(sector) }) as never;
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
  });
}

function renderCompany(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/research/company/${id}`]}>
      <Routes>
        <Route path="/research/company/:id" element={<CompanyIntelligence />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => { globalThis.fetch = vi.fn() as never; });

describe('Company Intelligence — N+5 vertical slice (preserved behavior)', () => {
  it('keeps the decision header + certified badge intact', async () => {
    globalThis.fetch = urlAwareMock();
    renderCompany('Technology');
    expect(await screen.findByTestId('company-header')).toBeInTheDocument();
    expect(screen.getByTestId('decision-badge-Buy')).toHaveTextContent('Buy');
    expect(screen.getByTestId('company-composite')).toHaveTextContent('76.3');
    expect(screen.getByTestId('badge-certified')).toHaveTextContent('CERTIFIED RESULT');
  });

  it('renders the inline governed Evidence payload (supporting metrics + evidence record + snapshot)', async () => {
    globalThis.fetch = urlAwareMock();
    renderCompany('Technology');
    await screen.findByTestId('company-header');
    expect(screen.getByText('Evidence (governed)')).toBeInTheDocument();
    expect(screen.getByText('Asset Quality')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-record-card')).toBeInTheDocument();
    expect(screen.getByText('Snapshot & Provenance')).toBeInTheDocument();
  });

  it('renders the inline governed Replay result (MATCH equivalence + refs)', async () => {
    globalThis.fetch = urlAwareMock();
    renderCompany('Technology');
    await screen.findByTestId('company-header');
    expect(screen.getByText('Replay Verification (governed)')).toBeInTheDocument();
    expect(screen.getByTestId('company-replay-equivalence')).toHaveTextContent('MATCH — byte-identical');
    expect(screen.getByTestId('company-replay-refs')).toHaveTextContent('ev_Technology');
  });

  it('renders DIFFERENCE when the governed replay is not byte-identical', async () => {
    globalThis.fetch = urlAwareMock({ replayBIdentical: false });
    renderCompany('Banking');
    await screen.findByTestId('company-header');
    expect(screen.getByTestId('company-replay-equivalence')).toHaveTextContent('DIFFERENCE');
  });

  it('shows pillar scores only where the engine exposes them', async () => {
    globalThis.fetch = urlAwareMock();
    renderCompany('Technology');
    await screen.findByTestId('company-header');
    expect(screen.queryByTestId('pillars-unavailable')).not.toBeInTheDocument();
    expect(screen.getByText('Business Quality / Growth / Valuation / Risk')).toBeInTheDocument();
  });

  it('shows pillars-unavailable and confidence-unavailable (no fabrication) for non-Technology', async () => {
    globalThis.fetch = urlAwareMock();
    renderCompany('Banking');
    await screen.findByTestId('company-header');
    expect(screen.getByTestId('pillars-unavailable')).toHaveTextContent('not exposed');
    expect(screen.getByText('Confidence unavailable')).toBeInTheDocument();
  });

  it('renders certified input metrics (SNAPSHOT) table', async () => {
    globalThis.fetch = urlAwareMock();
    renderCompany('Technology');
    await screen.findByTestId('company-header');
    expect(screen.getByText('Company Inputs (SNAPSHOT)')).toBeInTheDocument();
    expect(screen.getByText('revenueGrowth')).toBeInTheDocument();
  });

  it('provenance remains visible', async () => {
    globalThis.fetch = urlAwareMock();
    renderCompany('Technology');
    await screen.findByTestId('company-header');
    expect(screen.getByTestId('company-provenance')).toBeInTheDocument();
  });

  it('renders error state when any governed call fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('down')) as never;
    renderCompany('Banking');
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load company data');
  });

  it('N+7: requests the exact governed endpoints for the concrete Banking route', async () => {
    const calls: string[] = [];
    const base = urlAwareMock();
    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      calls.push(url);
      return base(input);
    }) as never;

    renderCompany('Banking');
    await screen.findByTestId('company-header');

    expect(calls).toContain('/api/company/Banking');
    expect(calls).toContain('/api/evidence/Banking');
    expect(calls).toContain('/api/replay/Banking');
    expect(calls).not.toContain('/api/company/%3Aid');
  });
});

describe('Company Intelligence — N+12 governed sector reachability', () => {
  it('renders the sector selector options from the governed /api/decision-matrix payload', async () => {
    globalThis.fetch = urlAwareMock();
    renderCompany('Banking');
    const select = await screen.findByTestId('sector-select');
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(options).toContain('Banking');
    expect(options).toContain('Technology');
  });

  it('does NOT hardcode the sector list (options reflect the governed payload)', async () => {
    const customSectors: DecisionMatrixData = {
      matrixType: 'scatter', note: 'test',
      companies: [
        { companyId: 'X-H1', sector: 'Alpha', verdict: 'Buy', composite: 60, quality: 55, valuation: 50 },
        { companyId: 'Y-H1', sector: 'Beta', verdict: 'Hold', composite: 40, quality: 45, valuation: 55 },
      ],
      universe: { avgConviction: 50, avgQuality: 50, holdings: 2 },
      provenance: PROVENANCE,
    };
    globalThis.fetch = urlAwareMock({ sectorsOverride: customSectors });
    renderCompany('Banking');
    const select = await screen.findByTestId('sector-select');
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(options).toContain('Alpha');
    expect(options).toContain('Beta');
    expect(options).not.toContain('Banking');
    expect(options).not.toContain('Technology');
  });

  it('selecting a sector navigates to /research/company/:sector (selected Technology loads)', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    renderCompany('Banking');
    await screen.findByTestId('sector-select');
    await user.selectOptions(screen.getByTestId('sector-select'), 'Technology');
    expect(await screen.findByTestId('company-composite')).toHaveTextContent('76.3');
    expect(screen.getByTestId('company-header')).toHaveTextContent('Technology');
  });

  it('propagates the selected sector exactly to company/evidence/replay', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const base = urlAwareMock();
    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      calls.push(url);
      return base(input);
    }) as never;

    renderCompany('Banking');
    await screen.findByTestId('sector-select');
    await user.selectOptions(screen.getByTestId('sector-select'), 'Technology');
    await screen.findByTestId('company-composite');

    expect(calls).toContain('/api/company/Technology');
    expect(calls).toContain('/api/evidence/Technology');
    expect(calls).toContain('/api/replay/Technology');
  });

  it('selecting Technology does NOT trigger additional Banking endpoint calls (only the initial Banking mount)', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const base = urlAwareMock();
    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      calls.push(url);
      return base(input);
    }) as never;

    renderCompany('Banking');
    await screen.findByTestId('sector-select');
    const callsAfterInitialMount = calls.length; // initial load is Banking (the route param)
    await user.selectOptions(screen.getByTestId('sector-select'), 'Technology');
    await screen.findByTestId('company-composite');

    const postSelection = calls.slice(callsAfterInitialMount);
    expect(postSelection).toContain('/api/company/Technology');
    expect(postSelection).toContain('/api/evidence/Technology');
    expect(postSelection).toContain('/api/replay/Technology');
    expect(postSelection).not.toContain('/api/company/Banking');
    expect(postSelection).not.toContain('/api/evidence/Banking');
    expect(postSelection).not.toContain('/api/replay/Banking');
  });

  it('renders the governed trust chain (MATCH) for the newly selected sector', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    renderCompany('Banking');
    await screen.findByTestId('sector-select');
    await user.selectOptions(screen.getByTestId('sector-select'), 'Technology');
    expect(await screen.findByText('Evidence (governed)')).toBeInTheDocument();
    expect(screen.getByText('Replay Verification (governed)')).toBeInTheDocument();
    expect(screen.getByTestId('company-replay-equivalence')).toHaveTextContent('MATCH — byte-identical');
  });

  it('renders DIFFERENCE for the selected sector when the governed replay is not byte-identical', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock({ replayBIdentical: false });
    renderCompany('Banking');
    await screen.findByTestId('sector-select');
    await user.selectOptions(screen.getByTestId('sector-select'), 'Banking');
    expect(await screen.findByTestId('company-replay-equivalence')).toHaveTextContent('DIFFERENCE');
  });

  it('shows a governed error state when the sector-list fetch fails (company content preserved)', async () => {
    globalThis.fetch = urlAwareMock({ sectorListFails: true });
    renderCompany('Banking');
    expect(await screen.findByTestId('sector-selector-error')).toHaveTextContent('Unable to load sector list');
    // The company surface itself still renders its certified content.
    expect(screen.getByTestId('company-header')).toBeInTheDocument();
  });

  it('preserves existing Company content alongside the selector (inputs + provenance)', async () => {
    globalThis.fetch = urlAwareMock();
    renderCompany('Technology');
    await screen.findByTestId('company-header');
    expect(screen.getByTestId('sector-select')).toBeInTheDocument();
    expect(screen.getByText('Company Inputs (SNAPSHOT)')).toBeInTheDocument();
    expect(screen.getByTestId('company-provenance')).toBeInTheDocument();
  });

  it('preserves no-fabrication for a non-Technology sector (pillars + confidence unavailable)', async () => {
    globalThis.fetch = urlAwareMock();
    renderCompany('Banking');
    await screen.findByTestId('sector-select');
    expect(screen.getByTestId('pillars-unavailable')).toHaveTextContent('not exposed');
    expect(screen.getByText('Confidence unavailable')).toBeInTheDocument();
  });
});

describe('G-AI-IMPL — embedded AI explanation (T5 host binding · T6 no regression)', () => {
  it('renders the advisory bound to the host sector key (T5)', async () => {
    globalThis.fetch = urlAwareMock();
    renderCompany('Technology');
    expect(await screen.findByTestId('ai-explanation')).toBeInTheDocument();
    const calls = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((c) => String(c[0]));
    expect(calls.some((u) => u === '/api/ai-advisory/Technology')).toBe(true);
  });

  it('follows the host sector when the governed sector selector changes (T5)', async () => {
    globalThis.fetch = urlAwareMock();
    renderCompany('Technology');
    await screen.findByTestId('ai-explanation');
    await userEvent.selectOptions(screen.getByTestId('sector-select'), 'Banking');
    await waitFor(() => {
      const calls = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((c) => String(c[0]));
      expect(calls.some((u) => u === '/api/ai-advisory/Banking')).toBe(true);
    });
  });

  it('keeps the certified result surface unchanged alongside the advisory (T6)', async () => {
    globalThis.fetch = urlAwareMock();
    renderCompany('Technology');
    expect(await screen.findByTestId('company-header')).toBeInTheDocument();
    expect(screen.getByTestId('badge-certified')).toHaveTextContent('CERTIFIED RESULT');
    expect(screen.getByTestId('decision-badge-Buy')).toHaveTextContent('Buy');
    expect(screen.getByTestId('company-composite')).toHaveTextContent('76.3');
    // The advisory is present and remains visually and textually distinct from the certified result.
    expect(screen.getByTestId('ai-explanation')).toBeInTheDocument();
    expect(screen.getByTestId('ai-explanation-label')).toHaveTextContent('AI EXPLANATION ≠ CERTIFIED RESULT');
  });

  it('adds no sector selector and no navigation entry of its own (D2/D3/D4)', async () => {
    globalThis.fetch = urlAwareMock();
    const { container } = renderCompany('Technology');
    await screen.findByTestId('ai-explanation');
    const advisory = screen.getByTestId('ai-explanation');
    expect(advisory.querySelector('select')).toBeNull();
    expect(container.querySelectorAll('nav')).toHaveLength(0);
  });

  it('renders the canonical ErrorState on advisory failure without disturbing the host (T6 · S4)', async () => {
    globalThis.fetch = urlAwareMock({ advisoryFails: true });
    renderCompany('Technology');
    expect(await screen.findByTestId('company-header')).toBeInTheDocument();
    expect(await screen.findByTestId('state-error')).toBeInTheDocument();
    expect(screen.getByTestId('badge-certified')).toHaveTextContent('CERTIFIED RESULT');
    expect(screen.queryByText(/supplementary advisory explanation/)).not.toBeInTheDocument();
  });
});
