/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-F / Package P17: Operations, Monitoring, Telemetry & Release Evidence Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W5-AUTH-2026-01
 */

import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';

import {
  TelemetryContextManager,
  TelemetryCorrelationVector,
  SLOEvaluator,
  RunbooksHarness,
  EmergencyControlCircuit,
  ReleaseStateMachine,
  DeadLetterQueue,
  SecurityMaster,
  RestatementTracker,
  FinancialConflictError,
  StandardizedIncomeStatement,
} from '../src/index.js';

describe('WS-F Package P17: Operations, Monitoring & Release Evidence', () => {
  const createMockIncomeStatement = (revenue: number, pat: number): StandardizedIncomeStatement => ({
    revenue,
    otherIncome: 0,
    totalIncome: revenue,
    operatingExpenses: revenue * 0.7,
    ebitda: revenue * 0.3,
    depreciationAndAmort: revenue * 0.05,
    ebit: revenue * 0.25,
    financeCosts: revenue * 0.02,
    pbt: revenue * 0.23,
    taxExpense: revenue * 0.05,
    pat,
    epsBasic: 50.0,
    epsDiluted: 50.0,
    sharesOutstanding: 10000000,
  });

  beforeEach(() => {
    TelemetryContextManager.clearSpans();
    EmergencyControlCircuit.resetAll();
  });

  describe('P17-01: 12-Dimensional Telemetry Correlation Vector & Context Propagation', () => {
    it('creates instrumented spans bound to the 12-dimensional correlation vector without provider leakage', () => {
      const vector: TelemetryCorrelationVector = {
        correlationId: 'corr-1001-xyz',
        tenantId: 'TENANT_DEFAULT',
        domain: 'D01_QUOTES',
        companyId: 'INFY',
        asOf: '2026-09-18T10:00:00.000Z',
        vendorTier: 'OFFLINE_BOOTSTRAP',
        qualityState: 'GOOD',
        lineageHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        engineId: 'SECTOR_IT',
        surfaceId: 'UI02_EXECUTIVE_SUMMARY',
        operationMode: 'SNAPSHOT',
        timestamp: '2026-09-18T10:00:00.000Z',
      };

      const span = TelemetryContextManager.startSpan('EXECUTE_SECTOR_IT_SCORING', vector);
      assert.ok(span.spanId);
      assert.strictEqual(span.attributes.correlationId, 'corr-1001-xyz');
      assert.strictEqual(span.attributes.companyId, 'INFY');

      TelemetryContextManager.addEvent(span, 'NORMALIZATION_COMPLETED', { status: 'OK' });
      const endedSpan = TelemetryContextManager.endSpan(span);

      assert.ok(endedSpan.durationMs !== undefined && endedSpan.durationMs >= 0);
      assert.strictEqual(endedSpan.events.length, 1);

      const allSpans = TelemetryContextManager.getRecordedSpans();
      assert.strictEqual(allSpans.length, 1);
    });

    it('rejects spans containing proprietary provider names violating NFR-06', () => {
      const violatingVector: any = {
        correlationId: 'corr-leak',
        tenantId: 'TENANT_DEFAULT',
        domain: 'D01_QUOTES',
        companyId: 'INFY',
        asOf: '2026-09-18T10:00:00.000Z',
        vendorTier: 'BLOOMBERG', // Disallowed proprietary name in vector attributes
        qualityState: 'GOOD',
        lineageHash: 'hash',
        operationMode: 'SNAPSHOT',
        timestamp: '2026-09-18T10:00:00.000Z',
      };

      assert.throws(() => TelemetryContextManager.startSpan('LEAKY_SPAN', violatingVector), /Telemetry violation/);
    });
  });

  describe('P17-02: Quantitative SLO / Health Instrumentation', () => {
    it('evaluates all 6 target SLOs against local quantitative thresholds', () => {
      const report = SLOEvaluator.evaluateAll({
        d01LatencyMs: 120, // < 500ms
        d01FreshnessAgeSec: 300, // <= 900s
        d02EodDeliveryTimeIST: '18:15', // <= 18:30 IST
        d03StatementAgeDays: 45, // <= 105 days
        parserErrorRatePct: 0.002, // < 0.01%
        killSwitchResponseMs: 15, // < 250ms
      });

      assert.strictEqual(report.overallPassed, true);
      assert.strictEqual(report.results.length, 6);
      assert.ok(report.results.every((r) => r.passed));
    });

    it('flags SLO violations when latency or freshness exceeds target thresholds', () => {
      const report = SLOEvaluator.evaluateAll({
        d01LatencyMs: 650, // BREACH (> 500ms)
        d01FreshnessAgeSec: 1200, // BREACH (> 900s)
        d02EodDeliveryTimeIST: '19:00', // BREACH (> 18:30 IST)
        d03StatementAgeDays: 120, // BREACH (> 105 days)
        parserErrorRatePct: 0.05, // BREACH (> 0.01%)
        killSwitchResponseMs: 300, // BREACH (> 250ms)
      });

      assert.strictEqual(report.overallPassed, false);
      assert.ok(report.results.every((r) => !r.passed));
    });
  });

  describe('P17-03 & P17-04: Governed Incident & Recovery Runbooks Harness', () => {
    it('executes RB-01: Dead-Letter Queue Triage and Quarantine Inspection', () => {
      const dlq = new DeadLetterQueue();
      dlq.push({
        quarantineId: 'dlq-test-01',
        domain: 'D01_QUOTES',
        failureStage: 'STAGE_2_STRUCTURAL',
        rawPayload: { bad: 'data' },
        anomalyCodes: ['REQUIRED_FIELD_MISSING'],
        errors: ['symbol: Required field missing'],
        receivedAt: new Date().toISOString(),
        sourceClassification: 'REAL',
      });

      const result = RunbooksHarness.executeDeadLetterTriage(dlq);
      assert.strictEqual(result.recoveryVerified, true);
      assert.strictEqual(result.isFailClosedPreserved, true);
      assert.ok(result.actionTaken.includes('Triaged 1 quarantined records'));
    });

    it('executes RB-02: Identity Resolution Ambiguity & Fail-Closed Quarantine', () => {
      const sm = new SecurityMaster();
      const result = RunbooksHarness.executeIdentityQuarantineResolution(sm, {
        identifierType: 'NSE_SYMBOL',
        identifierValue: 'UNKNOWN_TICKER',
      });

      assert.strictEqual(result.recoveryVerified, true);
      assert.strictEqual(result.isFailClosedPreserved, true);
      assert.ok(result.actionTaken.includes('Triggered fail-closed rejection'));
    });

    it('executes RB-03: Material Restatement Conflict Quarantine & PIT Retrieval', () => {
      const tracker = new RestatementTracker();
      tracker.registerStatement({
        statementId: 'stmt-infy-2025-orig',
        companyId: 'INFY',
        scope: 'CONSOLIDATED',
        fiscalYear: 2025,
        periodType: 'ANNUAL',
        periodStart: '2024-04-01T00:00:00.000Z',
        periodEnd: '2025-03-31T00:00:00.000Z',
        filingDate: '2025-05-15T00:00:00.000Z',
        restatementIndex: 0,
        rawCurrency: 'INR',
        currency: 'INR',
        isAudited: true,
        sourceFilingType: 'MCA_XBRL',
        incomeStatement: createMockIncomeStatement(1000000000, 200000000),
        qualityState: 'GOOD',
      });

      // Register diverging filing that conflicts by >0.5% at same restatement index
      try {
        tracker.registerStatement({
          statementId: 'stmt-infy-2025-diverging',
          companyId: 'INFY',
          scope: 'CONSOLIDATED',
          fiscalYear: 2025,
          periodType: 'ANNUAL',
          periodStart: '2024-04-01T00:00:00.000Z',
          periodEnd: '2025-03-31T00:00:00.000Z',
          filingDate: '2025-08-15T00:00:00.000Z',
          restatementIndex: 0,
          rawCurrency: 'INR',
          currency: 'INR',
          isAudited: true,
          sourceFilingType: 'MCA_XBRL',
          incomeStatement: createMockIncomeStatement(1200000000, 200000000), // 20% divergence
          qualityState: 'GOOD',
        });
      } catch (err) {
        assert.ok(err instanceof FinancialConflictError);
      }

      const result = RunbooksHarness.executeRestatementConflictHandling(tracker, 'INFY', 2025);
      assert.strictEqual(result.recoveryVerified, true);
      assert.strictEqual(result.isFailClosedPreserved, true);
    });

    it('executes RB-04: Stale Input Suppression Circuit Breaker', () => {
      const staleTime = '2026-09-18T10:00:00.000Z';
      const evaluationTime = '2026-09-18T10:45:00.000Z'; // 45 mins later (exceeds 2x 15m threshold)

      const result = RunbooksHarness.executeStaleInputSuppression(staleTime, evaluationTime);
      assert.strictEqual(result.recoveryVerified, true);
      assert.strictEqual(result.isFailClosedPreserved, true);
      assert.ok(result.actionTaken.includes('Suppressed engine execution'));
    });
  });

  describe('P17-07: Emergency Controls & Local Simulation Circuits', () => {
    it('instantly suppresses market data dispatching upon global kill switch trigger (<250ms)', () => {
      assert.strictEqual(EmergencyControlCircuit.shouldAllowDispatch('D01_QUOTES'), true);

      const startTime = Date.now();
      EmergencyControlCircuit.triggerGlobalKillSwitch();
      const durationMs = Date.now() - startTime;

      assert.ok(durationMs < 250);
      assert.strictEqual(EmergencyControlCircuit.shouldAllowDispatch('D01_QUOTES'), false);
      assert.strictEqual(EmergencyControlCircuit.shouldAllowDispatch('D03_FUNDAMENTALS'), false);

      EmergencyControlCircuit.resetGlobalKillSwitch();
      assert.strictEqual(EmergencyControlCircuit.shouldAllowDispatch('D01_QUOTES'), true);
    });

    it('enforces selective domain and provider disablement circuits', () => {
      EmergencyControlCircuit.disableDomain('D08_MACRO');
      assert.strictEqual(EmergencyControlCircuit.shouldAllowDispatch('D08_MACRO'), false);
      assert.strictEqual(EmergencyControlCircuit.shouldAllowDispatch('D01_QUOTES'), true);

      EmergencyControlCircuit.disableProvider('SYNTHETIC_TEST_PROVIDER');
      assert.strictEqual(EmergencyControlCircuit.shouldAllowDispatch('D01_QUOTES', 'SYNTHETIC_TEST_PROVIDER'), false);
      assert.strictEqual(EmergencyControlCircuit.shouldAllowDispatch('D01_QUOTES', 'CANONICAL_SOURCE'), true);
    });

    it('supports engine fallback suppression mode', () => {
      assert.strictEqual(EmergencyControlCircuit.isFallbackSuppressed(), false);
      EmergencyControlCircuit.setEngineFallbackSuppression(true);
      assert.strictEqual(EmergencyControlCircuit.isFallbackSuppressed(), true);
    });
  });

  describe('P17-05, P17-06 & P17-08: Release State Machine & Residual Risk Register', () => {
    it('progresses through valid non-production lifecycle states', () => {
      const sm = new ReleaseStateMachine();
      assert.strictEqual(sm.getState(), 'DRAFT');

      sm.transitionTo('QUALIFIED');
      assert.strictEqual(sm.getState(), 'QUALIFIED');

      sm.transitionTo('RELEASE_CANDIDATE');
      assert.strictEqual(sm.getState(), 'RELEASE_CANDIDATE');

      sm.transitionTo('WITHHELD_PENDING_WAVE6');
      assert.strictEqual(sm.getState(), 'WITHHELD_PENDING_WAVE6');

      // Terminal state check
      assert.throws(() => sm.transitionTo('DRAFT'));
    });

    it('maintains the residual risk register with M-2, M-5, and M-6 marked as CONTAINED / NOT REPAIRED', () => {
      const register = ReleaseStateMachine.getResidualRiskRegister();
      assert.strictEqual(register.length, 3);

      const defectIds = register.map((r) => r.defectId);
      assert.ok(defectIds.includes('M-2'));
      assert.ok(defectIds.includes('M-5'));
      assert.ok(defectIds.includes('M-6'));

      for (const entry of register) {
        assert.strictEqual(entry.status, 'CONTAINED / NOT REPAIRED');
        assert.strictEqual(entry.remediationPermittedInWave5, false);
      }
    });

    it('generates a governed release manifest preserving G-004 open and commercial authorization prohibited', () => {
      const manifest = ReleaseStateMachine.generateReleaseManifest('fcf5dbe72e2fd0b1c91240eada7813fca4254f8b');

      assert.strictEqual(manifest.state, 'WITHHELD_PENDING_WAVE6');
      assert.strictEqual(manifest.programGates.G004_MasterProgramGate, 'OPEN_PRESERVED_WAVE6_DEPENDENCY');
      assert.strictEqual(manifest.operationalBoundaries.productionAuthorization, 'PROHIBITED');
      assert.strictEqual(manifest.operationalBoundaries.commercialProviderActivation, 'PROHIBITED');
      assert.strictEqual(manifest.operationalBoundaries.operationalQualification, 'PENDING');
      assert.strictEqual(manifest.operationalBoundaries.releaseCertification, 'PENDING');
    });
  });
});
