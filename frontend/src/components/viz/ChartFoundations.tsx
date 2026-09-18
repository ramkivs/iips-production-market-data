/**
 * Program v3.0 — Phase 4: Chart / visualization foundations (presentation-only).
 *
 * Charts render certified values ONLY; they never compute or recompute investment data.
 * Empty-data and stale-data states are explicit (never fabricated). Non-color-only.
 */
import type { ReactNode } from 'react';
import { EmptyState } from '../state/StateComponents';

export type ChartDatum = { label: string; value: number | null };

export function ChartContainer({ title, children, height = 240 }: { title: string; children: ReactNode; height?: number }) {
  return (
    <figure data-testid="chart-container" style={{ margin: 0, border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-1)' }}>
      <figcaption style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{title}</figcaption>
      <div style={{ height, position: 'relative' }}>{children}</div>
    </figure>
  );
}

/** Renders a simple, accessible bar visualization of certified values. */
export function SimpleBarChart({ data, max }: { data: readonly ChartDatum[]; max?: number }) {
  const hasData = data.some((d) => d.value !== null && d.value !== undefined);
  if (!hasData) {
    return <EmptyState label="Chart data unavailable" />;
  }
  const peak = max ?? Math.max(...data.map((d) => d.value ?? 0), 1);
  return (
    <div data-testid="simple-bar-chart" role="group" aria-label="Bar chart" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: '100%' }}>
      {data.map((d, i) => {
        const pct = d.value === null ? 0 : Math.max(0, Math.min(100, (d.value / peak) * 100));
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%' }}>
            <div
              data-testid={`bar-${d.label}`}
              aria-hidden="true"
              style={{ width: '100%', background: d.value === null ? 'repeating-linear-gradient(45deg,var(--color-border),var(--color-border) 3px,transparent 3px,transparent 6px)' : 'var(--color-status-informational)', height: `${pct}%`, minHeight: d.value === null ? 8 : 2 }}
            />
            <span style={{ fontSize: 11 }}>{d.label}</span>
            <span className="sr-only">{d.value === null ? 'unavailable' : d.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export function LegendConventions({ items }: { items: ReadonlyArray<{ label: string; colorVar: string }> }) {
  return (
    <ul data-testid="legend" style={{ listStyle: 'none', display: 'flex', gap: 12, padding: 0, margin: '8px 0', fontSize: 12 }}>
      {items.map((it) => (
        <li key={it.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span aria-hidden="true" style={{ width: 10, height: 10, background: it.colorVar, display: 'inline-block' }} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}
