/** Evidence Pipeline — build immutable, deterministic evidence packages (generic, IES-006.2A WP-2). */
import { deepFreeze } from '../../infrastructure/deepFreeze';
import type { Clock } from '../../infrastructure/Clock';

export interface EvidenceComponent {
  readonly id: string;
  readonly name: string;
  readonly value: number;
}

export interface EvidenceProvenance {
  readonly frameworkVersion: string;
  readonly engineVersion: string;
  readonly methodologyVersion: string;
  readonly snapshotId: string;
}

export interface EvidencePackage {
  readonly evidenceId: string;
  readonly engineId: string;
  readonly recommendation: string;
  readonly compositeScore: number;
  readonly confidence: number;
  readonly keyMetrics: readonly EvidenceComponent[];
  readonly supportingScores: readonly EvidenceComponent[];
  readonly calibrationVersion: string;
  readonly decisionRulesApplied: readonly string[];
  readonly replayReference: string;
  readonly provenance: EvidenceProvenance;
  readonly generatedAt: string;
}

export interface EvidenceInput {
  engineId: string;
  recommendation: string;
  compositeScore: number;
  confidence: number;
  keyMetrics?: readonly EvidenceComponent[];
  supportingScores?: readonly EvidenceComponent[];
  calibrationVersion?: string;
  decisionRulesApplied?: readonly string[];
  replayReference?: string;
  provenance: EvidenceProvenance;
}

export class EvidencePipeline {
  constructor(private readonly clock: Clock) {}

  build(input: EvidenceInput): Readonly<EvidencePackage> {
    const evidenceId = `ev_${input.engineId}_${this.clock.now()}`;
    const pkg: EvidencePackage = {
      evidenceId,
      engineId: input.engineId,
      recommendation: input.recommendation,
      compositeScore: input.compositeScore,
      confidence: input.confidence,
      keyMetrics: Object.freeze([...(input.keyMetrics ?? [])]),
      supportingScores: Object.freeze([...(input.supportingScores ?? [])]),
      calibrationVersion: input.calibrationVersion ?? 'unknown',
      decisionRulesApplied: Object.freeze([...(input.decisionRulesApplied ?? [])]),
      replayReference: input.replayReference ?? '',
      provenance: Object.freeze({ ...input.provenance }),
      generatedAt: this.clock.now(),
    };
    return deepFreeze(pkg);
  }

  /** Validate that an evidence package is well-formed + immutable. */
  validate(pkg: EvidencePackage): boolean {
    return (
      !!pkg.evidenceId &&
      !!pkg.engineId &&
      !!pkg.recommendation &&
      typeof pkg.compositeScore === 'number' &&
      pkg.confidence >= 0 &&
      pkg.confidence <= 100 &&
      Object.isFrozen(pkg) &&
      Array.isArray(pkg.keyMetrics) &&
      Array.isArray(pkg.supportingScores)
    );
  }
}
