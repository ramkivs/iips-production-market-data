/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-H / Package D114: Governed Historical Evidence Handoff & Intake Contract
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / D114 / OI-HIST-01
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  CompleteEvidencePackage,
  HistoricalFeasibilityManifest,
  HistoricalCoverageSummary,
  FailureUnavailableRegisterEntry,
  ArchiveIntegrityReportEntry,
  Sha256ManifestEntry,
  SchemaValidationReportEntry,
} from './historical_feasibility_runner.js';
import {
  HistoricalEvidenceReconciler,
  EvidenceReconciliationReport,
} from './evidence_reconciler.js';
import { computeLineageHash } from '../contracts/provenance.js';

export interface HandoffValidationResult {
  handoffBatchId: string;
  status: 'ACCEPTED' | 'REJECTED';
  intakeDirectory: string;
  validatedAt: string;
  artifactsDiscovered: string[];
  missingArtifacts: string[];
  fileChecksumsSha256: Record<string, string>;
  evidencePackage?: CompleteEvidencePackage;
  errors: string[];
  quarantineReason?: string;
  governanceDisposition: {
    oiHist01Status: 'OPEN / EXTERNAL / HISTORICAL ACQUISITION BLOCKED';
    productionEligibility: 'NOT AUTHORIZED';
    programDisposition: 'NON_PRODUCTION_HOLD';
  };
  intakeLineageDigest: string;
}

export interface D114HandoffExecutionSummary {
  intakeResult: HandoffValidationResult;
  reconciliationReport?: EvidenceReconciliationReport;
  isReconciliationTriggered: boolean;
}

export class HistoricalEvidenceHandoff {
  public static readonly DEFAULT_INTAKE_DIR = 'evidence/d114';

  public static readonly MANIFEST_FILE = 'historical-acquisition-manifest.json';
  public static readonly COVERAGE_SUMMARY_FILE = 'historical-coverage-summary.json';
  public static readonly FAILURE_REGISTER_FILE = 'failure-unavailable-date-register.json';
  public static readonly ARCHIVE_INTEGRITY_FILE = 'archive-integrity-report.json';
  public static readonly SHA256_MANIFEST_FILE = 'sha256-manifest.json';
  public static readonly SCHEMA_VALIDATION_FILE = 'schema-validation-report.json';

  public static readonly REQUIRED_ARTIFACTS = [
    HistoricalEvidenceHandoff.MANIFEST_FILE,
    HistoricalEvidenceHandoff.COVERAGE_SUMMARY_FILE,
    HistoricalEvidenceHandoff.FAILURE_REGISTER_FILE,
    HistoricalEvidenceHandoff.ARCHIVE_INTEGRITY_FILE,
    HistoricalEvidenceHandoff.SHA256_MANIFEST_FILE,
    HistoricalEvidenceHandoff.SCHEMA_VALIDATION_FILE,
  ] as const;

