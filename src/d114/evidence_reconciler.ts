/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-H / Package D114: Historical Acquisition Evidence Reconciler
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / D114 / OI-HIST-01
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import * as crypto from 'crypto';
import {
  CompleteEvidencePackage,
  HistoricalFeasibilityManifest,
  HistoricalCoverageSummary,
  DetailedDateAssessment,
} from './historical_feasibility_runner.js';
import { computeLineageHash } from '../contracts/provenance.js';

export type FeasibilityDetermination =
  | 'FEASIBLE_10Y_UNIFIED_UDIFF'
  | 'FEASIBLE_DUAL_ERA_REQUIRED'
  | 'PARTIALLY_FEASIBLE_CONTEMPORARY_ONLY'
  | 'UNFEASIBLE_ARCHIVE_UNAVAILABLE';

export interface EvidenceReconciliationReport {
  reconciliationId: string;
  sourceManifestId: string;
  evaluatedAt: string;
  feasibilityDetermination: FeasibilityDetermination;
  statistics: {
    totalCalendarDays: number;
    expectedTradingDays: number;
    weekendDays: number;
    holidays: number;
    acquiredValidDays: number;
    http404Days: number;
    networkErrorDays: number;
    corruptArchiveDays: number;
    schemaMismatchDays: number;
    coveragePct: number;
    integrityPct: number;
  };
  eraBreakdown: {
    contemporaryEraUdiff: {
      dateRange: string; // e.g. 2024-07-08 to 2026-09-20
      tradingDays: number;
      acquiredValid: number;
      coveragePct: number;
    };
    historicalEraLegacy: {
      dateRange: string; // e.g. 2016-09-20 to 2024-07-07
      tradingDays: number;
      acquiredUdiff: number;
      requiresLegacyAdapter: boolean;
    };
  };
  hashAudit: {
    totalHashesChecked: number;
    mismatchesDetected: number;
    isCryptographicallyConsistent: boolean;
  };
  governanceDisposition: {
    oiHist01Status: 'OPEN / EXTERNAL / HISTORICAL ACQUISITION BLOCKED';
    productionEligibility: 'NOT AUTHORIZED';
    programDisposition: 'NON_PRODUCTION_HOLD';
    recommendedNextStep: string;
  };
  reconciliationLineageDigest: string;
}

export class HistoricalEvidenceReconciler {
  public static readonly UDIFF_MIGRATION_CUTOFF_DATE = '2024-07-08';

