/**
 * Program v3.0 — Phase 12.1: Administration shell.
 *
 * Read-first governed administration with narrowly scoped platform-authorized mutations —
 * Phase 12.1 exposes the READ surfaces only. Each tab is a read-only governed surface.
 * React is not an authorization authority; the server enforces admin-only via the G3 boundary.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PermissionDeniedState } from '../../components/state/StateComponents';
import { useTabList } from '../../components/interaction/useTabList';
import { AdminOverview } from './AdminOverview';
import { AdminIdentity } from './AdminIdentity';
import { AdminTenancy } from './AdminTenancy';
import { AdminEngines } from './AdminEngines';
import { AdminPlatform } from './AdminPlatform';
import { AdminAudit } from './AdminAudit';
import { AdminData } from './AdminData';
import { AdminOperations } from './AdminOperations';

const TABS = [
  { id: 'overview', label: 'Overview', node: <AdminOverview /> },
  { id: 'identity', label: 'Identity & Access', node: <AdminIdentity /> },
  { id: 'tenancy', label: 'Tenants', node: <AdminTenancy /> },
  { id: 'engines', label: 'Engines & Certification', node: <AdminEngines /> },
  { id: 'platform', label: 'Platform Operations', node: <AdminPlatform /> },
  { id: 'audit', label: 'Audit', node: <AdminAudit /> },
  { id: 'data', label: 'Live Data & Governance', node: <AdminData /> },
  { id: 'operations', label: 'Migration / Workflow / Marketplace', node: <AdminOperations /> },
] as const;

export function Administration() {
  const [active, setActive] = useState<string>('overview');
  const tabIds = TABS.map((t) => t.id);
  const activeIndex = TABS.findIndex((t) => t.id === active);
  const { tabProps, onKeyDown, idFor, panelIdFor } = useTabList(tabIds, active, setActive);

  // Milestone N+1: deep-linking. The route is /admin/* (splat); a child link like
  // /admin/engines selects the matching tab. Unknown segments fall back to Overview.
  // Presentation-only — the server remains the authorization authority.
  const { '*': splat } = useParams();
  useEffect(() => {
    if (splat && TABS.some((t) => t.id === splat)) setActive(splat);
  }, [splat]);

  // The SERVER enforces admin access (403 otherwise). When a governed API call returns
  // 403, the transport dispatches iips:auth:forbidden and this surface renders the
  // governed denial UI. React is NOT the authority — it only reflects the server decision.
  const [serverDenied, setServerDenied] = useState(false);

  useEffect(() => {
    function onForbidden(): void {
      setServerDenied(true);
    }
    window.addEventListener('iips:auth:forbidden', onForbidden);
    return () => window.removeEventListener('iips:auth:forbidden', onForbidden);
  }, []);

  if (serverDenied) return <PermissionDeniedState />;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Administration</h2>
      <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-ink-secondary)' }}>
        Read-first governed administration. Surfaces shown are those with an existing governed
        v2.0 contract. Unavailable capabilities are intentionally not presented as editable.
      </p>
      <div role="tablist" aria-label="Administration sections" onKeyDown={onKeyDown} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            {...tabProps(t.id, i)}
            aria-controls={panelIdFor(i)}
            style={{
              padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: 4,
              background: active === t.id ? 'var(--color-accent)' : 'var(--color-surface-1)',
              color: active === t.id ? '#fff' : 'var(--color-ink)', cursor: 'pointer', fontWeight: 600,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={panelIdFor(activeIndex)} aria-labelledby={idFor(activeIndex)} tabIndex={0}>
        {TABS.find((t) => t.id === active)?.node}
      </div>
    </div>
  );
}
