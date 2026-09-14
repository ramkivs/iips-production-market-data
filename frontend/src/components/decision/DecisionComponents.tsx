/**
 * Program v3.0 — Phase 4: Decision components (presentation-only).
 *
 * Consumes certified decision results via typed props. No scoring/ranking/threshold logic.
 * Non-color-only status. CERTIFIED result treatment (authority separation).
 */

// --- Verdict type (matches the v1.1 verdict vocabulary; presentation-only) ---
export type Verdict = 'Strong Buy' | 'Buy' | 'Accumulate' | 'Hold' | 'Watch' | 'Avoid';

const VERDICT_STATUS: Record<Verdict, 'positive' | 'neutral' | 'warning' | 'negative'> = {
  'Strong Buy': 'positive',
  Buy: 'positive',
  Accumulate: 'neutral',
  Hold: 'neutral',
  Watch: 'warning',
  Avoid: 'negative',
};

export function DecisionBadge({ verdict }: { verdict: Verdict }) {
  const status = VERDICT_STATUS[verdict];
  const colorVar = `var(--color-status-${status})`;
  const symbol = status === 'positive' ? '▲' : status === 'negative' ? '▼' : status === 'warning' ? '!' : '•';
  return (
    <span
      data-testid={`decision-badge-${verdict}`}
      role="status"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: `1px solid ${colorVar}`, borderRadius: 4, color: colorVar, fontWeight: 700, fontSize: 13, background: 'var(--color-surface-1)' }}
    >
      <span aria-hidden="true">{symbol}</span>
      <span>{verdict}</span>
    </span>
  );
}

export function ConfidenceIndicator({ value }: { value: number | null }) {
  if (value === null || value === undefined) {
    return <span data-testid="confidence-unavailable">Confidence unavailable</span>;
  }
  const pct = Math.round(value * 100);
  const colorVar = pct >= 80 ? 'var(--color-status-positive)' : pct >= 50 ? 'var(--color-status-warning)' : 'var(--color-status-negative)';
  return (
    <div data-testid="confidence-indicator" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span role="img" aria-label="Confidence" style={{ color: colorVar }}>●</span>
      <span>{pct}% confidence</span>
    </div>
  );
}

export function RiskIndicator({ level }: { level: 'low' | 'medium' | 'high' | null }) {
  const map: Record<string, { status: string; symbol: string }> = {
    low: { status: 'positive', symbol: '◔' },
    medium: { status: 'warning', symbol: '◑' },
    high: { status: 'negative', symbol: '◕' },
  };
  if (level === null || !(level in map)) {
    return <span data-testid="risk-unavailable">Risk unavailable</span>;
  }
  const { status, symbol } = map[level];
  return (
    <span data-testid={`risk-${level}`} role="status" style={{ color: `var(--color-status-${status})`, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <span aria-hidden="true">{symbol}</span>
      <span>{level.toUpperCase()} risk</span>
    </span>
  );
}

export interface DecisionDriver {
  readonly label: string;
  readonly value: number | null;
  readonly direction: 'positive' | 'negative' | 'neutral' | null;
}

export function DecisionDriver({ label, value, direction }: DecisionDriver) {
  return (
    <div data-testid="decision-driver" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span>{label}</span>
      <span style={{ color: direction ? `var(--color-status-${direction})` : undefined, fontWeight: 500 }}>
        {value === null ? 'unavailable' : value}
      </span>
    </div>
  );
}

export interface DecisionSummaryProps {
  readonly verdict: Verdict;
  readonly composite: number | null;
  readonly confidence: number | null;
  readonly drivers: readonly DecisionDriver[];
}

export function DecisionSummary({ verdict, composite, confidence, drivers }: DecisionSummaryProps) {
  return (
    <section data-testid="decision-summary" style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        <DecisionBadge verdict={verdict} />
        <span data-testid="decision-composite">Composite: {composite === null ? 'unavailable' : composite}</span>
        <ConfidenceIndicator value={confidence} />
      </div>
      {drivers.length > 0 ? (
        <div>{drivers.map((d) => <DecisionDriver key={d.label} {...d} />)}</div>
      ) : (
        <span data-testid="decision-drivers-empty">No decision drivers available</span>
      )}
    </section>
  );
}

export function DecisionCard({ summary, onOpenEvidence }: { summary: DecisionSummaryProps; onOpenEvidence?: () => void }) {
  return (
    <article data-testid="decision-card" style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-0)', boxShadow: 'var(--elev-1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <DecisionBadge verdict={summary.verdict} />
        {onOpenEvidence && (
          <button type="button" onClick={onOpenEvidence} style={{ fontSize: 12 }}>Evidence</button>
        )}
      </div>
      <DecisionSummary {...summary} />
    </article>
  );
}
