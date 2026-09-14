/** Hospitality Calibration Loader (WP-3) — loads frozen calibration profile (immutable, external). */
import { deepFreeze } from '../../../infrastructure/deepFreeze';
import calibrationProfile from '../hospitality-calibration-1.0.0.json';

export interface BusinessModelWeights {
  occupancy: number;
  demand: number;
  growth: number;
  profitability: number;
  earningsQuality: number;
  capitalRisk: number;
}
export interface BusinessModelProfile {
  weights: BusinessModelWeights;
  leverageAlert: number;
}
export interface DemandQualityBand {
  minPct: number;
  score: number;
}
export interface VerdictBand {
  min: number;
  max: number;
  verdict: string;
}
export interface HospitalityCalibrationProfile {
  readonly profileId: string;
  readonly version: string;
  readonly bandScores: Readonly<Record<string, unknown[]>>;
  readonly demandQualityBands: Readonly<Record<string, DemandQualityBand>>;
  readonly businessModels: Readonly<Record<string, BusinessModelProfile>>;
  readonly verdictMapping: readonly VerdictBand[];
}

export function loadHospitalityCalibration(): HospitalityCalibrationProfile {
  const p = calibrationProfile as unknown as {
    profile: string;
    version: string;
    bandScores: Record<string, unknown[]>;
    demandQualityBands: Record<string, DemandQualityBand>;
    businessModels: Record<string, BusinessModelProfile>;
    verdictMapping: VerdictBand[];
  };
  return deepFreeze({
    profileId: p.profile,
    version: p.version,
    bandScores: p.bandScores,
    demandQualityBands: p.demandQualityBands,
    businessModels: p.businessModels,
    verdictMapping: p.verdictMapping,
  });
}
