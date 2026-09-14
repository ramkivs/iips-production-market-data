/**
 * Program v3.0 — Phase 12.1: Migration / Workflow / Marketplace (read-only).
 *
 * Governed migration history, workflow definitions (read), and marketplace/module registry
 * (read). No mutation controls exposed in Phase 12.1.
 */
import { useEffect, useState } from 'react';
import { adminApi, type AdminMigration as M, type AdminWorkflow as W, type AdminMarketplace as K } from '../../api/admin';
import { DataTable } from '../../components/data/DataComponents';
import { LoadingState, ErrorState } from '../../components/state/StateComponents';
import { PlatformBadge, StatusBadge } from '../../components/ui/Badges';
import { WorkflowDefinitionPanel } from './WorkflowDefinitionPanel';

export function AdminOperations() {
  const [migration, setMigration] = useState<M | null>(null);
  const [workflow, setWorkflow] = useState<W | null>(null);
  const [marketplace, setMarketplace] = useState<K | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([adminApi.migration(), adminApi.workflow(), adminApi.marketplace()])
      .then(([m, w, k]) => { if (active) { setMigration(m); setWorkflow(w); setMarketplace(k); setError(null); } })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!migration || !workflow || !marketplace) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h3 style={{ margin: 0 }}>Migration · Workflow · Marketplace</h3>
        <PlatformBadge />
      </div>
      <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-ink-secondary)' }}>
        Read-only. Migration execution/rollback, workflow approvals/editing, and marketplace
        activation are unavailable (no governed mutation exposed).
      </p>

      <h4 style={{ marginTop: 16, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-secondary)' }}>
        Migration history
      </h4>
      <DataTable
        columns={[
          { key: 'id', header: 'Migration', render: (r) => r.migrationId },
          { key: 's', header: 'Source', render: (r) => r.source },
          { key: 't', header: 'Target', render: (r) => r.target },
          { key: 'snap', header: 'Snapshot', render: (r) => r.snapshotId },
          { key: 'cv', header: 'Contract', render: (r) => r.contractVersion },
        ]}
        rows={migration.migrations}
        emptyLabel="No migration history available"
      />

      <WorkflowDefinitionPanel workflow={workflow} />

      <h4 style={{ marginTop: 24, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-secondary)' }}>
        Marketplace / modules (read-only)
      </h4>
      <DataTable
        columns={[
          { key: 'id', header: 'Module', render: (r) => r.pluginId },
          { key: 'trust', header: 'Trust', render: (r) => r.trustState },
          { key: 'cert', header: 'Certified', render: (r) => (r.certified ? <StatusBadge status="positive" label="CERTIFIED" /> : <StatusBadge status="neutral" label="NOT CERTIFIED" />) },
          { key: 'black', header: 'Blacklisted', render: (r) => (r.blacklisted ? <StatusBadge status="critical" label="YES" /> : 'no') },
        ]}
        rows={marketplace.modules}
        emptyLabel="No modules registered"
      />
    </div>
  );
}
