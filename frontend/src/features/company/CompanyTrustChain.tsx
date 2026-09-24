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
import type { EvidenceData } from '../../api/evidence.js';
import type { ReplayData } from '../../api/replay.js';
import { MetricCard, MetricGroup } from '../../components/data/DataComponents.js';
import { Ad17Note } from '../../components/evidence/Ad17Disclosure.js';
import { EvidenceRecordCard, ProvenanceChain, ReplaySummary, SnapshotMetadataPanel } from '../../components/evidence/EvidenceExplorerComponents.js';

export function CompanyTrustChain({ evidence, replay, headingClassName }: {
  evidence: EvidenceData;
  replay: ReplayData;
  /**
   * WUI-RS-05D-A (visual only). When supplied (Company Intelligence), section headings take the
   * established `.app-surface` subtitle treatment. When omitted (ExecutiveDashboard), the
   * original inline heading style is rendered unchanged.
   */
  headingClassName?: string;
}) {
  const headingProps = headingClassName
    ? { className: headingClassName }
    : { style: { fontSize: 18, marginTop: 24 } };
  return (
    <>
      {/* --- Evidence: why the certified platform produced this result --- */}
      <h2 {...headingProps}>Evidence (governed)</h2>
      <MetricGroup label="Supporting metrics (certified)">
        {evidence.evidence.supportingScores.map((s) => (
          <MetricCard key={s.id} label={s.name} value={s.value} />
        ))}
      </MetricGroup>
      <EvidenceRecordCard evidence={evidence.evidence} />

      <h2 {...headingProps}>Snapshot &amp; Provenance</h2>
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
      <h2 {...headingProps}>Replay Verification (governed)</h2>
      <ReplaySummary replay={replay.replay} />
      {/*
        ⚠ AD-17 L-5 SAFETY AMENDMENT (bounded). Authority: D57 (commit 9316b54), Decision A.

        This block PREVIOUSLY rendered `byteIdentical ? 'MATCH — byte-identical' : 'DIFFERENCE'`
        inside a --color-status-positive / --color-status-negative <strong>. That asserted a
        VERIFIED replay equivalence which has never been performed: `ReplayService` returns
        `reproduced`/`byteIdentical` as LITERALS (AD-17 / M-2, UNRESOLVED).

        Because this component is rendered by five live consumers (CompanyIntelligence UI02,
        CrossSectorIntelligence UI15, DecisionMatrix UI06, ExecutiveDashboard, PortfolioWorkspace),
        the prohibited claim reached all of them.

        The reported literal is now shown neutrally and marked NOT VERIFIED, with the approved
        `Ad17Note` disclosure attached — the same treatment already approved for UI17
        ReplayExplorer. No third presentation variant is introduced. The full literal set is
        already rendered immediately above by `ReplaySummary`, so `ReplayLiteralDisplay` is
        deliberately NOT repeated here (it would duplicate its test hooks).

        ⚠ AD-17 / M-2 REMAIN UNRESOLVED. This removes a prohibited CLAIM. It performs no
        verification, establishes no reproducibility, and grants no certification.

        <div> (not <p>): Ad17Note renders a block-level <p>, which may not nest inside a <p>.
      */}
      <div
        data-testid="company-replay-equivalence"
        style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, background: 'var(--color-surface-1)' }}
      >
        {/* ⚠ Deliberately NOT colour-coded. Colour would imply a verified pass/fail. */}
        <strong>
          Reported byteIdentical: <code>{String(replay.replay.byteIdentical)}</code> — NOT VERIFIED
        </strong>
        <br />
        <span style={{ fontSize: 13 }}>{replay.note}</span>
        {/*
          PROMPT 2C ADDITION (governance-required; NOT in the donor body). The governing manifest
          (B-2) requires the corrected D79 attribution to be DISPLAYED VERBATIM wherever the
          evidence/replay authorities are consumed. It is rendered from the governed payload 1:1
          and placed INSIDE this existing element, so no new observable testId key is introduced
          and the E2E-018 key set is unaffected. It makes no verification claim.
        */}
        <br />
        <span style={{ fontSize: 12, color: 'var(--color-ink-secondary)' }}>{replay.provenance.dataSource}</span>
        <Ad17Note />
      </div>
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
