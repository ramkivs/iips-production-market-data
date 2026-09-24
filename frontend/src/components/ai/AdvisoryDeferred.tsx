/**
 * IIPS — Advisory placeholder for the Company / Sector Intelligence surfaces (Prompt 2C).
 *
 * ══ THIS IS NOT AN AI ADVISORY IMPLEMENTATION ═══════════════════════════════════════════════
 *  AI Advisory is explicitly OUT OF SCOPE for this gate. Nothing here reconstructs it.
 *  Specifically, this component:
 *    · makes NO network request of any kind (no `fetch`, no `authFetch`, no `/api/ai-advisory`);
 *    · holds NO advisory data and renders NO advisory field;
 *    · reconstructs NO authentication/authorization tier (the governed advisory transport is
 *      `guardRead`-authorized; that tier is deliberately NOT rebuilt and NOT bypassed);
 *    · invents NO provider output, NO model name, NO advice id, NO "grounded" flag.
 *
 *  It exists solely to preserve the DOCUMENTED DEFERRED STATE in the space the donor's advisory
 *  panel occupied, so neither surface silently omits a governance obligation or implies that
 *  advisory is active. It uses the canonical `UnavailableState` — the same honest state the
 *  rest of the platform uses for "genuinely absent", never a fabricated one.
 *
 * ══ PARITY CONSEQUENCE (recorded, not hidden) ═══════════════════════════════════════════════
 *  The donor surfaces rendered an embedded advisory panel contributing these observable
 *  `data-testid` keys: `ai-explanation`, `badge-ai`, `ai-explanation-label`,
 *  `ai-explanation-text`, `ai-explanation-fields`, `ai-explanation-ref`,
 *  `ai-explanation-unavailable`, `status-positive`. Those keys are therefore NOT recoverable
 *  in this gate, and the E2E-018 captures recorded `advisoryState: 'rendered'`. Parity is
 *  reported as PARTIALLY VERIFIED with this exact, enumerated shortfall — the advisory panel
 *  is the ONE remaining parity dependency, and it requires its own authorized gate.
 *
 * Authority: Prompt 2C scope §"AI ADVISORY" (do not implement or reconstruct).
 */
import { UnavailableState } from '../state/StateComponents.js';

export interface AdvisoryDeferredProps {
  /** The host surface's own sector key — carried for context only; never sent anywhere. */
  readonly sectorKey: string;
}

export function AdvisoryDeferred({ sectorKey }: AdvisoryDeferredProps) {
  return (
    <section
      data-testid="advisory-deferred"
      aria-label="AI explanation deferred"
      data-sector-key={sectorKey}
      className="app-surface__block"
    >
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 className="app-surface__subtitle" style={{ margin: 0 }}>AI Explanation</h2>
      </header>
      {/*
        The canonical unavailable state — a distinct meaning from failure. No advisory value,
        no model identity, no grounding claim is rendered, because none is available.
      */}
      <div data-testid="advisory-deferred-unavailable" style={{ marginTop: 8 }}>
        <UnavailableState reason="AI explanation deferred by authority" />
      </div>
      <p style={{ fontSize: 13, color: 'var(--color-ink-secondary)', marginTop: 8 }}>
        The AI explanation panel is deferred under the current authority: the governed advisory
        transport is authorization-bound and the identity tier is not active. No explanation is
        generated, inferred or substituted, and AI is never a decision authority. Sector key:{' '}
        <code>{sectorKey}</code>.
      </p>
    </section>
  );
}
