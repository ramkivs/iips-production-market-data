/**
 * Program v3.0 — P-4: Sector Information workspace (composition-only read surface).
 *
 * Route: /research/sector/:id. Answers "What does the certified platform say about this
 * sector — its engine, decision, certified pillars, position in the governed universe, and
 * replay verification?" — composed 1:1 from the FOUR existing governed read endpoints:
 * /api/company/:sector, /api/evidence/:sector, /api/replay/:sector, /api/decision-matrix.
 *
 * Accepted spec (S1–S6, recorded 2026-08-21):
 *   S1 = all four endpoints compose v1
 *   S2 = NO duplication of the Company trust chain — replay-verification summary only,
 *        with a link to /research/company/:sector for the full chain
 *   S3 = Sector → Company link is mandatory
 *   S4 = CSIP/macro context excluded
 *   S5 = payload order preserved; no sort/rank/band/quadrant
 *   S6 = sector selector options sourced ONLY from /api/decision-matrix (N+12 pattern)
 *
 * Null confidence/quality/valuation/pillars render "unavailable" (never 0). No new
 * endpoint, no recomputation, no fabrication, no persistence.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchCompanyData, type CompanyData } from '../../api/company';
import { fetchEvidenceData, type EvidenceData } from '../../api/evidence';
import { fetchReplayData, type ReplayData } from '../../api/replay';
import { fetchDecisionMatrixData, type MatrixCompany } from '../../api/decisionMatrix';
import { MetricGroup, MetricCard, DataTable } from '../../components/data/DataComponents';
import { DecisionBadge } from '../../components/decision/DecisionComponents';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge, StatusBadge } from '../../components/ui/Badges';
import { AiExplanation } from '../../components/ai/AiExplanation';

export function SectorIntelligence() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [evidence, setEvidence] = useState<EvidenceData | null>(null);
  const [replay, setReplay] = useState<ReplayData | null>(null);
  const [sectors, setSectors] = useState<MatrixCompany[] | null>(null);
  const [sectorsError, setSectorsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // S1: three-call governed composition (Bearer propagated via authFetch in each client).
  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    Promise.all([fetchCompanyData(id), fetchEvidenceData(id), fetchReplayData(id)])
      .then(([c, e, r]) => {
        if (active) { setCompany(c); setEvidence(e); setReplay(r); setError(null); }
      })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  // S6: governed sector universe (sourced from /api/decision-matrix; never hardcoded — N+12 pattern).
  useEffect(() => {
    let active = true;
    fetchDecisionMatrixData()
      .then((d) => { if (active) setSectors([...d.companies]); })
      .catch((e) => { if (active) setSectorsError(String(e)); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load sector data: ${error}`} />;
  if (!company || !evidence || !replay) return <UnavailableState />;

  const pillarEntries = company.pillars
    ? Object.entries(company.pillars).map(([k, v]) => ({ key: k, value: v }))
    : null;
  // S1: the governed universe position is the decision-matrix row for this exact sector.
  const matrixRow = sectors?.find((s) => s.sector === id) ?? null;
  const freshness = company.provenance.freshness;

  return (
    <section aria-label="Sector information">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>{company.sector}</h1>
          <CertifiedBadge />
          <FreshnessBadge state={freshness === 'SNAPSHOT' ? 'snapshot' : 'live'} />
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>
          Engine: {evidence.evidence.engineId} · calibration {evidence.evidence.calibrationVersion}
        </p>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
          <DecisionBadge verdict={company.decision.verdict} />
          <span data-testid="sector-composite">Composite: {company.decision.composite}</span>
          <span data-testid="sector-confidence">
            Confidence: {company.decision.confidence === null ? 'unavailable' : `${Math.round(company.decision.confidence * 100)}%`}
          </span>
        </div>
      </header>

      {/* S6: governed sector selector — options sourced only from /api/decision-matrix */}
      <div data-testid="sector-sector-selector" style={{ marginTop: 16 }}>
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
            Sector{' '}
            <select
              data-testid="sector-select"
              aria-label="Select sector"
              value={id ?? ''}
              onChange={(e) => navigate(`/research/sector/${e.target.value}`)}
              style={{ padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-surface-0)' }}
            >
              {sectors.map((s) => (
                <option key={s.sector} value={s.sector}>{s.sector}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* S1: certified pillars (company payload); null-honest where the engine lacks them */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Certified Pillars</h2>
      {pillarEntries ? (
        <MetricGroup label="Certified pillar scores">
          {pillarEntries.map((p) => (
            <MetricCard key={p.key} label={p.key} value={p.value} direction={p.value >= 60 ? 'positive' : p.value >= 40 ? 'neutral' : 'negative'} />
          ))}
        </MetricGroup>
      ) : (
        <div data-testid="sector-pillars-unavailable" style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-1)' }}>
          Pillar scores are not exposed by the certified engine for this sector. They are shown as unavailable rather than derived in the frontend.
        </div>
      )}

      {/* S1: universe position — decision-matrix row for this sector (null quality/valuation → unavailable) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Universe Position</h2>
      {sectorsError ? (
        <p>Universe position unavailable: {sectorsError}</p>
      ) : !sectors ? (
        <p>Loading universe position&hellip;</p>
      ) : matrixRow ? (
        <MetricGroup label="Decision-matrix position">
          <MetricCard label="Composite" value={matrixRow.composite} />
          <MetricCard label="Quality" value={matrixRow.quality} />
          <MetricCard label="Valuation" value={matrixRow.valuation} />
        </MetricGroup>
      ) : (
        <p data-testid="sector-universe-unavailable">Sector not present in the governed decision-matrix universe.</p>
      )}

      {/* Overrides (company payload) */}
      {company.overrides.length > 0 && (
        <MetricGroup label="Overrides Applied">
          <ul data-testid="sector-overrides" style={{ paddingLeft: 20 }}>
            {company.overrides.map((o) => <li key={o}><StatusBadge status="warning" label={o} /></li>)}
          </ul>
        </MetricGroup>
      )}

      {/* S1/S2: governed evidence summary — recommendation + key metrics + supporting scores + rules (not the full chain) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Governed Evidence Summary</h2>
      <p data-testid="sector-recommendation">Recommendation: {evidence.evidence.recommendation}</p>
      {evidence.evidence.keyMetrics.length > 0 && (
        <DataTable
          columns={[
            { key: 'id', header: 'Metric', render: (m: { id: string }) => m.id },
            { key: 'name', header: 'Name', render: (m: { name: string }) => m.name },
            { key: 'value', header: 'Value', render: (m: { value: number }) => m.value },
          ]}
          rows={evidence.evidence.keyMetrics}
          emptyLabel="No key metrics available"
        />
      )}
      {evidence.evidence.supportingScores.length > 0 && (
        <div data-testid="sector-supporting-scores" style={{ marginTop: 12 }}>
          {evidence.evidence.supportingScores.map((s) => (
            <div key={s.id}>{s.name}: {s.value}</div>
          ))}
        </div>
      )}
      {evidence.evidence.decisionRulesApplied.length > 0 && (
        <div data-testid="sector-rules-applied" style={{ marginTop: 12 }}>
          Rules applied: {evidence.evidence.decisionRulesApplied.join(' · ')}
        </div>
      )}

      {/* S2: replay-verification summary (no full trust-chain duplication) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Replay Verification</h2>
      <ul data-testid="sector-replay-summary" style={{ paddingLeft: 20 }}>
        <li>Snapshot: {replay.original.snapshotId}</li>
        <li>Reproduced: {replay.replay.reproduced ? 'yes' : 'no'}</li>
        <li>Byte-identical: {replay.replay.byteIdentical ? 'yes' : 'no'}</li>
        <li>Difference available: {replay.differenceAvailable ? 'yes' : 'no'}</li>
      </ul>

      {/* S3: mandatory Sector → Company link (the Company trust chain is the single full-chain authority) */}
      <p style={{ marginTop: 24 }}>
        <Link data-testid="sector-company-link" to={`/research/company/${company.sector}`}>
          Open the full company trust chain for {company.sector} (Decision → Evidence → Replay → Provenance)
        </Link>
      </p>

      {/* G-AI-IMPL (D2): embedded read-only AI explanation, bound to this host's sector key.
          No route, no navigation entry, no sector selector. */}
      <AiExplanation sectorKey={company.sector} />

      {/* Provenance footer (1:1) */}
      <p data-testid="sector-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 16 }}>
        {company.provenance.dataSource} · freshness {company.provenance.freshness} · {company.provenance.transportSemantics}
      </p>
    </section>
  );
}
