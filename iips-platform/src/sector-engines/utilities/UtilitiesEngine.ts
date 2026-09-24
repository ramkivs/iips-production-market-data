/**
 * Utilities Sector Engine (WP-3) — implements SectorPlugin, consumes platform services, frozen assets.
 *
 * Implements the IES-012 deterministic pipeline: metric eval → band → score → pillar →
 * segment/regulatory calibration → composite → override → verdict → evidence → ontology
 * registration. Reproduces the 11/11 frozen expected outputs. Zero platform/framework/CSIP changes.
 */
import type { SectorPlugin, ExecutionRequest, ExecutionResult, PluginManifest } from '../../plugin-loader/PluginContract';
import type { Container } from '../../di/Container';
import type { RuntimeCoordinator } from '../../runtime/RuntimeCoordinator';
import type { EvidencePipeline } from '../../framework/evidence/EvidencePipeline';
import { UtilitiesMetricsEvaluator, type UtilitiesInput } from './metrics/UtilitiesMetrics';
import { UtilitiesScoreEngine } from './scoring/UtilitiesScoreEngine';
import { loadUtilitiesCalibration, type UtilitiesCalibrationProfile } from './calibration/UtilitiesCalibration';
import { UtilitiesDecision } from './decision/UtilitiesDecision';
import { UtilitiesEvidence } from './evidence/UtilitiesEvidence';

export const UTILITIES_ENGINE_ID = 'sector.utilities';

/** Engine-declared ontology metadata (Universal Investment Ontology) — for CSIP, zero CSIP change. */
export const UTILITIES_ONTOLOGY_METADATA = {
  composite: 'Conviction',
  confidence: 'Confidence',
  qualityScore: 'Quality',
  growthScore: 'Growth',
  riskScore: 'Risk',
  valuationScore: 'Valuation',
  capitalEfficiency: 'Capital Efficiency',
  franchiseScore: 'Moat',
} as const;

export class UtilitiesEngine implements SectorPlugin {
  readonly identity = {
    engineId: UTILITIES_ENGINE_ID,
    sectorFamily: 'Utilities',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
  };
  readonly manifest: PluginManifest = {
    engineId: UTILITIES_ENGINE_ID,
    sectorFamily: 'Utilities',
    engineVersion: '1.0.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    compatibility: { framework: '1.0', methodology: 'IES-012 v1.0' },
  };

  private calibration: UtilitiesCalibrationProfile = loadUtilitiesCalibration();
  private metrics = new UtilitiesMetricsEvaluator();
  private scoreEngine!: UtilitiesScoreEngine;
  private decision!: UtilitiesDecision;
  private evidence!: UtilitiesEvidence;
  private runtime!: RuntimeCoordinator;
  private evidencePipeline!: EvidencePipeline;

  onDiscover(): void { /* no-op */ }

  onRegister(_ctx: Container): boolean {
    this.scoreEngine = new UtilitiesScoreEngine(this.calibration);
    this.decision = new UtilitiesDecision(this.calibration);
    return true;
  }

  onInitialize(ctx: Container): void {
    this.evidencePipeline = ctx.resolve<EvidencePipeline>('evidenceService');
    this.runtime = ctx.resolve<RuntimeCoordinator>('runtimeCoordinator');
    this.evidence = new UtilitiesEvidence(this.evidencePipeline);
  }

  execute(_ctx: Container, request: ExecutionRequest): ExecutionResult {
    const input = request.inputs as unknown as UtilitiesInput;
    const metrics = this.metrics.evaluate(input);
    const score = this.scoreEngine.score(metrics);
    const decision = this.decision.decide({
      composite: score.composite,
      segment: input.segment,
      debtEbitda: input.debtEbitda,
      governance: input.governance,
      adverseRateCase: input.adverseRateCase,
      regulatoryLag: input.regulatoryLag,
      capexOverrun: input.capexOverrun,
      strandedAsset: input.strandedAsset,
    });

    const snapshot = this.runtime.recordSnapshot(
      UTILITIES_ENGINE_ID,
      { rateBaseGrowth: input.rateBaseGrowth },
      score.pillars as unknown as Record<string, number>,
      decision.verdict,
    );
    const evidence = this.evidence.build({
      segment: input.segment,
      decision,
      score,
      calibrationVersion: this.calibration.version,
      snapshotId: snapshot.snapshotId,
    });

    return {
      state: 'COMPLETED',
      snapshotRef: snapshot.snapshotId,
      evidenceRef: evidence.evidenceId,
      metadata: {
        verdict: decision.verdict,
        composite: score.composite,
        overridesApplied: decision.overridesApplied,
        ontology: UTILITIES_ONTOLOGY_METADATA,
      },
    };
  }

  onComplete(): void { /* no-op */ }
}
