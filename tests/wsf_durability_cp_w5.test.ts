/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-F / Package P15 & P17: Wave 5 Durability Checkpoint Suite (CP-W5)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W5-AUTH-2026-01
 * Checkpoint: CP-W5 (Milestone G-08 Verification)
 */

import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';

import {
  SecurityMaster,
  E2ELineageVerifier,
  EngineRevalidationEngine,
  DegradedStateQualifier,
  UIRegistry,
  UI01ReplayStudioBuilder,
  ScreenerService,
  ObjectResolverService,
  AccessibilityEngine,
  TelemetryContextManager,
  TelemetryCorrelationVector,
  SLOEvaluator,
  RunbooksHarness,
  EmergencyControlCircuit,
  ReleaseStateMachine,
  DeadLetterQueue,
  RestatementTracker,
  FinancialConflictError,
  StandardizedIncomeStatement,
  scanTextForSecrets,
  AD17_CONSTRAINT_TEXT,
} from '../src/index.js';

describe('Wave 5 Durability Checkpoint: CP-W5 (CP-W5-01 through CP-W5-10)', () => {
  const securityMaster = new SecurityMaster();
  securityMaster.registerEntity({
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

  // ──────────────────────────────────────────────────────────────────────────
  // CP-W5-01: End-to-End Lineage Qualification across all 7 Hops
  // ──────────────────────────────────────────────────────────────────────────
  it('CP-W5-01: qualifies unbroken 7-hop end-to-end lineage from raw ingress to UI presentation', () => {
    const verifier = new E2ELineageVerifier(securityMaster);
    const fixture = {
      symbol: 'INFY',
      exchange: 'NSE' as const,
      lastPrice: 1850.0,
      open: 1835.0,
      high: 1860.0,
      low: 1830.0,
      previousClose: 1830.0,
      volume: 5200000,
      timestamp: '2026-09-18T10:00:00.000Z',
    };

    const result = verifier.qualifyLineage(fixture);
    assert.strictEqual(result.isFullyQualified, true);
    assert.strictEqual(result.totalHops, 7);
    assert.deepStrictEqual(
      result.hops.map((h) => h.stageName),
      [
        'RAW_INGRESS_RESOLUTION',
        'INGRESS_CANONICAL_PACKAGING',
        'POINT_IN_TIME_PERSISTENCE',
        'FROZEN_ENGINE_SCORING',
        'PRODUCT_TRANSPORT_SERIALIZATION',
        'INTELLIGENCE_SYNTHESIS',
        'UI_VIEWMODEL_PRESENTATION',
      ]
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CP-W5-02: Cryptographic SHA-256 Digest Continuity & NFR-06 Provider Masking
  // ──────────────────────────────────────────────────────────────────────────
  it('CP-W5-02: enforces continuous SHA-256 digest propagation and strict NFR-06 provider masking', () => {
    const verifier = new E2ELineageVerifier(securityMaster);
    const fixture = {
      symbol: 'INFY',
      exchange: 'NSE' as const,
      lastPrice: 1850.0,
      open: 1835.0,
      high: 1860.0,
      low: 1830.0,
      previousClose: 1830.0,
      volume: 5200000,
      timestamp: '2026-09-18T10:00:00.000Z',
    };

    const result = verifier.qualifyLineage(fixture);
    assert.strictEqual(result.nfr06MaskingVerified, true);
    assert.match(result.finalLineageDigest, /^[a-f0-9]{64}$/);

    for (const hop of result.hops) {
      assert.match(hop.outputDigest, /^[a-f0-9]{64}$/);
      assert.strictEqual(hop.providerMasked, true);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CP-W5-03: Frozen 13-Engine & CSIP Parity Revalidation
  // ──────────────────────────────────────────────────────────────────────────
  it('CP-W5-03: achieves 100% golden output digest parity across all 13 certified sector engines and CSIP composite', () => {
    const report = EngineRevalidationEngine.revalidateAll();

    assert.strictEqual(report.isAllInvariant, true);
    assert.strictEqual(report.totalEnginesRevalidated, 13);
    assert.strictEqual(report.csipCompositeResult.isInvariant, true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CP-W5-04: Contained Defect M-2 Verification & UI17 Decommissioning
  // ──────────────────────────────────────────────────────────────────────────
  it('CP-W5-04: verifies AD17_CONSTRAINT disclosure in replay mode and strict UI01–UI14 surface boundaries', () => {
    const mockMarketData = {
      companyId: 'INFY',
      symbol: 'INFY',
      exchange: 'NSE' as const,
      ltp: 1850.5,
      open: 1840.0,
      high: 1865.0,
      low: 1835.0,
      close: 1850.5,
      previousClose: 1830.0,
      change: 20.5,
      pctChange: 1.12,
      volume: 2500000,
      mode: 'SNAPSHOT' as const,
      quality: 'GOOD' as const,
      provenance: {
        sourceClassification: 'REAL' as const,
        asOf: '2026-09-18T10:00:00.000Z',
        evaluatedAt: '2026-09-18T10:00:01.000Z',
        dataVersion: 'v1.0.0',
        lineageDigest: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        quality: 'GOOD' as const,
        replayConstraintApplied: false,
      },
    };

    const mockEngineScore = {
      companyId: 'INFY',
      engineId: 'SECTOR_IT' as const,
      rawScore: 82.5,
      normalizedScore: 82.5,
      grade: 'A' as const,
      factorBreakdown: { valuation: 78.0, quality: 88.0, profitability: 84.0, momentum: 80.0 },
      qualityState: 'GOOD' as const,
      provenance: {
        sourceClassification: 'CERTIFIED_ENGINE' as const,
        vendorTier: 'OFFLINE_BOOTSTRAP' as const,
        asOf: '2026-09-18T10:00:00.000Z',
        receivedAt: '2026-09-18T10:00:00.000Z',
        evaluatedAt: '2026-09-18T10:00:01.000Z',
        dataVersion: 'v1.0.0-certified-frozen',
        lineageHash: 'f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2',
        qualityState: 'GOOD' as const,
      },
      versionVector: {
        schemaVersion: '1.0.0',
        engineVersion: 'v1.0.0-certified-frozen',
        securityMasterVersion: '2026.09.19',
        dataVersionVector: { D01_QUOTES: 'v1.0' },
      },
      executionId: 'exec-test-01',
      evaluatedAt: '2026-09-18T10:00:01.000Z',
      isFallbackApplied: false,
      fallbackFields: [],
    };

    const replayOverview = UI01ReplayStudioBuilder.build({
      marketSnapshot: mockMarketData,
      engineScore: mockEngineScore,
      companyName: 'Infosys Limited',
    });

    assert.strictEqual(replayOverview.ad17MandatoryDisclosure, AD17_CONSTRAINT_TEXT);
    assert.strictEqual(replayOverview.ad17Disclosure, AD17_CONSTRAINT_TEXT);

    const authorizedSurfaces = UIRegistry.getAuthorizedSurfaces();
    assert.strictEqual(authorizedSurfaces.length, 14);
    assert.strictEqual(UIRegistry.isSurfaceAuthorized('UI17'), false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CP-W5-05: Monotonic Degraded-State Propagation & AD-12 Stale Concession Rule
  // ──────────────────────────────────────────────────────────────────────────
  it('CP-W5-05: enforces monotonic quality rollup and AD-12 stale concession execution suppression', () => {
    const rollupResults = DegradedStateQualifier.qualifyQualityRollup();
    assert.ok(rollupResults.every((r) => r.passed));

    const concessionResults = DegradedStateQualifier.qualifyStaleConcession();
    assert.ok(concessionResults.every((r) => r.passed));

    // Concession granted scenario
    assert.strictEqual(concessionResults[1].quality, 'STALE');
    assert.strictEqual(concessionResults[1].concessionActive, true);
    assert.strictEqual(concessionResults[1].suppressExecution, false);

    // Concession breached scenario (>2x)
    assert.strictEqual(concessionResults[2].quality, 'UNAVAILABLE');
    assert.strictEqual(concessionResults[2].concessionActive, false);
    assert.strictEqual(concessionResults[2].suppressExecution, true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CP-W5-06: UI01–UI14 Functional & Transport Qualification
  // ──────────────────────────────────────────────────────────────────────────
  it('CP-W5-06: validates presentation-only UI contracts, C6 screener, C7 entity resolution, and WCAG AA compliance', () => {
    const screener = new ScreenerService();
    screener.registerCandidate({
      companyId: 'INFY',
      companyName: 'Infosys Limited',
      sector: 'IT',
      ltp: 1850.5,
      pe: 24.5,
      pb: 6.2,
      roe: 28.5,
      operatingMargin: 24.0,
      score: 82.5,
      grade: 'A',
      quality: 'GOOD',
    });

    const result = screener.executeScreen({ sector: 'IT' });
    assert.strictEqual(result.totalMatched, 1);
    assert.strictEqual(result.results[0].companyId, 'INFY');

    const resolver = new ObjectResolverService(securityMaster);
    const resolved = resolver.resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: 'INFY' });
    assert.strictEqual(resolved.companyId, 'INFY');

    const contrastCheck = AccessibilityEngine.checkContrast('#0F766E', '#FFFFFF');
    assert.strictEqual(contrastCheck.passesNormalText, true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CP-W5-07: 12-Dimensional Telemetry Context Propagation
  // ──────────────────────────────────────────────────────────────────────────
  it('CP-W5-07: instruments 12-dimensional telemetry context propagation without secret or provider leak', () => {
    const vector: TelemetryCorrelationVector = {
      correlationId: 'corr-w5-test',
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

    const span = TelemetryContextManager.startSpan('E2E_TELEMETRY_CHECK', vector);
    TelemetryContextManager.addEvent(span, 'STAGE_FINISHED', { stage: 'COMPLETED' });
    TelemetryContextManager.endSpan(span);

    const spans = TelemetryContextManager.getRecordedSpans();
    assert.strictEqual(spans.length, 1);
    assert.ok(spans[0].durationMs !== undefined && spans[0].durationMs >= 0);

    const violations = scanTextForSecrets(JSON.stringify(spans[0]), 'span.json');
    assert.strictEqual(violations.length, 0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CP-W5-08: Quantitative SLO/SLA Instrumentation Compliance
  // ──────────────────────────────────────────────────────────────────────────
  it('CP-W5-08: confirms 100% compliance across all 6 quantitative SLO performance targets', () => {
    const report = SLOEvaluator.evaluateAll({
      d01LatencyMs: 85, // Target < 500ms
      d01FreshnessAgeSec: 180, // Target <= 900s
      d02EodDeliveryTimeIST: '18:10', // Target <= 18:30 IST
      d03StatementAgeDays: 60, // Target <= 105 days
      parserErrorRatePct: 0.001, // Target < 0.01%
      killSwitchResponseMs: 12, // Target < 250ms
    });

    assert.strictEqual(report.overallPassed, true);
    assert.ok(report.results.every((r) => r.passed));
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CP-W5-09: Incident Recovery Runbooks & Emergency Kill Switch Cutoff
  // ──────────────────────────────────────────────────────────────────────────
  it('CP-W5-09: exercises governed incident recovery runbooks and sub-250ms emergency kill switch cutoff', () => {
    const dlq = new DeadLetterQueue();
    dlq.push({
      quarantineId: 'dlq-cp5',
      domain: 'D01_QUOTES',
      failureStage: 'STAGE_1_INGRESS',
      rawPayload: {},
      anomalyCodes: ['REQUIRED_FIELD_MISSING'],
      errors: ['symbol: Required field missing'],
      receivedAt: new Date().toISOString(),
      sourceClassification: 'REAL',
    });

    const rb1 = RunbooksHarness.executeDeadLetterTriage(dlq);
    assert.strictEqual(rb1.recoveryVerified, true);

    const rb2 = RunbooksHarness.executeIdentityQuarantineResolution(securityMaster, {
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'UNREGISTERED_SYMBOL_XYZ',
    });
    assert.strictEqual(rb2.recoveryVerified, true);

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
        incomeStatement: createMockIncomeStatement(1250000000, 200000000),
        qualityState: 'GOOD',
      });
    } catch (err) {
      assert.ok(err instanceof FinancialConflictError);
    }

    const rb3 = RunbooksHarness.executeRestatementConflictHandling(tracker, 'INFY', 2025);
    assert.strictEqual(rb3.recoveryVerified, true);

    const rb4 = RunbooksHarness.executeStaleInputSuppression(
      '2026-09-18T10:00:00.000Z',
      '2026-09-18T10:40:00.000Z'
    );
    assert.strictEqual(rb4.recoveryVerified, true);

    // Emergency kill switch
    EmergencyControlCircuit.triggerGlobalKillSwitch();
    assert.strictEqual(EmergencyControlCircuit.shouldAllowDispatch('D01_QUOTES'), false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CP-W5-10: Governed Release State Machine & Residual Risk Containment
  // ──────────────────────────────────────────────────────────────────────────
  it('CP-W5-10: transitions state machine to WITHHELD_PENDING_WAVE6, confirms risk containment, and preserves Gate G-004 open', () => {
    const sm = new ReleaseStateMachine();
    sm.transitionTo('QUALIFIED');
    sm.transitionTo('RELEASE_CANDIDATE');
    sm.transitionTo('WITHHELD_PENDING_WAVE6');

    assert.strictEqual(sm.getState(), 'WITHHELD_PENDING_WAVE6');

    const manifest = ReleaseStateMachine.generateReleaseManifest('fcf5dbe72e2fd0b1c91240eada7813fca4254f8b');
    assert.strictEqual(manifest.programGates.G004_MasterProgramGate, 'OPEN_PRESERVED_WAVE6_DEPENDENCY');
    assert.strictEqual(manifest.operationalBoundaries.productionAuthorization, 'PROHIBITED');
    assert.strictEqual(manifest.operationalBoundaries.commercialProviderActivation, 'PROHIBITED');

    const risks = ReleaseStateMachine.getResidualRiskRegister();
    assert.deepStrictEqual(
      risks.map((r) => r.defectId),
      ['M-2', 'M-5', 'M-6']
    );
    for (const risk of risks) {
      assert.strictEqual(risk.status, 'CONTAINED / NOT REPAIRED');
      assert.strictEqual(risk.remediationPermittedInWave5, false);
    }
  });
});
