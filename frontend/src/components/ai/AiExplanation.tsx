/**
 * Program v3.0 — G-AI-IMPL: embedded AI Explanation surface (read-only, non-authoritative).
 *
 * Rendered INSIDE an existing host surface using the host's own sector key (D2). There is
 * deliberately NO sector selector, NO route, and NO navigation entry (D3/D4).
 *
 * Presentation-only. This component derives nothing, computes nothing, ranks nothing and
 * fabricates nothing: it renders the governed DTO 1:1. React is not an authorization or
 * decision authority.
 *
 * D7: the canonical `AI EXPLANATION` badge is shown with the adjacent
 * `AI EXPLANATION ≠ CERTIFIED RESULT` text.
 *
 * S4: an advisory failure renders the canonical `ErrorState`; governed fields the contract does
 * not provide remain expressed by the canonical `UnavailableState`, which is a distinct meaning
 * from advisory failure. No new UI state is introduced.
 *
 * Authority: AUTH-G-AI-IMPL · SPEC-G-AI-IMPL · DEC-G-AI-IMPL-S1-S4 · DEC-G-AI-IMPL-S4 ·
 * DEC-G-AI-IMPL-S2 · DEC-G-AI-IMPL-SR1.
 */
import { useEffect, useState } from 'react';
import { fetchAiAdvisory, type AiAdvisoryDto } from '../../api/aiAdvisory';
import { LoadingState, ErrorState, UnavailableState } from '../state/StateComponents';
import { AiBadge, FreshnessBadge, StatusBadge } from '../ui/Badges';

export interface AiExplanationProps {
  /** The host surface's own sector key (D6). This component never selects a sector itself. */
  readonly sectorKey: string;
}

export function AiExplanation({ sectorKey }: AiExplanationProps) {
  const [data, setData] = useState<AiAdvisoryDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setData(null);
    fetchAiAdvisory(sectorKey)
      .then((d) => { if (active) setData(d); })
      .catch((e: unknown) => { if (active) { setError(String(e instanceof Error ? e.message : e)); setData(null); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sectorKey]);

  if (loading) return <LoadingState />;
  // S4 — advisory failure (404 / 503 advisory-unavailable / 503 engine-result-not-completed / 500).
  if (error) return <ErrorState message={`AI explanation unavailable: ${error}`} />;
  if (!data) return <UnavailableState reason="AI explanation unavailable" />;

  return (
    <section data-testid="ai-explanation" aria-label="AI explanation" style={{ marginTop: 24, padding: 16, border: '1px solid var(--color-border)', borderRadius: 6 }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>AI Explanation</h2>
        {/* D7 — canonical badge */}
        <AiBadge />
        <FreshnessBadge state={data.freshness.toLowerCase() as 'live' | 'snapshot' | 'stale' | 'unavailable' | 'replay'} />
      </header>

      {/* D7 — adjacent mandatory non-authoritative marker (the governed DTO label, verbatim) */}
      <p
        data-testid="ai-explanation-label"
        style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13, fontWeight: 600 }}
      >
        {data.label}
      </p>

      {/* S2 — the exact fixed authorized sentence, rendered verbatim from the governed DTO */}
      <p data-testid="ai-explanation-text" style={{ margin: '12px 0 0', fontSize: 14 }}>
        {data.text}
      </p>

      <dl data-testid="ai-explanation-fields" style={{ fontSize: 13, margin: '12px 0 0', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px' }}>
        <dt>Kind</dt>
        <dd>{data.kind}</dd>
        <dt>Grounded</dt>
        <dd>
          {data.grounded
            ? <StatusBadge status="positive" label="GROUNDED" />
            : <StatusBadge status="warning" label="NOT GROUNDED" />}
        </dd>
        <dt>Model</dt>
        <dd>{data.model} · {data.modelVersion}</dd>
        {/* SR-1 — the genuine canonical engineResult.snapshotRef. Never synthesized. */}
        <dt>Engine result</dt>
        <dd data-testid="ai-explanation-ref">{data.engineResultRef ?? 'unavailable'}</dd>
        <dt>Advice id</dt>
        <dd>{data.adviceId}</dd>
        <dt>Non-authoritative</dt>
        <dd>{String(data.nonAuthoritative)}</dd>
      </dl>

      {/* Governed fields the contract does not provide — listed, never fabricated. */}
      <div data-testid="ai-explanation-unavailable" style={{ marginTop: 16 }}>
        <UnavailableState reason="Fields not provided by the governed contract (rendered unavailable, never fabricated)" />
        <p style={{ fontSize: 13, color: 'var(--color-ink-secondary)' }}>
          Unavailable: {data.unavailable.join(', ')}. AI is never a decision authority.
        </p>
      </div>
    </section>
  );
}