  /**
   * Reconciles a completed 6-file evidence package received from Windows acquisition execution.
   */
  public static reconcileEvidencePackage(evidencePkg: CompleteEvidencePackage): EvidenceReconciliationReport {
    const manifest = evidencePkg.manifest;
    const summary = evidencePkg.coverageSummary;
    const records = manifest.records;

    let contemporaryTradingDays = 0;
    let contemporaryAcquired = 0;
    let historicalTradingDays = 0;
    let historicalAcquired = 0;

    let hashAuditCount = 0;
    let hashMismatches = 0;

    for (const [dateIso, rec] of Object.entries(records)) {
      if (rec.classification === 'TRADING_DAY') {
        if (dateIso >= HistoricalEvidenceReconciler.UDIFF_MIGRATION_CUTOFF_DATE) {
          contemporaryTradingDays++;
          if (rec.status === 'ACQUIRED_VALID') contemporaryAcquired++;
        } else {
          historicalTradingDays++;
          if (rec.status === 'ACQUIRED_VALID') historicalAcquired++;
        }
      }

      // Verify cross-table hash consistency with sha256Manifest
      if (rec.sha256Hex && rec.sha256Hex.length > 0) {
        hashAuditCount++;
        const shaEntry = evidencePkg.sha256Manifest[dateIso];
        if (!shaEntry || shaEntry.sha256Hex.toLowerCase() !== rec.sha256Hex.toLowerCase()) {
          hashMismatches++;
        }
      }
    }

    const totalTrading = summary.targetRange.expectedTradingDays;
    const acquiredValid = summary.metrics.acquiredValidCount;
    const coveragePct = summary.metrics.coveragePctOfTradingDays;
    const integrityPct = summary.metrics.dataIntegrityPct;

    // Determine feasibility classification
    let feasibilityDetermination: FeasibilityDetermination;
    if (acquiredValid === totalTrading && totalTrading > 0) {
      feasibilityDetermination = 'FEASIBLE_10Y_UNIFIED_UDIFF';
    } else if (contemporaryAcquired > 0 && historicalAcquired === 0) {
      feasibilityDetermination = 'FEASIBLE_DUAL_ERA_REQUIRED';
    } else if (acquiredValid > 0) {
      feasibilityDetermination = 'PARTIALLY_FEASIBLE_CONTEMPORARY_ONLY';
    } else {
      feasibilityDetermination = 'UNFEASIBLE_ARCHIVE_UNAVAILABLE';
    }

    const contemporaryCoveragePct = contemporaryTradingDays > 0
      ? Number(((contemporaryAcquired / contemporaryTradingDays) * 100).toFixed(2))
      : 0;

    const reportBody = {
      reconciliationId: `d114-recon-${Date.now()}`,
      sourceManifestId: manifest.manifestId,
      evaluatedAt: new Date().toISOString(),
      feasibilityDetermination,
      statistics: {
        totalCalendarDays: summary.targetRange.totalCalendarDays,
        expectedTradingDays: totalTrading,
        weekendDays: summary.targetRange.weekendDays,
        holidays: summary.targetRange.knownHolidays,
        acquiredValidDays: acquiredValid,
        http404Days: summary.countsByStatus.HTTP_404 || 0,
        networkErrorDays: summary.countsByStatus.NETWORK_ERROR || 0,
        corruptArchiveDays: summary.countsByStatus.CORRUPT_ARCHIVE || 0,
        schemaMismatchDays: summary.countsByStatus.SCHEMA_MISMATCH || 0,
        coveragePct,
        integrityPct,
      },
      eraBreakdown: {
        contemporaryEraUdiff: {
          dateRange: `${HistoricalEvidenceReconciler.UDIFF_MIGRATION_CUTOFF_DATE} to ${summary.targetRange.endDate}`,
          tradingDays: contemporaryTradingDays,
          acquiredValid: contemporaryAcquired,
          coveragePct: contemporaryCoveragePct,
        },
        historicalEraLegacy: {
          dateRange: `${summary.targetRange.startDate} to 2024-07-07`,
          tradingDays: historicalTradingDays,
          acquiredUdiff: historicalAcquired,
          requiresLegacyAdapter: historicalAcquired < historicalTradingDays,
        },
      },
      hashAudit: {
        totalHashesChecked: hashAuditCount,
        mismatchesDetected: hashMismatches,
        isCryptographicallyConsistent: hashMismatches === 0 && hashAuditCount > 0,
      },
      governanceDisposition: {
        oiHist01Status: 'OPEN / EXTERNAL / HISTORICAL ACQUISITION BLOCKED' as const,
        productionEligibility: 'NOT AUTHORIZED' as const,
        programDisposition: 'NON_PRODUCTION_HOLD' as const,
        recommendedNextStep: feasibilityDetermination === 'FEASIBLE_DUAL_ERA_REQUIRED'
          ? 'Deploy dual-era historical runner utilizing LegacyBhavcopyParser for pre-July-2024 archives'
          : 'Proceed with operator-assisted historical archive population under OFFLINE_BOOTSTRAP mode',
      },
    };

    const reconciliationLineageDigest = computeLineageHash(reportBody, {
      sourceClassification: 'CANONICAL_MARKET_DATA',
      asOf: '2026-09-20T00:00:00.000Z',
      dataVersion: 'v1.0.0-d114-reconciliation',
    });

    return {
      ...reportBody,
      reconciliationLineageDigest,
    };
  }
}
