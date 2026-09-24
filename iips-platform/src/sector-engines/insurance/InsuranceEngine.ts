/** Insurance Sector Engine (WP-3) — implements SectorPlugin, consumes platform services, frozen assets. */
import type { SectorPlugin, ExecutionRequest, ExecutionResult, PluginManifest } from '../../plugin-loader/PluginContract';
import type { Container } from '../../di/Container';
import type { RuntimeCoordinator } from '../../runtime/RuntimeCoordinator';
import type { EvidencePipeline } from '../../framework/evidence/EvidencePipeline';
import { InsuranceMetrics, type InsuranceInput } from './metrics/InsuranceMetrics';
import { InsuranceScoreEngine } from './scoring/InsuranceScoreEngine';
import { loadInsuranceCalibration, type InsuranceCalibrationProfile } from './calibration/InsuranceCalibration';
import { InsuranceDecision } from './decision/InsuranceDecision';
import { InsuranceEvidence } from './evidence/InsuranceEvidence';

export const INSURANCE_ENGINE_ID = 'sector.insurance';

export class InsuranceEngine implements SectorPlugin {
  readonly identity = {
    engineId: INSURANCE_ENGINE_ID,
    sectorFamily: 'Insurance',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
  };
  readonly manifest: PluginManifest = {
    engineId: INSURANCE_ENGINE_ID,
    sectorFamily: 'Insurance',
    engineVersion: '1.0.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence'],
    compatibility: { framework: '1.0', methodology: 'IES-007 v1.0' },
  };

  private calibration: InsuranceCalibrationProfile = loadInsuranceCalibration();
  private metrics = new InsuranceMetrics();
  private scoreEngine = new InsuranceScoreEngine();
  private decision!: InsuranceDecision;
  private evidence!: InsuranceEvidence;
  private runtime!: RuntimeCoordinator;
  private evidencePipeline!: EvidencePipeline;

  onDiscover(): void { /* no-op */ }

  onRegister(_ctx: Container): boolean {
    this.decision = new InsuranceDecision(this.calibration);
    return true;
  }

  onInitialize(ctx: Container): void {
    this.evidencePipeline = ctx.resolve<EvidencePipeline>('evidenceService');
    this.runtime = ctx.resolve<RuntimeCoordinator>('runtimeCoordinator');
    this.evidence = new InsuranceEvidence(this.evidencePipeline);
  }

  execute(_ctx: Container, request: ExecutionRequest): ExecutionResult {
    const input = request.inputs as unknown as InsuranceInput;
    const metrics = this.metrics.evaluate(input);
    const score = this.scoreEngine.score(metrics);
    const decision = this.decision.decide({
      composite: score.composite,
      combinedRatio: metrics['IM-001'],
      solvency: score.pillars.solvency,
      solvencyRatio: metrics['IM-002'],
      persistency: metrics['IM-005'],
      governanceFlag: input.governanceFlag as string | undefined,
      catastropheFlag: input.catastropheFlag as string | undefined,
      confidence: 0.8,
    });

    const snapshot = this.runtime.recordSnapshot(
      INSURANCE_ENGINE_ID,
      metrics,
      score.pillars as unknown as Record<string, number>,
      decision.verdict,
    );
    const evidence = this.evidence.build({
      engineId: INSURANCE_ENGINE_ID,
      metrics,
      score,
      decision,
      calibrationVersion: this.calibration.version,
      snapshotId: snapshot.snapshotId,
      frameworkVersion: '1.0',
      methodologyVersion: 'IES-007 v1.0',
    });

    return {
      state: 'COMPLETED',
      snapshotRef: snapshot.snapshotId,
      evidenceRef: evidence.evidenceId,
      metadata: {
        verdict: decision.verdict,
        composite: decision.composite,
        evidenceId: evidence.evidenceId,
      },
    };
  }

  onComplete(): void { /* no-op */ }
}
