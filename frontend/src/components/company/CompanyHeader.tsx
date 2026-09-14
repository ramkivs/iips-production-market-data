/**
 * Program v3.0 — Phase 7: CompanyHeader (reusable component).
 * Displays company identity + current certified decision + authority/freshness.
 * Presentation-only; consumes certified values via props.
 */
import type { Verdict } from '../decision/DecisionComponents';
import { DecisionBadge } from '../decision/DecisionComponents';
import { CertifiedBadge, FreshnessBadge } from '../ui/Badges';

export interface CompanyHeaderProps {
  readonly companyName: string;
  readonly sector: string;
  readonly verdict: Verdict;
  readonly composite: number;
  readonly confidence: number | null;
  readonly freshness: 'LIVE' | 'SNAPSHOT' | 'STALE' | 'UNAVAILABLE' | 'REPLAY';
  readonly subLabel?: string | null;
}

export function CompanyHeader({ companyName, sector, verdict, composite, confidence, freshness, subLabel }: CompanyHeaderProps) {
  return (
    <header data-testid="company-header">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>{companyName}</h1>
        <span style={{ color: 'var(--color-ink-secondary)' }}>{sector}</span>
        <CertifiedBadge />
        <FreshnessBadge state={freshness === 'SNAPSHOT' ? 'snapshot' : 'live'} />
      </div>
      {subLabel && <p style={{ color: 'var(--color-ink-secondary)', margin: '4px 0 8px', fontSize: 13 }}>{subLabel}</p>}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
        <DecisionBadge verdict={verdict} />
        <span data-testid="company-composite">Composite: {composite}</span>
        <span>{confidence === null ? 'Confidence unavailable' : `${Math.round(confidence * 100)}% confidence`}</span>
      </div>
    </header>
  );
}
