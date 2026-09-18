/**
 * Program v3.0 — Phase 12.1: Administration Overview.
 *
 * Read-only governed platform summary. Answers: platform state, engines registered, what is
 * certified, node health, data-source quality, audit state. NO invented "admin score", no
 * fabricated health metrics — every value comes from the governed transport DTO.
 */
import { useEffect, useState } from 'react';
import { adminApi, type AdminOverview as T } from '../../api/admin';
import { MetricCard, MetricGroup } from '../../components/data/DataComponents';
import { LoadingState, ErrorState } from '../../components/state/StateComponents';
import { PlatformBadge, StatusBadge } from '../../components/ui/Badges';

export function AdminOverview() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    adminApi.overview()
      .then((d) => { if (active) { setData(d); setError(null); } })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const stateStatus = data.platform.state === 'OPERATIONAL' ? 'positive'
    : data.platform.state === 'DEGRADED' ? 'warning' : 'negative';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h3 style={{ margin: 0 }}>Platform Overview</h3>
        <PlatformBadge />
        <StatusBadge status={stateStatus} label={data.platform.state} />
      </div>
      <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-ink-secondary)' }}>
        Governed read-only platform state. No operational health score is fabricated.
      </p>

      <MetricGroup label="Platform state">
        <MetricCard label="Platform state" value={data.platform.state === 'OPERATIONAL' ? 1 : null} />
        <MetricCard label="Healthy nodes" value={data.platform.nodesHealthy} unit={`/ ${data.platform.nodesTotal}`} />
        <MetricCard label="Engines registered" value={data.platform.enginesRegistered} />
        <MetricCard label="Engines certified" value={data.platform.enginesCertified} />
        <MetricCard label="Recent audit entries" value={data.platform.recentAuditCount} />
      </MetricGroup>

      <p style={{ marginTop: 16, fontSize: 12, color: 'var(--color-ink-secondary)' }}>
        Live-data quality: <strong>{data.platform.liveDataQuality ?? 'unavailable'}</strong>
      </p>
    </div>
  );
}
