/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-D3B Instrument Mapping & Identity-Resolution Suite (synthetic only)
 *
 * Gate: DHAN-D3B PRE-ACCESS MAPPING FOUNDATION. All identifiers are synthetic.
 * The real Dhan instrument registry remains EMPTY: no real-world security ids
 * are invented, and DHAN_INSTRUMENT_MASTER rows are never fabricated here.
 *
 * Covers: exact canonical identity resolution (NSE/BSE), missing identity,
 * missing mapping, duplicates, conflicts (security-id reuse, exchange,
 * instrument type), eligibility (inactive instrument), malformed rows, empty
 * registry, provenance/version metadata, and fail-closed resolution.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  DhanInstrumentMapping,
  DhanInstrumentMappingConflictError,
  DhanInstrumentRegistry,
  DhanInstrumentResolutionService,
  SecurityMaster,
  loadDhanInstrumentMappings,
  validateDhanInstrumentMappingRow,
} from '../src/index.js';

const SYNTH = 'SYNTHETIC_PRE_ACCESS_FIXTURE' as const;

function mapping(overrides: Partial<DhanInstrumentMapping> = {}): DhanInstrumentMapping {
  return {
    companyId: 'COMP-SYNTH-A',
    exchange: 'NSE',
    symbol: 'SYNTHA',
    exchangeSegment: 'NSE_EQ',
    dhanSecurityId: 'SYNTH-NSE-EQ-0001',
    mappingProvenance: SYNTH,
    instrumentType: 'EQUITY',
    active: true,
    mappingVersion: 'synthetic-v1',
    effectiveDate: '2026-09-25',
    validationStatus: 'UNVALIDATED',
    ...overrides,
  };
}

