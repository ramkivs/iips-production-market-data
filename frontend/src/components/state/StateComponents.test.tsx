import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState, ErrorState, PermissionDeniedState, StaleDataState, UnavailableState, ReplayState } from './StateComponents';

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

  it('ReplayState renders match/difference/pending', () => {
    const { rerender } = render(<ReplayState match="match" />);
    expect(screen.getByTestId('state-replay-match')).toHaveTextContent('MATCH');
    rerender(<ReplayState match="difference" />);
    expect(screen.getByTestId('state-replay-difference')).toHaveTextContent('DIFFERENCE');
    rerender(<ReplayState match={null} />);
    expect(screen.getByTestId('state-replay')).toHaveTextContent('Replay unavailable');
  });

  it('PermissionDeniedState renders', () => {
    render(<PermissionDeniedState />);
    expect(screen.getByTestId('state-permission-denied')).toBeInTheDocument();
  });
});
