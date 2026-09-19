/**
 * Institutional Investment Platform System (IIPS)
 * Macroeconomic Series Engine & Vintage Manager (P10 / D08)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W2-AUTH-2026-01
 */

import { MacroDataPayload, MacroSeriesId } from '../contracts/d08_macro.js';
import { QualityState } from '../contracts/types.js';

export interface MacroQueryResult {
  seriesId: MacroSeriesId;
  asOf: string;
  matchedPeriod: string;
  vintageDate: string;
  releaseDate: string;
  value: number;
  unit: string;
  isStepwiseCarryForward: boolean;
  qualityState: QualityState;
}

export class MacroEngine {
  private seriesStore: MacroDataPayload[] = [];

  public ingestMacroData(data: MacroDataPayload): void {
    if (typeof data.value !== 'number' || isNaN(data.value)) {
      throw new Error(`Invalid macro value for series ${data.seriesId}: ${data.value}`);
    }
    this.seriesStore.push(Object.freeze({ ...data }));
  }

  /**
   * Retrieves the most recent knowable macroeconomic value at a point in time (PIT).
   * Enforces vintageDate <= asOf to prevent lookahead bias and applies stepwise carry-forward.
   */
  public queryAsOf(seriesId: MacroSeriesId, asOf: string): MacroQueryResult | null {
    const asOfMs = Date.parse(asOf);

    // Filter series matching seriesId and whose vintageDate <= asOf
    const eligible = this.seriesStore.filter((m) => {
      if (m.seriesId !== seriesId) return false;
      const vintageMs = Date.parse(m.vintageDate);
      return vintageMs <= asOfMs;
    });

    if (eligible.length === 0) {
      return null;
    }

    // Sort by vintageDate descending to get the latest knowable vintage
    eligible.sort((a, b) => Date.parse(b.vintageDate) - Date.parse(a.vintageDate));
    const latestKnown = eligible[0];

    const releaseMs = Date.parse(latestKnown.releaseDate);
    const isStepwiseCarryForward = asOfMs > releaseMs;

    return {
      seriesId,
      asOf,
      matchedPeriod: latestKnown.period,
      vintageDate: latestKnown.vintageDate,
      releaseDate: latestKnown.releaseDate,
      value: latestKnown.value,
      unit: latestKnown.unit,
      isStepwiseCarryForward,
      qualityState: 'GOOD',
    };
  }
}
