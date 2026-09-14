import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
// `ReplayState` is deliberately absent from this import: it was deleted under the
// AD-17 L-6 amendment (D59 Decision B). See the export-contract test below.
import { LoadingState, ErrorState, PermissionDeniedState, StaleDataState, UnavailableState } from './StateComponents';

describe('State components', () => {
  it('LoadingState is a polite status', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('ErrorState is an assertive alert', () => {
    render(<ErrorState message="boom" />);
    expect(screen.getByRole('alert')).toHaveTextContent('boom');
  });

  it('UnavailableState never fabricates values', () => {
    render(<UnavailableState />);
    expect(screen.getByTestId('state-unavailable')).toHaveTextContent('No fabricated');
  });

  it('StaleDataState labels data stale', () => {
    render(<StaleDataState asOf="2026-08-01" />);
    expect(screen.getByTestId('state-stale')).toHaveTextContent('STALE');
  });

  /*
   * ⚠ AD-17 L-6. Authority: D59 Decision B (recovered SHA 3602bf4b; see D60 §5).
   *
   * The 'ReplayState renders match/difference/pending' test was REMOVED together with
   * the component. It asserted the literal strings 'MATCH' and 'DIFFERENCE', thereby
   * ENCODING the prohibited verified-replay verdict that AD-17 forbids while M-2 is
   * UNRESOLVED. It is deleted, not rewritten: there is no component left to test.
   *
   * The absence proof is the module contract itself — see the export test below.
   */
  it('AD-17: the module exports no replay-verdict component', async () => {
    const mod = await import('./StateComponents');
    expect('ReplayState' in mod).toBe(false);
    // The other six state exports are unaffected by the L-6 amendment.
    for (const name of ['LoadingState', 'EmptyState', 'ErrorState', 'PermissionDeniedState', 'StaleDataState', 'UnavailableState']) {
      expect(name in mod).toBe(true);
    }
  });

  it('PermissionDeniedState renders', () => {
    render(<PermissionDeniedState />);
    expect(screen.getByTestId('state-permission-denied')).toBeInTheDocument();
  });
});
