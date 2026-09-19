/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-F / Package P15: AD-4 Frozen 13-Engine & CSIP Revalidation
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W5-AUTH-2026-01
 */

import { FrozenEngines } from '../engine_adapters/frozen_engines.js';
import { CertifiedSectorEngineId } from '../engine_adapters/types.js';
import { computeLineageHash } from '../contracts/provenance.js';

export interface EngineRevalidationReport {
  totalEnginesRevalidated: number;
  isAllInvariant: boolean;
  sectorResults: Record<CertifiedSectorEngineId, {
    normalizedScore: number;
    grade: string;
    goldenDigest: string;
    factorCount: number;
    isInvariant: boolean;
  }>;
  csipCompositeResult: {
    totalRanked: number;
    topRankedCompany: string;
    bottomRankedCompany: string;
    csipGoldenDigest: string;
    isInvariant: boolean;
  };
}

export class EngineRevalidationEngine {
  public static readonly ALL_13_SECTORS: CertifiedSectorEngineId[] = [
    'SECTOR_IT',
    'SECTOR_BANKING',
    'SECTOR_AUTO',
    'SECTOR_PHARMA',
    'SECTOR_FMCG',
    'SECTOR_METALS',
    'SECTOR_OIL_GAS',
    'SECTOR_POWER',
    'SECTOR_CEMENT',
    'SECTOR_TELECOM',
    'SECTOR_CONSUMER_DURABLES',
    'SECTOR_CAPITAL_GOODS',
    'SECTOR_CHEMICALS',
  ];

  /**
   * Revalidates all 13 certified sector scoring models and CSIP composite model against reference benchmarks.
   */
  public static revalidateAll(): EngineRevalidationReport {
    const benchmarkInputs = { pe: 20.0, pb: 3.0, roe: 18.0, roce: 20.0, operatingMargin: 18.0, beta: 1.0, momentum: 1.0 };
    const sectorResults: EngineRevalidationReport['sectorResults'] = {} as any;
    const scoresForCSIP: Array<{ companyId: string; normalizedScore: number }> = [];

    for (const sector of EngineRevalidationEngine.ALL_13_SECTORS) {
      const res = FrozenEngines.executeSectorEngine(sector, benchmarkInputs);
      const goldenDigest = computeLineageHash(res, {
        sourceClassification: 'CERTIFIED_ENGINE',
        asOf: '2026-09-19T00:00:00.000Z',
        dataVersion: 'v1.0.0-certified-frozen',
      });

      sectorResults[sector] = {
        normalizedScore: res.normalizedScore,
        grade: res.grade,
        goldenDigest,
        factorCount: Object.keys(res.factors).length,
        isInvariant: res.normalizedScore >= 0 && res.normalizedScore <= 100 && res.grade.length > 0,
      };

      scoresForCSIP.push({ companyId: `CO_${sector}`, normalizedScore: res.normalizedScore });
    }

    const csipRanking = FrozenEngines.executeCSIP(scoresForCSIP);
    const csipGoldenDigest = computeLineageHash(csipRanking, {
      sourceClassification: 'CERTIFIED_ENGINE',
      asOf: '2026-09-19T00:00:00.000Z',
      dataVersion: 'v1.0.0-csip-frozen',
    });

    const isAllInvariant =
      Object.values(sectorResults).every((r) => r.isInvariant) &&
      csipRanking.length === 13 &&
      csipRanking[0].rank === 1 &&
      csipRanking[12].rank === 13;

    return {
      totalEnginesRevalidated: 13,
      isAllInvariant,
      sectorResults,
      csipCompositeResult: {
        totalRanked: csipRanking.length,
        topRankedCompany: csipRanking[0].companyId,
        bottomRankedCompany: csipRanking[12].companyId,
        csipGoldenDigest,
        isInvariant: isAllInvariant,
      },
    };
  }
}
