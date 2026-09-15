/**
 * D89 — shared governed "data mode unavailable" surface.
 *
 * Authority: D88 = A. Rendered whenever a mode-aware market-data route returns a governed
 * degraded response (LIVE_UNAVAILABLE / PIT_UNAVAILABLE) instead of certified SNAPSHOT data.
 *
 * ⚠ Renders the SERVER's own `reason`, `dependency` and `transportSemantics` VERBATIM. It shows
 *   no zeroed metrics and no placeholder figures — an empty data shell would be a functional
 *   pass and a governance failure, discarding exactly the honesty D85/D88 established.
 *
 * ⚠ Reuses the existing `UnavailableState`; it introduces no new state vocabulary.
 */
import type { DegradedData } from '../../api/dataMode';
import { UnavailableState } from './StateComponents';

export function DataModeUnavailable({ data, title }: { data: DegradedData; title: string }) {
  return (
    <section aria-label={`${title} unavailable`} data-testid="data-mode-unavailable">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>{title}</h1>
          <code data-testid="data-mode-unavailable-mode" style={{ fontSize: 13 }}>{data.dataMode}</code>
        </div>
      </header>

      <UnavailableState reason={data.reason} />

      <p data-testid="data-mode-unavailable-dependency" style={{ color: 'var(--color-ink-secondary)', margin: '12px 0 0', fontSize: 13 }}>
        Blocking dependency: {data.dependency}
      </p>
      <p data-testid="data-mode-unavailable-semantics" style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 12 }}>
        {data.provenance.transportSemantics}
      </p>
    </section>
  );
}
