/**
 * Program v3.0 — Phase 3: Semantic badge tests (token integration, non-color-only).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CertifiedBadge, AiBadge, PlatformBadge, FreshnessBadge, StatusBadge } from './Badges';

describe('Semantic badges (non-color-only)', () => {
  it('CertifiedBadge is visually distinct from AiBadge (authority separation)', () => {
    render(<CertifiedBadge />);
    expect(screen.getByTestId('badge-certified')).toHaveTextContent('CERTIFIED RESULT');
  });

  it('AiBadge is labeled AI EXPLANATION (non-authoritative)', () => {
    render(<AiBadge />);
    expect(screen.getByTestId('badge-ai')).toHaveTextContent('AI EXPLANATION');
  });

  it('PlatformBadge renders', () => {
    render(<PlatformBadge />);
    expect(screen.getByTestId('badge-platform')).toHaveTextContent('PLATFORM');
  });

  it('FreshnessBadge renders each state with a label + symbol (non-color-only)', () => {
    render(
      <>
        <FreshnessBadge state="live" />
        <FreshnessBadge state="stale" />
        <FreshnessBadge state="unavailable" />
        <FreshnessBadge state="replay" />
        <FreshnessBadge state="snapshot" />
      </>,
    );
    expect(screen.getByTestId('freshness-live')).toHaveTextContent('LIVE');
    expect(screen.getByTestId('freshness-stale')).toHaveTextContent('STALE');
    expect(screen.getByTestId('freshness-unavailable')).toHaveTextContent('UNAVAILABLE');
    expect(screen.getByTestId('freshness-replay')).toHaveTextContent('REPLAY');
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
  });

  it('StatusBadge renders with icon + label', () => {
    render(<StatusBadge status="critical" label="Requires action" />);
    expect(screen.getByTestId('status-critical')).toHaveTextContent('Requires action');
  });
});
