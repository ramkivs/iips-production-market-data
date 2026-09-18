/**
 * Program v3.0 — Phase 4: Data components (presentation-only).
 *
 * Metric/table display components. Consume typed data; no computation, no fabricated values.
 * Missing values render 'unavailable', never 0 or invented placeholders.
 */
import type { ReactNode } from 'react';

export function MetricCard({ label, value, unit, direction }: { label: string; value: number | null; unit?: string; direction?: 'positive' | 'negative' | 'neutral' | null }) {
  const display = value === null || value === undefined ? 'unavailable' : `${value}${unit ? ` ${unit}` : ''}`;
  return (
    <div data-testid="metric-card" style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, background: 'var(--color-surface-1)' }}>
      <div style={{ fontSize: 12, color: 'var(--color-ink-secondary)' }}>{label}</div>
      <div data-testid="metric-value" style={{ fontSize: 20, fontWeight: 600, color: direction ? `var(--color-status-${direction})` : 'var(--color-ink)' }}>
        {display}
      </div>
    </div>
  );
}

export function MetricGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section data-testid="metric-group" aria-label={label}>
      <h3 style={{ margin: '12px 0 8px', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-secondary)' }}>{label}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>{children}</div>
    </section>
  );
}

export interface Column<T> {
  readonly key: string;
  readonly header: string;
  readonly render: (row: T) => ReactNode;
}

export function DataTable<T>({ columns, rows, emptyLabel = 'No data available' }: { columns: readonly Column<T>[]; rows: readonly T[]; emptyLabel?: string }) {
  if (rows.length === 0) {
    return <div data-testid="data-table-empty">{emptyLabel}</div>;
  }
  return (
    <div className="table-scroll">
      <table data-testid="data-table" style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
        <thead>
          <tr>{columns.map((c) => <th key={c.key} scope="col" style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)', fontWeight: 600 }}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
              {columns.map((c) => <td key={c.key} style={{ padding: '8px' }}>{c.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TrendIndicator({ direction, label }: { direction: 'up' | 'down' | 'flat' | null; label?: string }) {
  const map: Record<string, { symbol: string; status: string }> = {
    up: { symbol: '↑', status: 'positive' },
    down: { symbol: '↓', status: 'negative' },
    flat: { symbol: '→', status: 'neutral' },
  };
  if (direction === null) return <span data-testid="trend-unavailable">Trend unavailable</span>;
  const { symbol, status } = map[direction];
  return <span data-testid={`trend-${direction}`} role="status" style={{ color: `var(--color-status-${status})`, display: 'inline-flex', gap: 4, alignItems: 'center' }}><span aria-hidden="true">{symbol}</span>{label ?? direction}</span>;
}

export function ComparisonTable({ headers, rows }: { headers: readonly string[]; rows: readonly ReactNode[][] }) {
  return (
    <div className="table-scroll">
      <table data-testid="comparison-table" style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
        <thead><tr>{headers.map((h, i) => <th key={i} scope="col" style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--color-border)' }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>{r.map((cell, j) => <td key={j} style={{ padding: 8 }}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function MetricTable({ rows }: { rows: ReadonlyArray<{ label: string; value: number | null; unit?: string }> }) {
  return (
    <table data-testid="metric-table" style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
      <thead><tr><th scope="col" style={{ textAlign: 'left', padding: 8 }}>Metric</th><th scope="col" style={{ textAlign: 'right', padding: 8 }}>Value</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.label} style={{ borderBottom: '1px solid var(--color-border)' }}><td style={{ padding: 8 }}>{r.label}</td><td style={{ padding: 8, textAlign: 'right' }}>{r.value === null ? 'unavailable' : `${r.value}${r.unit ? ` ${r.unit}` : ''}`}</td></tr>)}</tbody>
    </table>
  );
}
