/** Banking Sector Engine (WP-3) — implements SectorPlugin, consumes platform services. */
import type { SectorPlugin, ExecutionRequest, ExecutionResult, PluginManifest } from '../../plugin-loader/PluginContract';
import type { Container } from '../../di/Container';
import { BankingMetrics, type BankingInput } from './metrics/BankingMetrics';
import { BankingScoreEngine } from './scoring/BankingScoreEngine';
import { loadBankingCalibration, type BankingCalibrationProfile } from './calibration/BankingCalibration';
import { BankingDecision } from './decision/BankingDecision';
import { BankingEvidence } from './evidence/BankingEvidence';
import type { EvidencePipeline } from '../../framework/evidence/EvidencePipeline';
import type { RuntimeCoordinator } from '../../runtime/RuntimeCoordinator';

export const BANKING_ENGINE_ID = 'sector.banking';

export class BankingEngine implements SectorPlugin {
  readonly identity = {
    engineId: BANKING_ENGINE_ID,
    sectorFamily: 'Banking',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
  };
  readonly manifest: PluginManifest = {
    engineId: BANKING_ENGINE_ID,
    sectorFamily: 'Banking',
    engineVersion: '1.0.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence'],
    compatibility: { framework: '1.0', methodology: 'IES-006 v1.0' },
  };

  private calibration: BankingCalibrationProfile = loadBankingCalibration();
  private metrics = new BankingMetrics();
  private scoreEngine = new BankingScoreEngine();
  private decision!: BankingDecision;
  private evidence!: BankingEvidence;
  private runtime!: RuntimeCoordinator;
  private evidencePipeline!: EvidencePipeline;

  onDiscover(): void { /* no-op */ }

  onRegister(_ctx: Container): boolean {
    this.decision = new BankingDecision(this.calibration);
    return true;
  }

  onInitialize(ctx: Container): void {
    this.evidencePipeline = ctx.resolve<EvidencePipeline>('evidenceService');
    this.runtime = ctx.resolve<RuntimeCoordinator>('runtimeCoordinator');
    this.evidence = new BankingEvidence(this.evidencePipeline);
  }

  execute(_ctx: Container, request: ExecutionRequest): ExecutionResult {
    const input = request.inputs as unknown as BankingInput;
    const metrics = this.metrics.evaluate(input);
    const score = this.scoreEngine.score(metrics);
    const decision = this.decision.decide({
      composite: score.composite,
      assetQuality: score.pillars['asset-quality'],
      capitalStrength: score.pillars['capital-strength'],
      gnpa: metrics['BM-005'],
      governanceFlag: input.governanceFlag as string | undefined,
      confidence: 0.8,
    });

    // Record snapshot + evidence through the platform.
    const snapshot = this.runtime.recordSnapshot(
      BANKING_ENGINE_ID,
      metrics,
      score.pillars as unknown as Record<string, number>,
      decision.verdict,
    );
    const evidence = this.evidence.build({
      engineId: BANKING_ENGINE_ID,
      metrics,
      score,
      decision,
      calibrationVersion: this.calibration.version,
      snapshotId: snapshot.snapshotId,
      frameworkVersion: '1.0',
      methodologyVersion: 'IES-006 v1.0',
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
