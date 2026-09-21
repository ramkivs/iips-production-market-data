/**
 * D-PIT-WIRE-01 — the shared governed "PIT vintage" surface.
 *
 * Rendered when an in-scope mode-aware route (currently /api/company/:id ONLY) returns a
 * governed PIT vintage response (dataAvailable: true) instead of certified SNAPSHOT data.
 *
 * ⚠ Renders the SERVER's own values VERBATIM — requested vs resolved asOf are always BOTH
 *   shown so backward resolution (PS-9: resolved <= requested) is never hidden. The
 *   provenance block (era, archiveRef, sha256, certification) is disclosed verbatim. No
 *   zeroed or placeholder values, no derived analytics, no engine recomputation.
 *
 * ⚠ Application verification only — the panel prints the server's own certification line
 *   (NONE). It is NOT a certification or acceptance claim.
 */
import type { PitVintageData } from '../../api/dataMode';

function Row({ label, value, testId }: { label: string; value: unknown; testId: string }) {
  return (
    <div data-testid={testId} style={{ display: 'flex', gap: 8, fontSize: 13, margin: '4px 0' }}>
      <span style={{ color: 'var(--color-ink-secondary)', minWidth: 170 }}>{label}</span>
      <span>{String(value)}</span>
    </div>
  );
}

export function PitVintagePanel({ data, title }: { data: PitVintageData; title: string }) {
  const v = data.vintage;
  const payload = (v.record.payload ?? {}) as Record<string, unknown>;
  return (
    <section aria-label={`${title} point-in-time vintage`} data-testid="pit-vintage-panel">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>{title}</h1>
          <code data-testid="pit-vintage-mode" style={{ fontSize: 13 }}>PIT</code>
          {v.era !== null && (
            <code data-testid="pit-vintage-era" style={{ fontSize: 12 }}>{v.era}</code>
          )}
        </div>
      </header>

      <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>Point-in-time vintage</h2>
      <Row label="Requested asOf" value={v.requestedAsOf} testId="pit-vintage-requested-asof" />
      <Row label="Resolved vintage asOf" value={v.resolvedAsOf} testId="pit-vintage-resolved-asof" />
      <Row label="Series" value={`${data.query.domain} :: ${data.query.securityId}`} testId="pit-vintage-series" />
      <Row label="snapshotId" value={v.snapshotId ?? '—'} testId="pit-vintage-snapshot-id" />
      <Row label="Provider / dataVersion" value={`${v.provider ?? '—'} / ${v.dataVersion ?? '—'}`} testId="pit-vintage-provider" />
      <Row label="Quality" value={v.quality ?? '—'} testId="pit-vintage-quality" />
      <Row label="PIT boundary" value={v.pitBoundary ?? '—'} testId="pit-vintage-boundary" />

      <h2 style={{ fontSize: 16, margin: '16px 0 8px' }}>Historical record (canonical D02 daily bar)</h2>
      <div data-testid="pit-vintage-record">
        {Object.entries(payload).map(([k, val]) => (
          <Row key={k} label={k} value={typeof val === 'object' ? JSON.stringify(val) : String(val)} testId={`pit-vintage-record-${k}`} />
        ))}
      </div>

      <h2 style={{ fontSize: 16, margin: '16px 0 8px' }}>Provenance</h2>
      <div data-testid="pit-vintage-provenance" style={{ fontSize: 13 }}>
        <Row label="Data source" value={data.provenance.dataSource} testId="pit-vintage-source" />
        {data.provenance.archiveRef !== null && (
          <Row label="Archive reference" value={data.provenance.archiveRef} testId="pit-vintage-archive-ref" />
        )}
        {data.provenance.sha256 !== null && (
          <Row label="SHA-256" value={data.provenance.sha256} testId="pit-vintage-sha256" />
        )}
        {data.provenance.corpusId !== null && (
          <Row label="Corpus" value={data.provenance.corpusId} testId="pit-vintage-corpus" />
        )}
      </div>

      <p data-testid="pit-vintage-certification" style={{ color: 'var(--color-ink-secondary)', margin: '12px 0 0', fontSize: 12 }}>
        {data.provenance.certification}
      </p>
      <p data-testid="pit-vintage-semantics" style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 12 }}>
        {data.provenance.transportSemantics}
      </p>
    </section>
  );
}
