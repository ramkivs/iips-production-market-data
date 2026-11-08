/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-D3B Instrument Mapping & Identity-Resolution Suite (synthetic only)
 *
 * Gate: DHAN-D3B-CORRECTION — company identity is NOT security identity.
 * All identifiers are synthetic. The real Dhan instrument registry remains
 * EMPTY: no real-world security ids are invented, and DHAN_INSTRUMENT_MASTER
 * rows are never fabricated here.
 *
 * Model under test:
 *   companyId  = canonical COMPANY identity (P04) — one company, many securities.
 *   security   = listing-level identity: (companyId, exchangeSegment[, isin]).
 *   Dhan id    = provider instrument id, scoped to (exchangeSegment, securityId);
 *                provider-wide uniqueness is NOT assumed (live qualification pending).
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
    isin: 'INE000SYNTHA',
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
    listings: [
      { exchange: 'NSE', symbol: 'SYNTHA', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
      { exchange: 'BSE', symbol: 'SYNTHA', scripCode: 'SYN500001', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
    ],
  });
  return sm;
}

describe('DHAN-D3B instrument mapping (synthetic, company≠security)', () => {
  it('D3B-01: valid NSE and BSE equity mappings register and resolve per listing', () => {
    const registry = new DhanInstrumentRegistry();
    registry.register(mapping());
    registry.register(
      mapping({
        companyId: 'COMP-SYNTH-B',
        isin: 'INE000SYNTHB',
        exchange: 'BSE',
        symbol: 'SYNTHB',
        exchangeSegment: 'BSE_EQ',
        dhanSecurityId: 'SYNTH-BSE-EQ-0002',
      })
    );
    const a = registry.resolveListing('comp-synth-a', 'NSE_EQ'); // case-insensitive
    assert.ok(a.status === 'RESOLVED');
    if (a.status === 'RESOLVED') {
      assert.strictEqual(a.mapping.companyId, 'COMP-SYNTH-A');
      assert.strictEqual(a.mapping.exchange, 'NSE');
      assert.strictEqual(a.mapping.isin, 'INE000SYNTHA');
      assert.strictEqual(a.mapping.instrumentType, 'EQUITY');
    }
    const b = registry.resolveListing('COMP-SYNTH-B', 'BSE_EQ');
    assert.ok(b.status === 'RESOLVED');
    if (b.status === 'RESOLVED') assert.strictEqual(b.mapping.exchangeSegment, 'BSE_EQ');
  });

  it('D3B-02: one company with multiple securities/listings is NOT a conflict', () => {
    const registry = new DhanInstrumentRegistry();
    // Same company, NSE and BSE listings, distinct ISINs and Dhan ids.
    registry.register(mapping());
    registry.register(
      mapping({
        isin: 'INE000SYNTH2',
        exchange: 'BSE',
        symbol: 'SYNTHA',
        exchangeSegment: 'BSE_EQ',
        dhanSecurityId: 'SYNTH-BSE-EQ-0001',
      })
    );
    assert.strictEqual(registry.size, 2);
    const nse = registry.resolveListing('COMP-SYNTH-A', 'NSE_EQ');
    const bse = registry.resolveListing('COMP-SYNTH-A', 'BSE_EQ');
    assert.ok(nse.status === 'RESOLVED' && bse.status === 'RESOLVED');
    // Company-level resolution without a segment is ambiguous -> fail closed.
    const amb = registry.resolve('COMP-SYNTH-A');
    assert.ok(amb.status === 'UNRESOLVED');
    if (amb.status === 'UNRESOLVED') assert.strictEqual(amb.reason, 'AMBIGUOUS_MAPPING');
  });

  it('D3B-03: same Dhan security id under different segments is NOT a conflict (scoped uniqueness)', () => {
    const registry = new DhanInstrumentRegistry();
    registry.register(mapping({ dhanSecurityId: 'SYNTH-500001' }));
    registry.register(
      mapping({ exchange: 'BSE', exchangeSegment: 'BSE_EQ', dhanSecurityId: 'SYNTH-500001', isin: 'INE000SYNTH2' })
    );
    assert.strictEqual(registry.size, 2);
    // Same segment reuse by another company IS a conflict.
    assert.throws(
      () =>
        registry.register(
          mapping({ companyId: 'COMP-SYNTH-C', isin: 'INE000SYNTHC', symbol: 'SYNTHC', dhanSecurityId: 'SYNTH-500001' })
        ),
      (err: unknown) =>
        err instanceof DhanInstrumentMappingConflictError && err.conflictKind === 'SECURITY_ID_REUSED'
    );
  });

  it('D3B-04: genuine conflict for the same security identity is rejected', () => {
    const registry = new DhanInstrumentRegistry();
    registry.register(mapping());
    // Same company + same segment, different provider instrument -> conflict.
    assert.throws(
      () => registry.register(mapping({ dhanSecurityId: 'SYNTH-NSE-EQ-9999' })),
      (err: unknown) =>
        err instanceof DhanInstrumentMappingConflictError && err.conflictKind === 'SECURITY_MAPPING_CONFLICT'
    );
    // Identical re-registration is idempotent.
    registry.register(mapping());
    assert.strictEqual(registry.size, 1);
  });

  it('D3B-05: non-EQUITY instrument types are rejected (cash-equity scope); exchange mismatch within a listing rejected', () => {
    const registry = new DhanInstrumentRegistry();
    registry.register(mapping());
    // Out-of-scope instrument type fails closed at registration.
    assert.throws(() => registry.register(mapping({ instrumentType: 'OPTION' as never })));
    // A row whose exchange disagrees with its segment is malformed at validation.
    const bad = validateDhanInstrumentMappingRow(mapping({ exchange: 'BSE', exchangeSegment: 'NSE_EQ' }));
    assert.ok(!bad.ok);
    if (!bad.ok) assert.strictEqual(bad.failure.code, 'MALFORMED_INSTRUMENT_MAPPING');
  });

  it('D3B-06: empty registry fails closed with NO_MAPPING_DATA_LOADED; missing mapping is explicit', () => {
    const registry = new DhanInstrumentRegistry();
    assert.ok(registry.isEmpty());
    const r = registry.resolve('COMP-ANYTHING');
    assert.ok(r.status === 'UNRESOLVED');
    if (r.status === 'UNRESOLVED') {
      assert.strictEqual(r.reason, 'NO_MAPPING_DATA_LOADED');
      assert.strictEqual(r.companyId, 'COMP-ANYTHING'); // original identity preserved for diagnosis
    }
    registry.register(mapping());
    const miss = registry.resolveListing('COMP-UNMAPPED', 'NSE_EQ');
    assert.ok(miss.status === 'UNRESOLVED');
    if (miss.status === 'UNRESOLVED') assert.strictEqual(miss.reason, 'UNMAPPED_COMPANY_ID');
  });

  it('D3B-07: inactive instrument never resolves to market data', () => {
    const registry = new DhanInstrumentRegistry();
    registry.register(mapping({ active: false }));
    const r = registry.resolve('COMP-SYNTH-A');
    assert.ok(r.status === 'UNRESOLVED');
    if (r.status === 'UNRESOLVED') assert.strictEqual(r.reason, 'INSTRUMENT_INACTIVE');
  });

  it('D3B-08: malformed mapping rows are rejected deterministically', () => {
    const badRows: unknown[] = [
      null,
      42,
      'row',
      {},
      { companyId: 'X' },
      mapping({ exchangeSegment: 'NSE_EQ', exchange: 'BSE' }), // segment/exchange inconsistency
      { ...mapping(), isin: 'TOO-SHORT' },
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

  it('D3B-09: load report audits accepted/rejected rows without throwing', () => {
    const report = loadDhanInstrumentMappings([
      mapping(),
      mapping({ isin: 'INE000SYNTHB', companyId: 'COMP-SYNTH-B', symbol: 'SYNTHB', exchange: 'BSE', exchangeSegment: 'BSE_EQ', dhanSecurityId: 'SYNTH-BSE-EQ-0002' }),
      'garbage',
      mapping({ companyId: 'COMP-SYNTH-C', isin: 'INE000SYNTHC', symbol: 'SYNTHC', dhanSecurityId: 'SYNTH-NSE-EQ-0001' }), // id reuse
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

  it('D3B-10: P04 SecurityMaster alignment — ISIN/symbol resolve to companyId, then per-listing mapping; ambiguity fails closed', () => {
    const sm = securityMasterWithSynthEntity();
    const registry = new DhanInstrumentRegistry();
    registry.register(mapping());
    registry.register(
      mapping({ isin: 'INE000SYNTH2', exchange: 'BSE', exchangeSegment: 'BSE_EQ', dhanSecurityId: 'SYNTH-BSE-EQ-0001' })
    );
    const service = new DhanInstrumentResolutionService(sm, registry);

    // ISIN identifies the company's security but not its listing segment: with two
    // listings this fails closed rather than silently picking an instrument.
    const byIsin = service.resolveCanonicalIdentity({ identifierType: 'ISIN', identifierValue: 'ine000syntha' });
    assert.ok(!byIsin.ok);
    if (!byIsin.ok) assert.match(byIsin.failure.message, /AMBIGUOUS_MAPPING/);
    // A symbol query implies its segment and resolves the canonical identity.
    const bySymbol = service.resolveCanonicalIdentity({ identifierType: 'NSE_SYMBOL', identifierValue: 'syntha' });
    assert.ok(bySymbol.ok, JSON.stringify(bySymbol));
    if (bySymbol.ok) {
      // Canonical-only view: company identity, no Dhan identifier crosses the boundary.
      assert.deepStrictEqual(bySymbol.value, { companyId: 'COMP-SYNTH-A', symbol: 'SYNTHA', exchange: 'NSE' });
      assert.ok(!/SYNTH-(NSE|BSE)-EQ/.test(JSON.stringify(bySymbol.value))); // no Dhan instrument id leaks
    }
    // Segment-aware provider resolution picks the right listing, never silently.
    const nse = service.resolveProviderMapping('COMP-SYNTH-A', 'NSE_EQ');
    const bse = service.resolveProviderMapping('COMP-SYNTH-A', 'BSE_EQ');
    assert.ok(nse.ok && bse.ok);
    // Company-only resolution of a multi-listing company fails closed.
    const amb = service.resolveProviderMapping('COMP-SYNTH-A');
    assert.ok(!amb.ok);
    if (!amb.ok) assert.match(amb.failure.message, /AMBIGUOUS_MAPPING/);
    // Unknown identity fails closed via P04 quarantine.
    const unknown = service.resolveCanonicalIdentity({ identifierType: 'ISIN', identifierValue: 'INE999UNKNOWN' });
    assert.ok(!unknown.ok);
    if (!unknown.ok) assert.strictEqual(unknown.failure.code, 'IDENTITY_RESOLUTION_FAILURE');
    // Ambiguous P04 identity (two companies claiming one symbol) fails closed.
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

  it('D3B-11: unresolved instruments cannot produce quotes; real registry stays empty', () => {
    const sm = securityMasterWithSynthEntity();
    const emptyRegistry = new DhanInstrumentRegistry(); // real registry stays empty pre-access
    const service = new DhanInstrumentResolutionService(sm, emptyRegistry);
    const r = service.resolveProviderMapping('COMP-SYNTH-A', 'NSE_EQ');
    assert.ok(!r.ok);
    if (!r.ok) assert.strictEqual(r.failure.code, 'UNRESOLVED_INSTRUMENT');
    const coverage = service.describeCoverage();
    assert.strictEqual(coverage.totalMappings, 0);
    assert.strictEqual(coverage.preAccessOnly, true);
  });

  it('D3B-13 (mandatory): one company, one segment, two ISINs — both mappings coexist; company+segment is ambiguous; full security identity resolves exactly', () => {
    const registry = new DhanInstrumentRegistry();
    const eqA = mapping({ isin: 'INE000SYNTH1', securityId: 'ISIN:INE000SYNTH1:EQ', symbol: 'SYNTHA', dhanSecurityId: 'SYNTH-NSE-EQ-1001' });
    const eqB = mapping({ isin: 'INE000SYNTH2', securityId: 'ISIN:INE000SYNTH2:EQ', symbol: 'SYNTHA2', dhanSecurityId: 'SYNTH-NSE-EQ-1002' });
    registry.register(eqA);
    registry.register(eqB); // same company, same segment, different securities: NO conflict
    assert.strictEqual(registry.size, 2);

    // Neither overwrote the other.
    const all = registry.list();
    assert.deepStrictEqual(all.map((m) => m.isin).sort(), ['INE000SYNTH1', 'INE000SYNTH2']);
    assert.deepStrictEqual(all.map((m) => m.dhanSecurityId).sort(), ['SYNTH-NSE-EQ-1001', 'SYNTH-NSE-EQ-1002']);

    // Company + segment alone is ambiguous -> fail closed.
    const byListing = registry.resolveListing('COMP-SYNTH-A', 'NSE_EQ');
    assert.ok(byListing.status === 'UNRESOLVED');
    if (byListing.status === 'UNRESOLVED') assert.strictEqual(byListing.reason, 'AMBIGUOUS_MAPPING');
    const byCompany = registry.resolve('COMP-SYNTH-A');
    assert.ok(byCompany.status === 'UNRESOLVED');
    if (byCompany.status === 'UNRESOLVED') assert.strictEqual(byCompany.reason, 'AMBIGUOUS_MAPPING');

    // Complete security identity returns the correct mapping.
    const a = registry.resolveSecurity('COMP-SYNTH-A', 'NSE_EQ', 'INE000SYNTH1');
    const b = registry.resolveSecurity('COMP-SYNTH-A', 'NSE_EQ', 'ine000synth2'); // case-insensitive
    assert.ok(a.status === 'RESOLVED' && b.status === 'RESOLVED');
    if (a.status === 'RESOLVED') assert.strictEqual(a.mapping.dhanSecurityId, 'SYNTH-NSE-EQ-1001');
    if (b.status === 'RESOLVED') assert.strictEqual(b.mapping.dhanSecurityId, 'SYNTH-NSE-EQ-1002');

    // Unknown ISIN on the same company+segment fails closed (no substitution).
    const unknown = registry.resolveSecurity('COMP-SYNTH-A', 'NSE_EQ', 'INE000UNKNWN');
    assert.ok(unknown.status === 'UNRESOLVED');
    if (unknown.status === 'UNRESOLVED') assert.strictEqual(unknown.reason, 'UNMAPPED_COMPANY_ID');

    // Genuine conflict still detected at exact security level: same ISIN AND same
    // series, different Dhan id. (Same ISIN with a DIFFERENT series is a distinct
    // security and coexists — see DHAN-P6.)
    assert.throws(
      () => registry.register(mapping({ isin: 'INE000SYNTH1', securityId: 'ISIN:INE000SYNTH1:EQ', dhanSecurityId: 'SYNTH-NSE-EQ-7777' })),
      (err: unknown) =>
        err instanceof DhanInstrumentMappingConflictError && err.conflictKind === 'SECURITY_MAPPING_CONFLICT'
    );
    // securityId/isin disagreement is malformed.
    const bad = validateDhanInstrumentMappingRow(mapping({ isin: 'INE000SYNTH1', securityId: 'ISIN:INE000SYNTH2:EQ' }));
    assert.ok(!bad.ok);
  });

  it('D3B-12: mapping provenance and version metadata round-trips; synthetic rows never carry verification dates', () => {
    const noProv = validateDhanInstrumentMappingRow({
      companyId: 'C',
      symbol: 'S',
      exchange: 'NSE',
      exchangeSegment: 'NSE_EQ',
      dhanSecurityId: 'X',
    });
    assert.ok(!noProv.ok);
    const registry = new DhanInstrumentRegistry();
    assert.throws(() => registry.register(mapping({ effectiveDate: '32/13/2026' })));
    assert.throws(() => registry.register({ ...mapping(), lastVerifiedAt: '2026-09-25T00:00:00Z' }));
    const report = loadDhanInstrumentMappings([mapping({ mappingVersion: 'synthetic-v2' })]);
    const row = report.registry.list()[0]!;
    assert.strictEqual(row.mappingVersion, 'synthetic-v2');
    assert.strictEqual(row.validationStatus, 'UNVALIDATED');
    assert.strictEqual(row.lastVerifiedAt, undefined);
    assert.strictEqual(row.isin, 'INE000SYNTHA');
  });
});
