/**
 * Program v3.0 — Phase 11: Replay Explorer (UI17).
 *
 * Reporting surface. It displays the GOVERNED ReplayResult literals
 * (reproduced + byteIdentical + evidenceRefs) and the original certified result metadata.
 * It does NOT compute replay, compare metrics, derive differences, or infer causes.
 *
 * ⚠ P13-B-07 AD-17 SAFETY AMENDMENT (bounded, Program Authority authorized).
 *
 *   This surface PREVIOUSLY rendered `byteIdentical` as "MATCH — byte-identical" in a
 *   positive pass/fail colour. That asserted a VERIFIED byte identity which has never been
 *   verified, breaching the ALREADY-ACCEPTED P13 bounded condition and P13 BS-1:
 *
 *       "UI17 MUST NOT assert verified replay (AD-17/M-2)"
 *
 *   The defect was PRE-EXISTING — it was not introduced by P13-B. This amendment brings
 *   the React surface into conformance with the accepted P13 record. It changes NO
 *   accepted record, and it does NOT modify p13/src/boundedSurfaces.js.
 *
 *   ⚠ AD-17 / M-2 REMAIN UNRESOLVED. Accurate basis (D62): `ReplayService` COMPUTES
 *   reproduced/byteIdentical, but the UI-facing values are HARDCODED by
 *   `executive-transport.ts` `computeCertifiedReplay()`, which never invokes it; runtime
 *   replay verification is NOT ESTABLISHED. This amendment removes a prohibited CLAIM; it
 *   performs no verification, grants no certification, and does not remediate AD-17 or M-2.
 *
 *   The literals are now rendered by the shared AD-17-safe `ReplayLiteralDisplay`, with an
 *   explicit AD-17 disclosure and NO pass/fail colouring.
 *
 * D96: mode-aware UI12 propagation with guarded degraded handling.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { isDegraded } from '../../api/dataMode';
import { DataModeUnavailable } from '../../components/state/DataModeUnavailable';
import { fetchReplayData, type ReplayResponse } from '../../api/replay';
import { DecisionBadge } from '../../components/decision/DecisionComponents';
import { SnapshotMetadataPanel, ProvenanceChain } from '../../components/evidence/EvidenceExplorerComponents';
import { Ad17Note, ReplayLiteralDisplay } from '../../components/evidence/Ad17Disclosure';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges';

export function ReplayExplorer() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ReplayResponse | null>(null);
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
  // D96 — governed degraded state (UI12 LIVE/PIT). MUST precede any SNAPSHOT-shape dereference.
  if (isDegraded(data)) return <DataModeUnavailable data={data} title="Replay" />;

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

      {/* Replay result — reported literals ONLY (AD-17 safe; no verification claim). */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Replay Result</h2>
      <div data-testid="replay-summary" role="status">
        <ReplayLiteralDisplay
          dto={{
            // The platform reports these as LITERALS. They are carried verbatim and are
            // explicitly NOT verified. `verified*` are pinned false — UI17 never claims
            // verified reproduction or verified byte identity while AD-17/M-2 is open.
            replayServiceLiterals: { reproduced: replay.reproduced, byteIdentical: replay.byteIdentical },
            verifiedReproduction: false,
            verifiedByteIdentical: false,
          }}
        />
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--color-ink-secondary)' }}>
          snapshot <code>{replay.snapshotId}</code>
        </p>
      </div>

      {/* Reported equivalence — NOT a verified equivalence. No pass/fail colouring. */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Reported Equivalence</h2>
      {/* <div> (not <p>): Ad17Note renders a block-level <p>, which may not nest inside a <p>. */}
      <div data-testid="replay-equivalence" style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, background: 'var(--color-surface-1)' }}>
        <strong>
          Reported byteIdentical: <code>{String(replay.byteIdentical)}</code> — NOT VERIFIED
        </strong>
        <br />
        <span style={{ fontSize: 13 }}>{note}</span>
        <Ad17Note />
      </div>

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
