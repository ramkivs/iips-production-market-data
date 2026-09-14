/**
 * Program v3.0 — Phase 12.2: Live Data & Data Governance (read-only) + Data Classification
 * (the ONLY governed mutation authorized in Phase 12.2).
 *
 * Read surface: live-data source/freshness/quality/lineage + data-governance ownership/classification.
 * Mutation surface: reclassify an existing tenant-owned governed resource. The classification
 * vocabulary is the governed enum (public | internal | confidential | restricted) — consumed
 * verbatim from the contract, never invented. The flow is a consequential-operation confirmation
 * (preview → explicit confirm), never a bare "Save". React does NOT determine policy/tenant/
 * permission; the server (SecuredExecutor → EnterpriseRuntime → tenant ownership → classify →
 * audit) is authoritative.
 *
 * NOTE: governed state shown here is LOCAL / NON-PERSISTENT reference state (see transport note).
 */
import { useEffect, useState } from 'react';
import {
  adminApi, classifyData, GOVERNED_CLASSIFICATIONS, type AdminLiveData as L,
  type AdminDataGovernance as G, type GovernedDataRef, type GovernedClassification,
} from '../../api/admin';
import { DataTable } from '../../components/data/DataComponents';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents';
import { PlatformBadge, StatusBadge } from '../../components/ui/Badges';

