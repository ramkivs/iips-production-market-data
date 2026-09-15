import React, { useEffect, useState } from 'react';
import { fetchMarketDataStatus, type MarketDataStatus } from '../../api/marketData';

export const MarketDataFreshnessBadge: React.FC = () => {
  const [status, setStatus] = useState<MarketDataStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchMarketDataStatus()
      .then((data) => {
        if (mounted) {
          setStatus(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !status) {
    return null;
  }

  const isCurrent = status.freshness === 'CURRENT';
  const isStale = status.freshness === 'STALE';
  const gateState = status.activeLicensingGate?.state ?? 'EXTERNALLY_BLOCKED';
  const gateReason = status.activeLicensingGate?.reason ?? 'Licensing gate active';

  return (
    <div
      data-testid="market-data-freshness-badge"
      className="inline-flex items-center gap-2 px-2.5 py-1 rounded text-xs font-medium border"
      style={{
        backgroundColor: isCurrent ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        borderColor: isCurrent ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
        color: isCurrent ? '#10b981' : '#ef4444',
      }}
      title={`Source: ${status.provider ?? 'NSE'} | Refresh: ~${status.refreshCadenceMinutes ?? 15}m | Status: ${gateState}`}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: isCurrent ? '#10b981' : isStale ? '#f59e0b' : '#ef4444' }}
      />
      <span>
        NSE {status.freshness ?? 'UNAVAILABLE'}
        {status.lastSuccessfulRefresh ? ` (${new Date(status.lastSuccessfulRefresh).toLocaleTimeString()})` : ' (NO REFRESH)'}
      </span>
      {gateState === 'EXTERNALLY_BLOCKED' && (
        <span
          data-testid="market-data-gate-indicator"
          className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-500 border border-amber-500/30"
          title={gateReason}
        >
          GATE ACTIVE
        </span>
      )}
    </div>
  );
};
