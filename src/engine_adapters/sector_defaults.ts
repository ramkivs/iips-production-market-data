/**
 * Institutional Investment Platform System (IIPS)
 * Governed Sector Default Fallback Injector (P11-03 / AD-12)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 */

import { CertifiedSectorEngineId } from './types.js';

export interface SectorDefaultValues {
  benchmarkPe: number;
  benchmarkPb: number;
  benchmarkRoe: number;
  benchmarkRoce: number;
  benchmarkOperatingMargin: number;
  defaultBeta: number;
}

export const GOVERNED_SECTOR_DEFAULTS: Record<CertifiedSectorEngineId, SectorDefaultValues> = {
  SECTOR_IT: { benchmarkPe: 25.0, benchmarkPb: 6.0, benchmarkRoe: 24.0, benchmarkRoce: 30.0, benchmarkOperatingMargin: 22.0, defaultBeta: 0.95 },
  SECTOR_BANKING: { benchmarkPe: 16.0, benchmarkPb: 2.2, benchmarkRoe: 15.0, benchmarkRoce: 12.0, benchmarkOperatingMargin: 35.0, defaultBeta: 1.15 },
  SECTOR_AUTO: { benchmarkPe: 20.0, benchmarkPb: 3.5, benchmarkRoe: 18.0, benchmarkRoce: 20.0, benchmarkOperatingMargin: 12.0, defaultBeta: 1.05 },
  SECTOR_PHARMA: { benchmarkPe: 28.0, benchmarkPb: 4.0, benchmarkRoe: 16.0, benchmarkRoce: 18.0, benchmarkOperatingMargin: 20.0, defaultBeta: 0.75 },
  SECTOR_FMCG: { benchmarkPe: 40.0, benchmarkPb: 10.0, benchmarkRoe: 28.0, benchmarkRoce: 35.0, benchmarkOperatingMargin: 24.0, defaultBeta: 0.65 },
  SECTOR_METALS: { benchmarkPe: 10.0, benchmarkPb: 1.5, benchmarkRoe: 14.0, benchmarkRoce: 16.0, benchmarkOperatingMargin: 18.0, defaultBeta: 1.35 },
  SECTOR_OIL_GAS: { benchmarkPe: 12.0, benchmarkPb: 1.8, benchmarkRoe: 15.0, benchmarkRoce: 14.0, benchmarkOperatingMargin: 15.0, defaultBeta: 1.10 },
  SECTOR_POWER: { benchmarkPe: 14.0, benchmarkPb: 1.9, benchmarkRoe: 13.0, benchmarkRoce: 12.0, benchmarkOperatingMargin: 28.0, defaultBeta: 0.90 },
  SECTOR_CEMENT: { benchmarkPe: 26.0, benchmarkPb: 3.0, benchmarkRoe: 14.0, benchmarkRoce: 15.0, benchmarkOperatingMargin: 19.0, defaultBeta: 1.00 },
  SECTOR_TELECOM: { benchmarkPe: 30.0, benchmarkPb: 3.8, benchmarkRoe: 12.0, benchmarkRoce: 10.0, benchmarkOperatingMargin: 38.0, defaultBeta: 1.10 },
  SECTOR_CONSUMER_DURABLES: { benchmarkPe: 35.0, benchmarkPb: 5.5, benchmarkRoe: 17.0, benchmarkRoce: 20.0, benchmarkOperatingMargin: 10.0, defaultBeta: 1.05 },
  SECTOR_CAPITAL_GOODS: { benchmarkPe: 32.0, benchmarkPb: 4.5, benchmarkRoe: 16.0, benchmarkRoce: 19.0, benchmarkOperatingMargin: 14.0, defaultBeta: 1.20 },
  SECTOR_CHEMICALS: { benchmarkPe: 24.0, benchmarkPb: 3.2, benchmarkRoe: 17.0, benchmarkRoce: 21.0, benchmarkOperatingMargin: 18.0, defaultBeta: 1.10 },
  CSIP_COMPOSITE: { benchmarkPe: 22.0, benchmarkPb: 3.0, benchmarkRoe: 16.0, benchmarkRoce: 18.0, benchmarkOperatingMargin: 18.0, defaultBeta: 1.00 },
};

export class SectorDefaultInjector {
  public static injectDefaults(
    engineId: CertifiedSectorEngineId,
    inputs: Record<string, number | null | undefined>
  ): { resolvedInputs: Record<string, number>; injectedFields: string[] } {
    const defaults = GOVERNED_SECTOR_DEFAULTS[engineId];
    const resolved: Record<string, number> = {};
    const injectedFields: string[] = [];

    const fieldMap: Record<string, keyof SectorDefaultValues> = {
      pe: 'benchmarkPe',
      pb: 'benchmarkPb',
      roe: 'benchmarkRoe',
      roce: 'benchmarkRoce',
      operatingMargin: 'benchmarkOperatingMargin',
      beta: 'defaultBeta',
    };

    for (const [key, defaultProp] of Object.entries(fieldMap)) {
      const val = inputs[key];
      if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
        resolved[key] = val;
      } else {
        resolved[key] = defaults[defaultProp];
        injectedFields.push(key);
      }
    }

    return { resolvedInputs: resolved, injectedFields };
  }
}
