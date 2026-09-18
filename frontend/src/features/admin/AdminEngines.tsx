/**
 * Program v3.0 — Phase 12.1: Engine Registry & Certification (read-only).
 *
 * Exposes governed engine identity/manifest + certification/trust status. The UI cannot modify
 * engine methodology; no certification/revocation mutation is exposed in Phase 12.1.
 */
import { useEffect, useState } from 'react';
import { adminApi, type AdminEngines as E, type AdminCertification as C } from '../../api/admin';
import { DataTable } from '../../components/data/DataComponents';
import { LoadingState, ErrorState } from '../../components/state/StateComponents';
import { PlatformBadge, StatusBadge } from '../../components/ui/Badges';

export function AdminEngines() {
  const [engines, setEngines] = useState<E | null>(null);
  const [cert, setCert] = useState<C | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([adminApi.engines(), adminApi.certification()])
      .then(([e, c]) => { if (active) { setEngines(e); setCert(c); setError(null); } })
      .catch((err) => { if (active) setError(String(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!engines || !cert) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h3 style={{ margin: 0 }}>Engines &amp; Certification</h3>
        <PlatformBadge />
      </div>
      <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-ink-secondary)' }}>
        Governed engine registry. Read-only — engine methodology cannot be modified here.
      </p>

      <h4 style={{ marginTop: 16, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-secondary)' }}>
        Engine registry
      </h4>
      <DataTable
        columns={[
          { key: 'id', header: 'Engine', render: (r) => <strong>{r.engineId}</strong> },
          { key: 'sector', header: 'Sector', render: (r) => r.sectorFamily },
          { key: 'ver', header: 'Version', render: (r) => r.engineVersion },
          { key: 'sec', header: 'Sec', render: (r) => r.secVersion },
          { key: 'caps', header: 'Capabilities', render: (r) => r.capabilities.join(', ') },
        ]}
        rows={engines.engines}
        emptyLabel="No engines registered"
      />

      <h4 style={{ marginTop: 24, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-secondary)' }}>
        Certification status
      </h4>
      <DataTable
        columns={[
          { key: 'id', header: 'Plugin', render: (r) => r.pluginId },
          { key: 'trust', header: 'Trust', render: (r) => r.trustState },
          { key: 'cert', header: 'Certified', render: (r) => (r.certified ? <StatusBadge status="positive" label="CERTIFIED" /> : <StatusBadge status="neutral" label="NOT CERTIFIED" />) },
          { key: 'black', header: 'Blacklisted', render: (r) => (r.blacklisted ? <StatusBadge status="critical" label="YES" /> : 'no') },
          { key: 'det', header: 'Determinism verified', render: (r) => (r.determinismVerified ? 'yes' : 'no') },
        ]}
        rows={cert.records}
        emptyLabel="No certification records available"
      />
    </div>
  );
}
