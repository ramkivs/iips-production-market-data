/**
 * Program v3.0 — P-4: Sector Information tests (composition-only read surface).
 *
 * Verifies the accepted spec (S1–S6): data composed 1:1 from the FOUR existing governed
 * endpoints (company + evidence + replay + decision-matrix); no Company trust-chain
 * duplication (replay summary + Company link); null confidence/quality/valuation/pillars
 * render "unavailable" (never 0); replay verification is never forced; the sector selector
 * is sourced ONLY from /api/decision-matrix; and /research/sector/:id renders
 * SectorIntelligence instead of the FeaturePlaceholder.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SectorIntelligence } from './SectorIntelligence';
import { App } from '../../app/App';
import { SessionProvider } from '../../core/session/SessionContext';
import type { CompanyData } from '../../api/company';
import type { EvidenceData } from '../../api/evidence';
import type { ReplayData } from '../../api/replay';
import type { DecisionMatrixData } from '../../api/decisionMatrix';
import type { ExecutiveProvenance } from '../../api/executive';

const PROVENANCE: ExecutiveProvenance = {
  dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1',
};

const COMPANY: CompanyData = {
  companyId: 'Banking-H1',
  sector: 'Banking',
  decision: { verdict: 'Watch', composite: 47.1, confidence: null },
  overrides: ['valuation-cap'],
  pillars: { quality: 52, growth: 41, valuation: 47, risk: 44 },
  resolvedSubsegment: null,
  resolvedArchetype: null,
  calibrationVersion: '1.0.0',
  inputs: [{ key: 'netInterestMargin', value: 3.1 }],
  evidence: { evidenceId: 'ev-Banking', engineId: 'sector.banking', recommendation: 'Watch', compositeScore: 47.1 },
  provenance: PROVENANCE,
};

const EVIDENCE: EvidenceData = {
  decision: { verdict: 'Watch', composite: 47.1, confidence: null },
  evidence: {
    evidenceId: 'ev-Banking',
    engineId: 'sector.banking',
    recommendation: 'Watch',
    compositeScore: 47.1,
    confidence: null,
    keyMetrics: [{ id: 'netInterestMargin', name: 'Net Interest Margin', value: 3.1 }],
    supportingScores: [{ id: 'quality', name: 'Certified Quality', value: 52 }],
    calibrationVersion: '1.0.0',
    decisionRulesApplied: ['valuation-cap'],
    replayReference: 'snap-Banking',
    provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: '1.0', snapshotId: 'snap-Banking' },
    generatedAt: '2026-08-01T00:00:00.000Z',
  },
  snapshot: { snapshotId: 'snap-Banking', engineId: 'sector.banking', schemaVersion: '1.0', generatedAt: '2026-08-01T00:00:00.000Z', verdict: 'Watch', scores: { quality: 52 } },
  replay: { snapshotId: 'snap-Banking', reproduced: true, byteIdentical: true, evidenceRefs: ['ev-Banking'] },
  provenance: PROVENANCE,
};

const REPLAY: ReplayData = {
  original: {
    snapshotId: 'snap-Banking',
    engineId: 'sector.banking',
    schemaVersion: '1.0',
    calibrationVersion: '1.0.0',
    generatedAt: '2026-08-01T00:00:00.000Z',
    verdict: 'Watch',
    composite: 47.1,
    confidence: null,
    provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: '1.0', snapshotId: 'snap-Banking' },
  },
  replay: { snapshotId: 'snap-Banking', reproduced: true, byteIdentical: true, evidenceRefs: ['ev-Banking'] },
  differenceAvailable: false,
  note: 'test',
  evidenceRefs: ['ev-Banking'],
  provenance: PROVENANCE,
};

const DIRECTORY: DecisionMatrixData = {
  matrixType: 'scatter',
  note: 'presentational scatter; no classification computed',
  companies: [
    { companyId: 'Banking-H1', sector: 'Banking', verdict: 'Watch', composite: 47.1, quality: 52, valuation: 47 },
    { companyId: 'Technology-H1', sector: 'Technology', verdict: 'Buy', composite: 76.3, quality: 85, valuation: 60 },
  ],
  universe: { avgConviction: 60, avgQuality: 57, holdings: 2 },
  provenance: PROVENANCE,
};

interface MockOptions {
  failCompany?: boolean;
  company?: CompanyData;
  evidence?: EvidenceData;
  replay?: ReplayData;
  matrix?: DecisionMatrixData;
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

function urlAwareMock(opts: MockOptions = {}): ReturnType<typeof vi.fn> {
  const company = opts.company ?? COMPANY;
  const evidence = opts.evidence ?? EVIDENCE;
  const replay = opts.replay ?? REPLAY;
  const matrix = opts.matrix ?? DIRECTORY;
  return vi.fn((input: unknown) => {
    const url = String(input);
    if (url.includes('/api/company/')) {
      if (opts.failCompany) return Promise.reject(new Error('company down')) as never;
      return Promise.resolve({ ok: true, json: async () => company }) as never;
    }
    if (url.includes('/api/evidence/')) {
      return Promise.resolve({ ok: true, json: async () => evidence }) as never;
    }
    if (url.includes('/api/replay/')) {
      return Promise.resolve({ ok: true, json: async () => replay }) as never;
    }
    if (url.includes('/api/decision-matrix')) {
      return Promise.resolve({ ok: true, json: async () => matrix }) as never;
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

function renderSector(path = '/research/sector/Banking') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/research/sector/:id" element={<SectorIntelligence />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => { globalThis.fetch = vi.fn() as never; });

describe('Sector Information — governed composition (S1)', () => {
  it('renders sector data composed from the four governed endpoints', async () => {
    globalThis.fetch = urlAwareMock();
    renderSector();
    expect(await screen.findByRole('heading', { name: 'Banking' })).toBeInTheDocument();
    expect(screen.getByTestId('decision-badge-Watch')).toHaveTextContent('Watch');
    expect(screen.getByTestId('sector-composite')).toHaveTextContent('47.1');
    expect(screen.getByTestId('sector-company-link')).toBeInTheDocument();
  });

  it('renders engine identity and calibration version 1:1', async () => {
    globalThis.fetch = urlAwareMock();
    renderSector();
    await screen.findByRole('heading', { name: 'Banking' });
    expect(screen.getByText(/sector\.banking/)).toBeInTheDocument();
    expect(screen.getByText(/calibration 1\.0\.0/)).toBeInTheDocument();
  });

  it('renders null confidence as unavailable (never 0)', async () => {
    globalThis.fetch = urlAwareMock();
    renderSector();
    await screen.findByRole('heading', { name: 'Banking' });
    expect(screen.getByTestId('sector-confidence')).toHaveTextContent('unavailable');
  });

  it('renders certified pillars from the company payload', async () => {
    globalThis.fetch = urlAwareMock();
    renderSector();
    await screen.findByRole('heading', { name: 'Banking' });
    expect(screen.getByText('quality')).toBeInTheDocument();
    expect(screen.getByText('growth')).toBeInTheDocument();
    expect(screen.getByText('valuation')).toBeInTheDocument();
    expect(screen.getByText('risk')).toBeInTheDocument();
  });

  it('renders the unavailable-safe state when the engine exposes no pillars', async () => {
    globalThis.fetch = urlAwareMock({ company: { ...COMPANY, pillars: null } });
    renderSector();
    await screen.findByRole('heading', { name: 'Banking' });
    expect(screen.getByTestId('sector-pillars-unavailable')).toBeInTheDocument();
  });

  it('renders the universe position from the decision-matrix row (null quality/valuation → unavailable)', async () => {
    const matrix: DecisionMatrixData = {
      ...DIRECTORY,
      companies: [
        { companyId: 'Banking-H1', sector: 'Banking', verdict: 'Watch', composite: 47.1, quality: null, valuation: null },
        { companyId: 'Technology-H1', sector: 'Technology', verdict: 'Buy', composite: 76.3, quality: 85, valuation: 60 },
      ],
    };
    globalThis.fetch = urlAwareMock({ matrix });
    renderSector();
    await screen.findByRole('heading', { name: 'Banking' });
    // quality + valuation MetricCards render "unavailable" (never 0).
    expect(screen.getAllByText('unavailable').length).toBe(2);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders overrides and decision rules from the governed payload', async () => {
    globalThis.fetch = urlAwareMock();
    renderSector();
    await screen.findByRole('heading', { name: 'Banking' });
    expect(screen.getByTestId('sector-overrides')).toBeInTheDocument();
    expect(screen.getByTestId('sector-rules-applied')).toHaveTextContent('valuation-cap');
  });
});

describe('Sector Information — replay verification (S2)', () => {
  it('renders the replay summary without forcing difference availability', async () => {
    globalThis.fetch = urlAwareMock();
    renderSector();
    await screen.findByRole('heading', { name: 'Banking' });
    const summary = screen.getByTestId('sector-replay-summary');
    expect(summary).toHaveTextContent('Reproduced: yes');
    expect(summary).toHaveTextContent('Byte-identical: yes');
    // differenceAvailable is false in the payload → must render "no" (never forced true).
    expect(summary).toHaveTextContent('Difference available: no');
  });
});

describe('Sector Information — navigation and selector (S3/S6)', () => {
  it('links to the full Company trust chain for the exact sector (S3)', async () => {
    globalThis.fetch = urlAwareMock();
    renderSector();
    await screen.findByRole('heading', { name: 'Banking' });
    expect(screen.getByTestId('sector-company-link')).toHaveAttribute('href', '/research/company/Banking');
  });

  it('sources the sector selector ONLY from /api/decision-matrix (S6)', async () => {
    const matrix: DecisionMatrixData = {
      matrixType: 'scatter', note: 'test',
      companies: [
        { companyId: 'A-H1', sector: 'Alpha', verdict: 'Buy', composite: 60, quality: 55, valuation: 50 },
        { companyId: 'B-H1', sector: 'Beta', verdict: 'Hold', composite: 40, quality: 45, valuation: 55 },
      ],
      universe: { avgConviction: 50, avgQuality: 50, holdings: 2 },
      provenance: PROVENANCE,
    };
    globalThis.fetch = urlAwareMock({ matrix });
    renderSector();
    await screen.findByRole('heading', { name: 'Banking' });
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Alpha', 'Beta']);
  });
});

describe('Sector Information — error state', () => {
  it('renders the governed error state when the sector payload is unavailable', async () => {
    globalThis.fetch = urlAwareMock({ failCompany: true });
    renderSector('/research/sector/Unknown');
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load sector data');
  });
});

describe('Sector Information — route integration', () => {
  it('/research/sector/:id renders SectorIntelligence instead of the FeaturePlaceholder', async () => {
    globalThis.fetch = urlAwareMock();
    render(
      <MemoryRouter initialEntries={['/research/sector/Banking']}>
        <SessionProvider session={{ userId: 'u1', tenantId: 'tenant-A', role: 'analyst', authenticated: true }}>
          <App />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Banking' })).toBeInTheDocument();
    expect(screen.queryByTestId('shell-not-authorized')).not.toBeInTheDocument();
  });
});

describe('G-AI-IMPL — embedded AI explanation (T5 host binding · T6 no regression)', () => {
  it('renders the advisory bound to the host sector key (T5)', async () => {
    globalThis.fetch = urlAwareMock();
    renderSector();
    expect(await screen.findByTestId('ai-explanation')).toBeInTheDocument();
    const calls = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((c) => String(c[0]));
    expect(calls.some((u) => u === '/api/ai-advisory/Banking')).toBe(true);
  });

  it('keeps the certified sector surface unchanged alongside the advisory (T6)', async () => {
    globalThis.fetch = urlAwareMock();
    renderSector();
    // Await the host's governed composition first, then the advisory embedded within it.
    expect(await screen.findByTestId('sector-company-link')).toBeInTheDocument();
    expect(screen.getByTestId('sector-provenance')).toBeInTheDocument();
    expect(await screen.findByTestId('ai-explanation')).toBeInTheDocument();
    expect(screen.getByTestId('ai-explanation-label')).toHaveTextContent('AI EXPLANATION ≠ CERTIFIED RESULT');
  });

  it('adds no sector selector of its own (D2/D6)', async () => {
    globalThis.fetch = urlAwareMock();
    renderSector();
    await screen.findByTestId('ai-explanation');
    expect(screen.getByTestId('ai-explanation').querySelector('select')).toBeNull();
  });

  it('renders the canonical ErrorState on advisory failure without disturbing the host (T6 · S4)', async () => {
    globalThis.fetch = urlAwareMock({ advisoryFails: true });
    renderSector();
    expect(await screen.findByTestId('sector-company-link')).toBeInTheDocument();
    expect(await screen.findByTestId('state-error')).toBeInTheDocument();
    expect(screen.queryByText(/supplementary advisory explanation/)).not.toBeInTheDocument();
  });
});
