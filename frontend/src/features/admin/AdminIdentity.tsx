/**
 * Program v3.0 — Phase 12.1: Identity & Access (read-only).
 *
 * Exposes the governed identity/access model that ACTUALLY exists: current Principal context,
 * tenant, roles, and the governed Roles & Permissions reference (ROLE_POLICY). Clearly
 * distinguishes Keycloak identity (WHO) from IIPS authorization policy (WHAT MAY THEY DO).
 * No fake Users table — the platform has no user directory.
 */
import { useEffect, useState } from 'react';
import { adminApi, type AdminIdentity as T } from '../../api/admin';
import { DataTable, MetricCard, MetricGroup } from '../../components/data/DataComponents';
import { LoadingState, ErrorState } from '../../components/state/StateComponents';
import { PlatformBadge } from '../../components/ui/Badges';

export function AdminIdentity() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    adminApi.identity()
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
        <h3 style={{ margin: 0 }}>Identity &amp; Access</h3>
        <PlatformBadge />
      </div>
      <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-ink-secondary)' }}>
        Identity authority: <strong>{data.identityAuthority}</strong> · Authorization authority:{' '}
        <strong>{data.authzAuthority}</strong>. This is the governed model only; the platform has
        no user directory, so no user table is shown.
      </p>

      <MetricGroup label="Current Principal">
        <MetricCard label="User" value={null} />
        <MetricCard label="Tenant" value={null} />
        <MetricCard label="Roles" value={data.principal.roles.length} />
      </MetricGroup>
      <p style={{ marginTop: 8, fontSize: 13 }}>
        <strong>{data.principal.userId}</strong> · tenant <strong>{data.principal.tenantId}</strong>{' '}
        · roles: {data.principal.roles.join(', ')}
      </p>

      <h4 style={{ marginTop: 20, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-secondary)' }}>
        Governed roles &amp; permissions reference
      </h4>
      <DataTable
        columns={[
          { key: 'role', header: 'Role', render: (r) => <strong>{r.role}</strong> },
          { key: 'perms', header: 'Permissions (action × resource)', render: (r) => r.permissions.map((p) => `${p.action}:${p.resource}`).join(' · ') || '—' },
        ]}
        rows={data.roles}
        emptyLabel="No governed role reference available"
      />
    </div>
  );
}
