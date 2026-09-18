/**
 * Program v3.0 — G-AI-IMPL: read-only AI Advisory G2 transport.
 *
 * Exposes the governed `AiAssistedRuntime` advisory for a certified engine result over HTTP,
 * authorized exclusively through the EXISTING canonical read mechanism (SR-4):
 *
 *   guardRead(executor, token, 'ai-advisory')
 *     → SecuredExecutor.authenticate (401)
 *     → SecuredExecutor.authorize('read', 'read.ai-advisory') (403)
 *     → governed audit
 *
 * NO second RBAC or read-authorization model is introduced. `guardRead` is reused as-is
 * and `admin-transport.ts` is not modified.
 *
 * Orchestration (S3-A): `AiAssistedRuntime.executeWithAi` is the SOLE authoritative path.
 * `AiAdvisor.advise()` is never called directly by this transport.
 *
 * Failure semantics (S4): 401/403 via guardRead; 404 unknown/unresolvable sector (pre-existing
 * semantics); 503 `engine-result-not-completed` when the engine result is not COMPLETED (advisor
 * body not consulted); 503 `advisory-unavailable` when the advisor cannot produce advice;
 * 500 engine/runtime/transport failure (pre-existing semantics).
 *
 * Authority: AUTH-G-AI-IMPL · SPEC-G-AI-IMPL (SR-1…SR-5) · DEC-G-AI-IMPL-B2-B4 ·
 * DEC-G-AI-IMPL-S1-S4 · DEC-G-AI-IMPL-S4 · DEC-G-AI-IMPL-S2 · DEC-G-AI-IMPL-SR1.
 */
import http from 'node:http';
import { AiAssistedRuntime, adviceId, type AiAdvice, type AiAdvisor } from '../../iips-platform/src/distributed/AiAssistedRuntime';
import type { ExecutionResult, SectorPlugin } from '../../iips-platform/src/plugin-loader/PluginContract';
import type { SecuredExecutor } from './secured-executor';
import { AuthError } from '../src/core/auth/keycloakAdapter';

/** S2 — the exact authorized advisory sentence. Fixed; no interpolation; no result-dependent slots. */
export const ADVISORY_TEXT =
  'This is a supplementary advisory explanation. It is not a certified engine result and does not alter the certified result.';

/** D7 — mandatory non-authoritative marker rendered adjacent to the canonical `AI EXPLANATION` badge. */
export const ADVISORY_LABEL = 'AI EXPLANATION ≠ CERTIFIED RESULT' as const;

/** SR-2 — the advisory is derived from the frozen certified baseline, so freshness is SNAPSHOT. */
export const ADVISORY_FRESHNESS = 'SNAPSHOT' as const;

/** Governed fields the contract does not provide. Listed, never fabricated. */
export const ADVISORY_UNAVAILABLE = ['timestamp', 'tenant', 'provider', 'confidence', 'citations', 'decision'] as const;

/** S1 — the deterministic advisor identity. Truthful: no external AI model is implied. */
export const ADVISOR_MODEL = 'iips-deterministic-advisor' as const;
export const ADVISOR_MODEL_VERSION = '1.0.0' as const;

/** Thrown when the engine result is not COMPLETED, so the advisory body is never produced. */
export class EngineResultNotCompletedError extends Error {
  constructor(readonly state: ExecutionResult['state']) {
    super(`engine result not completed (${state})`);
    this.name = 'EngineResultNotCompletedError';
  }
}

/**
 * S1 — the deterministic in-process advisor.
 *
 * Deterministic; no external AI, provider or network; no additional reads. Consumes ONLY the
 * engine result and the evidence object it is handed. Does not mutate the engine result and
 * fabricates nothing: `text` is the fixed authorized sentence and `grounded` reflects whether the
 * evidence actually carries the certified composite and verdict.
 */
export function createDeterministicAdvisor(): AiAdvisor {
  return {
    advise(engineResult: ExecutionResult, evidence: Record<string, unknown>): AiAdvice {
      const grounded =
        typeof evidence.composite === 'number' && typeof evidence.verdict === 'string';

      return {
        kind: 'explanation',
        text: ADVISORY_TEXT,
        grounded,
        nonAuthoritative: true,
        model: ADVISOR_MODEL,
        modelVersion: ADVISOR_MODEL_VERSION,
        ...(engineResult.snapshotRef !== undefined ? { engineResultRef: engineResult.snapshotRef } : {}),
      };
    },
  };
}

/**
 * Wraps the advisor so the advisory BODY is never produced for a non-COMPLETED engine result (S4).
 * The throw is raised before any advisory content is constructed.
 */
