/**
 * Program v3.0 — Phase 11: Replay Explorer.
 *
 * Verification surface. Answers "Can this result be reproduced and independently verified?"
 * It displays the GOVERNED ReplayResult (reproduced + byteIdentical + evidenceRefs) and the
 * original certified result metadata. It does NOT compute replay, compare metrics, derive
 * differences, or infer causes.
 *
 * HARD STOP honored: ReplayService exposes only reproduced/byteIdentical/evidenceRefs, so the
 * UI displays "Replay reproduced successfully; byte-identical: MATCH/DIFFERENCE" and does NOT
 * invent field-level/metric-level diffs.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchReplayData, type ReplayData } from '../../api/replay';
import { DecisionBadge } from '../../components/decision/DecisionComponents';
import { SnapshotMetadataPanel, ProvenanceChain, ReplaySummary } from '../../components/evidence/EvidenceExplorerComponents';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges';

export function ReplayExplorer() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ReplayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    fetchReplayData(id)
      .then((d) => { if (active) { setData(d); setError(null); } })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load replay: ${error}`} />;
  if (!data) return <UnavailableState />;

  const { original, replay, differenceAvailable, note, provenance } = data;
  void differenceAvailable; // governed flag: no field-level diff is available (displayed in note)

  return (
    <section aria-label="Replay explorer">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Replay — {id}</h1>
          <CertifiedBadge />
          <FreshnessBadge state={provenance.freshness === 'SNAPSHOT' ? 'snapshot' : 'live'} />
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>{provenance.dataSource}</p>
      </header>

      {/* Original certified result */}
      <h2 style={{ fontSize: 18 }}>Original Certified Result</h2>
      <div data-testid="replay-original" style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-1)' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
          <DecisionBadge verdict={original.verdict} />
          <span>Composite: {original.composite}</span>
          <span>{original.confidence === null ? 'Confidence unavailable' : `${Math.round(original.confidence * 100)}% confidence`}</span>
        </div>
        <SnapshotMetadataPanel snapshot={{ snapshotId: original.snapshotId, engineId: original.engineId, schemaVersion: original.schemaVersion, generatedAt: original.generatedAt, verdict: original.verdict }} />
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--color-ink-secondary)' }}>Calibration <code>{original.calibrationVersion}</code></p>
      </div>

      {/* Replay result (governed ReplayResult) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Replay Result</h2>
      <ReplaySummary replay={replay} />

      {/* Equivalence status (governed byteIdentical; no invented diff) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Equivalence</h2>
      <p data-testid="replay-equivalence" style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, background: 'var(--color-surface-1)' }}>
        <strong style={{ color: replay.byteIdentical ? 'var(--color-status-positive)' : 'var(--color-status-negative)' }}>
          {replay.byteIdentical ? 'MATCH — byte-identical' : 'DIFFERENCE'}
        </strong>
        <br />
        <span style={{ fontSize: 13 }}>{note}</span>
      </p>

      {/* Evidence references (governed) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Evidence References</h2>
      <ul data-testid="replay-evidence-refs" style={{ paddingLeft: 20 }}>
        {replay.evidenceRefs.map((r) => <li key={r}><code>{r}</code></li>)}
      </ul>

      {/* Provenance */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Provenance</h2>
      <ProvenanceChain items={[
        { key: 'framework', value: original.provenance.frameworkVersion },
        { key: 'engine', value: original.provenance.engineVersion },
        { key: 'methodology', value: original.provenance.methodologyVersion },
        { key: 'snapshot', value: original.provenance.snapshotId },
      ]} />

      <p style={{ marginTop: 16 }}>
        <Link to={`/evidence/${id}`}>Back to Evidence →</Link>
      </p>
      <p style={{ marginTop: 8 }}>
        <Link to={`/research/company/${id}`}>Company context →</Link>
      </p>

      <p data-testid="replay-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 16 }}>
        {provenance.dataSource} · freshness {provenance.freshness}
      </p>
    </section>
  );
}
