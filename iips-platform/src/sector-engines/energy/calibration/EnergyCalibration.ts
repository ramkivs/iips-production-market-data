/** Energy Calibration Loader (WP-3) — loads frozen calibration profile (immutable, external). */
import { deepFreeze } from '../../../infrastructure/deepFreeze';
import calibrationProfile from '../energy-calibration-1.0.0.json';

export interface EnergyWeights {
  quality: number;
  growth: number;
  risk: number;
  profitability: number;
  capitalEfficiency: number;
  valuation: number;
}
export interface EnergySegmentProfile {
  weights: EnergyWeights;
  leverageAlert: number;
}
export interface VerdictBand {
  min: number;
  max: number;
  verdict: string;
}
export interface EnergyCalibrationProfile {
  readonly profileId: string;
  readonly version: string;
  readonly bandScores: Readonly<Record<string, unknown[]>>;
  readonly segments: Readonly<Record<string, EnergySegmentProfile>>;
  readonly commodityExposureRisk: Readonly<Record<string, number>>;
  readonly verdictMapping: readonly VerdictBand[];
}

export function loadEnergyCalibration(): EnergyCalibrationProfile {
  const p = calibrationProfile as unknown as {
    profile: string;
    version: string;
    bandScores: Record<string, unknown[]>;
    segments: Record<string, EnergySegmentProfile>;
    commodityExposureRisk: Record<string, number>;
    verdictMapping: VerdictBand[];
  };
  return deepFreeze({
    profileId: p.profile,
    version: p.version,
    bandScores: p.bandScores,
    segments: p.segments,
    commodityExposureRisk: p.commodityExposureRisk,
    verdictMapping: p.verdictMapping,
  });
}
