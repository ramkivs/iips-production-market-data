import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard, MetricGroup, MetricTable, DataTable, TrendIndicator, ComparisonTable } from './DataComponents';

describe('Data components', () => {
  it('MetricCard renders null as unavailable, never 0', () => {
    render(<MetricCard label="Growth" value={null} />);
    expect(screen.getByTestId('metric-value')).toHaveTextContent('unavailable');
    expect(screen.getByTestId('metric-value')).not.toHaveTextContent('0');
  });

  it('MetricCard renders a value with unit', () => {
    render(<MetricCard label="Margin" value={40} unit="%" />);
    expect(screen.getByTestId('metric-value')).toHaveTextContent('40 %');
  });

  it('DataTable renders empty state without fabricating rows', () => {
    render(<DataTable columns={[]} rows={[]} />);
    expect(screen.getByTestId('data-table-empty')).toHaveTextContent('No data available');
  });

  it('DataTable renders rows via column renderers', () => {
    render(<DataTable columns={[{ key: 'n', header: 'Name', render: (r: { n: string }) => r.n }]} rows={[{ n: 'Alpha' }]} />);
    expect(screen.getByTestId('data-table')).toHaveTextContent('Alpha');
  });

  it('TrendIndicator renders unavailable for null', () => {
    render(<TrendIndicator direction={null} />);
    expect(screen.getByTestId('trend-unavailable')).toBeInTheDocument();
  });

  it('MetricTable renders unavailable value', () => {
    render(<MetricTable rows={[{ label: 'FCF Yield', value: null }]} />);
    expect(screen.getByTestId('metric-table')).toHaveTextContent('unavailable');
  });

  it('ComparisonTable renders', () => {
    render(<ComparisonTable headers={['A', 'B']} rows={[[<span key="1">x</span>, <span key="2">y</span>]]} />);
    expect(screen.getByTestId('comparison-table')).toHaveTextContent('x');
  });

  it('MetricGroup renders children', () => {
    render(<MetricGroup label="Quality"><MetricCard label="Margin" value={40} /></MetricGroup>);
    expect(screen.getByTestId('metric-group')).toHaveTextContent('Margin');
  });

  it('B2: MetricGroup label is an h3 (heading order)', () => {
    render(<MetricGroup label="Quality"><MetricCard label="Margin" value={40} /></MetricGroup>);
    expect(screen.getByRole('heading', { level: 3, name: 'Quality' })).toBeInTheDocument();
  });

  it('B1: DataTable is wrapped in a horizontal-scroll container', () => {
    render(<DataTable columns={[{ key: 'n', header: 'Name', render: (r: { n: string }) => r.n }]} rows={[{ n: 'Alpha' }]} />);
    expect(screen.getByTestId('data-table').parentElement).toHaveClass('table-scroll');
  });

  it('B1: ComparisonTable is wrapped in a horizontal-scroll container', () => {
    render(<ComparisonTable headers={['A']} rows={[[<span key="1">x</span>]]} />);
    expect(screen.getByTestId('comparison-table').parentElement).toHaveClass('table-scroll');
  });
});
