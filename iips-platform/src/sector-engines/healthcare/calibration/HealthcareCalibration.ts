/** Healthcare Calibration Loader (WP-3) — loads frozen calibration profile (immutable, external). */
import { deepFreeze } from '../../../infrastructure/deepFreeze';
import calibrationProfile from '../healthcare-calibration-1.0.0.json';

export interface VerdictBand { minScore: number; maxScore: number; verdict: string; }
export interface HealthcareCalibrationProfile {
  readonly profileId: string;
  readonly version: string;
  readonly engineId: string;
  readonly verdictMapping: readonly VerdictBand[];
  readonly overrideRules: readonly { rule: string; description: string }[];
}

export function loadHealthcareCalibration(): HealthcareCalibrationProfile {
  const profile: HealthcareCalibrationProfile = {
    profileId: calibrationProfile.profileId,
    version: calibrationProfile.version,
    engineId: calibrationProfile.engineId,
    verdictMapping: calibrationProfile.verdictMapping as VerdictBand[],
    overrideRules: calibrationProfile.overrideRules as { rule: string; description: string }[],
  };
  return deepFreeze(profile);
}
