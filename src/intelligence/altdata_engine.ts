/**
 * Institutional Investment Platform System (IIPS)
 * Alternative Data Governance & Signal Processor (P10 / D09)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W2-AUTH-2026-01
 */

import { QualityState } from '../contracts/types.js';

export interface GovernedAlternativeDataSignal {
  companyId: string;
  signalId: string;
  datasetName: string;
  signalType: string;
  observedAt: string; // ISO-8601 UTC
  value: number;
  unit: string;
  confidenceScore: number; // 0.0 to 1.0
  approvalRef: string;     // Mandatory regulatory / program approval reference
  coverage: string;
}

export interface CompositeAlternativeSignal {
  companyId: string;
  signalType: string;
  asOf: string;
  weightedValue: number;
  compositeConfidence: number;
  constituentCount: number;
  approvalRefs: string[];
  qualityState: QualityState;
}

export class AltDataEngine {
  private signals: GovernedAlternativeDataSignal[] = [];

  public ingestSignal(signal: GovernedAlternativeDataSignal): void {
    // Mandatory approvalRef invariant
    if (!signal.approvalRef || typeof signal.approvalRef !== 'string' || signal.approvalRef.trim().length === 0) {
      throw new Error(`Alternative data rejection: signal '${signal.signalId}' lacks mandatory approvalRef`);
    }

    if (signal.confidenceScore < 0.0 || signal.confidenceScore > 1.0) {
      throw new Error(`Alternative data rejection: invalid confidenceScore ${signal.confidenceScore}`);
    }

    this.signals.push(Object.freeze({ ...signal }));
  }

  /**
   * Computes composite alternative signal with confidence weighting as of a point in time (PIT).
   */
  public computeCompositeSignal(params: {
    companyId: string;
    signalType: string;
    asOf: string;
  }): CompositeAlternativeSignal | null {
    const { companyId, signalType, asOf } = params;
    const asOfMs = Date.parse(asOf);

    // Filter signals observed <= asOf
    const eligible = this.signals.filter((s) => {
      const obsMs = Date.parse(s.observedAt);
      return s.companyId === companyId && s.signalType === signalType && obsMs <= asOfMs;
    });

    if (eligible.length === 0) {
      return null;
    }

    // Compute confidence-weighted average
    const totalConfidence = eligible.reduce((acc, s) => acc + s.confidenceScore, 0);
    if (totalConfidence === 0) {
      return {
        companyId,
        signalType,
        asOf,
        weightedValue: 0,
        compositeConfidence: 0,
        constituentCount: eligible.length,
        approvalRefs: Array.from(new Set(eligible.map((s) => s.approvalRef))),
        qualityState: 'UNAVAILABLE',
      };
    }

    const weightedSum = eligible.reduce((acc, s) => acc + s.value * s.confidenceScore, 0);
    const weightedValue = Math.round((weightedSum / totalConfidence) * 100) / 100;
    const avgConfidence = Math.round((totalConfidence / eligible.length) * 100) / 100;

    return {
      companyId,
      signalType,
      asOf,
      weightedValue,
      compositeConfidence: avgConfidence,
      constituentCount: eligible.length,
      approvalRefs: Array.from(new Set(eligible.map((s) => s.approvalRef))),
      qualityState: avgConfidence >= 0.7 ? 'GOOD' : 'PARTIAL',
    };
  }
}
