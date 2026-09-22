/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-F / Package P15: Full E2E Lineage & Functional Qualification Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W5-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  SecurityMaster,
  E2ELineageVerifier,
  EngineRevalidationEngine,
  DegradedStateQualifier,
  E2EEvidenceBuilder,
  UIRegistry,
  UI01ReplayStudioBuilder,
  ScreenerService,
  ObjectResolverService,
  AccessibilityEngine,
  scanTextForSecrets,
  AD17_CONSTRAINT_TEXT,
} from '../src/index.js';

describe('WS-F Package P15: E2E Lineage & Functional Qualification', () => {
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

  describe('P15-01: 7-Hop End-to-End Lineage Qualification', () => {
    it('qualifies full provider-to-UI lineage across all 7 hops with SHA-256 digest propagation', () => {
      const verifier = new E2ELineageVerifier(securityMaster);
      const fixture = {
        symbol: 'INFY',
        exchange: 'NSE' as const,
        lastPrice: 1845.5,
        open: 1830.0,
        high: 1855.0,
        low: 1825.0,
        previousClose: 1825.0,
        volume: 4500000,
        timestamp: '2026-09-18T10:00:00.000Z',
      };

      const result = verifier.qualifyLineage(fixture);

      assert.strictEqual(result.isFullyQualified, true);
      assert.strictEqual(result.totalHops, 7);
      assert.strictEqual(result.companyId, 'INFY');
      assert.strictEqual(result.p04IdentityVerified, true);
      assert.strictEqual(result.nfr06MaskingVerified, true);

      // Verify each hop has a valid 64-char SHA-256 hex digest and provider masking
      for (const hop of result.hops) {
        assert.ok(hop.outputDigest);
        assert.strictEqual(hop.outputDigest.length, 64);
        assert.strictEqual(hop.providerMasked, true);
      }
    });

    it('enforces P04 fail-closed identity resolution during ingress', () => {
      const verifier = new E2ELineageVerifier(securityMaster);
      const invalidFixture = {
        symbol: 'UNREGISTERED_CO',
        exchange: 'NSE' as const,
        lastPrice: 100.0,
        open: 100.0,
        high: 100.0,
        low: 100.0,
        previousClose: 100.0,
        volume: 1000,
        timestamp: '2026-09-18T10:00:00.000Z',
      };

      assert.throws(() => verifier.qualifyLineage(invalidFixture));
    });
  });

  describe('P15-02: AD-4 Frozen 13-Engine & CSIP Revalidation', () => {
    it('revalidates all 13 certified sector scoring engines with 100% parity against golden reference digests', () => {
      const report = EngineRevalidationEngine.revalidateAll();

      assert.strictEqual(report.isAllInvariant, true);
      assert.strictEqual(report.totalEnginesRevalidated, 13);

      for (const sector of EngineRevalidationEngine.ALL_13_SECTORS) {
        const sectorRes = report.sectorResults[sector];
        assert.ok(sectorRes);
        assert.strictEqual(sectorRes.isInvariant, true);
        assert.strictEqual(sectorRes.goldenDigest.length, 64);
      }
    });

    it('revalidates CSIP composite cross-sector ranking model without methodology drift', () => {
      const report = EngineRevalidationEngine.revalidateAll();
      const csipResult = report.csipCompositeResult;

      assert.strictEqual(csipResult.isInvariant, true);
      assert.strictEqual(csipResult.totalRanked, 13);
      assert.strictEqual(csipResult.csipGoldenDigest.length, 64);
    });
  });

  describe('P15-03: Contained Defect M-2 Verification', () => {
    it('verifies AD17_CONSTRAINT disclosure is present on simulation/replay view models', () => {
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

      const replayVM = UI01ReplayStudioBuilder.build({
        marketSnapshot: mockMarketData,
        engineScore: mockEngineScore,
        companyName: 'Infosys Limited',
      });

      assert.strictEqual(replayVM.surfaceId, 'UI01_REPLAY_STUDIO');
      assert.strictEqual(replayVM.ad17MandatoryDisclosure, AD17_CONSTRAINT_TEXT);
      assert.strictEqual(replayVM.ad17Disclosure, AD17_CONSTRAINT_TEXT);
    });

    it('confirms UI inventory is strictly UI01–UI14 and blocks UI17 access', () => {
      const allowedIds = UIRegistry.getAuthorizedSurfaces();
      assert.strictEqual(allowedIds.length, 14);
      assert.ok(!allowedIds.includes('UI17' as any));
      assert.strictEqual(UIRegistry.isSurfaceAuthorized('UI17'), false);
    });
  });

  describe('P15-04: Monotonic Quality Rollup & AD-12 Stale Concession Qualifier', () => {
    it('verifies monotonic degradation hierarchy: GOOD -> STALE -> PARTIAL -> UNAVAILABLE', () => {
      const results = DegradedStateQualifier.qualifyQualityRollup();
      assert.ok(results.length > 0);
      assert.ok(results.every((r) => r.passed));
    });

    it('qualifies AD-12 concession rule: <=2x dispatches with STALE, >2x suppresses execution', () => {
      const results = DegradedStateQualifier.qualifyStaleConcession();
      assert.strictEqual(results.length, 3);
      assert.ok(results.every((r) => r.passed));

      // Check specific scenarios
      assert.strictEqual(results[0].quality, 'GOOD');
      assert.strictEqual(results[0].concessionActive, false);
      assert.strictEqual(results[0].suppressExecution, false);

      assert.strictEqual(results[1].quality, 'STALE');
      assert.strictEqual(results[1].concessionActive, true);
      assert.strictEqual(results[1].suppressExecution, false);

      assert.strictEqual(results[2].quality, 'UNAVAILABLE');
      assert.strictEqual(results[2].concessionActive, false);
      assert.strictEqual(results[2].suppressExecution, true);
    });
  });

  describe('P15-05: UI01–UI14 Functional & Transport Qualification', () => {
    it('verifies C6 server-side screening with fail-closed security and C7 entity resolution', () => {
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

      const response = screener.executeScreen({ sector: 'IT' });
      assert.strictEqual(response.totalMatched, 1);
      assert.strictEqual(response.results[0].companyId, 'INFY');

      const resolver = new ObjectResolverService(securityMaster);
      const resolved = resolver.resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: 'INFY' });
      assert.strictEqual(resolved.companyId, 'INFY');
      assert.strictEqual(resolved.companyName, 'Infosys Limited');
    });

    it('validates WCAG 2.1 AA accessibility contrast and dual-coded indicators', () => {
      const colorCheck = AccessibilityEngine.checkContrast('#0F766E', '#FFFFFF');
      assert.strictEqual(colorCheck.passesNormalText, true);
      assert.ok(colorCheck.contrastRatio >= 4.5);

      const indicator = AccessibilityEngine.getQualityIndicator('GOOD');
      assert.strictEqual(indicator.state, 'GOOD');
      assert.strictEqual(indicator.icon, '✓');
      assert.ok(indicator.ariaText.length > 0);
    });
  });

  describe('P15-06: Deterministic E2E Evidence Manifest Generation', () => {
    it('assembles a comprehensive cryptographic qualification manifest tied to the commit SHA', () => {
      const evidence = E2EEvidenceBuilder.buildPackage('fcf5dbe72e2fd0b1c91240eada7813fca4254f8b');

      assert.ok(evidence.programId);
      assert.strictEqual(evidence.sourceRevision, 'fcf5dbe72e2fd0b1c91240eada7813fca4254f8b');
      assert.strictEqual(evidence.lineageQualification.isQualified, true);
      assert.strictEqual(evidence.lineageQualification.totalHops, 7);
      assert.strictEqual(evidence.engineRevalidation.isAllInvariant, true);
      assert.strictEqual(evidence.engineRevalidation.totalEngines, 13);
      assert.strictEqual(evidence.degradedStateQualification.rollupTestsPassed, true);
      assert.strictEqual(evidence.degradedStateQualification.staleConcessionPassed, true);
      assert.strictEqual(evidence.governanceDigest.length, 64);

      // Verify zero plaintext secrets in manifest
      const violations = scanTextForSecrets(JSON.stringify(evidence), 'manifest.json');
      assert.strictEqual(violations.length, 0);
    });
  });
});
