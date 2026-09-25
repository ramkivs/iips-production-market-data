/**
 * IIPS v3.0 — E2E-025 Engine API Integration Adapter
 *
 * Thin, versioned, auditable adapter that exposes the certified engines via
 * the governed platform runtime (no alternate path).
 *
 * Chain verified here:
 *   API request → validation → engine dispatch → governed engine execution
 *   → response DTO → evidence/provenance reference → audit/event identity
 *
 * Constraints (governance boundary):
 *   - Must use the existing governed contracts (SectorPlugin, RuntimeCoordinator,
 *     PluginLoader, SnapshotService/Store, ReplayService, EvidencePipeline,
 *     Transport, Clock/IdProvider) — never re-implement scoring/methodology.
 *   - Must preserve engine identity, IES/domain identity, version, provenance,
 *     deterministic/error behavior.
 *   - Must not introduce undocumented contract semantics.
 */

import { Container } from '../di/Container';
import { createClock } from '../infrastructure/Clock';
import { createIdProvider } from '../infrastructure/IdProvider';
import { PluginLoader } from '../plugin-loader/PluginLoader';
import { SnapshotService } from '../snapshot/SnapshotService';
import { SnapshotStore } from '../snapshot/SnapshotStore';
import { ReplayService } from '../replay/ReplayService';
import { RuntimeCoordinator } from '../runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../framework/evidence/EvidencePipeline';
import { Transport } from '../framework/transport/Transport';
import type { SectorPlugin, ExecutionRequest } from '../plugin-loader/PluginContract';

import { BankingEngine } from '../sector-engines/banking/BankingEngine';
import { InsuranceEngine } from '../sector-engines/insurance/InsuranceEngine';
import { CapitalMarketsEngine } from '../sector-engines/capital-markets/CapitalMarketsEngine';
import { HealthcareEngine } from '../sector-engines/healthcare/HealthcareEngine';
import { HospitalityEngine } from '../sector-engines/hospitality/HospitalityEngine';
import { EnergyEngine } from '../sector-engines/energy/EnergyEngine';
import { UtilitiesEngine } from '../sector-engines/utilities/UtilitiesEngine';
import { ConsumerEngine } from '../sector-engines/consumer/ConsumerEngine';
import { IndustrialsEngine } from '../sector-engines/industrials/IndustrialsEngine';
import { TechnologyEngine } from '../sector-engines/technology/TechnologyEngine';

import {
  CERTIFIED_ENGINES,
  getEngineEntry,
  isCertifiedEngine,
  assertNotTaxonomyResolved,
} from './EngineRegistry';

/* ------------------------------------------------------------------ */
/*  Engine factory map — the ONLY way to materialize a certified engine
    (additive, certified-only; adding a non-certified engine throws).      */
/* ------------------------------------------------------------------ */

type EngineFactory = () => SectorPlugin;

const ENGINE_FACTORY: Record<string, EngineFactory> = {
  'sector.banking': () => new BankingEngine(),
  'sector.insurance': () => new InsuranceEngine(),
  'sector.capital-markets': () => new CapitalMarketsEngine(),
  'sector.healthcare': () => new HealthcareEngine(),
  'sector.hospitality': () => new HospitalityEngine(),
  'sector.energy': () => new EnergyEngine(),
  'sector.utilities': () => new UtilitiesEngine(),
  'sector.consumer': () => new ConsumerEngine(),
  'sector.industrials': () => new IndustrialsEngine(),
  'sector.technology': () => new TechnologyEngine(),
};

export function makeCertifiedEngine(engineId: string): SectorPlugin {
  if (!isCertifiedEngine(engineId)) {
    throw new Error(`uncertified-capability: ${engineId} is not a certified engine`);
  }
  const make = ENGINE_FACTORY[engineId];
  if (!make) throw new Error(`factory-missing: ${engineId}`);
  return make();
}

/* ------------------------------------------------------------------ */
/*  Typed API request/response — versioned, minimal, governed           */
/* ------------------------------------------------------------------ */

