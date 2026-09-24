/**
 * Telecommunications Calibration Loader — loads the frozen IES-016 D16 calibration profile
 * (immutable, external). The frozen profile carries baseline bandScores, per-subsegment
 * calibrated band tables (boundaries + scores together), subsegment weights + leverage alerts,
 * archetype risk multipliers, and the verdict mapping. All immutable via deepFreeze.
 *
 * Implements the accepted D16 M6–M15 methodology exactly. No reinterpretation.
 */
import { deepFreeze } from '../../../infrastructure/deepFreeze';
import calibrationProfile from '../telecommunications-calibration-1.0.0.json';

export interface VerdictBand {
  min: number;
  max: number;
  verdict: string;
}

export interface SegmentCalibration {
  w: number[];
  leverageAlert: number;
}

export interface TelecommunicationsCalibrationProfile {
  readonly profileId: string;
  readonly version: string;
  readonly bandScores: Readonly<Record<string, unknown[]>>;         // baseline band tables
  readonly calibratedBandTables: Readonly<Record<string, Readonly<Record<string, unknown[]>>>>; // per-subsegment
  readonly segments: Readonly<Record<string, SegmentCalibration>>;
  readonly archetypeRisk: Readonly<Record<string, number>>;
  readonly verdictMapping: readonly VerdictBand[];
}

export function loadTelecommunicationsCalibration(): TelecommunicationsCalibrationProfile {
  const p = calibrationProfile as unknown as {
    profile: string;
    version: string;
    bandScores: Record<string, unknown[]>;
    calibratedBandTables: Record<string, Record<string, unknown[]>>;
    segments: Record<string, SegmentCalibration>;
    archetypeRisk: Record<string, number>;
    verdictMapping: Record<string, string>;
  };
  // Frozen calibration encodes verdictMapping in object form ("80-100": "Strong Buy", ...).
  // Parse deterministically (descending min) into ordered VerdictBand[] (lower-incl/upper-excl).
  const verdictMapping = Object.entries(p.verdictMapping)
    .map(([range, verdict]) => {
      const [min, max] = range.split('-').map((n) => Number(n));
      return { min, max, verdict };
    })
    .sort((a, b) => b.min - a.min);
  return deepFreeze({
    profileId: p.profile,
    version: p.version,
    bandScores: p.bandScores,
    calibratedBandTables: p.calibratedBandTables ?? {},
    segments: p.segments,
    archetypeRisk: p.archetypeRisk,
    verdictMapping,
  });
}
