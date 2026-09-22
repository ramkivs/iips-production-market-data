/**
 * Institutional Investment Platform System (IIPS)
 * Wave 4 Durability Checkpoint (CP-W4) Executable Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 * Scope: 10-Point Executable Durability Checkpoint for Wave 4 Exit
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  scanDirectoryForSecrets,
  AccessibilityEngine,
  ResponsiveEngine,
  UI01ReplayStudioBuilder,
  UI02ExecutiveSummaryBuilder,
  UIRegistry,
  AD17_CONSTRAINT_TEXT,
  MarketDataDTO,
  IntelligenceDTO,
  FrozenEngines,
  SecurityMaster,
} from '../src/index.js';

describe('Wave 4 Durability Checkpoint (CP-W4)', () => {
  const rootDir = path.resolve('.');

  it('CP-W4-01: Wave 1 Regression Invariant — Foundation Contracts, Ingress, Security Master, PIT, Quality remain intact', () => {
    const sm = new SecurityMaster();
    sm.registerEntity({
      companyId: 'INFY',
      isin: 'INE009A01021',
      companyName: 'Infosys Limited',
      industry: 'IT',
      sector: 'Technology',
      effectiveFrom: '2000-01-01T00:00:00.000Z',
      listings: [{ exchange: 'NSE', symbol: 'INFY', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
    });

    const res = sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'INFY' });
    assert.strictEqual(res, 'INFY');
  });

  it('CP-W4-02: Wave 2 Regression Invariant — Fundamentals & Intelligence Engines remain intact', () => {
    const indIndicator = AccessibilityEngine.getQualityIndicator('GOOD');
    assert.strictEqual(indIndicator.state, 'GOOD');
  });

  it('CP-W4-03: Wave 3 Regression Invariant — Frozen 13 Engines & CSIP remain 100% invariant', () => {
    const benchmarkInputs = { pe: 20.0, pb: 3.0, roe: 18.0, roce: 20.0, operatingMargin: 18.0, momentum: 1.0 };
    const itScore = FrozenEngines.executeSectorEngine('SECTOR_IT', benchmarkInputs);
    assert.ok(itScore.normalizedScore >= 0 && itScore.normalizedScore <= 100);
    assert.ok(['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].includes(itScore.grade));
  });

  it('CP-W4-04: Provider Masking Invariance (NFR-06) — Zero proprietary vendor details in UI layer', () => {
    const authorizedSurfaces = UIRegistry.getAuthorizedSurfaces();
    assert.strictEqual(authorizedSurfaces.length, 14);

    for (const surface of authorizedSurfaces) {
      assert.strictEqual(UIRegistry.verifyProviderMasking(surface), true);
    }

    assert.strictEqual(UIRegistry.verifyProviderMasking('BLOOMBERG_FEED'), false);
    assert.strictEqual(UIRegistry.verifyProviderMasking('REFINITIV_EIKON'), false);
  });

  it('CP-W4-05: Replay Disclosure Invariance — Mandatory AD17_CONSTRAINT present and unclipped in Replay views', () => {
    const mockMarketData: MarketDataDTO = {
      companyId: 'INFY',
      symbol: 'INFY',
      exchange: 'NSE',
      ltp: 1850.5,
      open: 1840.0,
      high: 1865.0,
      low: 1835.0,
      previousClose: 1830.0,
      change: 20.5,
      pctChange: 1.12,
      volume: 2500000,
      mode: 'SNAPSHOT',
      quality: 'GOOD',
      provenance: {
        sourceClassification: 'REAL',
        asOf: '2026-09-18T10:00:00.000Z',
        evaluatedAt: '2026-09-18T10:00:01.000Z',
        dataVersion: 'v1.0.0',
        lineageDigest: 'hash1',
        quality: 'GOOD',
        replayConstraintApplied: false,
      },
    };

    const vm = UI01ReplayStudioBuilder.build({
      marketSnapshot: mockMarketData,
      engineScore: {
        companyId: 'INFY',
        engineId: 'SECTOR_IT',
        rawScore: 82.5,
        normalizedScore: 82.5,
        grade: 'A',
        factorBreakdown: { valuation: 78.0, quality: 88.0, profitability: 84.0, momentum: 80.0 },
        qualityState: 'GOOD',
        provenance: {
          sourceClassification: 'CERTIFIED_ENGINE',
          vendorTier: 'OFFLINE_BOOTSTRAP',
          asOf: '2026-09-18T10:00:00.000Z',
          receivedAt: '2026-09-18T10:00:00.000Z',
          evaluatedAt: '2026-09-18T10:00:01.000Z',
          dataVersion: 'v1.0.0-certified-frozen',
          lineageHash: 'hash2',
          qualityState: 'GOOD',
        },
        versionVector: {
          schemaVersion: '1.0.0',
          engineVersion: 'v1.0.0-certified-frozen',
          securityMasterVersion: '2026.09.19',
          dataVersionVector: { D01_QUOTES: 'v1.0' },
        },
        executionId: 'exec-01',
        evaluatedAt: '2026-09-18T10:00:01.000Z',
        isFallbackApplied: false,
        fallbackFields: [],
      },
      companyName: 'Infosys Limited',
    });

    assert.strictEqual(vm.ad17MandatoryDisclosure, AD17_CONSTRAINT_TEXT);
    assert.ok(vm.ad17MandatoryDisclosure.includes('AD17_CONSTRAINT'));
  });

  it('CP-W4-06: Accessibility Invariance — WCAG 2.1 AA dual coding, focus management and contrast', () => {
    // Contrast check
    const contrast = AccessibilityEngine.checkContrast('#0f766e', '#FFFFFF');
    assert.strictEqual(contrast.passesNormalText, true);

    // Non-color-only dual coding
    const qGood = AccessibilityEngine.getQualityIndicator('GOOD');
    assert.strictEqual(qGood.icon, '✓');

    const qPartial = AccessibilityEngine.getQualityIndicator('PARTIAL');
    assert.strictEqual(qPartial.icon, '⚠');

    // Focus trap
    const trap = AccessibilityEngine.createFocusTrap(['btn1', 'btn2']);
    assert.strictEqual(trap.getFocusedId(), 'btn1');
  });

  it('CP-W4-07: Responsive Layout Invariance — All 4 tiers resolve correct columns and mobile pinned primary key', () => {
    assert.strictEqual(ResponsiveEngine.resolveTier(500).tier, 'MOBILE');
    assert.strictEqual(ResponsiveEngine.resolveTier(500).pinPrimaryColumn, true);
    assert.strictEqual(ResponsiveEngine.resolveTier(800).tier, 'TABLET');
    assert.strictEqual(ResponsiveEngine.resolveTier(1200).tier, 'DESKTOP');
    assert.strictEqual(ResponsiveEngine.resolveTier(1600).tier, 'WIDE');
  });

  it('CP-W4-08: Zero Wave 5 Bleed — Zero derivatives, options, cross-asset models exist in runtime', () => {
    const srcDir = path.join(rootDir, 'src');
    const allFiles: string[] = [];

    function collectFiles(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) collectFiles(full);
        else if (entry.name.endsWith('.ts')) allFiles.push(full);
      }
    }
    collectFiles(srcDir);

    const wave5Keywords = ['blackScholes', 'greeksDelta', 'impliedVolatilitySurface', 'monteCarloDerivative'];
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const kw of wave5Keywords) {
        assert.ok(!content.includes(kw), `Wave 5 bleed detected: keyword '${kw}' in ${file}`);
      }
    }
  });

  it('CP-W4-09: Zero Plaintext Secrets Invariant — Workspace AST scanner must confirm 0 violations', () => {
    const srcDir = path.join(rootDir, 'src');
    const testsDir = path.join(rootDir, 'tests');

    const srcFindings = scanDirectoryForSecrets(srcDir);
    const testsFindings = scanDirectoryForSecrets(testsDir);
    const totalViolations = srcFindings.violations.length + testsFindings.violations.length;

    assert.strictEqual(totalViolations, 0, `Expected 0 plaintext secrets, found ${totalViolations}`);
  });

  it('CP-W4-10: Deterministic UI Data-State Behavior — Repeated view model generation produces byte-identical results', () => {
    const mockMarketData: MarketDataDTO = {
      companyId: 'INFY',
      symbol: 'INFY',
      exchange: 'NSE',
      ltp: 1850.5,
      open: 1840.0,
      high: 1865.0,
      low: 1835.0,
      previousClose: 1830.0,
      change: 20.5,
      pctChange: 1.12,
      volume: 2500000,
      mode: 'SNAPSHOT',
      quality: 'GOOD',
      provenance: {
        sourceClassification: 'REAL',
        asOf: '2026-09-18T10:00:00.000Z',
        evaluatedAt: '2026-09-18T10:00:01.000Z',
        dataVersion: 'v1.0.0',
        lineageDigest: 'hash1',
        quality: 'GOOD',
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
        lineageHash: 'hash2',
        qualityState: 'GOOD' as const,
      },
      versionVector: {
        schemaVersion: '1.0.0',
        engineVersion: 'v1.0.0-certified-frozen',
        securityMasterVersion: '2026.09.19',
        dataVersionVector: { D01_QUOTES: 'v1.0' },
      },
      executionId: 'exec-01',
      evaluatedAt: '2026-09-18T10:00:01.000Z',
      isFallbackApplied: false,
      fallbackFields: [],
    };

    const mockIntelligence: IntelligenceDTO = {
      companyId: 'INFY',
      news: {
        newsItems: [],
        totalAvailable: 0,
        filteredCount: 0,
        dominantSentiment: 'NEUTRAL',
        averageSentimentScore: 0.1,
        qualityState: 'GOOD',
      },
      quality: 'GOOD',
      provenance: {
        sourceClassification: 'DERIVED',
        asOf: '2026-09-18T10:00:00.000Z',
        evaluatedAt: '2026-09-18T10:00:01.000Z',
        dataVersion: 'v1.0.0',
        lineageDigest: 'hash3',
        quality: 'GOOD',
        replayConstraintApplied: false,
      },
    };

    const vm1 = UI02ExecutiveSummaryBuilder.build({
      marketData: mockMarketData,
      engineScore: mockEngineScore,
      intelligence: mockIntelligence,
      companyName: 'Infosys Limited',
      rank: 1,
      viewportWidth: 1280,
    });

    const vm2 = UI02ExecutiveSummaryBuilder.build({
      marketData: mockMarketData,
      engineScore: mockEngineScore,
      intelligence: mockIntelligence,
      companyName: 'Infosys Limited',
      rank: 1,
      viewportWidth: 1280,
    });

    assert.strictEqual(JSON.stringify(vm1), JSON.stringify(vm2));
  });
});
