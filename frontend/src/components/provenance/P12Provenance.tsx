/**
 * P13-B-03 / P13-B-04 / P13-B-08 / P13-B-09 — Governed provenance, quality and lineage display.
 *
 * Authority: D54 P13-B Implementation Authorization (commit dce5cdb4)
 *
 * Presentation-only. These components RENDER governed facts already computed by the
 * certified P12 contracts; they never derive, upgrade or infer any of them.
 *
 * ⚠ Lineage is DISCLOSED from the server envelope, never inferred from payload shape.
 * ⚠ Quality is the worst-case value propagated by the certified contract.
 * ⚠ Rendering a provenance panel does NOT certify the surface that displays it.
 */
import type { GovernanceLimitations, P12Provenance, TransportDisclosure } from '../../api/p12Screener';

/* ------------------------------------------------------------------ */
/* P13-B-08 — LINEAGE DISCLOSURE                                       */
/* ------------------------------------------------------------------ */

const LINEAGE_LABEL: Record<string, string> = {
  'P12-GOVERNED': 'P12-governed',
  'V2.0-CERTIFIED': 'v2.0-certified',
  DUAL: 'Dual transport',
};

const LINEAGE_DETAIL: Record<string, string> = {
  'P12-GOVERNED': 'Produced by the certified P12 API/DTO Gate contracts.',
  'V2.0-CERTIFIED': 'Produced by the existing certified v2.0 platform transport.',
  DUAL:
    'Rows originate from the certified v2.0 platform; the screening, ordering and resolution ' +
    'applied to them are governed by the certified P12 contracts. The two lineages are distinct ' +
    'and are not interchangeable.',
};

export function LineageBadge({ lineage }: { lineage: string }) {
  return (
    <span
      data-testid="lineage-badge"
      data-lineage={lineage}
      title={LINEAGE_DETAIL[lineage] ?? 'Lineage undisclosed'}
      style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 12,
        border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
      }}
    >
      {LINEAGE_LABEL[lineage] ?? 'Lineage undisclosed'}
    </span>
  );
}

/** P13-B-08 — The full dual-transport disclosure, shown on every P12-fed surface. */
export function TransportDisclosurePanel({
  disclosure, lineage,
}: { disclosure: TransportDisclosure; lineage: string }) {
  return (
    <details data-testid="transport-disclosure" style={{ fontSize: 12, marginTop: 12 }}>
      <summary style={{ cursor: 'pointer' }}>
        Data lineage &amp; transport disclosure — <LineageBadge lineage={lineage} />
      </summary>
      <div style={{ padding: '8px 0 0 12px', color: 'var(--color-ink-secondary)' }}>
        <p style={{ margin: '4px 0' }}>{LINEAGE_DETAIL[lineage] ?? 'Lineage undisclosed.'}</p>
        <p style={{ margin: '4px 0' }}>{disclosure.statement}</p>
        <p style={{ margin: '4px 0' }}><strong>P12 scope:</strong> {disclosure.p12Scope}</p>
        <p style={{ margin: '4px 0' }}><strong>v2.0 scope:</strong> {disclosure.v2Scope}</p>
        <p style={{ margin: '4px 0' }}>{disclosure.certificationNote}</p>
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/* P13-B-04 — QUALITY / DEGRADATION                                    */
/* ------------------------------------------------------------------ */

const QUALITY_COLOR: Record<string, string> = {
  good: 'var(--color-status-positive)',
  stale: 'var(--color-status-warning)',
  partial: 'var(--color-status-warning)',
  unavailable: 'var(--color-ink-secondary)',
};

/** Governed quality label. `unavailable` is never rendered as a zero or a success state. */
export function QualityBadge({ quality, completenessPct }: { quality: string; completenessPct?: number }) {
  return (
    <span
      data-testid="quality-badge"
      data-quality={quality}
      style={{ fontSize: 12, color: QUALITY_COLOR[quality] ?? 'var(--color-ink-secondary)' }}
    >
      quality: {quality}
      {typeof completenessPct === 'number' ? ` · ${completenessPct}% complete` : ''}
    </span>
  );
}

/** Row-level degradation label produced by the certified `classifyRowDegradation`. */
export function DegradationLabel({ degradation }: { degradation: string }) {
  if (degradation === 'good') {
    return <span data-testid="degradation-label" data-degradation={degradation} style={{ fontSize: 12 }}>—</span>;
  }
  return (
    <span
      data-testid="degradation-label"
      data-degradation={degradation}
      style={{ fontSize: 12, color: 'var(--color-status-warning)' }}
    >
      {degradation.replace('degraded-', 'degraded: ')}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* P13-B-03 / P13-B-09 — PROVENANCE + AS-OF                            */
/* ------------------------------------------------------------------ */

/** P13-B-09 — As-of display. The governed observation time, shown verbatim. */
export function AsOfDisplay({ asOf, mode }: { asOf: string; mode?: string }) {
  return (
    <span data-testid="as-of-display" style={{ fontSize: 12, color: 'var(--color-ink-secondary)' }}>
      as of <code>{asOf}</code>{mode ? ` · ${mode}` : ''}
    </span>
  );
}

/** P13-B-03 — The derived provenance DTO, rendered field-by-field without interpretation. */
export function P12ProvenancePanel({ provenance }: { provenance: P12Provenance }) {
  return (
    <div
      data-testid="p12-provenance"
      style={{
        border: '1px solid var(--color-border)', borderRadius: 6, padding: 12,
        background: 'var(--color-surface-1)', fontSize: 12, marginTop: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <AsOfDisplay asOf={provenance.asOf} mode={provenance.mode} />
        <QualityBadge quality={provenance.quality} completenessPct={provenance.completenessPct} />
        <span>classification: <code>{provenance.classification}</code></span>
      </div>
      <div style={{ marginTop: 6, color: 'var(--color-ink-secondary)' }}>
        <div>source: <code>{provenance.dataSource}</code> · freshness {provenance.freshness}</div>
        <div>data version: <code>{provenance.dataVersion}</code> · identity map v{provenance.identityMappingVersion} · namespace v{provenance.namespaceVersion}</div>
        {provenance.contributingSnapshotIds.length > 0 && (
          <div data-testid="contributing-snapshots">
            contributing snapshots: {provenance.contributingSnapshotIds.map((s) => <code key={s} style={{ marginRight: 6 }}>{s}</code>)}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Governance limitations restated on P12-fed surfaces.
 *
 * ⚠ AD-17/M-2 is UNRESOLVED. ⚠ C12 security certification is BLOCKED. Exposure of a
 * governed surface implies NO certification of that surface.
 */
export function GovernanceLimitationsNote({ limitations }: { limitations: GovernanceLimitations }) {
  return (
    <p data-testid="governance-limitations" style={{ fontSize: 11, color: 'var(--color-ink-secondary)', marginTop: 8 }}>
      Governed surface — not certified. UI surface certification: {String(limitations.uiSurfaceCertified)} ·
      production authorized: {String(limitations.productionAuthorized)}.
      Security certification (C12) remains BLOCKED; AD-17 replay reproducibility remains UNRESOLVED.
    </p>
  );
}
