/**
 * UI08 — REPORTS (first-class governed surface).
 *
 * Authority: D82 (UI08 Reports recovery), authorized by D82-R1.
 * Requirement: `docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md` **INT-012** and
 *              `docs/d4/D4_03_UI_BASELINE.md` "UI08 Reports — EXTEND":
 *              reuse `PortfolioReport`; templates + generation UI + **PIT reproducibility**;
 *              validation = historical/PIT reproducibility; lineage; source/timestamp.
 *
 * Route: /reports (viewer+ may READ; generation/deletion require analyst-and-above, server-enforced).
 *
 * ⚠ RECOVERY NOTE. `docs/P13_UI_SURFACE_COMPONENT_RECONCILIATION.md` recorded UI08 as
 *   "Current Component: NONE (embedded in UI01)… Implemented elsewhere". That was inaccurate:
 *   INT-012 records "No Reports UI", and `PortfolioReport`/`ReportingEngine` had ZERO references
 *   in frontend/server or frontend/src. The historical record is NOT edited — it is corrected by
 *   addition in the D82 governance record.
 *
 * ⚠ PIT SCOPE — stated, never amplified. Stored reports pin dataVersion/asOf/mode and re-open
 *   byte-identically (hash-verified). Regeneration is byte-identical only against the SAME
 *   pinned vintage. Arbitrary historical as-of regeneration is UNAVAILABLE while historical
 *   governed vintages are absent (R-2). No historical vintage is fabricated. The limitation is
 *   rendered on this surface rather than hidden.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  deleteReport,
  fetchReports,
  generateReport,
  type ReportType,
  type ReportView,
  type ReportsProvenance,
} from '../../api/reports';
import { LoadingState, ErrorState, EmptyState } from '../../components/state/StateComponents';

/** Render the byte-identity facts without pass/fail colour — these are statements, not verdicts. */
function Reproducibility({ report }: { report: ReportView }) {
  const reg = report.regeneration;
  return (
    <span data-testid={`repro-${report.reportId}`}>
      stored: {report.storedIntegrityVerified ? 'byte-identical (hash verified)' : 'INTEGRITY MISMATCH'}
      {reg !== null && (
        <>
          {' · '}
          {reg.sameVintage
            ? `same-vintage regeneration: ${reg.byteIdentical ? 'byte-identical' : 'DIFFERS'}`
            : 'regeneration: not comparable (different vintage)'}
        </>
      )}
    </span>
  );
}

export function Reports() {
  const [reports, setReports] = useState<readonly ReportView[] | null>(null);
  const [templates, setTemplates] = useState<readonly ReportType[]>([]);
  const [provenance, setProvenance] = useState<ReportsProvenance | null>(null);
  const [selected, setSelected] = useState<ReportType | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const env = await fetchReports();
      setReports(env.data);
      setTemplates(env.templates);
      setProvenance(env.provenance);
      if (env.templates.length > 0) setSelected((s) => (s === '' ? env.templates[0] : s));
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function run(fn: () => Promise<void>): Promise<void> {
    try { await fn(); await load(); } catch (e: unknown) { setError(String(e)); }
  }

  if (loading) return <LoadingState />;
  if (error !== null && reports === null) return <ErrorState message={error} />;

  const limitation = reports?.[0]?.pitLimitation ?? null;

  return (
    <section data-testid="reports-surface">
      <h1 style={{ fontSize: 22, margin: 0 }}>Reports</h1>
      <p style={{ color: 'var(--color-ink-secondary)', fontSize: 13, margin: '6px 0 0' }}>
        Generate governed portfolio reports from the certified templates. Each report pins the
        data vintage it was built from. Your reports only.
      </p>

      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select
          data-testid="report-template"
          value={selected}
          onChange={(e) => setSelected(e.target.value as ReportType)}
        >
          {templates.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          type="button"
          data-testid="report-generate"
          disabled={selected === ''}
          onClick={() => { void run(() => generateReport(selected as ReportType)); }}
        >
          Generate report
        </button>
      </div>

      {error !== null && <p data-testid="reports-error" style={{ fontSize: 13 }}>{error}</p>}

      {reports !== null && reports.length === 0 && <EmptyState label="No reports generated yet" />}

      {(reports ?? []).map((r) => (
        <article
          key={r.reportId}
          data-testid={`report-${r.reportId}`}
          style={{ marginTop: 20, border: '1px solid var(--color-border)', borderRadius: 6, padding: 12 }}
        >
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>{r.reportType}</h2>
            <span style={{ fontSize: 12, color: 'var(--color-ink-secondary)' }}>{r.portfolioId}</span>
            <button
              type="button"
              data-testid={`report-delete-${r.reportId}`}
              onClick={() => { void run(() => deleteReport(r.reportId)); }}
            >
              Delete
            </button>
          </header>

          {/* PIT pinning — the vintage this report was built from. */}
          <p data-testid={`pit-${r.reportId}`} style={{ fontSize: 12, margin: '8px 0 0' }}>
            as of <code>{r.pitPinning.asOf}</code> · data version <code>{r.pitPinning.dataVersion}</code> ·{' '}
            {r.pitPinning.mode}
          </p>

          {/* Lineage: source + timestamp on the stored figures. */}
          <p data-testid={`lineage-${r.reportId}`} style={{ fontSize: 12, color: 'var(--color-ink-secondary)', margin: '4px 0 0' }}>
            source {r.lineage.dataSource} · {r.lineage.classification} · generated {r.lineage.generatedAt} ·
            snapshots {r.lineage.contributingSnapshotIds.join(', ') || 'none'}
          </p>

          <p style={{ fontSize: 12, color: 'var(--color-ink-secondary)', margin: '4px 0 0' }}>
            <Reproducibility report={r} /> · hash <code>{r.payloadHash}</code>
          </p>

          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 13, cursor: 'pointer' }}>Report content</summary>
            <pre data-testid={`body-${r.reportId}`} style={{ fontSize: 12, overflowX: 'auto' }}>
              {JSON.stringify(r.reportBody, null, 2)}
            </pre>
          </details>
        </article>
      ))}

      {limitation !== null && (
        <p data-testid="reports-pit-limitation" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 20 }}>
          <strong>Point-in-time scope.</strong> {limitation.pinAndStore} {limitation.sameVintageRegeneration}{' '}
          <strong>Historical as-of regeneration:</strong> {limitation.historicalAsOf}
        </p>
      )}

      {provenance !== null && (
        <p data-testid="reports-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 8 }}>
          {provenance.dataSource} · as of {provenance.asOf} · {provenance.mode}
        </p>
      )}
    </section>
  );
}

export default Reports;
