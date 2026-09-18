/**
 * Program v3.0 — Phase 12.1: Audit (read-only).
 *
 * Governed audit viewer over EnterpriseRuntime.auditLog (in-memory). Presentational filter/sort
 * only. No second audit system; no persistent audit store is invented.
 */
import { useEffect, useMemo, useState } from 'react';
import { adminApi, type AdminAudit as T } from '../../api/admin';
import { DataTable } from '../../components/data/DataComponents';
import { LoadingState, ErrorState } from '../../components/state/StateComponents';
import { PlatformBadge, StatusBadge } from '../../components/ui/Badges';

export function AdminAudit() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [denyOnly, setDenyOnly] = useState(false);

  useEffect(() => {
    let active = true;
    adminApi.audit()
      .then((d) => { if (active) { setData(d); setError(null); } })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    let r = data.records;
    if (denyOnly) r = r.filter((x) => !x.allowed);
    return r;
  }, [data, denyOnly]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h3 style={{ margin: 0 }}>Audit</h3>
        <PlatformBadge />
      </div>
      <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-ink-secondary)' }}>
        {data.scope}
      </p>

      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 10 }}>
        <input type="checkbox" checked={denyOnly} onChange={(e) => setDenyOnly(e.target.checked)} />
        Show denied only
      </label>

      <DataTable
        columns={[
          { key: 'id', header: 'Audit ID', render: (r) => r.auditId },
          { key: 'u', header: 'Actor', render: (r) => r.userId },
          { key: 't', header: 'Tenant', render: (r) => r.tenantId },
          { key: 'a', header: 'Action', render: (r) => r.action },
          { key: 'r', header: 'Resource', render: (r) => r.resource },
          { key: 'ok', header: 'Result', render: (r) => (r.allowed ? <StatusBadge status="positive" label="ALLOW" /> : <StatusBadge status="negative" label="DENY" />) },
          { key: 'at', header: 'Timestamp', render: (r) => r.at },
        ]}
        rows={rows}
        emptyLabel="No audit records available"
      />
    </div>
  );
}
