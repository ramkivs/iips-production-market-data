/**
 * Program v3.0 — Phase 10: Evidence Explorer.
 *
 * Inspection surface over the governed v2.0 evidence chain. Answers
 * "Why did the certified platform produce this result?" WITHOUT recalculating,
 * inferring, or reinterpreting any investment value.
 *
 * Chain: Decision → Drivers → Metrics → Evidence → Snapshot → Provenance → Replay.
 * No reasoning/analytical logic in React. All values from governed contracts.
 *
 * ══ RESTORATION (A2 EVIDENCE RECOVERY) — donor blob 9f5927ff ═════════════════════
 *  Restored from the proven donor blob `9f5927ff35846c7a0bc702fb525bc5ba8f410008` (git blob id = content hash).
 *  The rendered markup (the donor `return (…)` block) and the donor loader state/effects are
 *  carried VERBATIM. Only two bounded, already-established adaptations are applied:
 *  · NodeNext `.js` import specifiers (the adaptation already applied to the recovered kit);
 *  · pure-view extraction (the Company/Sector and Decision Matrix precedent): the donor's
 *    rendered block lives in a pure `EvidenceExplorerView` so the data-rendered DOM is verifiable in
 *    `node:test` without jsdom; the loader keeps the donor's fetch/guard sequence unchanged.
 *  No new functionality, no new route, no new data source, no degraded-mode guard added.
 *  Browser boundary: HTTP only via the existing clients; no server/transport/node import.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEvidenceData, type EvidenceData } from '../../api/evidence.js';
import { DecisionBadge } from '../../components/decision/DecisionComponents.js';
import { MetricCard, MetricGroup } from '../../components/data/DataComponents.js';
import { EvidenceTimeline, EvidenceRecordCard, ProvenanceChain, SnapshotMetadataPanel, ReplaySummary } from '../../components/evidence/EvidenceExplorerComponents.js';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents.js';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges.js';

/* ─────────────────────────────────────────────────────────────────────────────────────────
 * Pure presentation — the donor rendered block, verbatim. Every value is consumed 1:1 from
 * the governed payload.
 * ───────────────────────────────────────────────────────────────────────────────────────── */

export interface EvidenceExplorerViewProps {
  readonly id: string | undefined;
  readonly data: EvidenceData;
}

export function EvidenceExplorerView({ id, data }: EvidenceExplorerViewProps) {
  const { decision, evidence, snapshot, replay, provenance } = data;

  return (
    <section aria-label="Evidence explorer">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Evidence — {id}</h1>
          <CertifiedBadge />
          <FreshnessBadge state={provenance.freshness === 'SNAPSHOT' ? 'snapshot' : 'live'} />
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>{provenance.dataSource}</p>
      </header>

      {/* Decision summary (certified) */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <DecisionBadge verdict={decision.verdict} />
        <span>Composite: {decision.composite}</span>
        <span>{decision.confidence === null ? 'Confidence unavailable' : `${Math.round(decision.confidence * 100)}% confidence`}</span>
      </div>

      {/* Decision drivers + supporting metrics (certified) */}
      <MetricGroup label="Supporting Metrics (certified)">
        {evidence.supportingScores.map((s) => <MetricCard key={s.id} label={s.name} value={s.value} />)}
      </MetricGroup>

      {/* Evidence record */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Evidence</h2>
      <EvidenceRecordCard evidence={evidence} />

      {/* Evidence chain timeline (inspection) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Evidence Chain</h2>
      <EvidenceTimeline
        steps={[
          { label: 'Decision', content: <span><DecisionBadge verdict={decision.verdict} /> composite {decision.composite}</span> },
          { label: 'Evidence ID', content: <code>{evidence.evidenceId}</code> },
          { label: 'Snapshot', content: <SnapshotMetadataPanel snapshot={snapshot} /> },
          { label: 'Engine / Version', content: <span><code>{evidence.engineId}</code> · calib <code>{evidence.calibrationVersion}</code></span> },
          { label: 'Provenance', content: <ProvenanceChain items={[
            { key: 'framework', value: evidence.provenance.frameworkVersion },
            { key: 'engine', value: evidence.provenance.engineVersion },
            { key: 'methodology', value: evidence.provenance.methodologyVersion },
          ]} /> },
          { label: 'Replay', content: <ReplaySummary replay={replay} /> },
        ]}
      />

      <p style={{ marginTop: 16 }}>
        <Link to={`/evidence/replay/${id}`}>Open full replay explorer →</Link>
      </p>

      <p data-testid="evidence-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 16 }}>
        {provenance.dataSource} · freshness {provenance.freshness}
      </p>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────────────────
 * Loader — the donor state, effects and fail-closed guards, verbatim.
 * ───────────────────────────────────────────────────────────────────────────────────────── */

export function EvidenceExplorer() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<EvidenceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    fetchEvidenceData(id)
      .then((d) => { if (active) { setData(d); setError(null); } })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load evidence: ${error}`} />;
  if (!data) return <UnavailableState />;

  return <EvidenceExplorerView id={id} data={data} />;
}
