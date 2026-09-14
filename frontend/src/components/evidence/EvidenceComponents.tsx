/**
 * Program v3.0 — Phase 4: Evidence components (presentation-only).
 *
 * Display certified evidence packages / snapshots / provenance / replay references via typed
 * props. No interpretation or recomputation. CERTIFIED result treatment.
 */
import type { ReactNode } from 'react';
import { useDialogFocus } from '../interaction/useDialogFocus';

export interface EvidenceReference {
  readonly evidenceId: string;
  readonly engineId: string;
  readonly recommendation: string;
  readonly compositeScore: number | null;
  readonly calibrationVersion?: string;
  readonly snapshotId?: string;
  readonly decisionRulesApplied?: readonly string[];
}

export function EvidenceReference({ reference }: { reference: EvidenceReference }) {
  return (
    <div data-testid="evidence-reference" style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span>Evidence <code className="evidence-id">{reference.evidenceId}</code></span>
      <span>Engine <code>{reference.engineId}</code></span>
      <span>Recommendation: {reference.recommendation}</span>
      {reference.calibrationVersion && <span>Calibration <code>{reference.calibrationVersion}</code></span>}
    </div>
  );
}

export function SnapshotMetadata({ snapshotId, version, generatedAt, dataTimestamp }: { snapshotId: string; version?: string; generatedAt?: string; dataTimestamp?: string }) {
  return (
    <dl data-testid="snapshot-metadata" style={{ fontSize: 13, margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px' }}>
      <dt>Snapshot</dt><dd><code>{snapshotId}</code></dd>
      {version && <><dt>Version</dt><dd>{version}</dd></>}
      {generatedAt && <><dt>Generated</dt><dd>{generatedAt}</dd></>}
      {dataTimestamp && <><dt>Data as-of</dt><dd>{dataTimestamp}</dd></>}
    </dl>
  );
}

export function ProvenancePanel({ items }: { items: ReadonlyArray<{ key: string; value: string }> }) {
  return (
    <table data-testid="provenance-panel" style={{ fontSize: 13, borderCollapse: 'collapse', width: '100%' }}>
      <caption className="sr-only">Provenance</caption>
      <tbody>
        {items.map((it) => (
          <tr key={it.key} style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th scope="row" style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 500 }}>{it.key}</th>
            <td style={{ padding: '4px 8px' }}>{it.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function EvidencePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section data-testid="evidence-panel" style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-1)' }}>
      <h3 style={{ marginTop: 0, fontSize: 14 }}>{title}</h3>
      {children}
    </section>
  );
}

export function EvidenceDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const containerRef = useDialogFocus<HTMLDivElement>(open, onClose);
  if (!open) return null;
  return (
    <div data-testid="evidence-drawer" role="dialog" aria-modal="true" aria-label="Evidence" tabIndex={-1} ref={containerRef} style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(420px, 100vw)', background: 'var(--color-surface-0)', boxShadow: 'var(--elev-3)', padding: 24, zIndex: 100, overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <strong>Evidence</strong>
        <button type="button" onClick={onClose} aria-label="Close evidence">✕</button>
      </div>
      {children}
    </div>
  );
}

export function EvidenceCard({ reference }: { reference: EvidenceReference }) {
  return (
    <article data-testid="evidence-card" style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-0)', boxShadow: 'var(--elev-1)' }}>
      <EvidenceReference reference={reference} />
    </article>
  );
}
