/**
 * Cross-Sector Intelligence Plugin (CSIP).
 *
 * CSIP is a *platform capability*, not a sector engine. It consumes the **published
 * outputs** of the four immutable sector engines (Banking/Insurance/Capital Markets/
 * Healthcare) via the Universal Investment Ontology and produces portfolio-level
 * intelligence. It never reads engine internals, never recomputes sector scores, and
 * never duplicates sector methodology — engines remain black boxes.
 *
 * The plugin hosts the CrossSectorEngine (7 core services) and exposes its pipeline
 * outputs through the shared platform (snapshot, evidence, replay).
 */
import type { SectorPlugin, ExecutionRequest, ExecutionResult, PluginManifest } from '../../plugin-loader/PluginContract';
import type { Container } from '../../di/Container';
import type { RuntimeCoordinator } from '../../runtime/RuntimeCoordinator';
import type { EvidencePipeline } from '../../framework/evidence/EvidencePipeline';
import { CrossSectorEngine, type PipelineInput } from './CrossSectorEngine';

export const CROSS_SECTOR_PLUGIN_ID = 'platform.cross-sector';

export class CrossSectorPlugin implements SectorPlugin {
  readonly identity = {
    engineId: CROSS_SECTOR_PLUGIN_ID,
    sectorFamily: 'Cross-Sector',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
  };
  readonly manifest: PluginManifest = {
    engineId: CROSS_SECTOR_PLUGIN_ID,
    sectorFamily: 'Cross-Sector',
    engineVersion: '1.0.0',
    capabilities: ['portfolio-intelligence', 'ranking', 'allocation', 'diversification', 'opportunity', 'correlation', 'reporting', 'evidence'],
    compatibility: { framework: '1.0', consumedEngines: 'banking/insurance/capital-markets/healthcare v1.0' },
  };

  private runtime!: RuntimeCoordinator;
  private evidencePipeline!: EvidencePipeline;
  private readonly engine = new CrossSectorEngine();

  onDiscover(): void { /* no-op */ }

  onRegister(_ctx: Container): boolean {
    return true;
  }

  onInitialize(ctx: Container): void {
    this.runtime = ctx.resolve<RuntimeCoordinator>('runtimeCoordinator');
    this.evidencePipeline = ctx.resolve<EvidencePipeline>('evidenceService');
  }

  /** Consume published engine outputs (normalized) → deterministic pipeline result. */
  execute(_ctx: Container, request: ExecutionRequest): ExecutionResult {
    const input = request.inputs as unknown as PipelineInput;
    const result = this.engine.run({
      portfolioId: input.portfolioId ?? 'PF',
      scenario: input.scenario ?? 'Balanced',
      strategy: input.strategy ?? 'Balanced',
      outputs: Array.isArray(input.outputs) ? input.outputs : [],
      topN: input.topN ?? 10,
      reportTypes: input.reportTypes,
    });

    // Record a snapshot through the shared runtime (replay-compatible).
    const snapshot = this.runtime.recordSnapshot(
      CROSS_SECTOR_PLUGIN_ID,
      { holdings: result.intelligence.holdings },
      result.intelligence.sectorExposure,
      'PORTFOLIO_SUMMARY',
    );

    // Build portfolio evidence through the shared Evidence Pipeline.
    const evidence = this.evidencePipeline.build({
      engineId: CROSS_SECTOR_PLUGIN_ID,
      recommendation: result.evidence.recommendation,
      compositeScore: result.intelligence.avgConviction,
      confidence: result.intelligence.holdings > 0 ? 1 : 0,
      supportingScores: [
        { id: 'concentration', name: 'Concentration', value: result.intelligence.concentration },
        { id: 'diversificationScore', name: 'Diversification Score', value: result.intelligence.diversificationScore },
      ],
      decisionRulesApplied: result.allocation.rulesApplied,
      calibrationVersion: 'csip-1.0.0',
      replayReference: snapshot.snapshotId,
      provenance: {
        frameworkVersion: '1.0',
        engineVersion: '1.0.0',
        methodologyVersion: 'CSIP v1.0',
        snapshotId: snapshot.snapshotId,
      },
    });

    return {
      state: 'COMPLETED',
      snapshotRef: snapshot.snapshotId,
      evidenceRef: evidence.evidenceId,
      metadata: {
        holdings: result.intelligence.holdings,
        sectorExposure: result.intelligence.sectorExposure,
        concentration: result.intelligence.concentration,
        diversificationScore: result.intelligence.diversificationScore,
        avgConviction: result.intelligence.avgConviction,
        avgQuality: result.intelligence.avgQuality,
        avgRisk: result.intelligence.avgRisk,
        ranking: result.ranking,
        allocationRecommendation: result.allocation.recommendation,
      },
    };
  }

  onComplete(): void { /* no-op */ }
}
