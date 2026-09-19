/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-F / Package P15: E2E Evidence Package Builder
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W5-AUTH-2026-01
 */

import { E2ELineageVerifier } from './lineage_verifier.js';
import { EngineRevalidationEngine } from './engine_revalidation.js';
import { DegradedStateQualifier } from './degraded_state_qualifier.js';
import { computeLineageHash } from '../contracts/provenance.js';
import { SecurityMaster } from '../identity/security_master.js';

export interface E2EEvidencePackage {
  programId: string;
  sourceRevision: string;
  generatedAt: string;
  lineageQualification: {
    totalHops: number;
    isQualified: boolean;
    finalLineageDigest: string;
  };
  engineRevalidation: {
    totalEngines: number;
    isAllInvariant: boolean;
    csipDigest: string;
  };
  degradedStateQualification: {
    rollupTestsPassed: boolean;
    staleConcessionPassed: boolean;
  };
  governanceDigest: string;
}

export class E2EEvidenceBuilder {
  public static buildPackage(sourceRevision: string = 'fcf5dbe72e2fd0b1c91240eada7813fca4254f8b'): E2EEvidencePackage {
    const sm = new SecurityMaster();
    sm.registerEntity({
      companyId: 'INFY',
      isin: 'INE009A01021',
      cin: 'L85110KA1981PLC013115',
      companyName: 'Infosys Limited',
      industry: 'IT Services',
      sector: 'IT',
      listings: [
        { exchange: 'NSE', symbol: 'INFY', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' },
        { exchange: 'BSE', symbol: 'INFY', scripCode: '500209', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' },
      ],
      effectiveFrom: '1981-07-02T00:00:00.000Z',
    });

    const verifier = new E2ELineageVerifier(sm);
    const lineageRes = verifier.qualifyLineage({
      symbol: 'INFY',
      exchange: 'NSE',
      lastPrice: 1850.5,
      open: 1840.0,
      high: 1865.0,
      low: 1835.0,
      previousClose: 1830.0,
      volume: 2500000,
      timestamp: '2026-09-19T00:00:00.000Z',
    });

    const engineReport = EngineRevalidationEngine.revalidateAll();
    const rollupResults = DegradedStateQualifier.qualifyQualityRollup();
    const concessionResults = DegradedStateQualifier.qualifyStaleConcession();

    const summaryPayload = {
      sourceRevision,
      lineageDigest: lineageRes.finalLineageDigest,
      csipDigest: engineReport.csipCompositeResult.csipGoldenDigest,
      allEnginesInvariant: engineReport.isAllInvariant,
    };

    const governanceDigest = computeLineageHash(summaryPayload, {
      sourceClassification: 'CERTIFIED_ENGINE',
      asOf: '2026-09-19T00:00:00.000Z',
      dataVersion: 'v1.0.0-e2e-evidence',
    });

    return {
      programId: 'IIPS_PRODUCTION_MARKET_DATA',
      sourceRevision,
      generatedAt: new Date().toISOString(),
      lineageQualification: {
        totalHops: lineageRes.totalHops,
        isQualified: lineageRes.isFullyQualified,
        finalLineageDigest: lineageRes.finalLineageDigest,
      },
      engineRevalidation: {
        totalEngines: engineReport.totalEnginesRevalidated,
        isAllInvariant: engineReport.isAllInvariant,
        csipDigest: engineReport.csipCompositeResult.csipGoldenDigest,
      },
      degradedStateQualification: {
        rollupTestsPassed: rollupResults.every((r) => r.passed),
        staleConcessionPassed: concessionResults.every((r) => r.passed),
      },
      governanceDigest,
    };
  }
}
