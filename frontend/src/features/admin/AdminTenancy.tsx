/**
 * Program v3.0 — Phase 12.1: Tenants (read-only).
 *
 * Exposes active tenant context + tenant isolation status via the governed isTenantResource.
 * Tenant context is platform-validated; never inferred from URL/state. No tenant CRUD exists.
 */
import { useEffect, useState } from 'react';
import { adminApi, type AdminTenancy as T } from '../../api/admin';
import { DataTable, MetricCard, MetricGroup } from '../../components/data/DataComponents';
import { LoadingState, ErrorState } from '../../components/state/StateComponents';
import { PlatformBadge, StatusBadge } from '../../components/ui/Badges';

export function AdminTenancy() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    adminApi.tenancy()
      .then((d) => { if (active) { setData(d); setError(null); } })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h3 style={{ margin: 0 }}>Tenancy</h3>
        <PlatformBadge />
      </div>
      <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-ink-secondary)' }}>
        Tenant authority: <strong>{data.tenantAuthority}</strong>. Active tenant context only;
        tenant CRUD / configuration / quotas are unavailable (no governed contract).
      </p>

      <MetricGroup label="Active principal">
        <MetricCard label="User" value={null} />
        <MetricCard label="Tenant" value={null} />
        <MetricCard label="Roles" value={data.principal.roles.length} />
      </MetricGroup>
      <p style={{ marginTop: 8, fontSize: 13 }}>
        <strong>{data.principal.userId}</strong> · tenant <strong>{data.principal.tenantId}</strong>{' '}
        · roles: {data.principal.roles.join(', ')}
      </p>

      <h4 style={{ marginTop: 20, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-secondary)' }}>
        Tenant isolation status
      </h4>
      <DataTable
        columns={[
          { key: 'res', header: 'Resource tenant', render: (r) => r.resourceTenant },
          { key: 'st', header: 'Access', render: (r) => (r.allowed ? <StatusBadge status="positive" label="ALLOW" /> : <StatusBadge status="negative" label="DENY" />) },
        ]}
        rows={data.tenantIsolation}
        emptyLabel="No tenant isolation reference available"
      />
    </div>
  );
}
