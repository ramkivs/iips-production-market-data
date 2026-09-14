/**
 * Program v3.0 — G-AI-IMPL: Typed API client for the embedded AI Advisory surface.
 *
 * Mirrors the governed transport DTO 1:1. Semantically inert and presentation-only:
 * this client makes no authorization decision, derives no value, and fabricates nothing.
 *
 * Authority: AUTH-G-AI-IMPL · SPEC-G-AI-IMPL §6 · DEC-G-AI-IMPL-S1-S4 (S1/S2/S3) ·
 * DEC-G-AI-IMPL-S4 (failure semantics) · DEC-G-AI-IMPL-S2 (exact fixed text) ·
 * DEC-G-AI-IMPL-SR1 (canonical snapshotRef).
 *
 * Authentication uses the EXISTING canonical `authFetch` mechanism — no second
 * authentication or authorization mechanism is introduced (SR-4).
 */
import { authFetch } from './authFetch';

/**
 * Governed AI advisory DTO.
 *
 * The first eight fields are the governed `AiAdvice` contract fields (canonical
 * `AiAssistedRuntime.AiAdvice`). The remaining four are the transport-level fields
 * established by SPEC-G-AI-IMPL §6. No field may be added, removed or renamed.
 */
export interface AiAdvisoryDto {
  /** Governed — produced by the canonical platform `adviceId()` helper (SR-3). */
  readonly adviceId: string;
  readonly engineResultId: string;
  readonly kind: 'explanation' | 'summary' | 'hypothesis' | 'anomaly' | 'research';
  /** Governed — the exact fixed sentence authorized by DEC-G-AI-IMPL-S2. */
  readonly text: string;
  readonly grounded: boolean;
  /** Governed — literal `true`; AI is never a decision authority. */
  readonly nonAuthoritative: true;
  readonly model: string;
  readonly modelVersion: string;
  /** Governed — the genuine canonical `engineResult.snapshotRef` (SR-1). Absent when the contract omits it. */
  readonly engineResultRef?: string;
  /** Transport — mandatory D7 non-authoritative marker. */
  readonly label: 'AI EXPLANATION ≠ CERTIFIED RESULT';
  /** Transport — `'SNAPSHOT'` per SR-2. */
  readonly freshness: 'LIVE' | 'SNAPSHOT' | 'STALE' | 'UNAVAILABLE' | 'REPLAY';
  /** Transport — governed fields the contract does not provide; never fabricated. */
  readonly unavailable: readonly string[];
}

/** S4 error codes, distinct from the pre-existing 401/403/404/500 semantics. */
export type AiAdvisoryErrorCode = 'advisory-unavailable' | 'engine-result-not-completed';

/** A distinguishable advisory failure carrying the S4 503 semantics. */
export class AiAdvisoryError extends Error {
  constructor(readonly status: number, readonly code: AiAdvisoryErrorCode | 'not-found' | 'transport', message: string) {
    super(message);
    this.name = 'AiAdvisoryError';
  }
}

/**
 * Fetch the governed advisory for a certified engine result identified by sector key (D6).
 *
 * Thin client: no retry, no cache, no derivation, no sector enumeration (SR-5).
 */
export async function fetchAiAdvisory(sectorKey: string, baseUrl = ''): Promise<AiAdvisoryDto> {
  const res = await authFetch(`${baseUrl}/api/ai-advisory/${encodeURIComponent(sectorKey)}`);

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
    const code = body.code;
    if (res.status === 404) throw new AiAdvisoryError(404, 'not-found', body.error ?? 'engine result not found');
    if (res.status === 503 && (code === 'advisory-unavailable' || code === 'engine-result-not-completed')) {
      throw new AiAdvisoryError(503, code, body.error ?? code);
    }
    throw new AiAdvisoryError(res.status, 'transport', body.error ?? `ai advisory transport returned ${res.status}`);
  }

  return (await res.json()) as AiAdvisoryDto;
}
