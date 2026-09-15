/**
 * D85 — UI12 → Portfolio data-mode propagation.
 *
 * Authority: D85 ACCEPT (bounded A–E). Implementation is limited to honouring the authenticated
 * principal's persisted UI12 `defaultDataMode` at the `/api/portfolio` boundary.
 *
 * ══ THE DEFECT BEING CORRECTED ═════════════════════════════════════════════════════════════
 *   UI12 persists `defaultDataMode = LIVE | SNAPSHOT | PIT`, but `/api/portfolio` never read it:
 *   `computeCertifiedPortfolio()` takes NO arguments and always computes from the frozen v1.1
 *   Replay Baseline, labelling the result `freshness: 'SNAPSHOT'`. Selecting LIVE therefore
 *   changed nothing and the user was given baseline data with no indication their request was
 *   not honoured. That is a TRUTHFULNESS defect, not a missing feature.
 *
 * ══ CONTRACT (D85 A–C) ═════════════════════════════════════════════════════════════════════
 *   SNAPSHOT → the EXISTING certified computation and provenance, byte-for-byte unchanged.
 *              This is the ONLY mode that returns Portfolio data.
 *   LIVE     → governed LIVE_UNAVAILABLE degraded state citing R-2.
 *              ⚠ NEVER falls back to SNAPSHOT and NEVER substitutes or fabricates provider data.
 *   PIT      → governed PIT_UNAVAILABLE degraded state, because no PIT capability is wired to
 *              transport. `p08/src/pitStorageModel.js` exports `PIT_CAPABILITY`/`createPitStore`
 *              but has ZERO transport consumers; wiring it is OUT OF SCOPE (D85 §3).
 *
 * ══ BOUNDARIES ═════════════════════════════════════════════════════════════════════════════
 *   ⚠ The mode is read EXCLUSIVELY from the authenticated principal's persisted UI12 settings
 *     journal via the existing `readPreferences`. NO client-supplied mode parameter is accepted,
 *     and settings logic is REUSED, never duplicated (D85 §4, §9).
 *   ⚠ `computeCertifiedPortfolio` is NOT modified — it is invoked unchanged for SNAPSHOT.
 *   ⚠ No provider ingestion, no credentials, no RBAC/executor change, no certified-contract
 *     change, no replay/AD-17 change, no production activation.
 */
import { readPreferences, type DataMode } from '../settings/settings-service';

/** Machine-readable degraded states. Closed set — never coerced to a data-bearing response. */
export const DEGRADED_STATES = Object.freeze(['LIVE_UNAVAILABLE', 'PIT_UNAVAILABLE'] as const);
export type DegradedState = (typeof DEGRADED_STATES)[number];

export interface DegradedPortfolioResponse {
  readonly dataMode: DataMode;
  readonly state: DegradedState;
  /** Always false — this response carries NO portfolio data of any kind. */
  readonly dataAvailable: false;
  readonly holdings: readonly [];
  readonly reason: string;
  readonly dependency: string;
  readonly provenance: {
    readonly dataSource: string;
    readonly freshness: string;
    readonly mode: DataMode;
    readonly transportSemantics: string;
  };
}

const LIVE_REASON =
  'LIVE portfolio data is UNAVAILABLE. Live provider ingestion is not wired to this transport, so no live values exist to return.';
const PIT_REASON =
  'PIT portfolio data is UNAVAILABLE. No point-in-time capability is wired to this transport, so no as-of values exist to return.';

const NO_FALLBACK =
  'This response deliberately contains NO portfolio data. The request is NOT silently served from the frozen v1.1 Replay Baseline, and no provider value is substituted or fabricated. Select SNAPSHOT to receive the certified baseline portfolio.';

/**
 * Build the governed degraded response for a mode that cannot be served.
 *
 * `holdings` is an empty tuple and `dataAvailable` is the literal `false`, so a consumer cannot
 * mistake this for a portfolio payload or silently render stale figures.
 */
export function buildDegradedPortfolio(mode: 'LIVE' | 'PIT'): DegradedPortfolioResponse {
  const isLive = mode === 'LIVE';
  return Object.freeze({
    dataMode: mode,
    state: isLive ? 'LIVE_UNAVAILABLE' : 'PIT_UNAVAILABLE',
    dataAvailable: false as const,
    holdings: Object.freeze([]) as readonly [],
    reason: isLive ? LIVE_REASON : PIT_REASON,
    dependency: isLive
      ? 'R-2 provider ingestion — OPEN and externally blocked (provider selection, licensing, credentials, entitlements).'
      : 'PIT capability exists in p08 but is NOT wired to transport; wiring it is a separate authorized act.',
    provenance: Object.freeze({
      dataSource: 'none — no governed data source is available for this data mode',
      freshness: 'UNAVAILABLE',
      mode,
      transportSemantics: NO_FALLBACK,
    }),
  });
}

/**
 * Resolve the effective portfolio data mode for an authenticated principal.
 *
 * SERVER-DERIVED ONLY: `tenantId` and `ownerUserId` come from the authenticated principal, and
 * the value is read from the UI12 settings journal. A principal who has never saved preferences
 * receives the governed default (SNAPSHOT), preserving today's behaviour exactly.
 */
export function resolvePortfolioDataMode(
  tenantId: string,
  ownerUserId: string,
  store?: Parameters<typeof readPreferences>[2],
): DataMode {
  return readPreferences(tenantId, ownerUserId, store).preferences.defaultDataMode;
}

/**
 * Apply the data-mode contract.
 *
 * @param mode              server-resolved data mode
 * @param computeSnapshot   the EXISTING certified computation, invoked unchanged for SNAPSHOT
 * @returns the unmodified certified payload for SNAPSHOT, otherwise a degraded response
 */
export function portfolioForMode(
  mode: DataMode,
  computeSnapshot: () => unknown,
): unknown {
  if (mode === 'SNAPSHOT') return computeSnapshot();
  return buildDegradedPortfolio(mode);
}
