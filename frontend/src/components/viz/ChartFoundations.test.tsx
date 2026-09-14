import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartContainer, SimpleBarChart, LegendConventions } from './ChartFoundations';

describe('Chart foundations', () => {
  it('ChartContainer renders with a title', () => {
    render(<ChartContainer title="Sector Exposure"><div>chart</div></ChartContainer>);
    expect(screen.getByTestId('chart-container')).toHaveTextContent('Sector Exposure');
  });

  it('SimpleBarChart renders empty state when no data', () => {
    render(<SimpleBarChart data={[{ label: 'A', value: null }]} />);
    expect(screen.getByTestId('state-empty')).toHaveTextContent('Chart data unavailable');
  });

  it('SimpleBarChart renders bars for data', () => {
    render(<SimpleBarChart data={[{ label: 'A', value: 50 }, { label: 'B', value: 30 }]} />);
    expect(screen.getByTestId('bar-A')).toBeInTheDocument();
    expect(screen.getByTestId('bar-B')).toBeInTheDocument();
  });

  it('LegendConventions renders labels', () => {
    render(<LegendConventions items={[{ label: 'Certified', colorVar: 'var(--color-authority-certified)' }]} />);
    expect(screen.getByTestId('legend')).toHaveTextContent('Certified');
  });

  it('B2: SimpleBarChart exposes data without nested role="img"', () => {
    render(<SimpleBarChart data={[{ label: 'A', value: 50 }]} />);
    expect(screen.getByTestId('simple-bar-chart')).toHaveAttribute('role', 'group');
    expect(screen.queryByRole('img', { name: /A: 50/ })).not.toBeInTheDocument();
    // Value remains available to assistive tech via sr-only text.
    expect(screen.getByTestId('simple-bar-chart')).toHaveTextContent('50');
  });
});