export function AdminData() {
  const [live, setLive] = useState<L | null>(null);
  const [gov, setGov] = useState<G | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<GovernedDataRef | null>(null);
  const [draft, setDraft] = useState<GovernedClassification | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationResult, setMutationResult] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([adminApi.liveData(), adminApi.dataGovernance()])
      .then(([l, g]) => { setLive(l); setGov(g); setError(null); })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!live || !gov) return null;

  const beginClassify = (row: GovernedDataRef) => {
    if (row.immutable) return; // immutable/frozen governed data cannot be reclassified
    setSelected(row);
    setDraft(null);
    setConfirming(false);
    setMutationError(null);
    setMutationResult(null);
  };

  const confirmAndMutate = () => {
    if (!selected || !draft) return;
    setMutating(true);
    setMutationError(null);
    setMutationResult(null);
    classifyData({ dataId: selected.dataId, classification: draft })
      .then((result) => {
        setGov((prev) => prev ? { ...prev, data: prev.data.map((d) => d.dataId === result.data.dataId ? result.data : d) } : prev);
        setMutationResult(`Classification updated for ${result.data.dataId}`);
        setConfirming(false);
        setSelected(null);
        setDraft(null);
      })
      .catch((e) => { setMutationError(String(e)); setConfirming(false); })
      .finally(() => setMutating(false));
  };

  const classificationBadge = (c: string) => {
    const st = c === 'restricted' ? 'critical' : c === 'confidential' ? 'warning' : c === 'internal' ? 'informational' : 'positive';
    return <StatusBadge status={st} label={c.toUpperCase()} />;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h3 style={{ margin: 0 }}>Live Data &amp; Data Governance</h3>
        <PlatformBadge />
      </div>
      <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-ink-secondary)' }}>{live.note}</p>

      <h4 style={{ marginTop: 12, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-secondary)' }}>
        Live data sources
      </h4>
      <DataTable
        columns={[
          { key: 'p', header: 'Provider', render: (r) => r.provider },
          { key: 'v', header: 'Data version', render: (r) => r.dataVersion },
          { key: 'asof', header: 'As of', render: (r) => r.asOf },
          { key: 'q', header: 'Quality', render: (r) => (r.quality === 'good' ? <StatusBadge status="positive" label="GOOD" /> : <StatusBadge status="warning" label={r.quality.toUpperCase()} />) },
          { key: 'c', header: 'Completeness', render: (r) => `${r.completenessPct}%` },
        ]}
        rows={live.sources}
        emptyLabel="No live data sources available"
      />

      <h4 style={{ marginTop: 24, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-secondary)' }}>
        Governed data — classification
      </h4>
      <p style={{ fontSize: 12, color: 'var(--color-ink-secondary)', marginTop: 0 }}>
        Classification vocabulary (governed): {GOVERNED_CLASSIFICATIONS.join(' · ')}. Only mutable,
        tenant-owned governed data can be reclassified. Frozen (immutable) resources are read-only.
      </p>
      <DataTable
        columns={[
          { key: 'id', header: 'Data ID', render: (r) => r.dataId },
          { key: 't', header: 'Tenant', render: (r) => r.tenantId },
          { key: 'c', header: 'Classification', render: (r) => classificationBadge(r.classification) },
          { key: 'reg', header: 'Region', render: (r) => r.region },
          { key: 'ret', header: 'Retention (days)', render: (r) => r.retentionDays },
          { key: 'imm', header: 'Immutable', render: (r) => (r.immutable ? 'yes (frozen)' : 'no') },
          { key: 'act', header: 'Action', render: (r) => (
            <button disabled={r.immutable} onClick={() => beginClassify(r)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'var(--color-surface-1)', cursor: r.immutable ? 'not-allowed' : 'pointer' }}>
              {r.immutable ? 'Frozen' : 'Reclassify'}
            </button>
          ) },
        ]}
        rows={gov.data}
        emptyLabel="No governed data available for this tenant"
      />

      {selected && !confirming && (
        <div data-testid="classify-preview" style={{ marginTop: 16, border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-1)' }}>
          <strong>Reclassify governed resource</strong>
          <dl style={{ fontSize: 13, margin: '8px 0 12px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px' }}>
            <dt>Resource</dt><dd data-testid="preview-resource">{selected.dataId}</dd>
            <dt>Tenant</dt><dd data-testid="preview-tenant">{selected.tenantId}</dd>
            <dt>Current</dt><dd>{classificationBadge(selected.classification)}</dd>
            <dt>Requested</dt><dd>{draft ? classificationBadge(draft) : '— select below'}</dd>
            <dt>Action</dt><dd>data.classify (governed)</dd>
            <dt>Audit</dt><dd>This operation will be audited (governed EnterpriseRuntime audit).</dd>
            <dt>Risk</dt><dd>MEDIUM — classification change affects data access/export policy.</dd>
          </dl>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>New classification (governed vocabulary)</label>
          <select
            aria-label="New classification"
            value={draft ?? ''}
            onChange={(e) => setDraft(e.target.value as GovernedClassification)}
            style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'var(--color-surface-1)' }}
          >
            <option value="" disabled>Select classification</option>
            {GOVERNED_CLASSIFICATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={() => setConfirming(true)} disabled={!draft || mutating} style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              Review &amp; Confirm
            </button>
            <button onClick={() => { setSelected(null); setDraft(null); }} disabled={mutating} style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'var(--color-surface-1)', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {selected && confirming && (
        <div data-testid="classify-confirm" style={{ marginTop: 16, border: '1px solid var(--color-status-warning)', borderRadius: 6, padding: 16, background: 'var(--color-surface-1)' }}>
          <strong>Confirm Classification Change</strong>
          <p style={{ fontSize: 13, margin: '8px 0' }}>
            You are about to change the classification of <strong>{selected.dataId}</strong> (tenant{' '}
            <strong>{selected.tenantId}</strong>) from <strong>{selected.classification}</strong> to{' '}
            <strong>{draft}</strong>. This is a governed mutation and will be audited. It affects data
            access/export policy. Confirm to proceed.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button data-testid="confirm-classify" onClick={confirmAndMutate} disabled={mutating} style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid var(--color-status-warning)', background: 'var(--color-status-warning)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              {mutating ? 'Applying…' : 'Confirm Classification Change'}
            </button>
            <button onClick={() => { setConfirming(false); }} disabled={mutating} style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'var(--color-surface-1)', cursor: 'pointer' }}>
              Back
            </button>
          </div>
        </div>
      )}

      {mutationError && <div data-testid="classify-error" role="alert" style={{ marginTop: 12, color: 'var(--color-status-negative)', fontSize: 13 }}>{mutationError}</div>}
      {mutationResult && <div data-testid="classify-success" role="status" style={{ marginTop: 12, color: 'var(--color-status-positive)', fontSize: 13 }}>{mutationResult}</div>}

      <h4 style={{ marginTop: 24, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-secondary)' }}>
        Unavailable / read-only operations
      </h4>
      <UnavailableState reason="Other mutations remain platform-only / unavailable" />
    </div>
  );
}
