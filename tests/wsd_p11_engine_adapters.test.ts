/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-D Test Suite: P11 Engine Adapters & Recalculation Integration
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { computeLineageHash } from '../src/contracts/provenance.js';

import {
  DataBoundExecutor,
  NamespaceGuard,
  NamespaceViolationError,
  RecalculationDAG,
  FrozenEngines,
  SecurityMaster,
  IdentityAmbiguityError,
  CertifiedSectorEngineId,
} from '../src/index.js';

describe('WS-D / P11 Engine Adapters & Recalculation Integration', () => {
  const sm = new SecurityMaster();
  sm.registerEntity({
    companyId: 'INFY',
    isin: 'INE009A01021',
    companyName: 'Infosys Limited',
    industry: 'Information Technology',
    sector: 'Technology',
    effectiveFrom: '2000-01-01T00:00:00.000Z',
    listings: [{ exchange: 'NSE', symbol: 'INFY', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
  });
  sm.registerEntity({
    companyId: 'TCS',
    isin: 'INE467B01029',
    companyName: 'Tata Consultancy Services',
    industry: 'Information Technology',
    sector: 'Technology',
    effectiveFrom: '2004-08-25T00:00:00.000Z',
    listings: [{ exchange: 'NSE', symbol: 'TCS', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
  });

  const executor = new DataBoundExecutor(sm);

  it('P11-01: DataBoundExecutor should execute sector scoring with namespaced inputs and produce valid provenance', () => {
    const rawInputs = {
      'MD:D01_QUOTES.pe': 22.5,
      'MD:D01_QUOTES.pb': 6.5,
      'MD:D01_QUOTES.pctChange': 1.5,
      'MD:D01_QUOTES.beta': 0.95,
      'MD:D03_FUNDAMENTALS.roe': 28.0,
      'MD:D03_FUNDAMENTALS.roce': 32.0,
      'MD:D03_FUNDAMENTALS.operatingMargin': 24.5,
    };

    const result = executor.execute({
      requestId: 'REQ-IT-001',
      companyId: 'INFY',
      engineId: 'SECTOR_IT',
      asOf: '2026-09-18T10:00:00.000Z',
      rawMarketDataInputs: rawInputs,
      correlationId: 'corr-engine-01',
      tenantId: 'tenant-inst-1',
    });

    assert.strictEqual(result.companyId, 'INFY');
    assert.strictEqual(result.engineId, 'SECTOR_IT');
    assert.ok(result.normalizedScore >= 50 && result.normalizedScore <= 100);
    assert.ok(['A+', 'A', 'B+', 'B', 'C'].includes(result.grade));
    assert.strictEqual(result.isFallbackApplied, false);
    assert.strictEqual(result.qualityState, 'GOOD');
    assert.strictEqual(result.provenance.sourceClassification, 'CERTIFIED_ENGINE');
    assert.strictEqual(result.provenance.lineageHash.length, 64);
    assert.strictEqual(result.versionVector.engineVersion, 'v1.0.0-certified-frozen');
  });

  it('P11-01: canonical momentum reaches frozen scoring and changes the result', () => {
    const base = {
      'MD:D01_QUOTES.pe': 25,
      'MD:D01_QUOTES.pb': 6,
      'MD:D03_FUNDAMENTALS.roe': 24,
      'MD:D03_FUNDAMENTALS.roce': 30,
      'MD:D03_FUNDAMENTALS.operatingMargin': 22,
    };
    const executeWithMomentum = (pctChange?: number) => executor.execute({
      requestId: 'REQ-MOMENTUM', companyId: 'INFY', engineId: 'SECTOR_IT',
      asOf: '2026-09-18T10:00:00.000Z',
      rawMarketDataInputs: { ...base, ...(pctChange === undefined ? {} : { 'MD:D01_QUOTES.pctChange': pctChange }) },
    });
    const positive = executeWithMomentum(10);
    const negative = executeWithMomentum(-10);
    assert.strictEqual(positive.factorBreakdown.momentumScore, 70);
    assert.strictEqual(negative.factorBreakdown.momentumScore, 30);
    assert.notStrictEqual(positive.normalizedScore, negative.normalizedScore);

    const missing = executeWithMomentum();
    assert.strictEqual(missing.factorBreakdown.momentumScore, 50);
    assert.ok(missing.fallbackFields.includes('momentum'));
    assert.strictEqual(missing.qualityState, 'PARTIAL');
  });

  it('P11-03: lineage binds effective inputs, output, engine/version and as-of metadata', () => {
    const request = {
      requestId: 'REQ-LINEAGE', companyId: 'INFY', engineId: 'SECTOR_IT' as const,
      asOf: '2026-09-18T10:00:00.000Z',
      rawMarketDataInputs: {
        'MD:D01_QUOTES.pe': 22, 'MD:D01_QUOTES.pb': 6,
        'MD:D01_QUOTES.pctChange': 1, 'MD:D03_FUNDAMENTALS.roe': 24,
        'MD:D03_FUNDAMENTALS.roce': 30, 'MD:D03_FUNDAMENTALS.operatingMargin': 22,
      },
    };
    const first = executor.execute(request);
    const same = executor.execute({ ...request, requestId: 'different-request-id' });
    const changed = executor.execute({ ...request, rawMarketDataInputs: { ...request.rawMarketDataInputs, 'MD:D01_QUOTES.pe': 23 } });
    assert.strictEqual(first.provenance.lineageHash, same.provenance.lineageHash);
    assert.notStrictEqual(first.provenance.lineageHash, changed.provenance.lineageHash);

    const sanitized = NamespaceGuard.validateAndSanitizeInputs(request.rawMarketDataInputs);
    const effectiveInputs = {
      pe: sanitized['D01_QUOTES.pe'], pb: sanitized['D01_QUOTES.pb'],
      roe: sanitized['D03_FUNDAMENTALS.roe'], roce: sanitized['D03_FUNDAMENTALS.roce'],
      operatingMargin: sanitized['D03_FUNDAMENTALS.operatingMargin'],
      beta: 0.95, momentum: sanitized['D01_QUOTES.pctChange'],
    };
    const output = { rawScore: first.rawScore, normalizedScore: first.normalizedScore, grade: first.grade, factors: first.factorBreakdown };
    assert.strictEqual(first.provenance.lineageHash, computeLineageHash({
      companyId: first.companyId, engineId: first.engineId, versionVector: first.versionVector,
      asOf: request.asOf, effectiveScoringInputs: effectiveInputs, output,
    }, { sourceClassification: 'CERTIFIED_ENGINE', asOf: request.asOf, dataVersion: first.versionVector.engineVersion }));
  });

  it('P11-02: C1-C6 Namespace Guard should reject non-namespaced inputs and fail closed', () => {
    const nonCompliantInputs = {
      'raw_unnamespaced_pe': 22.5, // Fails C1-C6 prefix check
    };

    assert.throws(() => {
      executor.execute({
        requestId: 'REQ-ERR-001',
        companyId: 'INFY',
        engineId: 'SECTOR_IT',
        asOf: '2026-09-18T10:00:00.000Z',
        rawMarketDataInputs: nonCompliantInputs,
      });
    }, NamespaceViolationError);
  });

  it('P11-03: P04 Identity Authority should fail closed for unmapped companyId', () => {
    const validInputs = {
      'MD:D01_QUOTES.pe': 20.0,
    };

    assert.throws(() => {
      executor.execute({
        requestId: 'REQ-ERR-002',
        companyId: 'UNMAPPED_COMPANY_TICKER',
        engineId: 'SECTOR_IT',
        asOf: '2026-09-18T10:00:00.000Z',
        rawMarketDataInputs: validInputs,
      });
    }, IdentityAmbiguityError);
  });

  it('P11-04: Governed Sector Defaults should inject fallbacks when metrics are missing and mark quality PARTIAL', () => {
    // Only PE provided; PB, ROE, ROCE, Margins omitted -> Trigger sector fallbacks
    const partialInputs = {
      'MD:D01_QUOTES.pe': 18.0,
    };

    const result = executor.execute({
      requestId: 'REQ-FALLBACK-001',
      companyId: 'INFY',
      engineId: 'SECTOR_IT',
      asOf: '2026-09-18T10:00:00.000Z',
      rawMarketDataInputs: partialInputs,
    });

    assert.strictEqual(result.isFallbackApplied, true);
    assert.ok(result.fallbackFields.length >= 4);
    assert.strictEqual(result.qualityState, 'PARTIAL'); // Worst-case quality floor on fallback
  });

  it('P11-05: RecalculationDAG should track domain dependencies and trigger downstream engine runs', () => {
    const dag = new RecalculationDAG();

    // Trigger update on D01 Quotes for INFY
    const triggerEvent = dag.triggerUpdate('INFY', 'D01_QUOTES', 'SECTOR_IT');
    assert.strictEqual(triggerEvent.companyId, 'INFY');
    assert.strictEqual(triggerEvent.triggeredByDomain, 'D01_QUOTES');
    assert.ok(triggerEvent.targetEngines.includes('SECTOR_IT'));
    assert.ok(triggerEvent.targetEngines.includes('CSIP_COMPOSITE'));
    assert.strictEqual(dag.getPendingTriggers().length, 1);
  });

  it('P11-06: Frozen 13 Sector Engines & CSIP should execute deterministically across all sectors', () => {
    const allSectors: CertifiedSectorEngineId[] = [
      'SECTOR_IT', 'SECTOR_BANKING', 'SECTOR_AUTO', 'SECTOR_PHARMA', 'SECTOR_FMCG',
      'SECTOR_METALS', 'SECTOR_OIL_GAS', 'SECTOR_POWER', 'SECTOR_CEMENT', 'SECTOR_TELECOM',
      'SECTOR_CONSUMER_DURABLES', 'SECTOR_CAPITAL_GOODS', 'SECTOR_CHEMICALS'
    ];

    const benchmarkInputs = { pe: 20.0, pb: 3.0, roe: 18.0, roce: 20.0, operatingMargin: 18.0, momentum: 1.0 };
    const scores: Array<{ companyId: string; normalizedScore: number }> = [];

    for (const sec of allSectors) {
      const res = FrozenEngines.executeSectorEngine(sec, benchmarkInputs);
      assert.ok(res.normalizedScore >= 0 && res.normalizedScore <= 100);
      assert.ok(['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].includes(res.grade));
      scores.push({ companyId: `CO_${sec}`, normalizedScore: res.normalizedScore });
    }

    // Execute CSIP Composite Ranking
    const csipRanking = FrozenEngines.executeCSIP(scores);
    assert.strictEqual(csipRanking.length, 13);
    assert.strictEqual(csipRanking[0].rank, 1);
    assert.strictEqual(csipRanking[12].rank, 13);
  });
});
