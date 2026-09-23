/**
 * Program v3.0 — Phase 4: Resilience / state components.
 *
 * Loading, Empty, Error, PermissionDenied, Stale, Unavailable.
 * (Replay-state removed under the AD-17 L-6 amendment — see note below.)
 * Never fabricate investment values. Non-color-only. Accessible.
 */
import type { ReactNode } from 'react';

function StateBox({ testid, title, children, role, ariaLive }: { testid: string; title: string; children: ReactNode; role?: 'status' | 'alert'; ariaLive?: 'polite' | 'assertive' }) {
  return (
    <div data-testid={testid} role={role} aria-live={ariaLive} style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-1)' }}>
      <strong>{title}</strong>
      <div style={{ marginTop: 4, fontSize: 13 }}>{children}</div>
    </div>
  );
}

export function LoadingState() {
  return <StateBox testid="state-loading" title="Loading" role="status" ariaLive="polite">Loading&hellip;</StateBox>;
}

export function EmptyState({ label = 'No data available' }: { label?: string }) {
  return <StateBox testid="state-empty" title="No data">{label}</StateBox>;
}

export function ErrorState({ message }: { message: string }) {
  return <StateBox testid="state-error" title="Error" role="alert" ariaLive="assertive">{message}</StateBox>;
}

export function PermissionDeniedState() {
  return <StateBox testid="state-permission-denied" title="Permission denied">You do not have permission to view this. Contact your administrator.</StateBox>;
}

export function StaleDataState({ asOf }: { asOf?: string }) {
  return (
    <StateBox testid="state-stale" title="Stale data">
      The displayed data is from a previous snapshot{asOf ? ` (as of ${asOf})` : ''} and may be out of date. It is labeled STALE, never presented as current.
    </StateBox>
  );
}

export function UnavailableState({ reason = 'Data unavailable' }: { reason?: string }) {
  return <StateBox testid="state-unavailable" title={reason}>Data is unavailable. No fabricated or placeholder investment values are shown.</StateBox>;
}

/*
 * ⚠ AD-17 L-6 SAFETY AMENDMENT — `ReplayState` DELETED (bounded).
 *   Authority: D59 Decision B (recovered SHA 3602bf4b706713337ff809c5f717a4a5bedfaf3d;
 *   original commit d3da1f1 destroyed — see D60 §5 for the binding SHA mapping).
 *
 *   This module PREVIOUSLY exported `ReplayState`, which rendered
 *     match      → 'REPLAY: MATCH'      in --color-status-positive
 *     difference → 'REPLAY: DIFFERENCE' in --color-status-negative
 *   That asserted a VERIFIED replay verdict. No such verification exists:
 *   `ReplayService` returns reproduced/byteIdentical as LITERALS (AD-17 / M-2,
 *   UNRESOLVED).
 *
 *   It was DORMANT — zero non-test consumers — so it was not a live exposure. But it
 *   was a public export of a module imported by 30 files, i.e. one import keystroke
 *   away from reintroducing the prohibited claim. D59 therefore authorized proactive
 *   removal, deletion being the preferred treatment: a component that cannot make the
 *   claim needs no policing.
 *
 *   NO replacement replay-verification component is provided. Surfaces that must show
 *   replay literals use the approved `components/evidence/Ad17Disclosure`
 *   (`ReplayLiteralDisplay` / `Ad17Note`), as applied in D56 and D58.
 *
 *   ⚠ AD-17 / M-2 REMAIN UNRESOLVED. This removes a prohibited CLAIM. It performs no
 *   verification, establishes no reproducibility, and grants no certification.
 */