export interface EngineApiRequest {
  readonly apiVersion: string; // '1.0' only
  readonly engineId: string; // e.g. 'sector.technology'
  readonly requestId: string;
  readonly inputs: Record<string, unknown>;
}

export interface EngineApiResponse {
  readonly apiVersion: string;
  readonly engineId: string;
  readonly requestId: string;
  readonly ies: string;
  readonly engineVersion: string;
  readonly state: 'COMPLETED' | 'DENIED' | 'FAILED';
  readonly verdict?: string;
  readonly composite?: number;
  readonly snapshotRef?: string;
  readonly evidenceRef?: string;
  readonly evidenceId?: string;
  readonly provenance: {
    readonly engineId: string;
    readonly ies: string;
    readonly engineVersion: string;
    readonly secVersion: string;
    readonly semcVersion: string;
    readonly calibrationProfile: string;
    readonly calibrationVersion: string;
    readonly snapshotId?: string;
    readonly evidenceId?: string;
    readonly deterministic: true;
    readonly runtimeConfig: {
      readonly clock: 'fixed';
      readonly idProvider: 'deterministic';
      readonly schemaVersion: 'snapshot-1.0';
      readonly transportVersion: 'v1';
    };
  };
  readonly reason?: string;
}

export interface EngineApiListResponse {
  readonly apiVersion: string;
  readonly engines: ReadonlyArray<{
    readonly engineId: string;
    readonly ies: string;
    readonly iesTitle: string;
    readonly sectorFamily: string;
    readonly engineVersion: string;
    readonly secVersion: string;
    readonly semcVersion: string;
    readonly calibrationProfile: string;
    readonly calibrationVersion: string;
    readonly capabilities: readonly string[];
  }>;
  readonly provenance: {
    readonly certifiedCount: number;
    readonly source: string;
    readonly freshness: 'FROZEN';
    readonly runtimeConfig: { clock: 'fixed'; idProvider: 'deterministic' };
  };
}

/* ------------------------------------------------------------------ */
/*  Validation (governance-authoritative, not invented)                 */
/* ------------------------------------------------------------------ */

export class ApiValidationError extends Error {
  readonly status: 400 | 404 | 422;
  constructor(status: 400 | 404 | 422, msg: string) {
    super(msg);
    this.name = 'ApiValidationError';
    this.status = status;
  }
}

function validateRequest(req: EngineApiRequest): void {
  if (!req || typeof req !== 'object') throw new ApiValidationError(400, 'invalid request body');
  if (req.apiVersion !== '1.0')
    throw new ApiValidationError(422, `unsupported-api-version: ${req.apiVersion}`);
  if (!req.engineId || typeof req.engineId !== 'string')
    throw new ApiValidationError(400, 'missing engineId');
  if (!req.requestId || typeof req.requestId !== 'string')
    throw new ApiValidationError(400, 'missing requestId');
  if (!req.inputs || typeof req.inputs !== 'object')
    throw new ApiValidationError(400, 'missing inputs');
  // Taxonomy guard — prevent IT/Chemicals/Realty separate-engine creation
  try {
    assertNotTaxonomyResolved(req.engineId);
  } catch (e) {
    throw new ApiValidationError(422, String((e as Error).message));
  }
  // If caller passes a plain sector name instead of engineId, they must map via registry first
  if (!req.engineId.startsWith('sector.')) {
    throw new ApiValidationError(400, `engineId must be a certified engineId (got ${req.engineId})`);
  }
}

/* ------------------------------------------------------------------ */
/*  EngineApiAdapter — the E2E-025 integration adapter                  */
/* ------------------------------------------------------------------ */

export class EngineApiAdapter {
  private readonly transport: Transport;
  private readonly FIXED_NOW = '2026-08-09T00:00:00.000Z';

  constructor() {
    const clock = createClock('fixed', this.FIXED_NOW);
    this.transport = new Transport(clock, 'v1', 'transport-1.0');
  }