function securityMasterWithSynthEntity(): SecurityMaster {
  const sm = new SecurityMaster();
  sm.registerEntity({
    companyId: 'COMP-SYNTH-A',
    isin: 'INE000SYNTHA',
    companyName: 'Synthetic A',
    industry: 'TEST',
    sector: 'TEST',
    effectiveFrom: '2026-01-01',
    listings: [{ exchange: 'NSE', symbol: 'SYNTHA', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
  });
  return sm;
}

describe('DHAN-D3B instrument mapping (synthetic)', () => {
  it('D3B-01: valid NSE and BSE equity mappings register and resolve exactly', () => {
    const registry = new DhanInstrumentRegistry();
    registry.register(mapping());
    registry.register(
      mapping({
        companyId: 'COMP-SYNTH-B',
        exchange: 'BSE',
        symbol: 'SYNTHB',
        exchangeSegment: 'BSE_EQ',
        dhanSecurityId: 'SYNTH-BSE-EQ-0002',
      })
    );
    const a = registry.resolve('comp-synth-a'); // case-insensitive canonical id
    assert.ok(a.status === 'RESOLVED');
    if (a.status === 'RESOLVED') {
      assert.strictEqual(a.mapping.companyId, 'COMP-SYNTH-A');
      assert.strictEqual(a.mapping.exchange, 'NSE');
      assert.strictEqual(a.mapping.exchangeSegment, 'NSE_EQ');
      assert.strictEqual(a.mapping.instrumentType, 'EQUITY');
    }
    const b = registry.resolve('COMP-SYNTH-B');
    assert.ok(b.status === 'RESOLVED');
    if (b.status === 'RESOLVED') assert.strictEqual(b.mapping.exchangeSegment, 'BSE_EQ');
  });

  it('D3B-02: empty registry fails closed with NO_MAPPING_DATA_LOADED', () => {
    const registry = new DhanInstrumentRegistry();
    assert.ok(registry.isEmpty());
    const r = registry.resolve('COMP-ANYTHING');
    assert.ok(r.status === 'UNRESOLVED');
    if (r.status === 'UNRESOLVED') {
      assert.strictEqual(r.reason, 'NO_MAPPING_DATA_LOADED');
      assert.strictEqual(r.companyId, 'COMP-ANYTHING'); // original identity preserved
    }
  });

  it('D3B-03: missing Dhan mapping returns explicit UNMAPPED_COMPANY_ID, never invented', () => {
    const registry = new DhanInstrumentRegistry();
    registry.register(mapping());
    const r = registry.resolve('COMP-UNMAPPED');
    assert.ok(r.status === 'UNRESOLVED');
    if (r.status === 'UNRESOLVED') assert.strictEqual(r.reason, 'UNMAPPED_COMPANY_ID');
  });

  it('D3B-04: duplicate Dhan security id across companies is rejected (SECURITY_ID_REUSED)', () => {
    const registry = new DhanInstrumentRegistry();
    registry.register(mapping());
    assert.throws(
      () =>
        registry.register(
          mapping({ companyId: 'COMP-SYNTH-C', symbol: 'SYNTHC', dhanSecurityId: 'SYNTH-NSE-EQ-0001' })
        ),
      (err: unknown) =>
        err instanceof DhanInstrumentMappingConflictError && err.conflictKind === 'SECURITY_ID_REUSED'
    );
  });

  it('D3B-05: conflicting canonical identity (remap / exchange / instrument type) is rejected', () => {
    const registry = new DhanInstrumentRegistry();
    registry.register(mapping());
    // Same companyId, different provider instrument.
    assert.throws(
      () => registry.register(mapping({ dhanSecurityId: 'SYNTH-NSE-EQ-9999' })),
      (err: unknown) =>
        err instanceof DhanInstrumentMappingConflictError && err.conflictKind === 'COMPANY_ID_REMAPPED'
    );
    // Conflicting exchange assignment.
    assert.throws(
      () =>
        registry.register(
          mapping({ dhanSecurityId: 'SYNTH-BSE-EQ-0007', exchange: 'BSE', exchangeSegment: 'BSE_EQ' })
        ),
      (err: unknown) =>
        err instanceof DhanInstrumentMappingConflictError && err.conflictKind === 'EXCHANGE_MISMATCH'
    );
    // Identical re-registration is idempotent.
    registry.register(mapping());
    assert.strictEqual(registry.size, 1);
  });

  it('D3B-06: inactive instrument never resolves to market data', () => {
    const registry = new DhanInstrumentRegistry();
    registry.register(mapping({ active: false }));
    const r = registry.resolve('COMP-SYNTH-A');
    assert.ok(r.status === 'UNRESOLVED');
    if (r.status === 'UNRESOLVED') assert.strictEqual(r.reason, 'INSTRUMENT_INACTIVE');
  });

  it('D3B-07: malformed mapping rows are rejected deterministically', () => {
    const badRows: unknown[] = [
      null,
      42,
      'row',
      {},
      { companyId: 'X' }, // missing the rest
      mapping({ exchangeSegment: 'NSE_EQ', exchange: 'BSE' }), // segment/exchange inconsistency
      { ...mapping(), instrumentType: 'OPTION' },
      { ...mapping(), active: 'yes' },
      { ...mapping(), effectiveDate: 'not-a-date' },
      { ...mapping(), validationStatus: 'MAYBE' },
      // Synthetic row claiming provider verification — fabricated date.
      { ...mapping(), lastVerifiedAt: '2026-09-25T00:00:00Z' },
    ];
    for (const row of badRows) {
      const r = validateDhanInstrumentMappingRow(row);
      assert.ok(!r.ok, `expected rejection of ${JSON.stringify(row)}`);
      if (!r.ok) assert.strictEqual(r.failure.code, 'MALFORMED_INSTRUMENT_MAPPING');
    }
    // Valid row passes; instrument-master row may carry verification metadata.
    assert.ok(validateDhanInstrumentMappingRow(mapping()).ok);
    assert.ok(
      validateDhanInstrumentMappingRow({
        ...mapping(),
        mappingProvenance: 'DHAN_INSTRUMENT_MASTER',
        validationStatus: 'VALIDATED',
        lastVerifiedAt: '2026-09-25T00:00:00.000Z',
      }).ok
    );
  });

  it('D3B-08: load report audits accepted/rejected rows without throwing', () => {
    const report = loadDhanInstrumentMappings([
      mapping(),
      { ...mapping(), companyId: 'COMP-SYNTH-B', symbol: 'SYNTHB', exchange: 'BSE', exchangeSegment: 'BSE_EQ', dhanSecurityId: 'SYNTH-BSE-EQ-0002' },
      'garbage',
      { ...mapping(), companyId: 'COMP-SYNTH-C', symbol: 'SYNTHC', dhanSecurityId: 'SYNTH-NSE-EQ-0001' }, // duplicate security id -> conflict
    ]);
    assert.strictEqual(report.acceptedCount, 2);
    assert.strictEqual(report.rejectedCount, 2);
    assert.strictEqual(report.syntheticCount, 2);
    assert.strictEqual(report.instrumentMasterCount, 0);
    assert.strictEqual(report.registry.size, 2);
    assert.deepStrictEqual(
      report.rejections.map((r) => r.code),
      ['MALFORMED_INSTRUMENT_MAPPING', 'CONFLICTING_INSTRUMENT_MAPPING']
    );
  });

  it('D3B-09: P04 SecurityMaster alignment — ISIN/symbol resolve to canonical companyId, then mapping', () => {
    const sm = securityMasterWithSynthEntity();
    const registry = new DhanInstrumentRegistry();
    registry.register(mapping());
    const service = new DhanInstrumentResolutionService(sm, registry);

    const byIsin = service.resolveCanonicalIdentity({ identifierType: 'ISIN', identifierValue: 'ine000syntha' });
    assert.ok(byIsin.ok, JSON.stringify(byIsin));
    if (byIsin.ok) {
      assert.deepStrictEqual(byIsin.value, { companyId: 'COMP-SYNTH-A', symbol: 'SYNTHA', exchange: 'NSE' });
      // Canonical-only view: no Dhan identifier crosses the boundary.
      assert.ok(!JSON.stringify(byIsin.value).includes('SYNTH-NSE-EQ'));
    }
    const bySymbol = service.resolveCanonicalIdentity({ identifierType: 'NSE_SYMBOL', identifierValue: 'SYNTHA' });
    assert.ok(bySymbol.ok);
    // Unknown identity fails closed via P04 quarantine.
    const unknown = service.resolveCanonicalIdentity({ identifierType: 'ISIN', identifierValue: 'INE999UNKNOWN' });
    assert.ok(!unknown.ok);
    if (!unknown.ok) assert.strictEqual(unknown.failure.code, 'IDENTITY_RESOLUTION_FAILURE');
    // Ambiguous identity (two companies claiming one symbol) fails closed.
    sm.registerEntity({
      companyId: 'COMP-SYNTH-D',
      isin: 'INE000SYNTHD',
      companyName: 'Synthetic D',
      industry: 'TEST',
      sector: 'TEST',
      effectiveFrom: '2026-01-01',
      listings: [{ exchange: 'NSE', symbol: 'SYNTHA', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
    });
    const ambiguous = service.resolveCanonicalIdentity({ identifierType: 'NSE_SYMBOL', identifierValue: 'SYNTHA' });
    assert.ok(!ambiguous.ok);
    if (!ambiguous.ok) assert.strictEqual(ambiguous.failure.code, 'IDENTITY_RESOLUTION_FAILURE');
  });

  it('D3B-10: unresolved instruments cannot produce quotes through the resolution service', () => {
    const sm = securityMasterWithSynthEntity();
    const emptyRegistry = new DhanInstrumentRegistry(); // real registry stays empty pre-access
    const service = new DhanInstrumentResolutionService(sm, emptyRegistry);
    const r = service.resolveProviderMapping('COMP-SYNTH-A');
    assert.ok(!r.ok);
    if (!r.ok) assert.strictEqual(r.failure.code, 'UNRESOLVED_INSTRUMENT');
    const coverage = service.describeCoverage();
    assert.strictEqual(coverage.totalMappings, 0);
    assert.strictEqual(coverage.preAccessOnly, true);
  });

  it('D3B-11: mapping provenance and version consistency is enforced', () => {
    // Synthetic provenance must be declared; missing provenance rejected.
    const noProv = validateDhanInstrumentMappingRow({
      companyId: 'C',
      symbol: 'S',
      exchange: 'NSE',
      exchangeSegment: 'NSE_EQ',
      dhanSecurityId: 'X',
    });
    assert.ok(!noProv.ok);
    // Registry rejects bad metadata at registration time.
    const registry = new DhanInstrumentRegistry();
    assert.throws(() => registry.register(mapping({ effectiveDate: '32/13/2026' })));
    assert.throws(() => registry.register({ ...mapping(), mappingProvenance: SYNTH, lastVerifiedAt: '2026-09-25T00:00:00Z' }));
    // Version metadata round-trips through the loader.
    const report = loadDhanInstrumentMappings([mapping({ mappingVersion: 'synthetic-v2' })]);
    const row = report.registry.list()[0]!;
    assert.strictEqual(row.mappingVersion, 'synthetic-v2');
    assert.strictEqual(row.validationStatus, 'UNVALIDATED');
    assert.strictEqual(row.lastVerifiedAt, undefined); // never fabricated for synthetic rows
  });
});
