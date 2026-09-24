/**
 * Program v3.0 — Phase 7 (+ N+5, + N+12): Company Intelligence workspace.
 * Route: /research/company/:id.
 *
 * Answers "What does the certified platform say about this company, why, and can I
 * verify/replay it?" as a complete governed trust chain:
 *   Decision (header) → Evidence (why) → Replay (reproducible) → Provenance.
 *
 * Composes the FOUR current-lineage SNAPSHOT read authorities client-side:
 *   /api/company/:sector · /api/evidence/:sector · /api/replay/:sector · /api/decision-matrix
 * Sector is the only variable; no sector-specific logic, no recomputation, no fabrication.
 * Pillars/confidence show "unavailable" where the certified source does not provide them.
 *
 * ══ PROMPT 2C SCOPE ADAPTATIONS (explicit, bounded) ═════════════════════════════════════════
 *  · SNAPSHOT ONLY. The donor's PIT-vintage branch (`fetchCompanyPayload`, `isPitVintage`,
 *    `PitVintagePanel`, the `?asOf=` search parameter) is NOT carried over: `asOf` is a PIT
 *    data-selection parameter, this gate adds no `asOf` support, and the server refuses `asOf`
 *    under SNAPSHOT rather than ignoring it. No PIT/D114 import exists here.
 *  · AI Advisory is NOT reconstructed. `<AdvisoryDeferred/>` renders the documented DEFERRED
 *    state in its place — no network call, no advisory value, no auth reconstruction.
 *  · The donor's `isDegraded(...)` guards are PRESERVED. In this gate the four authorities are
 *    SNAPSHOT-only and emit no degraded family, so those guards are unreachable-by-construction
 *    rather than removed — they keep the surface honest if a degraded payload ever appears.
 *  · Presentation is split into a pure `CompanyIntelligenceView` so the data-rendered DOM is
 *    verifiable in `node:test` without jsdom (the loader's effects do not run under
 *    `renderToString`). The rendered markup is the donor's, unchanged.
 *
 * Browser boundary: this file reaches data over HTTP only. It imports no server module, no
 * `src/transports/**`, no `iips-platform/**`, and no `node:*`.
 */
import { useEffect, useState } from 'react';
import { isDegraded } from '../../api/dataMode.js';
import { DataModeUnavailable } from '../../components/state/DataModeUnavailable.js';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCompanyData, type CompanyData } from '../../api/company.js';
import { fetchEvidenceData, type EvidenceData } from '../../api/evidence.js';
import { fetchReplayData, type ReplayData } from '../../api/replay.js';
import { fetchDecisionMatrixData, type MatrixCompany } from '../../api/decisionMatrix.js';
import { CompanyHeader } from '../../components/company/CompanyHeader.js';
import { MetricGroup, MetricCard, DataTable } from '../../components/data/DataComponents.js';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents.js';
import { StatusBadge } from '../../components/ui/Badges.js';
import { CompanyTrustChain } from './CompanyTrustChain.js';
import { AdvisoryDeferred } from '../../components/ai/AdvisoryDeferred.js';

/* ─────────────────────────────────────────────────────────────────────────────────────────
 * Pure presentation — every value is consumed 1:1 from the governed payloads.
 * ───────────────────────────────────────────────────────────────────────────────────────── */

export interface CompanyIntelligenceViewProps {
  readonly company: CompanyData;
  readonly evidence: EvidenceData;
  readonly replay: ReplayData;
  readonly sectors: readonly MatrixCompany[] | null;
  readonly sectorsError: string | null;
  /** The sector currently addressed by the route (:id), used as the selector value. */
  readonly selectedSector: string;
  readonly onSelectSector: (sector: string) => void;
}