  /** GET /api/engines — certified registry, read-only, frozen. */
  listEngines(): EngineApiListResponse {
    return {
      apiVersion: '1.0',
      engines: CERTIFIED_ENGINES.map((e) => ({
        engineId: e.engineId,
        ies: e.ies,
        iesTitle: e.iesTitle,
        sectorFamily: e.sectorFamily,
        engineVersion: e.engineVersion,
        secVersion: e.secVersion,
        semcVersion: e.semcVersion,
        calibrationProfile: e.calibrationProfile,
        calibrationVersion: e.calibrationVersion,
        capabilities: e.capabilities,
      })),
      provenance: {
        certifiedCount: CERTIFIED_ENGINES.length,
        source:
          'Program v1.1 LTS — 10 frozen sector engines (IES-006…015) — freeze manifests + replay baseline',
        freshness: 'FROZEN',
        runtimeConfig: { clock: 'fixed', idProvider: 'deterministic' },
      },
    };
  }

  /**
   * POST /api/engines/:engineId/execute — governed dispatch.
   *
   * Builds a fresh deterministic runtime per request (fixed clock + deterministic
   * id + isolated SnapshotStore) — matches the LTS certification model. Each call
   * is isolated (no state leakage) and deterministic.
   */
  execute(req: EngineApiRequest): EngineApiResponse {
    validateRequest(req);

    const entry = getEngineEntry(req.engineId);
    if (!entry) {
      return {
        apiVersion: req.apiVersion,
        engineId: req.engineId,
        requestId: req.requestId,
        ies: 'UNKNOWN',
        engineVersion: '0.0.0',
        state: 'DENIED',
        provenance: {
          engineId: req.engineId,
          ies: 'UNKNOWN',
          engineVersion: '0.0.0',
          secVersion: 'unknown',
          semcVersion: 'unknown',
          calibrationProfile: 'unknown',
          calibrationVersion: 'unknown',
          deterministic: true,
          runtimeConfig: {
            clock: 'fixed',
            idProvider: 'deterministic',
            schemaVersion: 'snapshot-1.0',
            transportVersion: 'v1',
          },
        },
        reason: 'uncertified-capability',
      };
    }

    // Build deterministic runtime (LTS pattern: same as Program v1.1 certification)
    const clock = createClock('fixed', this.FIXED_NOW);
    const id = createIdProvider('deterministic', req.requestId);
    const evidence = new EvidencePipeline(clock);
    const container = new Container({ clock, idProvider: id, evidenceService: evidence });
    const plugins = new PluginLoader(container);
    const snap = new SnapshotService(clock, id, 'snapshot-1.0');
    const store = new SnapshotStore();
    const replay = new ReplayService(store);
    const runtime = new RuntimeCoordinator(container, plugins, snap, store, replay);
    container.register('runtimeCoordinator', runtime);

    const engine = makeCertifiedEngine(req.engineId);
    const loaded = plugins.load(engine);
    if (!loaded) {
      return {
        apiVersion: req.apiVersion,
        engineId: req.engineId,
        requestId: req.requestId,
        ies: entry.ies,
        engineVersion: entry.engineVersion,
        state: 'FAILED',
        provenance: {
          engineId: entry.engineId,
          ies: entry.ies,
          engineVersion: entry.engineVersion,
          secVersion: entry.secVersion,
          semcVersion: entry.semcVersion,
          calibrationProfile: entry.calibrationProfile,
          calibrationVersion: entry.calibrationVersion,
          deterministic: true,
          runtimeConfig: {
            clock: 'fixed',
            idProvider: 'deterministic',
            schemaVersion: 'snapshot-1.0',
            transportVersion: 'v1',
          },
        },
        reason: 'engine-load-failed',
      };
    }
    plugins.initialize(req.engineId);

    const executionReq: ExecutionRequest = { requestId: req.requestId, inputs: req.inputs };
    let execResult;
    try {
      const out = runtime.execute(req.engineId, executionReq);
      execResult = out.result;
    } catch (e) {
      return {
        apiVersion: req.apiVersion,
        engineId: req.engineId,
        requestId: req.requestId,
        ies: entry.ies,
        engineVersion: entry.engineVersion,
        state: 'FAILED',
        provenance: {
          engineId: entry.engineId,
          ies: entry.ies,
          engineVersion: entry.engineVersion,
          secVersion: entry.secVersion,
          semcVersion: entry.semcVersion,
          calibrationProfile: entry.calibrationProfile,
          calibrationVersion: entry.calibrationVersion,
          deterministic: true,
          runtimeConfig: {
            clock: 'fixed',
            idProvider: 'deterministic',
            schemaVersion: 'snapshot-1.0',
            transportVersion: 'v1',
          },
        },
        reason: String(e),
      };
    }

    if (execResult.state !== 'COMPLETED') {
      return {
        apiVersion: req.apiVersion,
        engineId: req.engineId,
        requestId: req.requestId,
        ies: entry.ies,
        engineVersion: entry.engineVersion,
        state: execResult.state === 'CANCELLED' ? 'FAILED' : 'FAILED',
        provenance: {
          engineId: entry.engineId,
          ies: entry.ies,
          engineVersion: entry.engineVersion,
          secVersion: entry.secVersion,
          semcVersion: entry.semcVersion,
          calibrationProfile: entry.calibrationProfile,
          calibrationVersion: entry.calibrationVersion,
          snapshotId: execResult.snapshotRef,
          evidenceId: execResult.evidenceRef,
          deterministic: true,
          runtimeConfig: {
            clock: 'fixed',
            idProvider: 'deterministic',
            schemaVersion: 'snapshot-1.0',
            transportVersion: 'v1',
          },
        },
        reason: 'engine-execution-not-completed',
      };
    }

    const md = execResult.metadata as Record<string, unknown>;
    const verdict = typeof md.verdict === 'string' ? md.verdict : undefined;
    const composite = typeof md.composite === 'number' ? md.composite : (md.composite as number | undefined);

    // Validate through governed Transport (checksum + version check)
    const rows = this.transport.build(entry.engineId, [
      {
        sectorId: entry.engineId,
        sectorFamily: entry.sectorFamily,
        companyName: `${entry.sectorFamily} — governed`,
        metrics: {},
        scores: composite !== undefined ? { composite } : {},
        verdict,
      },
    ] as never);
    const transportValid = this.transport.validate(rows);

    return {
      apiVersion: req.apiVersion,
      engineId: req.engineId,
      requestId: req.requestId,
      ies: entry.ies,
      engineVersion: entry.engineVersion,
      state: 'COMPLETED',
      verdict,
      composite,
      snapshotRef: execResult.snapshotRef,
      evidenceRef: execResult.evidenceRef,
      evidenceId: execResult.evidenceRef,
      provenance: {
        engineId: entry.engineId,
        ies: entry.ies,
        engineVersion: entry.engineVersion,
        secVersion: entry.secVersion,
        semcVersion: entry.semcVersion,
        calibrationProfile: entry.calibrationProfile,
        calibrationVersion: entry.calibrationVersion,
        snapshotId: execResult.snapshotRef,
        evidenceId: execResult.evidenceRef,
        deterministic: true,
        runtimeConfig: {
          clock: 'fixed',
          idProvider: 'deterministic',
          schemaVersion: 'snapshot-1.0',
          transportVersion: 'v1',
        },
      },
      ...(transportValid ? {} : { reason: 'transport-validation-failed' }),
    };
  }

  /**
   * Deterministic/idempotency check: same requestId + inputs → same provenance identity.
   * (Not an engine-semantics check — just transport/API identity.)
   */
  isIdempotent(a: EngineApiResponse, b: EngineApiResponse): boolean {
    return (
      a.requestId === b.requestId &&
      a.engineId === b.engineId &&
      a.ies === b.ies &&
      a.composite === b.composite &&
      a.verdict === b.verdict
    );
  }
}
