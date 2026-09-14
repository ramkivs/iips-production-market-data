/** Utilities Calibration Loader (WP-3) — loads frozen calibration profile (immutable, external). */
import { deepFreeze } from '../../../infrastructure/deepFreeze';
import calibrationProfile from '../utilities-calibration-1.0.0.json';

export interface UtilitiesWeights {
  quality: number;
  growth: number;
  risk: number;
  profitability: number;
  capitalEfficiency: number;
  valuation: number;
}
export interface UtilitiesSegmentProfile {
  weights: UtilitiesWeights;
  leverageAlert: number;
}
export interface VerdictBand {
  min: number;
  max: number;
  verdict: string;
}
export interface UtilitiesCalibrationProfile {
  readonly profileId: string;
  readonly version: string;
  readonly bandScores: Readonly<Record<string, unknown[]>>;
  readonly segments: Readonly<Record<string, UtilitiesSegmentProfile>>;
  readonly regulatoryPostureRisk: Readonly<Record<string, number>>;
  readonly verdictMapping: readonly VerdictBand[];
}

export function loadUtilitiesCalibration(): UtilitiesCalibrationProfile {
  const p = calibrationProfile as unknown as {
    profile: string;
    version: string;
    bandScores: Record<string, unknown[]>;
    segments: Record<string, UtilitiesSegmentProfile>;
    regulatoryPostureRisk: Record<string, number>;
    verdictMapping: VerdictBand[];
  };
  return deepFreeze({
    profileId: p.profile,
    version: p.version,
    bandScores: p.bandScores,
    segments: p.segments,
    regulatoryPostureRisk: p.regulatoryPostureRisk,
    verdictMapping: p.verdictMapping,
  });
}
