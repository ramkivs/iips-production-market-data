/**
 * Program v3.0 — Phase 4: Resilience / state components.
 *
 * Loading, Empty, Error, PermissionDenied, Stale, Unavailable, Replay-state.
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

export function ReplayState({ match }: { match: 'match' | 'difference' | 'pending' | null }) {
  const map: Record<string, { title: string; status: string }> = {
    match: { title: 'REPLAY: MATCH', status: 'positive' },
    difference: { title: 'REPLAY: DIFFERENCE', status: 'negative' },
    pending: { title: 'REPLAY: PENDING', status: 'neutral' },
  };
  if (match === null) return <StateBox testid="state-replay" title="Replay unavailable">Replay result unavailable.</StateBox>;
  const { title, status } = map[match];
  return <StateBox testid={`state-replay-${match}`} title={title}><span style={{ color: `var(--color-status-${status})` }}>{title}</span></StateBox>;
}
