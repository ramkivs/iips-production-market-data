/**
 * Program v3.0 — N+5: Company Trust Chain (the reusable vertical-slice reference pattern).
 *
 * Renders the governed Decision → Evidence → Replay → Provenance chain for a company by
 * composing the three certified read endpoints client-side:
 *   /api/company/:sector  (decision/header — rendered by the caller)
 *   /api/evidence/:sector (why the result)
 *   /api/replay/:sector   (can the result be reproduced)
 *
 * GOVERNANCE:
 *   - Sector is the ONLY variable — this component contains no sector-specific logic and is
 *     the reference pattern for all 10 certified engines, CSIP, and future pending engines.
 *   - Every value comes from the governed payloads 1:1; no recomputation, no inference, no
 *     fabrication (null confidence/pillars stay "unavailable").
 */
import type { EvidenceData } from '../../api/evidence';
import type { ReplayData } from '../../api/replay';
import { MetricCard, MetricGroup } from '../../components/data/DataComponents';
import { EvidenceRecordCard, ProvenanceChain, ReplaySummary, SnapshotMetadataPanel } from '../../components/evidence/EvidenceExplorerComponents';

export function CompanyTrustChain({ evidence, replay }: { evidence: EvidenceData; replay: ReplayData }) {
  return (
    <>
      {/* --- Evidence: why the certified platform produced this result --- */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Evidence (governed)</h2>
      <MetricGroup label="Supporting metrics (certified)">
        {evidence.evidence.supportingScores.map((s) => (
          <MetricCard key={s.id} label={s.name} value={s.value} />
        ))}
      </MetricGroup>
      <EvidenceRecordCard evidence={evidence.evidence} />

      <h2 style={{ fontSize: 18, marginTop: 24 }}>Snapshot &amp; Provenance</h2>
      <SnapshotMetadataPanel snapshot={evidence.snapshot} />
      <div style={{ marginTop: 8 }}>
        <ProvenanceChain
          items={[
            { key: 'framework', value: evidence.evidence.provenance.frameworkVersion },
            { key: 'engine', value: evidence.evidence.provenance.engineVersion },
            { key: 'methodology', value: evidence.evidence.provenance.methodologyVersion },
            { key: 'snapshot', value: evidence.evidence.provenance.snapshotId },
          ]}
        />
      </div>

      {/* --- Replay: can the result be reproduced and independently verified --- */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Replay Verification (governed)</h2>
      <ReplaySummary replay={replay.replay} />
      <p
        data-testid="company-replay-equivalence"
        style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, background: 'var(--color-surface-1)' }}
      >
        <strong style={{ color: replay.replay.byteIdentical ? 'var(--color-status-positive)' : 'var(--color-status-negative)' }}>
          {replay.replay.byteIdentical ? 'MATCH — byte-identical' : 'DIFFERENCE'}
        </strong>
        <br />
        <span style={{ fontSize: 13 }}>{replay.note}</span>
      </p>
      <div data-testid="company-replay-original" style={{ marginTop: 8 }}>
        <SnapshotMetadataPanel
          snapshot={{
            snapshotId: replay.original.snapshotId,
            engineId: replay.original.engineId,
            schemaVersion: replay.original.schemaVersion,
            generatedAt: replay.original.generatedAt,
            verdict: replay.original.verdict,
          }}
        />
      </div>
      {replay.evidenceRefs.length > 0 && (
        <div data-testid="company-replay-refs" style={{ marginTop: 8, fontSize: 13 }}>
          Evidence references:{' '}
          {replay.evidenceRefs.map((r, i) => (
            <span key={r}>
              {i > 0 ? ', ' : ''}
              <code>{r}</code>
            </span>
          ))}
        </div>
      )}
    </>
  );
}
