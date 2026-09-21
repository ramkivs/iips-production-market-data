/**
 * Program v3.0 — Phase 6 (+ N+8): Portfolio Workspace.
 *
 * Answers "What is happening in my portfolio, and what deserves investigation?"
 * Navigation: Executive -> Portfolio -> Holding -> Company -> Evidence -> Replay.
 * Data: typed API client over the certified v2.0 transport (CSIP + engine outputs).
 * No portfolio-management logic in React (no rebalance/risk/quality/priority/limits/thresholds).
 * Only presentational operations (sort/filter/group/paginate/format).
 *
 * N+8: holding-level governed trust chain. Selecting a holding composes the existing
 * governed endpoints for that holding's ACTUAL sector — /api/evidence/:sector and
 * /api/replay/:sector — and renders the shared, payload-driven CompanyTrustChain
 * (Decision → Evidence → Replay → Provenance). Sector is the only variable; no
 * recomputation, no fabrication. Client-side composition only (no server changes).
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  fetchPortfolioData,
  fetchUserPortfolio,
  listUserPortfolios,
  saveUserPortfolio,
  deleteUserPortfolio,
  isPortfolioUnavailable,
  type PortfolioData,
  type PortfolioHolding,
  type UserPortfolioSummary,
  type UserHoldingInput,
} from '../../api/portfolio';
import { fetchEvidenceData, type EvidenceData } from '../../api/evidence';
import { fetchReplayData, type ReplayData } from '../../api/replay';
import { ChartContainer, SimpleBarChart, LegendConventions } from '../../components/viz/ChartFoundations';
import { MetricCard, MetricGroup, DataTable, TrendIndicator } from '../../components/data/DataComponents';
import { DecisionBadge } from '../../components/decision/DecisionComponents';
import { EvidenceCard, type EvidenceReference } from '../../components/evidence/EvidenceComponents';
import { Accordion } from '../../components/interaction/InteractionComponents';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge, PlatformBadge } from '../../components/ui/Badges';
import { CompanyTrustChain } from '../company/CompanyTrustChain';

type SortKey = 'sector' | 'composite' | 'weight';

export function PortfolioWorkspace() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('weight');

  // N+8: holding selection + governed trust-chain state.
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [chainEvidence, setChainEvidence] = useState<EvidenceData | null>(null);
  const [chainReplay, setChainReplay] = useState<ReplayData | null>(null);
  const [chainLoading, setChainLoading] = useState(false);
  const [chainError, setChainError] = useState<string | null>(null);

  // Option A: User Intelligence Overlay state
  const [userPortfolios, setUserPortfolios] = useState<readonly UserPortfolioSummary[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [showImport, setShowImport] = useState(false);
  const [importName, setImportName] = useState('');
  const [importHoldingsText, setImportHoldingsText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSaving, setImportSaving] = useState(false);

  // Temporary Qualification Operator Cleanup state (non-production)
  const [operatorCleanupStatus, setOperatorCleanupStatus] = useState<string | null>(null);
  const [operatorCleanupError, setOperatorCleanupError] = useState<string | null>(null);
  const [operatorCleanupRunning, setOperatorCleanupRunning] = useState(false);

  // Load portfolio list on mount
  useEffect(() => {
    let active = true;
    listUserPortfolios()
      .then((lists) => { if (active) setUserPortfolios(lists); })
      .catch(() => { /* silent fail for list on non-persisted/test fixtures */ });
    return () => { active = false; };
  }, []);

  // Load selected portfolio or default certified reference
  useEffect(() => {
    let active = true;
    setLoading(true);
    const fetcher = selectedPortfolioId && selectedPortfolioId.trim() !== ''
      ? fetchUserPortfolio(selectedPortfolioId)
      : fetchPortfolioData();

    fetcher
      .then((d) => { if (active) { setData(d); setError(null); } })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedPortfolioId]);

  // N+8: compose the governed trust chain for the selected holding's actual sector.
  useEffect(() => {
    if (!selectedSector) { setChainEvidence(null); setChainReplay(null); setChainError(null); return; }
    let active = true;
    setChainLoading(true);
    setChainError(null);
    Promise.all([fetchEvidenceData(selectedSector), fetchReplayData(selectedSector)])
      .then(([e, r]) => { if (active) { setChainEvidence(e); setChainReplay(r); } })
      .catch((e) => { if (active) setChainError(String(e)); })
      .finally(() => { if (active) setChainLoading(false); });
    return () => { active = false; };
  }, [selectedSector]);

  // Presentational sorting only (does not change investment semantics).
  const sortedHoldings = useMemo(() => {
    if (!data) return [];
    const copy = [...data.holdings];
    copy.sort((a, b) => {
      if (sortKey === 'sector') return a.sector.localeCompare(b.sector);
      if (sortKey === 'composite') return b.composite - a.composite;
      return b.weight - a.weight;
    });
    return copy;
  }, [data, sortKey]);

  const handleImportSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setImportError(null);
    if (!importName.trim()) {
      setImportError('Portfolio name is required');
      return;
    }

    let parsedHoldings: UserHoldingInput[] = [];
    const text = importHoldingsText.trim();
    if (!text) {
      setImportError('Holdings cannot be empty');
      return;
    }

    try {
      if (text.startsWith('[') || text.startsWith('{')) {
        const raw = JSON.parse(text) as unknown;
        parsedHoldings = Array.isArray(raw) ? (raw as UserHoldingInput[]) : [raw as UserHoldingInput];
      } else {
        const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
        for (const line of lines) {
          const parts = line.split(/[:,\s]+/).filter((p) => p.length > 0);
          if (parts.length >= 2) {
            const sym = parts[0].trim();
            const wt = parseFloat(parts[1].replace('%', '').trim());
            parsedHoldings.push({ symbol: sym, weight: wt });
          } else {
            throw new Error(`Invalid line format: "${line}". Expected "SYMBOL: WEIGHT"`);
          }
        }
      }
    } catch (err) {
      setImportError(`Failed to parse holdings: ${(err as Error).message}`);
      return;
    }

    try {
      setImportSaving(true);
      const saved = await saveUserPortfolio({ name: importName.trim(), holdings: parsedHoldings });
      setData(saved);
      const savedId = (saved as unknown as { savedPortfolioId?: string }).savedPortfolioId;
      if (savedId) {
        setSelectedPortfolioId(savedId);
        setUserPortfolios((prev) => [
          ...prev.filter((p) => p.portfolioId !== savedId),
          {
            portfolioId: savedId,
            name: importName.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            holdings: parsedHoldings,
          },
        ]);
      }
      setShowImport(false);
      setImportName('');
      setImportHoldingsText('');
    } catch (err) {
      setImportError((err as Error).message);
    } finally {
      setImportSaving(false);
    }
  };

  /**
   * Temporary Non-Production Qualification Operator Cleanup
   * Authoritative target IDs:
   *   DELETE: pf-1789967765977-r6rdy, pf-1789967781145-zc6tt
   *   KEEP:   pf-1789974643348-qpydt
   */
  const handleOperatorCleanup = async () => {
    const TARGET_DELETE_1 = 'pf-1789967765977-r6rdy';
    const TARGET_DELETE_2 = 'pf-1789967781145-zc6tt';
    const TARGET_KEEP = 'pf-1789974643348-qpydt';

    setOperatorCleanupStatus(null);
    setOperatorCleanupError(null);
    setOperatorCleanupRunning(true);

    try {
      // 1. Call listUserPortfolios()
      const currentList = await listUserPortfolios();
      const currentIds = currentList.map((p) => p.portfolioId);

      // 2. Require exactly these three portfolio IDs
      const requiredIds = [TARGET_DELETE_1, TARGET_DELETE_2, TARGET_KEEP];
      if (currentIds.length !== 3) {
        throw new Error(
          `Safety stop: Expected exactly 3 portfolio records, but found ${currentIds.length}. Refusing deletion.`,
        );
      }
      for (const reqId of requiredIds) {
        if (!currentIds.includes(reqId)) {
          throw new Error(
            `Safety stop: Required portfolio ID "${reqId}" not found in current list. Refusing deletion.`,
          );
        }
      }

      // 3. Require that the retained portfolio is pf-1789974643348-qpydt
      if (!currentIds.includes(TARGET_KEEP)) {
        throw new Error(
          `Safety stop: Retained portfolio ID "${TARGET_KEEP}" not found. Refusing deletion.`,
        );
      }

      // 4. Deletion: Call the EXISTING deleteUserPortfolio (reuses authFetch/in-memory token)
      await deleteUserPortfolio(TARGET_DELETE_1);
      await deleteUserPortfolio(TARGET_DELETE_2);

      // Post-delete verification:
      // 1. Call listUserPortfolios()
      const afterList = await listUserPortfolios();

      // 2. Require exactly one remaining portfolio
      if (afterList.length !== 1) {
        throw new Error(
          `Post-delete verification failed: Expected 1 remaining portfolio, but found ${afterList.length}.`,
        );
      }

      // 3. Require its ID to be pf-1789974643348-qpydt
      if (afterList[0].portfolioId !== TARGET_KEEP) {
        throw new Error(
          `Post-delete verification failed: Remaining ID "${afterList[0].portfolioId}" does not match "${TARGET_KEEP}".`,
        );
      }

      // 4. Update UI state and display explicit success message
      setUserPortfolios(afterList);
      setSelectedPortfolioId(TARGET_KEEP);
      setOperatorCleanupStatus(
        `Cleanup successful: Removed 2 duplicates (${TARGET_DELETE_1}, ${TARGET_DELETE_2}). Verified exactly 1 remaining portfolio: ${TARGET_KEEP}.`,
      );
    } catch (err) {
      setOperatorCleanupError((err as Error).message);
    } finally {
      setOperatorCleanupRunning(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load certified portfolio data: ${error}`} />;
  if (!data) return <UnavailableState />;

  /*
   * D86 — governed degraded state (D85 LIVE/PIT contract).
   *
   * ⚠ This guard MUST precede the destructure below: the LIVE_UNAVAILABLE / PIT_UNAVAILABLE
   *   response deliberately carries NO `portfolio` object, so dereferencing `portfolio.holdings`
   *   threw before the governed state could render. The server contract is unchanged; only this
   *   consumer assumption is corrected.
   *
   * ⚠ The server's own `reason` and `dependency` are surfaced VERBATIM. No SNAPSHOT fallback and
   *   no substituted value is rendered — showing an empty portfolio shell here would discard the
   *   honesty D85 established.
   */
  if (isPortfolioUnavailable(data)) {
    return (
      <section aria-label="Portfolio workspace" data-testid="portfolio-unavailable">
        <header style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24, margin: 0 }}>Portfolio</h1>
            <code data-testid="portfolio-unavailable-mode" style={{ fontSize: 13 }}>{data.dataMode}</code>
          </div>
        </header>
        <UnavailableState reason={data.reason} />
        <p data-testid="portfolio-unavailable-dependency" style={{ color: 'var(--color-ink-secondary)', margin: '12px 0 0', fontSize: 13 }}>
          Blocking dependency: {data.dependency}
        </p>
        <p data-testid="portfolio-unavailable-semantics" style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 12 }}>
          {data.provenance.transportSemantics}
        </p>
      </section>
    );
  }

  const { portfolio, diversification, allocation, opportunity, correlation, evidenceRefs, provenance } = data;
  const isUserOverlay = provenance.dataSource.toLowerCase().includes('intelligence overlay') || provenance.dataSource.toLowerCase().includes('user portfolio');

  return (
    <section aria-label="Portfolio workspace">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Portfolio</h1>
          {isUserOverlay ? <PlatformBadge /> : <CertifiedBadge />}
          <FreshnessBadge state={provenance.freshness === 'SNAPSHOT' ? 'snapshot' : 'live'} />
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>{provenance.dataSource}</p>

        {/* Portfolio Selection & Import Affordance (Option A) */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          <label htmlFor="portfolio-select" style={{ fontSize: 13, fontWeight: 600 }}>
            Active Portfolio:
          </label>
          <select
            id="portfolio-select"
            data-testid="portfolio-selector"
            value={selectedPortfolioId}
            onChange={(e) => setSelectedPortfolioId(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-1)',
              color: 'var(--color-ink-primary)',
              fontSize: 13,
            }}
          >
            <option value="">Certified Reference Portfolio (Default)</option>
            {userPortfolios.map((p) => (
              <option key={p.portfolioId} value={p.portfolioId}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            data-testid="btn-import-portfolio"
            onClick={() => setShowImport(!showImport)}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {showImport ? 'Cancel Import' : 'Import Overlay'}
          </button>
        </div>

        {/* Temporary Operator-Only Qualification Cleanup Control */}
        <div
          data-testid="operator-cleanup-control"
          style={{
            marginTop: 12,
            padding: '10px 14px',
            border: '2px dashed var(--color-status-warning, #D97706)',
            borderRadius: 6,
            background: 'rgba(217, 119, 6, 0.06)',
            maxWidth: 640,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-status-warning, #D97706)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Operator Only (Temporary Qualification Cleanup):
            </span>
            <button
              type="button"
              data-testid="btn-operator-cleanup"
              disabled={operatorCleanupRunning}
              onClick={handleOperatorCleanup}
              style={{
                padding: '5px 12px',
                borderRadius: 4,
                border: '1px solid var(--color-status-warning, #D97706)',
                background: 'var(--color-status-warning, #D97706)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 12,
                cursor: operatorCleanupRunning ? 'not-allowed' : 'pointer',
              }}
            >
              {operatorCleanupRunning ? 'Cleaning up...' : 'QUALIFICATION CLEANUP — DELETE 2 DUPLICATES'}
            </button>
          </div>
          {operatorCleanupStatus && (
            <p
              data-testid="operator-cleanup-status"
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: 'var(--color-status-success, #059669)',
                fontWeight: 600,
              }}
            >
              {operatorCleanupStatus}
            </p>
          )}
          {operatorCleanupError && (
            <p
              data-testid="operator-cleanup-error"
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: 'var(--color-status-danger, #DC2626)',
                fontWeight: 600,
              }}
            >
              {operatorCleanupError}
            </p>
          )}
        </div>

        {/* Import Overlay Form */}
        {showImport && (
          <form
            data-testid="portfolio-import-form"
            onSubmit={handleImportSubmit}
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-1)',
              maxWidth: 480,
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>Import Intelligence Overlay</h3>
            {importError && (
              <p data-testid="import-error" style={{ color: 'var(--color-status-negative)', fontSize: 12, margin: '0 0 8px' }}>
                {importError}
              </p>
            )}
            <div style={{ marginBottom: 8 }}>
              <label htmlFor="input-portfolio-name" style={{ display: 'block', fontSize: 12, marginBottom: 2 }}>
                Portfolio Name
              </label>
              <input
                id="input-portfolio-name"
                data-testid="input-portfolio-name"
                type="text"
                required
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder="e.g. My Tech Allocation"
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-0)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label htmlFor="input-portfolio-holdings" style={{ display: 'block', fontSize: 12, marginBottom: 2 }}>
                Holdings (JSON or Symbol: Weight lines)
              </label>
              <textarea
                id="input-portfolio-holdings"
                data-testid="input-portfolio-holdings"
                rows={3}
                required
                value={importHoldingsText}
                onChange={(e) => setImportHoldingsText(e.target.value)}
                placeholder={'TCS: 50\nINFY: 50'}
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-0)',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit"
                data-testid="btn-save-portfolio"
                disabled={importSaving}
                style={{
                  padding: '4px 12px',
                  borderRadius: 4,
                  border: 'none',
                  background: 'var(--color-primary, #0066cc)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {importSaving ? 'Evaluating...' : 'Save & Evaluate'}
              </button>
              <button
                type="button"
                onClick={() => setShowImport(false)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: '1px solid var(--color-border)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </header>

      {/* Overview */}
      <MetricGroup label="Portfolio Overview">
        <MetricCard label="Holdings" value={portfolio.holdings} />
        <MetricCard label="Avg Conviction" value={portfolio.avgConviction} />
        <MetricCard label="Avg Quality" value={portfolio.avgQuality} />
        <MetricCard label="Avg Risk" value={portfolio.avgRisk} />
        <MetricCard label="Concentration" value={portfolio.concentration} />
        <MetricCard label="Diversification" value={portfolio.diversificationScore} direction="positive" />
      </MetricGroup>

      {/* Allocation (certified recommendation) */}
      <Accordion title={`Allocation Recommendation (${allocation.strategy})`}>
        <p data-testid="allocation-recommendation">{allocation.recommendation}</p>
        <ul style={{ paddingLeft: 20 }}>{allocation.rulesApplied.map((r) => <li key={r}>{r}</li>)}</ul>
      </Accordion>

      {/* Sector exposure */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Sector Exposure</h2>
      <ChartContainer title="Sector Exposure (%)">
        <SimpleBarChart data={Object.entries(portfolio.sectorExposure).map(([label, value]) => ({ label, value }))} />
      </ChartContainer>
      <LegendConventions items={[{ label: 'Sector weight (%)', colorVar: 'var(--color-status-informational)' }]} />

      {/* Holdings (sortable, presentational) — the trust-chain selector (N+8) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Holdings</h2>
      <div role="group" aria-label="Sort holdings" style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {(['weight', 'composite', 'sector'] as SortKey[]).map((k) => (
          <button key={k} type="button" aria-pressed={sortKey === k} onClick={() => setSortKey(k)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid var(--color-border)', background: sortKey === k ? 'var(--color-surface-2)' : 'var(--color-surface-1)' }}>
            Sort by {k}
          </button>
        ))}
      </div>
      <DataTable
        columns={[
          { key: 'sector', header: 'Sector', render: (r: PortfolioHolding) => r.sector },
          { key: 'decision', header: 'Decision', render: (r: PortfolioHolding) => <DecisionBadge verdict={r.decision} /> },
          { key: 'composite', header: 'Composite', render: (r: PortfolioHolding) => r.composite },
          { key: 'confidence', header: 'Confidence', render: (r: PortfolioHolding) => (r.confidence === null ? 'unavailable' : Math.round(r.confidence * 100)) },
          { key: 'risk', header: 'Risk', render: (r: PortfolioHolding) => r.risk },
          { key: 'weight', header: 'Weight %', render: (r: PortfolioHolding) => r.weight },
          { key: 'trend', header: 'Trend', render: () => <TrendIndicator direction="flat" label="—" /> },
          {
            key: 'details',
            header: 'Details',
            render: (r: PortfolioHolding) => (
              <button
                type="button"
                data-testid={`inspect-${r.sector}`}
                aria-pressed={selectedSector === r.sector}
                onClick={() => setSelectedSector(selectedSector === r.sector ? null : r.sector)}
              >
                {selectedSector === r.sector ? 'Hide' : 'Inspect'}
              </button>
            ),
          },
        ]}
        rows={sortedHoldings}
        emptyLabel="No holdings available"
      />

      {/* N+8: holding-level governed trust chain (Decision → Evidence → Replay → Provenance) */}
      {selectedSector && (
        <section
          data-testid="portfolio-trust-chain"
          aria-label={`Holding trust chain ${selectedSector}`}
          style={{ marginTop: 16, border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-0)' }}
        >
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Holding Trust Chain — {selectedSector}</h2>
          {chainLoading && <LoadingState />}
          {chainError && <ErrorState message={`Unable to load holding evidence: ${chainError}`} />}
          {!chainLoading && !chainError && chainEvidence && chainReplay && (
            <CompanyTrustChain evidence={chainEvidence} replay={chainReplay} />
          )}
        </section>
      )}

      {/* Opportunities */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Opportunities</h2>
      {opportunity.length > 0 ? (
        <ul data-testid="opportunity-list" style={{ paddingLeft: 20 }}>
          {opportunity.map((o) => <li key={o.companyId}>{o.sector} — conviction {o.conviction}</li>)}
        </ul>
      ) : <p>No opportunities available</p>}

      {/* Risk */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Risk</h2>
      <ul data-testid="portfolio-risk-list" style={{ paddingLeft: 20 }}>
        {correlation.flags.map((f) => <li key={f}>{f}</li>)}
        {diversification.flags.map((f) => <li key={f}>{f}</li>)}
        {correlation.concentrationSectors.map((s) => <li key={s}>Concentration: {s}</li>)}
        {correlation.flags.length + diversification.flags.length + correlation.concentrationSectors.length === 0 && <li>No risk flags</li>}
      </ul>

      {/* Evidence entry points (Executive -> Portfolio -> Holding -> Evidence -> Replay) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Evidence &amp; Replay</h2>
      <div data-testid="portfolio-evidence" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
        {evidenceRefs.map((ref) => <EvidenceCard key={ref.evidenceId} reference={ref as EvidenceReference} />)}
      </div>
    </section>
  );
}
