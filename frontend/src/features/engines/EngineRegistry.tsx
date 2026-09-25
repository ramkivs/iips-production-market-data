/**
 * IIPS v3.0 — E2E-026 Engine UI Integration — Engine Registry workspace
 *
 * Verifies: UI → API (/api/engines) → governed EngineRegistry → API response → UI rendering
 * Displays: engineId, sectorFamily, IES, engineVersion, calibration, provenance
 * Handles: loading / success / error / empty (no fabrication)
 *
 * This surface is additive and semantically inert — it maps governed registry fields
 * 1:1. It does not compute scores, reinterpret verdicts, or fabricate versions.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchEngines, type EngineListData } from '../../api/engines.js';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents.js';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges.js';
import { DataTable } from '../../components/data/DataComponents.js';

export function EngineRegistry() {
  const [data, setData] = useState<EngineListData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchEngines()
      .then((d) => { if (active) { setData(d); setError(null); } })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load engine registry: ${error}`} />;
  if (!data) return <UnavailableState />;
  if (data.engines.length === 0) {
    return <UnavailableState />;
  }

  return (
    <section aria-label="Engine registry">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Certified Engine Registry</h1>
          <CertifiedBadge />
          <FreshnessBadge state="snapshot" />
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>
          {data.provenance.source} · {data.provenance.certifiedCount} engines · freshness {data.provenance.freshness}
        </p>
        <p style={{ color: 'var(--color-ink-secondary)', fontSize: 12, margin: '4px 0 0' }}>
          Runtime config: clock={data.provenance.runtimeConfig.clock} · idProvider={data.provenance.runtimeConfig.idProvider} · API {data.apiVersion}
        </p>
      </header>

      <DataTable
        columns={[
          { key: 'engineId', header: 'Engine ID', render: (r: { engineId: string }) => <code>{r.engineId}</code> },
          { key: 'sector', header: 'Sector', render: (r: { sectorFamily: string }) => r.sectorFamily },
          { key: 'ies', header: 'IES', render: (r: { ies: string; iesTitle: string }) => <span title={r.iesTitle}>{r.ies}</span> },
          { key: 'version', header: 'Engine Version', render: (r: { engineVersion: string }) => r.engineVersion },
          { key: 'calibration', header: 'Calibration', render: (r: { calibrationProfile: string }) => <code style={{ fontSize: 12 }}>{r.calibrationProfile}</code> },
          { key: 'capabilities', header: 'Capabilities', render: (r: { capabilities: readonly string[] }) => r.capabilities.join(', ') },
        ]}
        rows={[...data.engines].map((e) => ({
          engineId: e.engineId,
          sectorFamily: e.sectorFamily,
          ies: e.ies,
          iesTitle: e.iesTitle,
          engineVersion: e.engineVersion,
          calibrationProfile: e.calibrationProfile,
          calibrationVersion: e.calibrationVersion,
          capabilities: e.capabilities,
        }))}
        emptyLabel="No certified engines available"
      />

      <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--color-ink-secondary)' }}>Explore a certified result:</span>
        {data.engines.map((e) => (
          <Link key={e.engineId} to={`/research/company/${e.sectorFamily}`} style={{ fontSize: 13 }}>
            {e.sectorFamily} →
          </Link>
        ))}
      </div>

      <p data-testid="engine-registry-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 16 }}>
        {data.provenance.source} · deterministic ({data.provenance.runtimeConfig.clock}/{data.provenance.runtimeConfig.idProvider})
      </p>
    </section>
  );
}
