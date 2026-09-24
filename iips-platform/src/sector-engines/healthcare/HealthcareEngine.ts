/** Healthcare Sector Engine (WP-3) — implements SectorPlugin, consumes platform services, frozen assets. */
import type { SectorPlugin, ExecutionRequest, ExecutionResult, PluginManifest } from '../../plugin-loader/PluginContract';
import type { Container } from '../../di/Container';
import type { RuntimeCoordinator } from '../../runtime/RuntimeCoordinator';
import type { EvidencePipeline } from '../../framework/evidence/EvidencePipeline';
import { HealthcareMetrics, type HealthcareInput } from './metrics/HealthcareMetrics';
import { HealthcareScoreEngine } from './scoring/HealthcareScoreEngine';
import { loadHealthcareCalibration, type HealthcareCalibrationProfile } from './calibration/HealthcareCalibration';
import { HealthcareDecision } from './decision/HealthcareDecision';
import { HealthcareEvidence } from './evidence/HealthcareEvidence';

export const HEALTHCARE_ENGINE_ID = 'sector.healthcare';

export class HealthcareEngine implements SectorPlugin {
  readonly identity = {
    engineId: HEALTHCARE_ENGINE_ID,
    sectorFamily: 'Healthcare',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
  };
  readonly manifest: PluginManifest = {
    engineId: HEALTHCARE_ENGINE_ID,
    sectorFamily: 'Healthcare',
    engineVersion: '1.0.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence'],
    compatibility: { framework: '1.0', methodology: 'IES-009 v1.0' },
  };

  private calibration: HealthcareCalibrationProfile = loadHealthcareCalibration();
  private metrics = new HealthcareMetrics();
  private scoreEngine = new HealthcareScoreEngine();
  private decision!: HealthcareDecision;
  private evidence!: HealthcareEvidence;
  private runtime!: RuntimeCoordinator;
  private evidencePipeline!: EvidencePipeline;

  onDiscover(): void { /* no-op */ }

  onRegister(_ctx: Container): boolean {
    this.decision = new HealthcareDecision(this.calibration);
    return true;
  }

  onInitialize(ctx: Container): void {
    this.evidencePipeline = ctx.resolve<EvidencePipeline>('evidenceService');
    this.runtime = ctx.resolve<RuntimeCoordinator>('runtimeCoordinator');
    this.evidence = new HealthcareEvidence(this.evidencePipeline);
  }

  execute(_ctx: Container, request: ExecutionRequest): ExecutionResult {
    const input = request.inputs as unknown as HealthcareInput;
    const metrics = this.metrics.evaluate(input);
    const qualityFail = input.qualityFlag === 'FAIL';
    const score = this.scoreEngine.score(metrics, qualityFail);
    const decision = this.decision.decide({
      composite: score.composite,
      clinicalQualityFail: qualityFail,
      occupancy: metrics['HC-001'],
      regulatoryFlag: input.regulatoryFlag as string | undefined,
      pipelineFlag: input.pipelineFlag as string | undefined,
      confidence: 0.8,
    });

    const snapshot = this.runtime.recordSnapshot(
      HEALTHCARE_ENGINE_ID,
      metrics,
      score.pillars as unknown as Record<string, number>,
      decision.verdict,
    );
    const evidence = this.evidence.build({
      engineId: HEALTHCARE_ENGINE_ID,
      metrics,
      score,
      decision,
      calibrationVersion: this.calibration.version,
      snapshotId: snapshot.snapshotId,
      frameworkVersion: '1.0',
      methodologyVersion: 'IES-009 v1.0',
    });

    return {
      state: 'COMPLETED',
      snapshotRef: snapshot.snapshotId,
      evidenceRef: evidence.evidenceId,
      metadata: { verdict: decision.verdict, composite: decision.composite, evidenceId: evidence.evidenceId },
    };
  }

  onComplete(): void { /* no-op */ }
}
