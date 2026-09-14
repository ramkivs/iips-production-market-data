/** Industrials Calibration Loader (WP-3) — loads frozen calibration profile (immutable, external). */
import { deepFreeze } from '../../../infrastructure/deepFreeze';
import calibrationProfile from '../industrials-calibration-1.0.0.json';

export interface VerdictBand {
  min: number;
  max: number;
  verdict: string;
}
export interface IndustrialsCalibrationProfile {
  readonly profileId: string;
  readonly version: string;
  readonly bandScores: Readonly<Record<string, unknown[]>>;
  readonly segments: Readonly<Record<string, { w: number[]; leverageAlert: number }>>;
  readonly archetypeRisk: Readonly<Record<string, number>>;
  readonly verdictMapping: readonly VerdictBand[];
}

export function loadIndustrialsCalibration(): IndustrialsCalibrationProfile {
  const p = calibrationProfile as unknown as {
    profile: string;
    version: string;
    bandScores: Record<string, unknown[]>;
    segments: Record<string, { w: number[]; leverageAlert: number }>;
    archetypeRisk: Record<string, number>;
    verdictMapping: VerdictBand[];
  };
  return deepFreeze({
    profileId: p.profile,
    version: p.version,
    bandScores: p.bandScores,
    segments: p.segments,
    archetypeRisk: p.archetypeRisk,
    verdictMapping: p.verdictMapping,
  });
}