export function guardAdvisorCompletion(inner: AiAdvisor): AiAdvisor {
  return {
    advise(engineResult: ExecutionResult, evidence: Record<string, unknown>): AiAdvice {
      if (engineResult.state !== 'COMPLETED') throw new EngineResultNotCompletedError(engineResult.state);
      return inner.advise(engineResult, evidence);
    },
  };
}

/** A resolved sector: the governed engineId, its engine constructor, and its frozen baseline inputs. */
export interface ResolvedSectorEngine {
  readonly sector: string;
  readonly engineId: string;
  readonly makeEngine: () => SectorPlugin;
  readonly inputs: Readonly<Record<string, unknown>>;
}

/**
 * Build the governed 12-field success DTO. No field is added, removed or renamed.
 * `adviceId` is produced by the canonical platform helper (SR-3).
 */
export function buildAiAdvisoryDto(advice: AiAdvice, engineResultId: string): Record<string, unknown> {
  return {
    adviceId: adviceId(`ai-advisory|${advice.engineResultRef ?? engineResultId}`),
    engineResultId,
    kind: advice.kind,
    text: advice.text,
    grounded: advice.grounded,
    nonAuthoritative: advice.nonAuthoritative,
    model: advice.model,
    modelVersion: advice.modelVersion,
    ...(advice.engineResultRef !== undefined ? { engineResultRef: advice.engineResultRef } : {}),
    label: ADVISORY_LABEL,
    freshness: ADVISORY_FRESHNESS,
    unavailable: [...ADVISORY_UNAVAILABLE],
  };
}

/** Injectable advisor seam (test-only; production always uses the default deterministic advisor). */
export interface AiAdvisoryHandlerOptions {
  readonly advisor?: AiAdvisor;
}

/**
 * GET /api/ai-advisory/:sectorKey
 *
 * Sector coverage is derived from the governed ENGINE_FACTORY mapping supplied by the resolver
 * (SR-5) — no sector is enumerated here.
 */
export async function handleAiAdvisoryRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  executor: SecuredExecutor,
  resolveSectorEngine: (sectorKey: string) => ResolvedSectorEngine | null,
  opts: AiAdvisoryHandlerOptions = {},
): Promise<void> {
  res.setHeader('Content-Type', 'application/json');
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '').trim();

  try {
    const match = (req.url ?? '').match(/^\/api\/ai-advisory\/([^/]+)$/);
    if (!match) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'not found' }));
      return;
    }
    const sectorKey = decodeURIComponent(match[1]);

    // SR-4 — canonical governed read authorization. 401 on missing/invalid token, 403 on denial.
    const admin = await import('./admin-transport');
    await admin.guardRead(executor, token, 'ai-advisory');

    // D5/D6 — resolve the sector key through the governed mapping. Unknown → pre-existing 404.
    const resolved = resolveSectorEngine(sectorKey);
    if (!resolved) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: `engine result not found: ${sectorKey}` }));
      return;
    }

    // S3-A — executeWithAi is the sole orchestration path. The engine is executed exactly once,
    // by the platform runtime, on the frozen baseline inputs. advise() is never called directly.
    const runtime = new AiAssistedRuntime(
      guardAdvisorCompletion(opts.advisor ?? createDeterministicAdvisor()),
    );
    let result: ExecutionResult;
    let advice: AiAdvice;
    let engineResultUnchanged: boolean;
    try {
      const executed = runtime.executeWithAi(resolved.engineId, resolved.makeEngine, {
        requestId: `ai-advisory-${resolved.engineId}`,
        inputs: resolved.inputs as Record<string, unknown>,
      });
      result = executed.result;
      advice = executed.advice;
      engineResultUnchanged = executed.engineResultUnchanged;
    } catch (e) {
      // S4 — non-COMPLETED engine result: the advisory body was never produced.
      if (e instanceof EngineResultNotCompletedError) {
        res.writeHead(503);
        res.end(JSON.stringify({ error: e.message, code: 'engine-result-not-completed' }));
        return;
      }
      // S4 — the advisor could not produce advice. No fallback, no fabricated or partial advice.
      res.writeHead(503);
      res.end(JSON.stringify({ error: 'advisory unavailable', code: 'advisory-unavailable' }));
      return;
    }

    // A===B — the certified engine result is returned unchanged and is never mutated here.
    if (!engineResultUnchanged) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'engine result integrity check failed' }));
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify(buildAiAdvisoryDto(advice, resolved.sector)));
    // adviceLog() lineage is retained on the runtime instance for the request that produced it.
    void runtime.adviceLog();
    void result;
  } catch (e) {
    if (e instanceof AuthError) {
      res.writeHead(e.status);
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'ai advisory transport error', detail: String(e) }));
  }
}
