/**
 * Hospitality Sector Engine (WP-3) — implements SectorPlugin, consumes platform services, frozen assets.
 *
 * Implements the IES-010 deterministic pipeline: metric eval → band → score → pillar →
 * business-model calibration → override → verdict → evidence → ontology registration.
 * Reproduces the 9/9 frozen expected outputs. Zero platform/framework/CSIP changes.
 */
import type { SectorPlugin, ExecutionRequest, ExecutionResult, PluginManifest } from '../../plugin-loader/PluginContract';
import type { Container } from '../../di/Container';
import type { RuntimeCoordinator } from '../../runtime/RuntimeCoordinator';
import type { EvidencePipeline } from '../../framework/evidence/EvidencePipeline';
import { HospitalityMetricsEvaluator, type HospitalityInput } from './metrics/HospitalityMetrics';
import { HospitalityScoreEngine } from './scoring/HospitalityScoreEngine';
import { loadHospitalityCalibration, type HospitalityCalibrationProfile } from './calibration/HospitalityCalibration';
import { HospitalityDecision } from './decision/HospitalityDecision';
import { HospitalityEvidence } from './evidence/HospitalityEvidence';

export const HOSPITALITY_ENGINE_ID = 'sector.hospitality';

/** Engine-declared ontology metadata (Universal Investment Ontology) — for CSIP, zero CSIP change. */
export const HOSPITALITY_ONTOLOGY_METADATA = {
  composite: 'Conviction',
  confidence: 'Confidence',
  qualityScore: 'Quality',
  growthScore: 'Growth',
  riskScore: 'Risk',
  valuationScore: 'Valuation',
  capitalEfficiency: 'Capital Efficiency',
  franchiseScore: 'Moat',
} as const;

export class HospitalityEngine implements SectorPlugin {
  readonly identity = {
    engineId: HOSPITALITY_ENGINE_ID,
    sectorFamily: 'Hospitality',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
  };
  readonly manifest: PluginManifest = {
    engineId: HOSPITALITY_ENGINE_ID,
    sectorFamily: 'Hospitality',
    engineVersion: '1.0.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    compatibility: { framework: '1.0', methodology: 'IES-010 v1.0' },
  };

  private calibration: HospitalityCalibrationProfile = loadHospitalityCalibration();
  private metrics = new HospitalityMetricsEvaluator();
  private scoreEngine!: HospitalityScoreEngine;
  private decision!: HospitalityDecision;
  private evidence!: HospitalityEvidence;
  private runtime!: RuntimeCoordinator;
  private evidencePipeline!: EvidencePipeline;

  onDiscover(): void { /* no-op */ }

  onRegister(_ctx: Container): boolean {
    this.scoreEngine = new HospitalityScoreEngine(this.calibration);
    this.decision = new HospitalityDecision(this.calibration);
    return true;
  }

  onInitialize(ctx: Container): void {
    this.evidencePipeline = ctx.resolve<EvidencePipeline>('evidenceService');
    this.runtime = ctx.resolve<RuntimeCoordinator>('runtimeCoordinator');
    this.evidence = new HospitalityEvidence(this.evidencePipeline);
  }

  execute(_ctx: Container, request: ExecutionRequest): ExecutionResult {
    const input = request.inputs as unknown as HospitalityInput;
    const metrics = this.metrics.evaluate(input);
    const score = this.scoreEngine.score(metrics);
    const decision = this.decision.decide({
      composite: score.composite,
      businessModel: input.businessModel,
      debtEbitda: input.debtEbitda,
      demandShock: input.demandShock,
      occupancyCollapse: input.occupancyCollapse,
      brandDeterioration: input.brandDeterioration,
      governance: input.governance,
    });

    const snapshot = this.runtime.recordSnapshot(
      HOSPITALITY_ENGINE_ID,
      { revpar: input.revpar, occupancy: input.occupancy },
      score.pillars as unknown as Record<string, number>,
      decision.verdict,
    );
    const evidence = this.evidence.build({
      businessModel: input.businessModel,
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
        ontology: HOSPITALITY_ONTOLOGY_METADATA,
      },
    };
  }

  onComplete(): void { /* no-op */ }
}
