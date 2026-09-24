/** Consumer Calibration Loader (WP-3) — loads frozen calibration profile (immutable, external). */
import { deepFreeze } from '../../../infrastructure/deepFreeze';
import calibrationProfile from '../consumer-calibration-1.0.0.json';

export interface ConsumerWeights {
  quality: number;
  growth: number;
  risk: number;
  profitability: number;
  capitalEfficiency: number;
  valuation: number;
}
export interface ConsumerSegmentProfile {
  weights: ConsumerWeights;
  leverageAlert: number;
}
export interface VerdictBand {
  min: number;
  max: number;
  verdict: string;
}
export interface ConsumerCalibrationProfile {
  readonly profileId: string;
  readonly version: string;
  readonly bandScores: Readonly<Record<string, unknown[]>>;
  readonly segments: Readonly<Record<string, ConsumerSegmentProfile>>;
  readonly demandDurabilityRisk: Readonly<Record<string, number>>;
  readonly verdictMapping: readonly VerdictBand[];
}

export function loadConsumerCalibration(): ConsumerCalibrationProfile {
  const p = calibrationProfile as unknown as {
    profile: string;
    version: string;
    bandScores: Record<string, unknown[]>;
    segments: Record<string, ConsumerSegmentProfile>;
    demandDurabilityRisk: Record<string, number>;
    verdictMapping: VerdictBand[];
  };
  return deepFreeze({
    profileId: p.profile,
    version: p.version,
    bandScores: p.bandScores,
    segments: p.segments,
    demandDurabilityRisk: p.demandDurabilityRisk,
    verdictMapping: p.verdictMapping,
  });
}
