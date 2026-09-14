import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DecisionBadge, ConfidenceIndicator, RiskIndicator, DecisionDriver, DecisionSummary, DecisionCard } from './DecisionComponents';

describe('Decision components', () => {
  it('DecisionBadge renders the verdict with non-color-only treatment', () => {
    render(<DecisionBadge verdict="Buy" />);
    expect(screen.getByTestId('decision-badge-Buy')).toHaveTextContent('Buy');
    expect(screen.getByTestId('decision-badge-Buy').getAttribute('role')).toBe('status');
  });

  it('ConfidenceIndicator renders null as unavailable, never a fabricated value', () => {
    const { rerender } = render(<ConfidenceIndicator value={null} />);
    expect(screen.getByTestId('confidence-unavailable')).toHaveTextContent('Confidence unavailable');
    rerender(<ConfidenceIndicator value={0.85} />);
    expect(screen.getByTestId('confidence-indicator')).toHaveTextContent('85% confidence');
  });

  it('RiskIndicator renders unavailable for null', () => {
    render(<RiskIndicator level={null} />);
    expect(screen.getByTestId('risk-unavailable')).toBeInTheDocument();
  });

  it('DecisionDriver renders unavailable for null value', () => {
    render(<DecisionDriver label="Growth" value={null} direction={null} />);
    expect(screen.getByTestId('decision-driver')).toHaveTextContent('unavailable');
  });

  it('DecisionSummary shows composite and drivers', () => {
    render(<DecisionSummary verdict="Buy" composite={76.3} confidence={0.8} drivers={[{ label: 'Growth', value: 75, direction: 'positive' }]} />);
    expect(screen.getByTestId('decision-composite')).toHaveTextContent('76.3');
    expect(screen.getByTestId('decision-driver')).toHaveTextContent('Growth');
  });

  it('DecisionCard wires the evidence button', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<DecisionCard summary={{ verdict: 'Buy', composite: 76.3, confidence: 0.8, drivers: [] }} onOpenEvidence={onOpen} />);
    await user.click(screen.getByRole('button', { name: 'Evidence' }));
    expect(onOpen).toHaveBeenCalled();
  });
});
