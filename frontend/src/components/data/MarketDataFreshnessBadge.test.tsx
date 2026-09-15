import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MarketDataFreshnessBadge } from './MarketDataFreshnessBadge';
import * as marketDataApi from '../../api/marketData';

describe('MarketDataFreshnessBadge (R-2 UI Integration)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders CURRENT freshness badge with last refresh time when provisioned', async () => {
    vi.spyOn(marketDataApi, 'fetchMarketDataStatus').mockResolvedValue({
      isLiveProvisioned: true,
      provider: 'NSE (National Stock Exchange of India)',
      refreshCadenceMinutes: 15,
      lastSuccessfulRefresh: '2026-09-15T10:00:00.000Z',
      lastAttemptTimestamp: '2026-09-15T10:00:00.000Z',
      freshness: 'CURRENT',
      currentRecordCount: 50,
      historicalDayCount: 100,
      historicalRange: { earliestDate: '2026-01-01', latestDate: '2026-09-14' },
      activeLicensingGate: {
        state: 'PROVISIONED',
        reason: 'Credentials and entitlement valid',
        providerSelection: 'NSE',
        requiredEntitlements: [],
      },
    });

    render(<MarketDataFreshnessBadge />);

    await waitFor(() => {
      expect(screen.getByTestId('market-data-freshness-badge')).toBeInTheDocument();
    });

    expect(screen.getByText(/NSE CURRENT/i)).toBeInTheDocument();
    expect(screen.queryByTestId('market-data-gate-indicator')).not.toBeInTheDocument();
  });

  it('renders UNAVAILABLE status and GATE ACTIVE indicator when externally blocked', async () => {
    vi.spyOn(marketDataApi, 'fetchMarketDataStatus').mockResolvedValue({
      isLiveProvisioned: false,
      provider: 'NSE (National Stock Exchange of India)',
      refreshCadenceMinutes: 15,
      lastSuccessfulRefresh: null,
      lastAttemptTimestamp: null,
      freshness: 'UNAVAILABLE',
      currentRecordCount: 0,
      historicalDayCount: 0,
      historicalRange: { earliestDate: null, latestDate: null },
      activeLicensingGate: {
        state: 'EXTERNALLY_BLOCKED',
        reason: 'Production NSE credentials and licensing agreement not provisioned (OI-P04-04 gate active).',
        providerSelection: 'NSE (Capital Market Equities)',
        requiredEntitlements: ['NSE 15-minute delayed market data licensing agreement'],
      },
    });

    render(<MarketDataFreshnessBadge />);

    await waitFor(() => {
      expect(screen.getByTestId('market-data-freshness-badge')).toBeInTheDocument();
    });

    expect(screen.getByText(/NSE UNAVAILABLE/i)).toBeInTheDocument();
    expect(screen.getByTestId('market-data-gate-indicator')).toBeInTheDocument();
    expect(screen.getByText('GATE ACTIVE')).toBeInTheDocument();
  });
});