  /**
   * Validates and ingests the 6 deposited evidence artifacts from a designated intake directory.
   * Strictly read-only against the deposit location.
   */
  public static validateAndLoadEvidencePackage(
    intakeDir: string = HistoricalEvidenceHandoff.DEFAULT_INTAKE_DIR
  ): HandoffValidationResult {
    const resolvedDir = path.resolve(intakeDir);
    const handoffBatchId = `d114-handoff-${Date.now()}`;
    const validatedAt = new Date().toISOString();
    const artifactsDiscovered: string[] = [];
    const missingArtifacts: string[] = [];
    const fileChecksumsSha256: Record<string, string> = {};
    const errors: string[] = [];

    // Check directory existence
    if (!fs.existsSync(resolvedDir) || !fs.statSync(resolvedDir).isDirectory()) {
      const errorMsg = `Intake directory does not exist or is not a directory: ${resolvedDir}`;
      errors.push(errorMsg);

      const rejectedPayload = {
        handoffBatchId,
        status: 'REJECTED' as const,
        intakeDirectory: resolvedDir,
        validatedAt,
        artifactsDiscovered: [],
        missingArtifacts: [...HistoricalEvidenceHandoff.REQUIRED_ARTIFACTS],
        fileChecksumsSha256: {},
        errors,
        quarantineReason: errorMsg,
        governanceDisposition: {
          oiHist01Status: 'OPEN / EXTERNAL / HISTORICAL ACQUISITION BLOCKED' as const,
          productionEligibility: 'NOT AUTHORIZED' as const,
          programDisposition: 'NON_PRODUCTION_HOLD' as const,
        },
      };

      const intakeLineageDigest = computeLineageHash(rejectedPayload, {
        sourceClassification: 'CANONICAL_MARKET_DATA',
        asOf: '2026-09-20T00:00:00.000Z',
        dataVersion: 'v1.0.0-d114-handoff-rejected',
      });

      return {
        ...rejectedPayload,
        intakeLineageDigest,
      };
    }

    // Check presence of all 6 required artifacts
    for (const artifactName of HistoricalEvidenceHandoff.REQUIRED_ARTIFACTS) {
      const artifactPath = path.join(resolvedDir, artifactName);
      if (fs.existsSync(artifactPath) && fs.statSync(artifactPath).isFile()) {
        artifactsDiscovered.push(artifactName);
        try {
          const content = fs.readFileSync(artifactPath);
          const checksum = crypto.createHash('sha256').update(content).digest('hex');
          fileChecksumsSha256[artifactName] = checksum;
        } catch (err: unknown) {
          errors.push(`Failed to read artifact ${artifactName}: ${(err as Error).message}`);
        }
      } else {
        missingArtifacts.push(artifactName);
      }
    }

    if (missingArtifacts.length > 0) {
      errors.push(`Missing required evidence artifact(s): ${missingArtifacts.join(', ')}`);
    }

    // If any files are missing or unreadable, fail closed immediately
    if (errors.length > 0 || missingArtifacts.length > 0) {
      const rejectedPayload = {
        handoffBatchId,
        status: 'REJECTED' as const,
        intakeDirectory: resolvedDir,
        validatedAt,
        artifactsDiscovered,
        missingArtifacts,
        fileChecksumsSha256,
        errors,
        quarantineReason: `Incomplete evidence package: ${missingArtifacts.length} artifact(s) missing`,
        governanceDisposition: {
          oiHist01Status: 'OPEN / EXTERNAL / HISTORICAL ACQUISITION BLOCKED' as const,
          productionEligibility: 'NOT AUTHORIZED' as const,
          programDisposition: 'NON_PRODUCTION_HOLD' as const,
        },
      };

      const intakeLineageDigest = computeLineageHash(rejectedPayload, {
        sourceClassification: 'CANONICAL_MARKET_DATA',
        asOf: '2026-09-20T00:00:00.000Z',
        dataVersion: 'v1.0.0-d114-handoff-rejected',
      });

      return {
        ...rejectedPayload,
        intakeLineageDigest,
      };
    }

    // Parse all 6 artifacts
    let manifest: HistoricalFeasibilityManifest;
    let coverageSummary: HistoricalCoverageSummary;
    let failureRegister: FailureUnavailableRegisterEntry[];
    let archiveIntegrityReport: ArchiveIntegrityReportEntry[];
    let sha256Manifest: Record<string, Sha256ManifestEntry>;
    let schemaValidationReport: SchemaValidationReportEntry[];

    try {
      manifest = JSON.parse(
        fs.readFileSync(path.join(resolvedDir, HistoricalEvidenceHandoff.MANIFEST_FILE), 'utf-8')
      );
      if (!manifest.manifestId || !manifest.records || !manifest.targetRange) {
        errors.push('Manifest missing required top-level fields (manifestId, targetRange, records)');
      }
    } catch (err: unknown) {
      errors.push(`JSON parse error in ${HistoricalEvidenceHandoff.MANIFEST_FILE}: ${(err as Error).message}`);
    }

    try {
      coverageSummary = JSON.parse(
        fs.readFileSync(path.join(resolvedDir, HistoricalEvidenceHandoff.COVERAGE_SUMMARY_FILE), 'utf-8')
      );
      if (!coverageSummary.targetRange || !coverageSummary.countsByStatus) {
        errors.push('Coverage summary missing required schema sections (targetRange, countsByStatus)');
      } else {
        const counts = coverageSummary.countsByStatus;
        const acquiredValid = counts.ACQUIRED_VALID || 0;
        const weekendDays = counts.NON_TRADING_WEEKEND || 0;
        const holidayDays = counts.NON_TRADING_HOLIDAY || 0;
        const expectedTrading = (coverageSummary.targetRange.totalCalendarDays || 0) - weekendDays - holidayDays;
        const unavailable =
          (counts.HTTP_404 || 0) +
          (counts.HTTP_OTHER_ERROR || 0) +
          (counts.NETWORK_ERROR || 0) +
          (counts.EMPTY_RESPONSE || 0);
        const corruptOrInvalid =
          (counts.CORRUPT_ARCHIVE || 0) +
          (counts.CSV_INVALID || 0) +
          (counts.SCHEMA_MISMATCH || 0) +
          (counts.OTHER_FAILURE || 0);

        if (!coverageSummary.metrics) {
          coverageSummary.metrics = {
            tradingDaysAttempted: expectedTrading,
            acquiredValidCount: acquiredValid,
            unavailableCount: unavailable,
            corruptOrInvalidCount: corruptOrInvalid,
            coveragePctOfTradingDays:
              expectedTrading > 0 ? Number(((acquiredValid / expectedTrading) * 100).toFixed(2)) : 0,
            dataIntegrityPct:
              acquiredValid + corruptOrInvalid > 0
                ? Number(((acquiredValid / (acquiredValid + corruptOrInvalid)) * 100).toFixed(2))
                : 0,
          };
        }
        if (coverageSummary.targetRange.expectedTradingDays === undefined) {
          coverageSummary.targetRange.expectedTradingDays = expectedTrading;
          coverageSummary.targetRange.weekendDays = weekendDays;
          coverageSummary.targetRange.knownHolidays = holidayDays;
        }
      }
    } catch (err: unknown) {
      errors.push(`JSON parse error in ${HistoricalEvidenceHandoff.COVERAGE_SUMMARY_FILE}: ${(err as Error).message}`);
    }

    try {
      failureRegister = JSON.parse(
        fs.readFileSync(path.join(resolvedDir, HistoricalEvidenceHandoff.FAILURE_REGISTER_FILE), 'utf-8')
      );
      if (!Array.isArray(failureRegister)) {
        errors.push('Failure register must be a JSON array');
      }
    } catch (err: unknown) {
      errors.push(`JSON parse error in ${HistoricalEvidenceHandoff.FAILURE_REGISTER_FILE}: ${(err as Error).message}`);
    }

    try {
      archiveIntegrityReport = JSON.parse(
        fs.readFileSync(path.join(resolvedDir, HistoricalEvidenceHandoff.ARCHIVE_INTEGRITY_FILE), 'utf-8')
      );
      if (!Array.isArray(archiveIntegrityReport)) {
        errors.push('Archive integrity report must be a JSON array');
      }
    } catch (err: unknown) {
      errors.push(`JSON parse error in ${HistoricalEvidenceHandoff.ARCHIVE_INTEGRITY_FILE}: ${(err as Error).message}`);
    }

    try {
      sha256Manifest = JSON.parse(
        fs.readFileSync(path.join(resolvedDir, HistoricalEvidenceHandoff.SHA256_MANIFEST_FILE), 'utf-8')
      );
      if (typeof sha256Manifest !== 'object' || Array.isArray(sha256Manifest) || sha256Manifest === null) {
        errors.push('SHA-256 manifest must be a JSON object mapping dates to entries');
      }
    } catch (err: unknown) {
      errors.push(`JSON parse error in ${HistoricalEvidenceHandoff.SHA256_MANIFEST_FILE}: ${(err as Error).message}`);
    }

    try {
      schemaValidationReport = JSON.parse(
        fs.readFileSync(path.join(resolvedDir, HistoricalEvidenceHandoff.SCHEMA_VALIDATION_FILE), 'utf-8')
      );
      if (!Array.isArray(schemaValidationReport)) {
        errors.push('Schema validation report must be a JSON array');
      }
    } catch (err: unknown) {
      errors.push(`JSON parse error in ${HistoricalEvidenceHandoff.SCHEMA_VALIDATION_FILE}: ${(err as Error).message}`);
    }

    if (errors.length > 0) {
      const rejectedPayload = {
        handoffBatchId,
        status: 'REJECTED' as const,
        intakeDirectory: resolvedDir,
        validatedAt,
        artifactsDiscovered,
        missingArtifacts,
        fileChecksumsSha256,
        errors,
        quarantineReason: `Schema or syntax validation failure: ${errors.join('; ')}`,
        governanceDisposition: {
          oiHist01Status: 'OPEN / EXTERNAL / HISTORICAL ACQUISITION BLOCKED' as const,
          productionEligibility: 'NOT AUTHORIZED' as const,
          programDisposition: 'NON_PRODUCTION_HOLD' as const,
        },
      };

      const intakeLineageDigest = computeLineageHash(rejectedPayload, {
        sourceClassification: 'CANONICAL_MARKET_DATA',
        asOf: '2026-09-20T00:00:00.000Z',
        dataVersion: 'v1.0.0-d114-handoff-rejected',
      });

      return {
        ...rejectedPayload,
        intakeLineageDigest,
      };
    }

    const evidencePackage: CompleteEvidencePackage = {
      manifest: manifest!,
      coverageSummary: coverageSummary!,
      failureRegister: failureRegister!,
      archiveIntegrityReport: archiveIntegrityReport!,
      sha256Manifest: sha256Manifest!,
      schemaValidationReport: schemaValidationReport!,
    };

    const acceptedPayload = {
      handoffBatchId,
      status: 'ACCEPTED' as const,
      intakeDirectory: resolvedDir,
      validatedAt,
      artifactsDiscovered,
      missingArtifacts: [],
      fileChecksumsSha256,
      evidencePackage,
      errors: [],
      governanceDisposition: {
        oiHist01Status: 'OPEN / EXTERNAL / HISTORICAL ACQUISITION BLOCKED' as const,
        productionEligibility: 'NOT AUTHORIZED' as const,
        programDisposition: 'NON_PRODUCTION_HOLD' as const,
      },
    };

    const intakeLineageDigest = computeLineageHash(acceptedPayload, {
      sourceClassification: 'CANONICAL_MARKET_DATA',
      asOf: '2026-09-20T00:00:00.000Z',
      dataVersion: 'v1.0.0-d114-handoff-accepted',
    });

    return {
      ...acceptedPayload,
      intakeLineageDigest,
    };
  }

  /**
   * Governed pipeline transition:
   * Deposits -> Intake Validation -> Reconciliation Report
   */
  public static executeGovernedIntakeAndReconciliation(
    intakeDir: string = HistoricalEvidenceHandoff.DEFAULT_INTAKE_DIR
  ): D114HandoffExecutionSummary {
    const intakeResult = HistoricalEvidenceHandoff.validateAndLoadEvidencePackage(intakeDir);

    if (intakeResult.status === 'ACCEPTED' && intakeResult.evidencePackage) {
      const reconciliationReport = HistoricalEvidenceReconciler.reconcileEvidencePackage(
        intakeResult.evidencePackage
      );
      return {
        intakeResult,
        reconciliationReport,
        isReconciliationTriggered: true,
      };
    }

    return {
      intakeResult,
      isReconciliationTriggered: false,
    };
  }
}
