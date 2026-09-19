/**
 * Institutional Investment Platform System (IIPS)
 * Server-Side Screener Engine (P12 / Contract C6)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 */

import { ExecutiveProvenance } from './types.js';
import { QualityState } from '../contracts/types.js';
import { computeLineageHash } from '../contracts/provenance.js';

export interface ScreenerFilter {
  sector?: string;
  maxPe?: number;
  minRoe?: number;
  minOperatingMargin?: number;
  minScore?: number;
  minGrade?: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
}

export interface ScreenerCandidate {
  companyId: string;
  companyName: string;
  sector: string;
  ltp: number;
  pe: number | null;
  pb: number | null;
  roe: number | null;
  operatingMargin: number | null;
  score: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  quality: QualityState;
}

export interface ScreenerResponse {
  totalMatched: number;
  results: ScreenerCandidate[];
  asOf: string;
  provenance: ExecutiveProvenance;
}

export class ScreenerService {
  private candidates: ScreenerCandidate[] = [];

  public registerCandidate(candidate: ScreenerCandidate): void {
    this.candidates.push(Object.freeze({ ...candidate }));
  }

  /**
   * Executes server-side screening query according to Contract C6 rules.
   */
  public executeScreen(filter: ScreenerFilter, asOf: string = new Date().toISOString()): ScreenerResponse {
    const gradeRanks: Record<string, number> = {
      'A+': 7,
      A: 6,
      'B+': 5,
      B: 4,
      C: 3,
      D: 2,
      F: 1,
    };

    const matched = this.candidates.filter((c) => {
      if (filter.sector && c.sector.toUpperCase() !== filter.sector.toUpperCase()) {
        return false;
      }
      if (filter.maxPe !== undefined && (c.pe === null || c.pe > filter.maxPe)) {
        return false;
      }
      if (filter.minRoe !== undefined && (c.roe === null || c.roe < filter.minRoe)) {
        return false;
      }
      if (filter.minOperatingMargin !== undefined && (c.operatingMargin === null || c.operatingMargin < filter.minOperatingMargin)) {
        return false;
      }
      if (filter.minScore !== undefined && c.score < filter.minScore) {
        return false;
      }
      if (filter.minGrade) {
        const reqRank = gradeRanks[filter.minGrade] || 1;
        const candidateRank = gradeRanks[c.grade] || 1;
        if (candidateRank < reqRank) {
          return false;
        }
      }
      return true;
    });

    // Sort by score descending
    matched.sort((a, b) => b.score - a.score);

    const lineageDigest = computeLineageHash(matched, {
      sourceClassification: 'DERIVED',
      asOf,
      dataVersion: 'v1.0.0-screener',
    });

    const provenance: ExecutiveProvenance = {
      sourceClassification: 'DERIVED',
      asOf,
      evaluatedAt: new Date().toISOString(),
      dataVersion: 'v1.0.0-screener',
      lineageDigest,
      quality: 'GOOD',
      replayConstraintApplied: false,
    };

    return {
      totalMatched: matched.length,
      results: matched,
      asOf,
      provenance,
    };
  }
}
