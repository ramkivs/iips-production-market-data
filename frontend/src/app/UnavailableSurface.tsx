/**
 * IIPS — Offline structural surface (Phase 5, Option A).
 *
 * The honest fail-closed page for donor Master IIPS routes restored STRUCTURALLY by
 * authority act phase5-offline-full-shell-restoration-2026-09-23-001.
 *
 * ══ WHY THIS EXISTS ══════════════════════════════════════════════════════════════════════
 *  Option A restores the STRUCTURE of the full Master IIPS platform around the accepted
 *  BI-08 integration, WITHOUT restoring the excluded runtime dependencies. In the donor
 *  lineage these surfaces are clients of a server tier (authFetch -> /api/* ->
 *  frontend/server/** -> Keycloak OIDC) that standing authority excludes from this
 *  application. Mounting the donor components would activate those dependencies; leaving
 *  the routes out would shrink the Master platform; faking their data would fabricate
 *  functionality.
 *
 *  Therefore each restored route renders THIS page: an explicit, honest statement that
 *  the surface is STRUCTURALLY PRESENT but NOT FUNCTIONALLY AVAILABLE in the governed
 *  offline execution mode. It performs no fetch, holds no data, fabricates no values,
 *  and claims no capability.
 *
 *  States:
 *    · 'offline'        — the surface's donor implementation is server/API-coupled; the
 *                         platform services are not active in the offline mode.
 *    · 'authorization'  — the surface requires the deferred identity/authorization tier
 *                         (D115 DEFERRED / WITHHELD / UNRESOLVED / NOT AUTHORIZED).
 *    · 'excluded'       — the surface is excluded by a standing authority act (e.g. Macro,
 *                         D91/D88: LIVE-only governance, no relief granted).
 *
 * Governed under: phase5-offline-full-shell-restoration-2026-09-23-001 (Option A)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */
import { UnavailableState } from '../components/state/StateComponents.js';

export type StructuralState = 'offline' | 'authorization' | 'excluded';

export interface UnavailableSurfaceProps {
  /** Human-facing surface name, e.g. "Administration — Identity & Access". */
  surface: string;
  /** Why the surface cannot function here (see StructuralState). */
  state: StructuralState;
  /** One-line governed reason, shown as the state title. */
  reason: string;
  /** Optional provenance/lineage note (e.g. donor source of the structure). */
  note?: string;
}

const STATE_BADGE: Record<StructuralState, string> = {
  offline: 'OFFLINE — SERVICE NOT ACTIVE',
  authorization: 'AUTHORIZATION REQUIRED — D115 DEFERRED',
  excluded: 'EXCLUDED BY AUTHORITY',
};

export function UnavailableSurface({ surface, state, reason, note }: UnavailableSurfaceProps) {
  return (
    <section
      className="app-placeholder"
      aria-labelledby="structural-unavailable-heading"
      data-testid="structural-surface-unavailable"
    >
      <h2 id="structural-unavailable-heading" className="app-placeholder__title">
        {surface}
      </h2>
      <p className="app-placeholder__status">
        <span className="app-placeholder__badge" data-testid="structural-surface-state">
          {STATE_BADGE[state]}
        </span>
      </p>
      <UnavailableState reason={reason} />
      <p className="app-placeholder__body" data-testid="structural-surface-body">
        This surface is part of the Master IIPS platform structure, restored offline by
        governed authority. Its functionality is not available in this execution mode:
        no server, no identity layer, and no live data are active, and none are activated
        by this page.
      </p>
      {note && (
        <p className="app-placeholder__body app-placeholder__body--muted" data-testid="structural-surface-note">
          {note}
        </p>
      )}
    </section>
  );
}
