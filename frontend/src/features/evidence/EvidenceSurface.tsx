/**
 * Institutional Investment Platform System (IIPS)
 * Evidence Surface — Phase-2, PATH L (LOCAL VIEW-MODEL / OFFLINE, PRESENTATION-ONLY)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 *                 Phase-2 Authority Act (RAMKI): `phase2-evidence-presentation-only-2026-09-22-001`
 *                 OPTION B — Evidence presentation-only Path-L convergence
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ FORENSIC BASIS — WHY THIS SURFACE RENDERS EMPTY BY DEFAULT ═══════════════════════════
 *  GATE-PHASE-2-EVIDENCE-PAYLOAD-FORENSIC (report 8dfd8ec817c92a75f4b552a0d5ab285afa201d7e)
 *  returned classification B — NO GOVERNED OFFLINE EVIDENCE PAYLOAD SOURCE FOUND.
 *
 *  The determinative finding: ZERO repository artifacts carry BOTH a `lineageDigest` and a
 *  `companyId`. The provenance that exists under `evidence/**` describes the PROGRAM
 *  (were P13..P16 certified?), not any COMPANY'S DATA LINEAGE. Field coverage of the best
 *  governed candidate against the 7 required ExecutiveProvenance fields is 1/7.
 *
 *  Therefore this surface is PRESENTATION-ONLY and renders an explicit unavailable state
 *  until a governed per-company provenance source is authorized (E-1..E-4 remain OPEN).
 *
 * ══ PATH-L CONSTRUCTION — WHAT THIS IS, AND WHAT IT IS NOT ═══════════════════════════════
 *  Bound to the EXISTING, ALREADY-TESTED local view-model builder
 *  `UI11ProvenanceAuditorBuilder` (src/ui/view_models/ui11_provenance_auditor.ts), a pure
 *  synchronous function over an `ExecutiveProvenance`. It contains ZERO network references.
 *
 *  NOT introduced here: `api/evidence`, `api/decisionMatrix`, `authFetch`,
 *  `core/auth/oidcClient`, AuthProvider, keycloakAdapter, `frontend/server/**`.
 *  There is no fetch, no XMLHttpRequest, no WebSocket, no EventSource, no /api/* call site,
 *  no token acquisition, no credential access, and no persistence.
 *
 * ══ DATA HONESTY — THE BINDING PROHIBITIONS OF THE AUTHORITY ACT ═════════════════════════
 *  Per §3.2 of the governing authority act, this component:
 *    · invents NO per-company provenance;
 *    · GENERATES NO `lineageDigest`. It never calls `computeLineageHash`. The Phase-2
 *      forensic determined that function is DERIVED presentation provenance, not an
 *      authoritative source lineage — a real SHA-256 over invented input is a real hash of a
 *      fiction, and on a PROVENANCE AUDITOR that would defeat the very control the surface
 *      implements. Lineage is therefore displayed ONLY when supplied by a governed source.
 *    · fabricates NO company identity. D05 identity is used for DISPLAY ONLY, and only when
 *      an identity is explicitly supplied by the caller.
 *    · performs NO production data ingestion.
 *
 *  Every provenance value rendered is surfaced verbatim from the view model. Nothing is
 *  synthesised, defaulted, or inferred.
 */

import { useMemo } from 'react';
import { UI11ProvenanceAuditorBuilder } from '../../../../src/ui/view_models/ui11_provenance_auditor.js';
import type { UI11ProvenanceAuditorViewModel } from '../../../../src/ui/types.js';
import type { ExecutiveProvenance } from '../../../../src/transports/types.js';
import { ProvenanceChain, EvidenceTimeline } from '../../components/evidence/EvidenceExplorerComponents.js';
import { FreshnessBadge } from '../../components/ui/Badges.js';
import { EmptyState, StaleDataState, UnavailableState } from '../../components/state/StateComponents.js';

export interface EvidenceSurfaceProps {
  /**
   * Governed provenance payload. Optional: when omitted the surface renders an explicit
   * unavailable state. NO provenance is fabricated and NO lineage digest is generated.
   */
  provenance?: ExecutiveProvenance;
  /**
   * Governed D05 company identity (canonical `companyId` form, e.g. `EQ_INFY_IN`).
   * Display-only. Required only when `provenance` is supplied.
   */
  companyId?: string;
  /** Governed D05 display name. Display-only. Required only when `provenance` is supplied. */
  companyName?: string;
  /** Optional governed version vector. Never invented when absent. */
  versionVector?: Record<string, string>;
  /** Viewport width forwarded to the responsive engine (defaults to the builder's 1280). */
  viewportWidth?: number;
}

