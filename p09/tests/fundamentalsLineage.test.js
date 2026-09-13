/**
 * P09-04 — FUNDAMENTALS LINEAGE TESTS
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  P09_04_MODULE,
  CODED_NAMESPACE_PREFIXES,
  FREE_FORM_COLLISION_KEYS,
  buildFundamentalsLineage,
  buildProviderAbstraction,
  declareMetricCodeMapping,
  verifyLineageComplete,
  lineageDigest,
} from '../src/fundamentalsLineage.js';

import { RECEIVED_AT, testLineage, assertThrowsWithRule } from './helpers.js';

// ── Module identity ────────────────────────────────────────────────────────────────────────

describe('P09-04 module identity', () => {
  it('has the correct module identifier', () => {
    assert.equal(P09_04_MODULE, 'P09-04-FUNDAMENTALS-LINEAGE');
  });
});

// ── Metric-code namespace (FL-3) ───────────────────────────────────────────────────────────

describe('FL-3 — metric-code namespace', () => {
  it('coded namespace prefixes are frozen', () => {
    assert.ok(Object.isFrozen(CODED_NAMESPACE_PREFIXES));
  });

  it('contains exactly 7 sector prefixes', () => {
    assert.equal(CODED_NAMESPACE_PREFIXES.length, 7);
    for (const prefix of ['BM', 'IM', 'CM', 'HC', 'TL', 'AU', 'MM']) {
      assert.ok(CODED_NAMESPACE_PREFIXES.includes(prefix), `missing ${prefix}`);
    }
  });

  it('free-form collision keys are frozen', () => {
    assert.ok(Object.isFrozen(FREE_FORM_COLLISION_KEYS));
  });

  it('contains exactly 13 collision keys (D4_02)', () => {
    assert.equal(FREE_FORM_COLLISION_KEYS.length, 13);
    for (const key of ['ebitdaMargin', 'debtEbitda', 'revenueGrowth', 'roic', 'peRatio']) {
      assert.ok(FREE_FORM_COLLISION_KEYS.includes(key), `missing ${key}`);
    }
  });
});

// ── Lineage building (FL-1) ────────────────────────────────────────────────────────────────

describe('buildFundamentalsLineage', () => {
  it('builds a complete lineage block', () => {
    const lineage = buildFundamentalsLineage({
      sourceRef: 'test://fundamentals/nse/annual/2025',
      adapterId: 'fundamentals-adapter',
      adapterVersion: '1.0',
      transformationChainRef: 'chain:fundamentals:normalization:v1',
      receivedAt: RECEIVED_AT,
    });
    assert.equal(lineage.sourceRef, 'test://fundamentals/nse/annual/2025');
    assert.equal(lineage.adapterId, 'fundamentals-adapter');
    assert.equal(lineage.module, P09_04_MODULE);
  });

  it('rejects missing sourceRef (FL-1)', () => {
    assertThrowsWithRule(() => buildFundamentalsLineage({
      adapterId: 'test', adapterVersion: '1.0',
      transformationChainRef: 'chain:test', receivedAt: RECEIVED_AT,
    }), 'FL-1');
  });

  it('rejects missing adapterId (FL-1)', () => {
    assertThrowsWithRule(() => buildFundamentalsLineage({
      sourceRef: 'test://source', adapterVersion: '1.0',
      transformationChainRef: 'chain:test', receivedAt: RECEIVED_AT,
    }), 'FL-1');
  });

  it('rejects missing transformationChainRef (FL-1)', () => {
    assertThrowsWithRule(() => buildFundamentalsLineage({
      sourceRef: 'test://source', adapterId: 'test', adapterVersion: '1.0',
      receivedAt: RECEIVED_AT,
    }), 'FL-1');
  });

  it('result is frozen (FL-5)', () => {
    const lineage = buildFundamentalsLineage({
      sourceRef: 'test://source', adapterId: 'test', adapterVersion: '1.0',
      transformationChainRef: 'chain:test', receivedAt: RECEIVED_AT,
    });
    assert.ok(Object.isFrozen(lineage));
  });
});

// ── Provider abstraction (FL-2, FL-4) ──────────────────────────────────────────────────────

describe('buildProviderAbstraction', () => {
  it('builds a provider abstraction record', () => {
    const abstraction = buildProviderAbstraction({
      provider: 'local_fixture',
      providerKind: 'LOCAL_FIXTURE',
      providerSchemaVersion: '1.0',
      providerDocumentRef: 'doc://annual-report/2025',
    });
    assert.equal(abstraction.provider, 'local_fixture');
    assert.equal(abstraction.providerKind, 'LOCAL_FIXTURE');
    assert.equal(abstraction.module, P09_04_MODULE);
  });

  it('rejects missing provider (FL-4)', () => {
    assertThrowsWithRule(() => buildProviderAbstraction({
      providerKind: 'LOCAL_FIXTURE',
    }), 'FL-4');
  });

  it('rejects non-LOCAL_FIXTURE providerKind (FL-6)', () => {
    assertThrowsWithRule(() => buildProviderAbstraction({
      provider: 'live_provider',
      providerKind: 'LIVE',
    }), 'FL-6');
  });

  it('result is frozen', () => {
    const abstraction = buildProviderAbstraction({
      provider: 'local_fixture',
      providerKind: 'LOCAL_FIXTURE',
      providerSchemaVersion: '1.0',
    });
    assert.ok(Object.isFrozen(abstraction));
  });
});

// ── Metric-code mapping declaration (FL-3) ─────────────────────────────────────────────────

describe('declareMetricCodeMapping', () => {
  it('declares a valid mapping', () => {
    const mapping = declareMetricCodeMapping({
      mappingId: 'fundamentals-to-banking-v1',
      mappingVersion: '1.0',
      engineId: 'banking-engine',
      entries: [
        { canonicalKey: 'MD:fundamentals.revenue', engineKey: 'BM-01', sectorNamespace: 'BM' },
        { canonicalKey: 'MD:fundamentals.netIncome', engineKey: 'BM-02', sectorNamespace: 'BM' },
      ],
    });
    assert.equal(mapping.mappingId, 'fundamentals-to-banking-v1');
    assert.equal(mapping.entryCount, 2);
    assert.ok(mapping.digest);
  });

  it('rejects non-namespaced canonical key (N-5)', () => {
    assertThrowsWithRule(() => declareMetricCodeMapping({
      mappingId: 'test', mappingVersion: '1.0', engineId: 'test',
      entries: [
        { canonicalKey: 'revenue', engineKey: 'BM-01', sectorNamespace: 'BM' },
      ],
    }), 'N-5');
  });

  it('rejects empty entries', () => {
    assertThrowsWithRule(() => declareMetricCodeMapping({
      mappingId: 'test', mappingVersion: '1.0', engineId: 'test',
      entries: [],
    }), 'FL-3');
  });

  it('result is frozen', () => {
    const mapping = declareMetricCodeMapping({
      mappingId: 'test', mappingVersion: '1.0', engineId: 'test',
      entries: [
        { canonicalKey: 'MD:fundamentals.revenue', engineKey: 'BM-01', sectorNamespace: 'BM' },
      ],
    });
    assert.ok(Object.isFrozen(mapping));
    assert.ok(Object.isFrozen(mapping.entries));
  });
});

// ── Lineage completeness verification (FL-1) ───────────────────────────────────────────────

describe('verifyLineageComplete', () => {
  it('verifies a complete lineage block', () => {
    const lineage = testLineage();
    const result = verifyLineageComplete(lineage);
    assert.equal(result.complete, true);
    assert.equal(result.missing.length, 0);
  });

  it('detects missing fields', () => {
    const result = verifyLineageComplete({ sourceRef: 'test' });
    assert.equal(result.complete, false);
    assert.ok(result.missing.length > 0);
  });

  it('detects empty lineage', () => {
    const result = verifyLineageComplete({});
    assert.equal(result.complete, false);
    assert.equal(result.missing.length, 6);
  });
});

// ── Lineage digest (FL-5) ──────────────────────────────────────────────────────────────────

describe('lineageDigest', () => {
  it('produces a deterministic digest', () => {
    const lineage = testLineage();
    const d1 = lineageDigest(lineage);
    const d2 = lineageDigest(lineage);
    assert.equal(d1, d2);
  });

  it('different lineage produces different digest', () => {
    const d1 = lineageDigest(testLineage());
    const d2 = lineageDigest(testLineage({ sourceRef: 'different://source' }));
    assert.notEqual(d1, d2);
  });
});