export function CompanyIntelligenceView({
  company, evidence, replay, sectors, sectorsError, selectedSector, onSelectSector,
}: CompanyIntelligenceViewProps) {
  // Pillar scores exist only where the certified engine exposes them — never derived here.
  const pillarEntries = company.pillars
    ? Object.entries(company.pillars).map(([k, v]) => ({ key: k, value: v }))
    : null;

  return (
    <section aria-label="Company intelligence">
      <CompanyHeader
        companyName={`${company.sector} (reference)`}
        sector={company.sector}
        verdict={company.decision.verdict}
        composite={company.decision.composite}
        confidence={company.decision.confidence}
        freshness={company.provenance.freshness}
        subLabel={company.resolvedSubsegment ? `${company.resolvedSubsegment}${company.resolvedArchetype ? ` · ${company.resolvedArchetype}` : ''}` : null}
      />

      {/* N+12: governed sector selector — options sourced only from /api/decision-matrix */}
      <div data-testid="company-sector-selector" style={{ marginTop: 16 }}>
        {sectorsError ? (
          <span data-testid="sector-selector-error" style={{ color: 'var(--color-status-critical)', fontSize: 13 }}>
            Unable to load sector list: {sectorsError}
          </span>
        ) : !sectors ? (
          <span data-testid="sector-selector-loading" style={{ color: 'var(--color-ink-secondary)', fontSize: 13 }}>
            Loading sectors&hellip;
          </span>
        ) : (
          <label style={{ fontSize: 13 }}>
            Company / Sector{' '}
            <select
              data-testid="sector-select"
              aria-label="Select sector"
              value={selectedSector}
              onChange={(e) => onSelectSector(e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-surface-0)' }}
            >
              {sectors.map((s) => (
                <option key={s.sector} value={s.sector}>{s.sector}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Overrides */}
      {company.overrides.length > 0 && (
        <MetricGroup label="Overrides Applied">
          <ul data-testid="company-overrides" style={{ paddingLeft: 20 }}>
            {company.overrides.map((o) => <li key={o}><StatusBadge status="warning" label={o} /></li>)}
          </ul>
        </MetricGroup>
      )}

      {/* Pillars — only where the certified engine exposes them; else unavailable (no fabrication). */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Business Quality / Growth / Valuation / Risk</h2>
      {pillarEntries ? (
        <MetricGroup label="Certified pillar scores">
          {pillarEntries.map((p) => (
            <MetricCard key={p.key} label={p.key} value={p.value} direction={p.value >= 60 ? 'positive' : p.value >= 40 ? 'neutral' : 'negative'} />
          ))}
        </MetricGroup>
      ) : (
        <div data-testid="pillars-unavailable" style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-1)' }}>
          Pillar scores are not exposed by the certified engine for this sector. They are shown as unavailable rather than derived in the frontend.
        </div>
      )}

      {/* Certified input metrics (traceable, SNAPSHOT inputs) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Company Inputs (SNAPSHOT)</h2>
      <DataTable
        columns={[
          { key: 'key', header: 'Metric', render: (r: { key: string }) => r.key },
          { key: 'value', header: 'Value', render: (r: { key: string; value: unknown }) => (typeof r.value === 'number' ? r.value : String(r.value ?? 'unavailable')) },
        ]}
        rows={company.inputs}
        emptyLabel="No input metrics available"
      />

      {/* N+5: governed trust chain — Decision → Evidence → Replay → Provenance */}
      <CompanyTrustChain evidence={evidence} replay={replay} />

      {/* AI Advisory is DEFERRED by authority — the documented deferred state is preserved;
          no advisory value is fabricated and no auth tier is reconstructed. */}
      <AdvisoryDeferred sectorKey={company.sector} />

      {/* Provenance */}
      <p data-testid="company-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 16 }}>
        {company.provenance.dataSource} · freshness {company.provenance.freshness}
      </p>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────────────────
 * Loader — SNAPSHOT-only governed composition (no mode, no asOf, no PIT branch).
 * ───────────────────────────────────────────────────────────────────────────────────────── */

export function CompanyIntelligence() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [evidence, setEvidence] = useState<EvidenceData | null>(null);
  const [replay, setReplay] = useState<ReplayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // N+12: governed sector list (sourced from /api/decision-matrix; never hardcoded).
  const [sectors, setSectors] = useState<MatrixCompany[] | null>(null);
  const [sectorsError, setSectorsError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    // N+5: three-call governed composition (Bearer propagated via authFetch in each client).
    Promise.all([fetchCompanyData(id), fetchEvidenceData(id), fetchReplayData(id)])
      .then(([c, e, r]) => {
        if (!active) return;
        // D89 — a governed degraded state is a valid served response; it is discriminated
        // BEFORE any SNAPSHOT-shape dereference. No PIT family exists in this gate.
        setCompany(c); setEvidence(e); setReplay(r); setError(null);
      })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  // N+12: fetch the governed sector universe once (independent of the selected company).
  useEffect(() => {
    let active = true;
    fetchDecisionMatrixData()
      .then((d) => { if (active) setSectors([...d.companies]); })
      .catch((e) => { if (active) setSectorsError(String(e)); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load company data: ${error}`} />;
  if (!company || !evidence || !replay) return <UnavailableState />;
  // D89 — any of the three mode-aware routes may return a governed degraded state.
  if (isDegraded(company)) return <DataModeUnavailable data={company} title="Company Intelligence" />;
  if (isDegraded(evidence)) return <DataModeUnavailable data={evidence} title="Company Intelligence" />;
  if (isDegraded(replay)) return <DataModeUnavailable data={replay} title="Company Intelligence" />;

  return (
    <CompanyIntelligenceView
      company={company}
      evidence={evidence}
      replay={replay}
      sectors={sectors}
      sectorsError={sectorsError}
      selectedSector={id ?? ''}
      onSelectSector={(sector) => navigate(`/research/company/${sector}`)}
    />
  );
}
