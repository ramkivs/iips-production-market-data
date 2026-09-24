/**
 * Program v2.0 — WP-8: SDK / API (public integration boundary).
 *
 * Constitutional rule:
 *   The SDK/API may expose, invoke, compose, observe, and manage certified platform
 *   capabilities, but it must NEVER provide an alternate path that bypasses the deterministic
 *   engine contract, security controls, evidence lineage, replay guarantees, or the WP-0
 *   frozen-oracle boundary.
 *
 * The API layer is a thin, versioned facade over the platform: it adds NO scoring/methodology
 * logic (no alternate decision authority); it enforces authz (WP-4), tenant isolation,
 * idempotency, rate limiting, and delegates replay/evidence to the certified runtime.
 */
import type { SectorPlugin, ExecutionRequest, ExecutionResult } from '../plugin-loader/PluginContract';
import { createClock } from '../infrastructure/Clock';
import { createIdProvider } from '../infrastructure/IdProvider';
import { Container } from '../di/Container';
import { PluginLoader } from '../plugin-loader/PluginLoader';
import { SnapshotService } from '../snapshot/SnapshotService';
import { SnapshotStore } from '../snapshot/SnapshotStore';
import { ReplayService } from '../replay/ReplayService';
import { RuntimeCoordinator } from '../runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../framework/evidence/EvidencePipeline';

export interface ApiRequest {
  readonly apiVersion: string;
  readonly engineId: string;
  readonly requestId: string;
  readonly inputs: Record<string, unknown>;
  readonly tenantId: string;
  readonly principal: { userId: string; roles: string[] };
}

export interface ApiResponse {
  readonly apiVersion: string;
  readonly engineId: string;
  readonly requestId: string;
  readonly state: 'COMPLETED' | 'DENIED' | 'THROTTLED';
  readonly result?: ExecutionResult;
  readonly snapshotRef?: string;
  readonly evidenceRef?: string;
  readonly reason?: string;
}

export interface ApiSecurity {
  authorize(tenantId: string, roles: string[], action: string, resource: string): boolean;
}

export class PlatformApi {
  private readonly execCount = new Map<string, number>();

  constructor(
    private readonly security: ApiSecurity,
    private readonly makeEngine: (engineId: string) => SectorPlugin,
  ) {}

  /** Execute a request through the certified runtime (NOT via any alternate path). */
  execute(req: ApiRequest): ApiResponse {
    // 1. API version gate
    if (req.apiVersion !== '1.0') return { apiVersion: req.apiVersion, engineId: req.engineId, requestId: req.requestId, state: 'DENIED', reason: 'unsupported-api-version' };
    // 2. Authorization (WP-4): must not be bypassed.
    if (!this.security.authorize(req.tenantId, req.principal.roles, 'execute', req.engineId)) {
      return { apiVersion: req.apiVersion, engineId: req.engineId, requestId: req.requestId, state: 'DENIED', reason: 'unauthorized' };
    }
    // 3. Rate limiting / resource governance (operational, does not affect engine math).
    const key = `${req.tenantId}|${req.principal.userId}`;
    const count = (this.execCount.get(key) ?? 0) + 1;
    if (count > 100) return { apiVersion: req.apiVersion, engineId: req.engineId, requestId: req.requestId, state: 'THROTTLED', reason: 'rate-limit-exceeded' };
    this.execCount.set(key, count);

    // 3b. Marketplace gate: only certified capabilities can be loaded (WP-6). An unknown/
    // uncertified engine is rejected (DENIED), never invoked via an alternate path.
    let engine: SectorPlugin;
    try {
      engine = this.makeEngine(req.engineId);
    } catch {
      return { apiVersion: req.apiVersion, engineId: req.engineId, requestId: req.requestId, state: 'DENIED', reason: 'uncertified-capability' };
    }

    // 4. Build the certified deterministic runtime (fixed clock + deterministic id).
    const clock = createClock('fixed');
    const id = createIdProvider('deterministic');
    const evidence = new EvidencePipeline(clock);
    const container = new Container({ clock, idProvider: id, evidenceService: evidence });
    const plugins = new PluginLoader(container);
    const snap = new SnapshotService(clock, id);
    const store = new SnapshotStore();
    const replay = new ReplayService(store);
    const runtime = new RuntimeCoordinator(container, plugins, snap, store, replay);
    container.register('runtimeCoordinator', runtime);
    plugins.load(engine);
    plugins.initialize(req.engineId);

    // 5. Execute via the certified runtime.
    const result = runtime.execute(req.engineId, { requestId: req.requestId, inputs: req.inputs as never }).result;
    return {
      apiVersion: req.apiVersion,
      engineId: req.engineId,
      requestId: req.requestId,
      state: 'COMPLETED',
      result,
      snapshotRef: result.snapshotRef,
      evidenceRef: result.evidenceRef,
    };
  }

  /** Idempotency: the same requestId + inputs produces the same deterministic result. */
  isIdempotent(a: ApiResponse, b: ApiResponse): boolean {
    return a.requestId === b.requestId && JSON.stringify(a.result?.metadata) === JSON.stringify(b.result?.metadata);
  }
}
