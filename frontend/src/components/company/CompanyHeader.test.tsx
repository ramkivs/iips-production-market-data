import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompanyHeader } from './CompanyHeader';

describe('CompanyHeader (reusable)', () => {
  it('renders identity, certified decision, and SNAPSHOT freshness', () => {
    render(<CompanyHeader companyName="Technology (reference)" sector="Technology" verdict="Buy" composite={76.3} confidence={0.8} freshness="SNAPSHOT" />);
    expect(screen.getByTestId('company-header')).toHaveTextContent('Technology (reference)');
    expect(screen.getByTestId('decision-badge-Buy')).toHaveTextContent('Buy');
    expect(screen.getByTestId('company-composite')).toHaveTextContent('76.3');
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
  });

  it('shows confidence unavailable when null', () => {
    render(<CompanyHeader companyName="X" sector="S" verdict="Watch" composite={47.1} confidence={null} freshness="SNAPSHOT" />);
    expect(screen.getByText('Confidence unavailable')).toBeInTheDocument();
  });
});
