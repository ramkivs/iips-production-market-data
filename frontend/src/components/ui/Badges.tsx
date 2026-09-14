/**
 * Program v3.0 — Phase 3: Semantic status / authority / freshness badges.
 *
 * These consume the frozen semantic tokens and express the constitution's non-color-only
 * rule: each badge pairs an icon/symbol + label + semantic color.
 */
import type { ReactNode } from 'react';

interface BadgeProps {
  label: string;
  symbol: string;
  colorVar: string;
  testid?: string;
}

function Badge({ label, symbol, colorVar, testid }: BadgeProps) {
  return (
    <span
      data-testid={testid}
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        border: `1px solid ${colorVar}`,
        borderRadius: '4px',
        color: colorVar,
        fontSize: '12px',
        fontWeight: 600,
        background: 'var(--color-surface-1)',
      }}
    >
      <span aria-hidden="true">{symbol}</span>
      <span>{label}</span>
    </span>
  );
}

/** Authority badges (constitution-critical): CERTIFIED != AI != PLATFORM. */
export function CertifiedBadge() {
  return <Badge label="CERTIFIED RESULT" symbol="✓" colorVar="var(--color-authority-certified)" testid="badge-certified" />;
}
export function AiBadge() {
  return <Badge label="AI EXPLANATION" symbol="✦" colorVar="var(--color-authority-ai)" testid="badge-ai" />;
}
export function PlatformBadge() {
  return <Badge label="PLATFORM" symbol="◇" colorVar="var(--color-authority-platform)" testid="badge-platform" />;
}

/** Freshness badges. */
export function FreshnessBadge({ state }: { state: 'live' | 'snapshot' | 'stale' | 'unavailable' | 'replay' }) {
  const map: Record<string, { symbol: string; colorVar: string }> = {
    live: { symbol: '●', colorVar: 'var(--color-freshness-live)' },
    snapshot: { symbol: '□', colorVar: 'var(--color-freshness-snapshot)' },
    stale: { symbol: '▲', colorVar: 'var(--color-freshness-stale)' },
    unavailable: { symbol: '✕', colorVar: 'var(--color-freshness-unavailable)' },
    replay: { symbol: '↻', colorVar: 'var(--color-freshness-replay)' },
  };
  const { symbol, colorVar } = map[state];
  return <Badge label={state.toUpperCase()} symbol={symbol} colorVar={colorVar} testid={`freshness-${state}`} />;
}

export function StatusBadge({ status, label }: { status: 'positive' | 'negative' | 'neutral' | 'warning' | 'critical' | 'informational'; label?: string }) {
  const map: Record<string, { symbol: string; colorVar: string }> = {
    positive: { symbol: '✓', colorVar: 'var(--color-status-positive)' },
    negative: { symbol: '✕', colorVar: 'var(--color-status-negative)' },
    neutral: { symbol: '·', colorVar: 'var(--color-status-neutral)' },
    warning: { symbol: '▲', colorVar: 'var(--color-status-warning)' },
    critical: { symbol: '!', colorVar: 'var(--color-status-critical)' },
    informational: { symbol: 'i', colorVar: 'var(--color-status-informational)' },
  };
  const { symbol, colorVar } = map[status];
  return <Badge label={label ?? status} symbol={symbol} colorVar={colorVar} testid={`status-${status}`} />;
}

export function Icon({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span role="img" aria-label={label} style={{ display: 'inline-flex' }}>
      {children}
    </span>
  );
}
