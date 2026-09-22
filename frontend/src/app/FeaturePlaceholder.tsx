/**
 * IIPS — Honest placeholder surface (Phase-1A).
 *
 * Renders an explicit "not implemented" statement for navigation entries that exist in the
 * governed navigation model but have NO implementation on the BI-authoritative base.
 *
 * ══ WHY THIS EXISTS (AC-12) ══════════════════════════════════════════════════════════════
 *  The historical full-IIPS application implemented these surfaces against a server tier
 *  (authFetch -> /api/* -> frontend/server/**) that is excluded from the current
 *  application by authority decision. Mounting an empty-but-styled surface, or silently
 *  routing to a blank page, would imply functionality that does not exist.
 *
 *  This component therefore states plainly that the surface is declared-but-not-implemented,
 *  and names the reason. It fabricates no data, performs no fetch, and claims no capability.
 *
 * Governed under: AD-01..AD-18 / Phase-1A Authority Decision
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */
export interface FeaturePlaceholderProps {
  /** Human-facing surface name, e.g. "Research". */
  surface: string;
}

export function FeaturePlaceholder({ surface }: FeaturePlaceholderProps) {
  return (
    <section className="app-placeholder" aria-labelledby="placeholder-heading">
      <h2 id="placeholder-heading" className="app-placeholder__title">
        {surface}
      </h2>
      <p className="app-placeholder__status">
        <span className="app-placeholder__badge">Not implemented</span>
      </p>
      <p className="app-placeholder__body">
        This surface is declared in the governed navigation model but has no implementation
        in the current application. It is not available offline and no data is shown.
      </p>
      <p className="app-placeholder__body app-placeholder__body--muted">
        A navigation entry does not indicate that a product module exists.
      </p>
    </section>
  );
}
