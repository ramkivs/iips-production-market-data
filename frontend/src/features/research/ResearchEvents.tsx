/**
 * Program v3.0 — P-4: Research Events workspace (composition-only read surface).
 *
 * Route: /research/events/:sector. Renders the FOUR platform-derived lifecycle events for a
 * sector, composed 1:1 from existing governed read authorities — fetchEvidenceData and
 * fetchReplayData (the events) plus fetchDecisionMatrixData (sector selector only):
 *
 *   Calibration                ← /api/evidence/:sector → provenance.calibratedAt
 *   Snapshot generated         ← /api/evidence/:sector → snapshot.generatedAt
 *   Evidence generated         ← /api/evidence/:sector → evidence.generatedAt
 *   Replay original generated  ← /api/replay/:sector   → original.generatedAt
 *
 * Accepted spec (S1–S10, recorded 2026-08-21; final review PASS):
 *   S1  platform-derived events only for v1
 *   S2  exactly the four events above
 *   S3  sector scope only
 *   S4  FIXED lifecycle ordering (Calibration → Snapshot → Evidence → Replay) — NOT a timestamp sort
 *   S5  per-event source annotation + provenance footer
 *   S6  /research/events/:sector + decision-matrix selector + Sector/Company links
 *   S7  missing timestamps → "unavailable"; partial-data honesty
 *   S8  no dedup needed — identical timestamps are distinct events, never merged
 *   S9  Research → Events child, viewer+, concrete path
 *   S10 external events deferred / out of scope
 *
 * Timestamp honesty: all four lifecycle timestamps currently resolve to the frozen
 * reference-baseline date, so the surface presents the fixed lifecycle sequence and states
 * plainly that it is NOT a temporal timeline. No event store, no persistence, no new
 * endpoint, no fabrication.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchEvidenceData, type EvidenceData } from '../../api/evidence';
import { fetchReplayData, type ReplayData } from '../../api/replay';
import { fetchDecisionMatrixData, type MatrixCompany } from '../../api/decisionMatrix';
import { LoadingState, ErrorState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges';

interface ResearchEvent {
  readonly key: string;
  readonly label: string;
  readonly timestamp: string | undefined;
  readonly source: string;
}

export function ResearchEvents() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [evidence, setEvidence] = useState<EvidenceData | null>(null);
  const [replay, setReplay] = useState<ReplayData | null>(null);
  const [sectors, setSectors] = useState<MatrixCompany[] | null>(null);
  const [sectorsError, setSectorsError] = useState<string | null>(null);
  const [partialError, setPartialError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // S7: partial-data honesty — allSettled so one failing endpoint does not fabricate the
  // other's events; missing events render "unavailable" (never invented).
  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    Promise.allSettled([fetchEvidenceData(id), fetchReplayData(id)])
      .then(([e, r]) => {
        if (!active) return;
        const ev = e.status === 'fulfilled' ? e.value : null;
        const rp = r.status === 'fulfilled' ? r.value : null;
        setEvidence(ev);
        setReplay(rp);
        const failures: string[] = [];
        if (e.status === 'rejected') failures.push('evidence');
        if (r.status === 'rejected') failures.push('replay');
        setPartialError(failures.length > 0 ? `Unable to load: ${failures.join(', ')}` : null);
        setError(!ev && !rp ? 'Unable to load research events' : null);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  // S6: governed sector universe (sourced only from /api/decision-matrix; never hardcoded — N+12 pattern).
  useEffect(() => {
    let active = true;
    fetchDecisionMatrixData()
      .then((d) => { if (active) setSectors([...d.companies]); })
      .catch((e) => { if (active) setSectorsError(String(e)); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const sector = id ?? '';
  const prov = (evidence ?? replay)?.provenance;
  const freshness = prov?.freshness ?? 'SNAPSHOT';

  // S2/S4: the four governed events in FIXED lifecycle order (never timestamp-sorted).
  const events: ResearchEvent[] = [
    { key: 'calibration', label: 'Calibration', timestamp: evidence?.provenance.calibratedAt, source: '/api/evidence/:sector · provenance.calibratedAt' },
    { key: 'snapshot', label: 'Snapshot generated', timestamp: evidence?.snapshot.generatedAt, source: '/api/evidence/:sector · snapshot.generatedAt' },
    { key: 'evidence', label: 'Evidence generated', timestamp: evidence?.evidence.generatedAt, source: '/api/evidence/:sector · evidence.generatedAt' },
    { key: 'replay', label: 'Replay original generated', timestamp: replay?.original.generatedAt, source: '/api/replay/:sector · original.generatedAt' },
  ];

  return (
    <section aria-label="Research events">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>{sector}</h1>
          <CertifiedBadge />
          <FreshnessBadge state={freshness === 'SNAPSHOT' ? 'snapshot' : 'live'} />
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>
          Research events — governed lifecycle chronology (read-only, platform-derived).
        </p>
      </header>

      {/* S6: governed sector selector — options sourced only from /api/decision-matrix */}
      <div data-testid="events-sector-selector" style={{ marginTop: 16 }}>
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
              value={sector}
              onChange={(e) => navigate(`/research/events/${e.target.value}`)}
              style={{ padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-surface-0)' }}
            >
              {sectors.map((s) => (
                <option key={s.sector} value={s.sector}>{s.sector}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* S7: partial-data note (honest — never hides a failed source) */}
      {partialError && (
        <div data-testid="events-partial-error" role="status" style={{ marginTop: 16, border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, background: 'var(--color-surface-1)', color: 'var(--color-ink-secondary)', fontSize: 13 }}>
          Some event sources are unavailable ({partialError}). Missing events are shown as unavailable.
        </div>
      )}

      {/* S2/S4/S8: fixed lifecycle sequence; identical timestamps are distinct events, never merged */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Governed Lifecycle Events</h2>
      <ol data-testid="research-events-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {events.map((ev) => (
          <li key={ev.key} data-testid={`event-${ev.key}`} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--color-border)', alignItems: 'baseline' }}>
            <span style={{ color: 'var(--color-ink-muted)', flex: '0 0 220px', fontWeight: 600 }}>{ev.label}</span>
            <span data-testid={`event-${ev.key}-time`} style={{ flex: '0 0 280px' }}>{ev.timestamp ? ev.timestamp : 'unavailable'}</span>
            <span data-testid={`event-${ev.key}-source`} style={{ color: 'var(--color-ink-secondary)', fontSize: 12 }}>{ev.source}</span>
          </li>
        ))}
      </ol>

      {/* S4: honest ordering annotation — lifecycle, not a temporal timeline */}
      <p data-testid="events-lifecycle-note" style={{ color: 'var(--color-ink-secondary)', fontSize: 13, marginTop: 12 }}>
        Lifecycle order, not chronological: these events are listed in the governed lifecycle sequence (Calibration → Snapshot → Evidence → Replay). Their timestamps currently share the frozen reference-baseline date, so this is not a temporal timeline.
      </p>

      {/* S6: Sector Information + Company navigation */}
      <p style={{ marginTop: 24 }}>
        <Link data-testid="events-sector-link" to={`/research/sector/${sector}`}>
          Open sector information for {sector}
        </Link>
        {' · '}
        <Link data-testid="events-company-link" to={`/research/company/${sector}`}>
          Open company trust chain for {sector}
        </Link>
      </p>

      {/* S5: provenance footer (1:1) */}
      <p data-testid="events-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 16 }}>
        {prov?.dataSource ?? 'governed'} · freshness {prov?.freshness ?? 'SNAPSHOT'}{prov?.transportSemantics ? ` · ${prov.transportSemantics}` : ''}
      </p>
    </section>
  );
}
