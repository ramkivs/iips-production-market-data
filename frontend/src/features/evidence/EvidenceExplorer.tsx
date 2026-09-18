/**
 * Program v3.0 — Phase 10: Evidence Explorer.
 *
 * Inspection surface over the governed v2.0 evidence chain. Answers
 * "Why did the certified platform produce this result?" WITHOUT recalculating,
 * inferring, or reinterpreting any investment value.
 *
 * Chain: Decision → Drivers → Metrics → Evidence → Snapshot → Provenance → Replay.
 * No reasoning/analytical logic in React. All values from governed contracts.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEvidenceData, type EvidenceData } from '../../api/evidence';
import { DecisionBadge } from '../../components/decision/DecisionComponents';
import { MetricCard, MetricGroup } from '../../components/data/DataComponents';
import { EvidenceTimeline, EvidenceRecordCard, ProvenanceChain, SnapshotMetadataPanel, ReplaySummary } from '../../components/evidence/EvidenceExplorerComponents';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges';

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
