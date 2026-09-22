/**
 * Program v3.0 — Phase 3: Global shell states.
 * Loading / error / permission-denied / not-yet-authorized (feature placeholder) states.
 * Never fabricate investment values. Accessibility: role="status"/aria-live for loading,
 * role="alert" for errors.
 */
import type { ReactNode } from 'react';

function ShellState({ title, children, testid }: { title: string; children: ReactNode; testid: string }) {
  return (
    <section data-testid={testid} style={{ padding: '24px', maxWidth: '640px' }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

export function LoadingState() {
  return (
    <ShellState title="Loading" testid="shell-loading">
      <p role="status" aria-live="polite">Loading&hellip;</p>
    </ShellState>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <ShellState title="Error" testid="shell-error">
      <p role="alert">{message}</p>
    </ShellState>
  );
}

export function PermissionDeniedState() {
  return (
    <ShellState title="Permission denied" testid="shell-permission-denied">
      <p>You do not have permission to view this surface. Contact your administrator if this is unexpected.</p>
    </ShellState>
  );
}

export function EmptyState({ label = 'No data available' }: { label?: string }) {
  return (
    <ShellState title="No data" testid="shell-empty">
      <p>{label}</p>
    </ShellState>
  );
}

/**
 * Feature placeholder for surfaces not yet authorized (Phase 3 = shell only).
 * Rendered instead of fabricating feature data.
 */
export function NotYetAuthorized({ surface }: { surface: string }) {
  return (
    <ShellState title={`${surface} — not yet built`} testid="shell-not-authorized">
      <p>
        The <strong>{surface}</strong> workspace is part of a later Program v3.0 phase and has
        not been implemented yet. No feature data is fabricated at this stage.
      </p>
    </ShellState>
  );
}
