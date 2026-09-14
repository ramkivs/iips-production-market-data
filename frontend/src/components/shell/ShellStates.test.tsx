/**
 * Program v3.0 — Phase 3: Shell states tests.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState, ErrorState, PermissionDeniedState, EmptyState, NotYetAuthorized } from './ShellStates';

describe('Shell states', () => {
  it('LoadingState renders a polite status', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.getByTestId('shell-loading')).toBeInTheDocument();
  });

  it('ErrorState renders an alert', () => {
    render(<ErrorState message="Something failed" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something failed');
  });

  it('PermissionDeniedState renders', () => {
    render(<PermissionDeniedState />);
    expect(screen.getByTestId('shell-permission-denied')).toBeInTheDocument();
  });

  it('EmptyState does not fabricate a value', () => {
    render(<EmptyState />);
    expect(screen.getByTestId('shell-empty')).toHaveTextContent('No data available');
  });

  it('NotYetAuthorized does not fabricate feature data', () => {
    render(<NotYetAuthorized surface="Executive" />);
    expect(screen.getByTestId('shell-not-authorized')).toHaveTextContent('not been implemented yet');
  });
});
