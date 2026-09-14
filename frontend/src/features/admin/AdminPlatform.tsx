/**
 * Program v3.0 — Phase 12.1: Platform Operations (read-only).
 *
 * Governed health / HA / DR / telemetry / performance. No invented uptime %, health scores,
 * capacity scores, or SLOs — every value comes from the governed transport DTO. Freshness
 * semantics (LIVE/SNAPSHOT) are preserved.
 */
import { useEffect, useState } from 'react';
import { adminApi, type AdminPlatform as T } from '../../api/admin';
import { DataTable, MetricCard, MetricGroup } from '../../components/data/DataComponents';
import { LoadingState, ErrorState } from '../../components/state/StateComponents';
import { PlatformBadge, StatusBadge } from '../../components/ui/Badges';

export function AdminPlatform() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    adminApi.platform()
      .then((d) => { if (active) { setData(d); setError(null); } })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const healthBadge = (h: string) =>
    h === 'healthy' ? <StatusBadge status="positive" label="HEALTHY" /> :
    h === 'degraded' ? <StatusBadge status="warning" label="DEGRADED" /> :
    <StatusBadge status="critical" label="DOWN" />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h3 style={{ margin: 0 }}>Platform Operations</h3>
        <PlatformBadge />
      </div>
      <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-ink-secondary)' }}>
        Governed health / HA / DR / telemetry / performance. No SLOs or health scores are
        invented.
      </p>

      <MetricGroup label="HA">
        <MetricCard label="Nodes" value={data.ha.nodeCount} />
        <MetricCard label="Coordinator" value={null} />
      </MetricGroup>
      <p style={{ marginTop: 8, fontSize: 13 }}>
        Coordinator: <strong>{data.ha.coordinator ?? 'unavailable'}</strong>
      </p>

      <h4 style={{ marginTop: 20, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-secondary)' }}>
        Node health
      </h4>
      <DataTable
        columns={[
          { key: 'n', header: 'Node', render: (r) => r.nodeId },
          { key: 'h', header: 'Health', render: (r) => healthBadge(r.health) },
        ]}
        rows={data.nodes}
        emptyLabel="No nodes registered"
      />

      <h4 style={{ marginTop: 24, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-secondary)' }}>
        DR / backup
      </h4>
      <DataTable
        columns={[
          { key: 'b', header: 'Backup', render: (r) => r.backupId },
          { key: 'l', header: 'Lineage', render: (r) => r.lineage },
          { key: 's', header: 'Snapshots', render: (r) => r.snapshotCount },
        ]}
        rows={data.dr}
        emptyLabel="No DR backup records available"
      />

      <h4 style={{ marginTop: 24, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-secondary)' }}>
        Telemetry (recent)
      </h4>
      <DataTable
        columns={[
          { key: 't', header: 'Trace', render: (r) => r.traceId },
          { key: 'e', header: 'Event', render: (r) => r.event },
          { key: 'n', header: 'Node', render: (r) => r.nodeId ?? '—' },
        ]}
        rows={data.telemetry}
        emptyLabel="No telemetry available"
      />

      <h4 style={{ marginTop: 24, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-secondary)' }}>
        Performance (governed measurement)
      </h4>
      {data.performance ? (
        <MetricGroup label="Measured">
          <MetricCard label="Throughput /s" value={data.performance.throughputPerSec} />
          <MetricCard label="p50 ms" value={data.performance.p50Ms} />
          <MetricCard label="p95 ms" value={data.performance.p95Ms} />
          <MetricCard label="Executions" value={data.performance.executions} />
        </MetricGroup>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--color-ink-secondary)' }}>Performance measurement unavailable.</p>
      )}
    </div>
  );
}