/**
 * Renders the governed provenance audit for a single company.
 *
 * Pure presentation: the view model is built synchronously via `useMemo`. There is no effect,
 * no fetch, and no subscription.
 */
export function EvidenceSurface({
  provenance,
  companyId,
  companyName,
  versionVector,
  viewportWidth,
}: EvidenceSurfaceProps) {
  const vm: UI11ProvenanceAuditorViewModel | null = useMemo(() => {
    // Fail closed: without a governed provenance payload AND a governed identity, nothing is
    // rendered. We do not substitute placeholder identity or placeholder lineage.
    if (!provenance || !companyId || !companyName) return null;
    return UI11ProvenanceAuditorBuilder.build({
      provenance,
      companyId,
      companyName,
      versionVector,
      viewportWidth,
    });
  }, [provenance, companyId, companyName, versionVector, viewportWidth]);

  if (!vm) {
    return (
      <section className="app-surface" aria-labelledby="evidence-heading">
        <header className="app-surface__header">
          <h1 className="app-surface__title" id="evidence-heading">
            Evidence &amp; Provenance Auditor
          </h1>
          <p className="app-surface__subtitle">Cryptographic Lineage &amp; Governance Audit</p>
        </header>

        <UnavailableState />
        <EmptyState label="No governed provenance record loaded" />

        <p className="app-surface__note">
          This surface is implemented and ready, but no governed per-company provenance source
          is currently authorized for offline execution. Program governance records are not
          product provenance, and no lineage digest is generated here — displaying a
          synthesised digest on a provenance auditor would defeat the control this surface
          exists to provide.
        </p>
      </section>
    );
  }

  const q = vm.qualityIndicator;

  // Provenance chain is assembled ONLY from values present on the governed view model.
  const chain: { key: string; value: string }[] = [
    { key: 'Source', value: vm.sourceClassification },
    { key: 'Lineage', value: vm.lineageHash },
    { key: 'Vendor Tier', value: vm.vendorTier },
    { key: 'Evaluated', value: vm.evaluatedAt },
  ];
  if (vm.tenantId) chain.push({ key: 'Tenant', value: vm.tenantId });
  if (vm.correlationId) chain.push({ key: 'Correlation', value: vm.correlationId });

  const timelineSteps = [
    { label: 'Company', content: `${vm.companyName} (${vm.companyId})` },
    { label: 'Source Classification', content: vm.sourceClassification },
    { label: 'Lineage Digest', content: <code>{vm.lineageHash}</code> },
    { label: 'Evaluated At', content: vm.evaluatedAt },
    { label: 'Quality', content: q.label },
  ];

  return (
    <section
      className="app-surface"
      aria-labelledby="evidence-heading"
      aria-live={vm.accessibility.ariaLive}
      role={vm.accessibility.ariaRole}
    >
      <header className="app-surface__header">
        <h1 className="app-surface__title" id="evidence-heading">
          Evidence &amp; Provenance Auditor
        </h1>
        <p className="app-surface__subtitle">
          {vm.companyName} · {vm.companyId}
        </p>
        <div className="app-surface__meta">
          <FreshnessBadge state={vm.provenance.replayConstraintApplied ? 'replay' : 'snapshot'} />
          <span aria-label={q.ariaText}>
            {q.icon} {q.label}
          </span>
          <span>As of {vm.asOf}</span>
        </div>
      </header>

      {q.isDegraded && <StaleDataState asOf={vm.asOf} />}

      <div className="app-surface__block" id={vm.accessibility.focusElementId} tabIndex={-1}>
        <EvidenceTimeline steps={timelineSteps} />
      </div>

      <div className="app-surface__block">
        <ProvenanceChain items={chain} />
      </div>

      {vm.provenance.replayConstraintApplied && vm.provenance.replayConstraintText && (
        <p className="app-surface__note">{vm.provenance.replayConstraintText}</p>
      )}

      <footer className="app-surface__provenance">
        <span>Schema {vm.versionVector.schemaVersion ?? '—'}</span>
        <span>Engine {vm.versionVector.engineVersion ?? '—'}</span>
        <span>Data version {vm.provenance.dataVersion}</span>
        <span>{vm.accessibility.tableCaption}</span>
      </footer>
    </section>
  );
}
