/**
 * Program v3.0 — N+10: Executive Dashboard tests (selected-decision governed trust chain).
 * URL-aware three-endpoint mocks; preserves the Phase-5 dashboard tests; adds selection →
 * inline governed Evidence + Replay (MATCH/DIFFERENCE), exact sector propagation,
 * loading/error/no-fabrication/deselection behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import type { ExecutiveData } from '../../api/executive';
import type { EvidenceData } from '../../api/evidence';
import type { ReplayData } from '../../api/replay';

const FIXTURE: ExecutiveData = {
  portfolio: { portfolioId: 'PF-T', scenario: 'Balanced', holdings: 2, sectorExposure: { A: 50, B: 50 }, concentration: 50, diversificationScore: 100, avgConviction: 60, avgQuality: 70, avgRisk: 40 },
  diversification: { band: 'High', flags: ['diversified'] },
  ranking: [{ companyId: 'A-H1', sector: 'A', conviction: 70 }, { companyId: 'B-H1', sector: 'B', conviction: 50 }],
  opportunity: [{ companyId: 'A-H1', sector: 'A', conviction: 70 }],
  correlation: { flags: ['low correlation'], concentrationSectors: [] },
  decisions: [
    { sector: 'A', verdict: 'Buy', composite: 70, confidence: 0.8 },
    { sector: 'B', verdict: 'Hold', composite: 50, confidence: 0.7 },
  ],
  provenance: { dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1' },
};

function evidenceFor(sector: string, composite: number): EvidenceData {
  return {
    decision: { verdict: 'Buy', composite, confidence: 0.8 },
    evidence: {
      evidenceId: `ev_${sector}`, engineId: `sector.${sector.toLowerCase()}`, recommendation: 'Buy', compositeScore: composite,
      confidence: 0.55, keyMetrics: [],
      supportingScores: [{ id: 'quality', name: 'Certified Quality', value: 62 }],
      calibrationVersion: '1.0.0', decisionRulesApplied: ['pillar-floor'], replayReference: `snap_${sector}`,
      provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: '1.0', snapshotId: `snap_${sector}` },
      generatedAt: '2026-08-01T00:00:00.000Z',
    },
    snapshot: { snapshotId: `snap_${sector}`, engineId: `sector.${sector.toLowerCase()}`, schemaVersion: '1.0', generatedAt: '2026-08-01T00:00:00.000Z', verdict: 'Buy', scores: {} },
    replay: { snapshotId: `snap_${sector}`, reproduced: true, byteIdentical: true, evidenceRefs: [`ev_${sector}`] },
    provenance: { dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1' },
  };
}

function replayFor(sector: string, byteIdentical: boolean): ReplayData {
  return {
    original: {
      snapshotId: `snap_${sector}`, engineId: `sector.${sector.toLowerCase()}`, schemaVersion: '1.0', calibrationVersion: '1.0.0',
      generatedAt: '2026-08-01T00:00:00.000Z', verdict: 'Buy', composite: 70, confidence: 0.8,
      provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: '1.0', snapshotId: `snap_${sector}` },
    },
    replay: { snapshotId: `snap_${sector}`, reproduced: true, byteIdentical, evidenceRefs: [`ev_${sector}`] },
    differenceAvailable: false,
    note: byteIdentical ? 'Replay reproduced successfully; byte-identical: MATCH' : 'Replay reproduced; outputs differ',
    evidenceRefs: [`ev_${sector}`],
    provenance: { dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1' },
  };
}

function urlAwareMock(opts: { replayBIdentical?: boolean; evidenceFails?: boolean } = {}) {
  return vi.fn((input: unknown) => {
    const url = String(input);
    if (url.includes('/api/executive')) return Promise.resolve({ ok: true, json: async () => FIXTURE }) as never;
    if (url.includes('/api/evidence/')) {
      if (opts.evidenceFails) return Promise.reject(new Error('evidence down')) as never;
      const sector = url.includes('/api/evidence/B') ? 'B' : 'A';
      return Promise.resolve({ ok: true, json: async () => evidenceFor(sector, sector === 'A' ? 70 : 50) }) as never;
    }
    if (url.includes('/api/replay/')) {
      const sector = url.includes('/api/replay/B') ? 'B' : 'A';
      return Promise.resolve({ ok: true, json: async () => replayFor(sector, sector === 'A' ? true : (opts.replayBIdentical ?? true)) }) as never;
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
  });
}

beforeEach(() => {
  globalThis.fetch = vi.fn() as never;
});

describe('Executive Dashboard (Phase 5 preserved behavior)', () => {
  it('renders loading then data', async () => {
    globalThis.fetch = urlAwareMock();
    render(<ExecutiveDashboard />);
    expect(screen.getByTestId('state-loading')).toBeInTheDocument();
    expect(await screen.findByTestId('decision-list')).toBeInTheDocument();
    expect(screen.getByTestId('badge-certified')).toHaveTextContent('CERTIFIED RESULT');
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
  });

  it('renders error state on fetch failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('transport down')) as never;
    render(<ExecutiveDashboard />);
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load certified executive data');
  });

  it('renders decision badges from certified data', async () => {
    globalThis.fetch = urlAwareMock();
    render(<ExecutiveDashboard />);
    expect(await screen.findByTestId('decision-badge-Buy')).toHaveTextContent('Buy');
    expect(screen.getByTestId('decision-badge-Hold')).toHaveTextContent('Hold');
  });

  it('does not fabricate values and surfaces SNAPSHOT freshness (not stale/live)', async () => {
    globalThis.fetch = urlAwareMock();
    render(<ExecutiveDashboard />);
    await screen.findByTestId('decision-list');
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
    expect(screen.queryByTestId('state-stale')).not.toBeInTheDocument();
  });
});

describe('Executive Dashboard — N+10 selected-decision trust chain', () => {
  it('selects a decision and renders the inline governed trust chain', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    render(<ExecutiveDashboard />);
    await screen.findByTestId('decision-list');
    await user.click(screen.getByTestId('inspect-A'));

    expect(await screen.findByTestId('executive-trust-chain')).toBeInTheDocument();
    expect(screen.getByText('Trust Chain — A')).toBeInTheDocument();
    expect(await screen.findByText('Evidence (governed)')).toBeInTheDocument();
    expect(screen.getByText('Replay Verification (governed)')).toBeInTheDocument();
    // ⚠ AD-17 L-5 (authority: D57, commit 9316b54). This PREVIOUSLY asserted the literal
    // 'MATCH — byte-identical', which encoded a verified-replay claim that has never been
    // established (AD-17 / M-2 UNRESOLVED). Replaced by an absence proof, scoped to the
    // verdict <strong> — replay.note is payload free text and contains 'MATCH' in the
    // fixture, so a region-wide search would be unsound, not stronger.
    {
      const eq = screen.getByTestId('company-replay-equivalence');
      expect(eq.querySelector('strong')?.textContent ?? '').not.toMatch(/MATCH|\bDIFFERENCE\b/);
      expect(eq).toHaveTextContent('NOT VERIFIED');
      expect(eq.querySelector('[data-testid="ad17-disclosure"]')).not.toBeNull();
    }
  });

  it('propagates the selected decision\'s ACTUAL sector to evidence + replay (exact URLs)', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const base = urlAwareMock();
    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      calls.push(url);
      return base(input);
    }) as never;

    render(<ExecutiveDashboard />);
    await screen.findByTestId('decision-list');
    await user.click(screen.getByTestId('inspect-B'));
    await screen.findByTestId('executive-trust-chain');

    expect(calls).toContain('/api/evidence/B');
    expect(calls).toContain('/api/replay/B');
    expect(calls.some((u) => u.includes('/api/evidence/A'))).toBe(false);
    expect(calls.some((u) => u.includes('/api/replay/A'))).toBe(false);
  });

  it('AD-17: reports byteIdentical=false as an unverified literal, with no DIFFERENCE verdict', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock({ replayBIdentical: false });
    render(<ExecutiveDashboard />);
    await screen.findByTestId('decision-list');
    await user.click(screen.getByTestId('inspect-B'));
    // ⚠ AD-17 L-5 (authority: D57). This PREVIOUSLY asserted the 'DIFFERENCE' failure
    // verdict, which is equally a verification claim. Now proves the verdict is absent and
    // the literal is reported as UNVERIFIED.
    {
      const eq = await screen.findByTestId('company-replay-equivalence');
      expect(eq.querySelector('strong')?.textContent ?? '').not.toMatch(/MATCH|\bDIFFERENCE\b/);
      expect(eq).toHaveTextContent('Reported byteIdentical:');
      expect(eq).toHaveTextContent('false');
      expect(eq).toHaveTextContent('NOT VERIFIED');
    }
  });

  it('shows a governed error state when the selected evidence fetch fails', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock({ evidenceFails: true });
    render(<ExecutiveDashboard />);
    await screen.findByTestId('decision-list');
    await user.click(screen.getByTestId('inspect-A'));
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load decision evidence');
  });

  it('deselects (toggle) and hides the trust chain when the same decision is clicked again', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    render(<ExecutiveDashboard />);
    await screen.findByTestId('decision-list');
    await user.click(screen.getByTestId('inspect-A'));
    await screen.findByTestId('executive-trust-chain');
    await user.click(screen.getByTestId('inspect-A'));
    expect(screen.queryByTestId('executive-trust-chain')).not.toBeInTheDocument();
  });

  it('does not fabricate: existing executive content remains alongside the trust chain', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    render(<ExecutiveDashboard />);
    await screen.findByTestId('decision-list');
    await user.click(screen.getByTestId('inspect-B'));
    await screen.findByTestId('executive-trust-chain');
    // The certified decision cards remain rendered (no removal, no fabrication).
    expect(screen.getAllByTestId('recent-decision').length).toBe(2);
    expect(screen.getByTestId('decision-badge-Hold')).toHaveTextContent('Hold');
  });
});

describe('Executive Dashboard — D93 data-mode degraded state handling (no crash)', () => {
  it('LIVE_UNAVAILABLE does not crash and renders the governed DataModeUnavailable UI', async () => {
    const degradedLive = {
      surface: 'Executive',
      dataMode: 'LIVE',
      state: 'LIVE_UNAVAILABLE',
      dataAvailable: false,
      reason: 'LIVE data is UNAVAILABLE for Executive. Live provider ingestion is not wired to this transport, so no live values exist to return.',
      dependency: 'R-2 provider ingestion — OPEN and externally blocked (provider selection, licensing, credentials, entitlements).',
      provenance: {
        dataSource: 'none — no governed data source is available for this data mode',
        freshness: 'UNAVAILABLE',
        mode: 'LIVE',
        transportSemantics: 'This response deliberately contains NO market data. The request is NOT silently served from the frozen v1.1 Replay Baseline, and no provider value is substituted or fabricated. Select SNAPSHOT to receive the certified baseline data.',
      },
    };

    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      if (url.includes('/api/executive')) {
        return Promise.resolve({ ok: true, json: async () => degradedLive }) as never;
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
    });

    render(<ExecutiveDashboard />);
    expect(await screen.findByTestId('data-mode-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('data-mode-unavailable-mode')).toHaveTextContent('LIVE');
    expect(screen.getByText(/LIVE data is UNAVAILABLE for Executive/)).toBeInTheDocument();
    expect(screen.queryByTestId('decision-list')).not.toBeInTheDocument();
  });

  it('PIT_UNAVAILABLE does not crash and renders the governed DataModeUnavailable UI', async () => {
    const degradedPit = {
      surface: 'Executive',
      dataMode: 'PIT',
      state: 'PIT_UNAVAILABLE',
      dataAvailable: false,
      reason: 'PIT data is UNAVAILABLE for Executive. No point-in-time capability is wired to this transport, so no as-of values exist to return.',
      dependency: 'PIT capability exists in p08 but is NOT wired to transport; wiring it is a separate authorized act.',
      provenance: {
        dataSource: 'none — no governed data source is available for this data mode',
        freshness: 'UNAVAILABLE',
        mode: 'PIT',
        transportSemantics: 'This response deliberately contains NO market data. The request is NOT silently served from the frozen v1.1 Replay Baseline, and no provider value is substituted or fabricated. Select SNAPSHOT to receive the certified baseline data.',
      },
    };

    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      if (url.includes('/api/executive')) {
        return Promise.resolve({ ok: true, json: async () => degradedPit }) as never;
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
    });

    render(<ExecutiveDashboard />);
    expect(await screen.findByTestId('data-mode-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('data-mode-unavailable-mode')).toHaveTextContent('PIT');
    expect(screen.getByText(/PIT data is UNAVAILABLE for Executive/)).toBeInTheDocument();
    expect(screen.queryByTestId('decision-list')).not.toBeInTheDocument();
  });

  it('successful-only arrays are never accessed for degraded payloads (decisions / ranking)', async () => {
    // Pass a degraded object with traps on successful-only fields that throw if touched
    const trappedDegraded = {
      surface: 'Executive',
      dataMode: 'LIVE',
      state: 'LIVE_UNAVAILABLE',
      dataAvailable: false,
      reason: 'LIVE data is UNAVAILABLE for Executive.',
      dependency: 'R-2 provider ingestion.',
      provenance: {
        dataSource: 'none',
        freshness: 'UNAVAILABLE',
        mode: 'LIVE',
        transportSemantics: 'none',
      },
      get decisions() { throw new Error('Attempted to access data.decisions on degraded payload!'); },
      get ranking() { throw new Error('Attempted to access data.ranking on degraded payload!'); },
      get portfolio() { throw new Error('Attempted to access data.portfolio on degraded payload!'); },
      get opportunity() { throw new Error('Attempted to access data.opportunity on degraded payload!'); },
      get correlation() { throw new Error('Attempted to access data.correlation on degraded payload!'); },
      get diversification() { throw new Error('Attempted to access data.diversification on degraded payload!'); },
    };

    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      if (url.includes('/api/executive')) {
        return Promise.resolve({ ok: true, json: async () => trappedDegraded }) as never;
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
    });

    expect(() => render(<ExecutiveDashboard />)).not.toThrow();
    expect(await screen.findByTestId('data-mode-unavailable')).toBeInTheDocument();
  });

  it('no silent SNAPSHOT fallback occurs when degraded payload is returned', async () => {
    const degradedLive = {
      surface: 'Executive',
      dataMode: 'LIVE',
      state: 'LIVE_UNAVAILABLE',
      dataAvailable: false,
      reason: 'LIVE data is UNAVAILABLE for Executive.',
      dependency: 'R-2',
      provenance: { dataSource: 'none', freshness: 'UNAVAILABLE', mode: 'LIVE', transportSemantics: 'none' },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => degradedLive }) as never;

    render(<ExecutiveDashboard />);
    await screen.findByTestId('data-mode-unavailable');
    // None of the SNAPSHOT fixture cards or metrics should appear
    expect(screen.queryByTestId('badge-certified')).not.toBeInTheDocument();
    expect(screen.queryByTestId('freshness-snapshot')).not.toBeInTheDocument();
    expect(screen.queryByTestId('top-opportunity')).not.toBeInTheDocument();
    expect(screen.queryByTestId('decision-badge-Buy')).not.toBeInTheDocument();
  });
});
