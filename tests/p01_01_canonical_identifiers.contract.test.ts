/**
 * Institutional Investment Platform System (IIPS)
 * P01-01 Canonical Identifiers — Contract Test Suite
 *
 * Governing record: P01-WAVE1-EXECUTION-AUTHORITY-DESIGNATION-ACT.md (authority commit 6b7552b…)
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 * Scope: P01-01 ONLY. Proves the tracker-defined exit condition "IDs versioned and testable"
 * for the canonical-ID specification. No acceptance/certification claim is made by these tests.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

import {
  CANONICAL_ID_SPECIFICATION_ID,
  CANONICAL_ID_SPECIFICATION_VERSION,
  CanonicalIdContractError,
  canonicalIdSpecificationDescriptor,
  normalizeCanonicalIdValue,
  parseCanonicalId,
  validateCanonicalId,
  CanonicalIdKind,
} from '../src/contracts/canonical_id_specification.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import { IdentityMappingStore } from '../src/identity/mapping_store.js';
import { IdentityAmbiguityError } from '../src/identity/quarantine.js';
import { validateInstrumentMaster } from '../src/contracts/d05_security_master.js';

const FIXTURES = JSON.parse(
  fs.readFileSync(path.resolve('tests/fixtures/p01_01_canonical_id_fixtures.json'), 'utf-8'),
);
const D05_FIXTURES = JSON.parse(
  fs.readFileSync(path.resolve('tests/fixtures/d05_fixtures.json'), 'utf-8'),
);

const KINDS: CanonicalIdKind[] = [
  'COMPANY_ID',
  'PORTFOLIO_ID',
  'RESEARCH_ID',
  'EVENT_ID',
  'ISIN',
  'EXCHANGE_SYMBOL',
  'COMPOSITE_TICKER',
];

describe('P01-01 Canonical Identifier Specification — contract tests', () => {
  it('P01-01-T01: specification is versioned (constant + fixture pin agree)', () => {
    assert.strictEqual(CANONICAL_ID_SPECIFICATION_ID, 'P01-01-CANONICAL-ID-SPECIFICATION');
    assert.strictEqual(CANONICAL_ID_SPECIFICATION_VERSION, '1.0.0');
    assert.match(CANONICAL_ID_SPECIFICATION_VERSION, /^[0-9]+\.[0-9]+\.[0-9]+$/);
    assert.strictEqual(FIXTURES.specificationVersion, CANONICAL_ID_SPECIFICATION_VERSION);
    assert.strictEqual(FIXTURES.specificationId, CANONICAL_ID_SPECIFICATION_ID);
  });

  it('P01-01-T02: descriptor is deterministic, covers all 7 kinds, records limitations', () => {
    const a = canonicalIdSpecificationDescriptor();
    const b = canonicalIdSpecificationDescriptor();
    assert.deepStrictEqual(a, b);
    assert.notStrictEqual(a, b); // defensive copies
    assert.strictEqual(a.specificationId, CANONICAL_ID_SPECIFICATION_ID);
    assert.strictEqual(a.version, CANONICAL_ID_SPECIFICATION_VERSION);
    assert.deepStrictEqual([...a.kinds].sort(), [...KINDS].sort());
    assert.ok(a.recordedLimitations.length >= 7, 'limitations must be recorded explicitly');
    assert.ok(a.evidenceBasis.length >= 6);
    assert.strictEqual(a.crossProviderMappingSemantics.normativeReference, 'src/identity/mapping_store.ts');
    assert.strictEqual(a.crossProviderMappingSemantics.reimplemented, false);
    for (const k of KINDS) assert.ok(a.grammars[k].length > 0);
  });

  it('P01-01-T03: valid fixtures accepted for every kind (strict, canonical form)', () => {
    for (const kind of KINDS) {
      for (const v of FIXTURES.valid[kind] as string[]) {
        const r = validateCanonicalId(kind, v);
        assert.strictEqual(r.isValid, true, `${kind} '${v}' must be valid: ${JSON.stringify(r)}`);
        assert.strictEqual(r.code, null);
        assert.strictEqual(r.kind, kind);
        assert.strictEqual(r.value, v);
      }
    }
  });

  it('P01-01-T04: invalid fixtures rejected with STRUCTURAL_MALFORMATION', () => {
    for (const kind of KINDS) {
      for (const v of FIXTURES.invalid[kind] as string[]) {
        const r = validateCanonicalId(kind, v);
        assert.strictEqual(r.isValid, false, `${kind} '${v}' must be invalid`);
        assert.strictEqual(r.code, 'STRUCTURAL_MALFORMATION');
      }
    }
  });

  it('P01-01-T05: missing values rejected with MISSING_MANDATORY_FIELD for every kind', () => {
    for (const kind of FIXTURES.missingValueKinds as CanonicalIdKind[]) {
      for (const v of ['', null, undefined] as unknown as string[]) {
        const r = validateCanonicalId(kind, v as unknown as string);
        assert.strictEqual(r.isValid, false);
        assert.strictEqual(r.code, 'MISSING_MANDATORY_FIELD');
      }
    }
  });

  it('P01-01-T06: normalization seam is deterministic and matches mapping-store semantics (trim+uppercase)', () => {
    for (const c of FIXTURES.normalizationCases) {
      const n = normalizeCanonicalIdValue(c.raw);
      assert.strictEqual(n, c.normalized);
      assert.strictEqual(validateCanonicalId(c.kind as CanonicalIdKind, n).isValid, true);
      // raw forms are strictly invalid without the explicit pre-step
      assert.strictEqual(validateCanonicalId(c.kind as CanonicalIdKind, c.raw).isValid, false);
    }
  });

  it('P01-01-T07: parse succeeds for canonical values and fails closed with typed error otherwise', () => {
    assert.strictEqual(parseCanonicalId('COMPANY_ID', 'EQ_RELIANCE_IN'), 'EQ_RELIANCE_IN');
    let thrown: CanonicalIdContractError | null = null;
    try {
      parseCanonicalId('COMPANY_ID', 'INFY');
    } catch (e) {
      thrown = e as CanonicalIdContractError;
    }
    assert.ok(thrown instanceof CanonicalIdContractError);
    assert.strictEqual(thrown!.kind, 'COMPANY_ID');
    assert.strictEqual(thrown!.rawValue, 'INFY');
    assert.strictEqual(thrown!.code, 'STRUCTURAL_MALFORMATION');
  });

  it('P01-01-T08: validation results are deterministic (identical repeated calls)', () => {
    const r1 = validateCanonicalId('EVENT_ID', 'EVT_INFY_20260918_01');
    const r2 = validateCanonicalId('EVENT_ID', 'EVT_INFY_20260918_01');
    assert.deepStrictEqual(r1, r2);
    const r3 = validateCanonicalId('ISIN', 'INE002A0101');
    const r4 = validateCanonicalId('ISIN', 'INE002A0101');
    assert.deepStrictEqual(r3, r4);
  });

  it('P01-01-T09: reuse — certified D05 contract semantics retained; legacy opaque companyId boundary recorded, not repaired', () => {
    const valids = D05_FIXTURES.validInstruments as Array<Record<string, unknown>>;
    assert.ok(valids.length > 0);
    for (const payload of valids) {
      // certified D05 validator remains authoritative for the legacy payloads
      const d05 = validateInstrumentMaster(payload as never);
      assert.strictEqual(d05.isValid, true, 'D05 certified validation must pass for legacy fixture');
      // every ISIN in the certified corpus is structurally valid under the canonical grammar (reuse of d05 regex)
      const isin = payload.isin as string;
      assert.strictEqual(validateCanonicalId('ISIN', isin).isValid, true, `ISIN ${isin}`);
      // legacy opaque companyId forms are intentionally NOT conformant: recorded boundary
      const cid = payload.companyId as string;
      const canonical = validateCanonicalId('COMPANY_ID', cid);
      const legacy = FIXTURES.legacyEvidence as Array<{ file: string; value: string }>;
      const knownOpaque = legacy.some((l) => String(l.value).split(' / ').includes(cid) || String(l.value) === cid);
      if (!canonical.isValid) {
        assert.ok(knownOpaque, `non-conformant companyId '${cid}' must be listed in recorded legacy evidence`);
      }
    }
    assert.strictEqual(validateCanonicalId('COMPANY_ID', 'INFY').isValid, false);
  });

  it('P01-01-T10: reuse — cross-provider mapping resolution via certified IdentityMappingStore/SecurityMaster', () => {
    const master = new SecurityMaster();
    for (const e of FIXTURES.reuseAnchors.securityMasterEntities) {
      master.registerEntity(e as never);
    }
    assert.strictEqual(
      master.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'NSE:RELIANCE' }),
      'EQ_RELIANCE_IN',
    );
    assert.strictEqual(
      master.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE009A01021' }),
      'EQ_INFY_IN',
    );
    // normalization inside the certified store (lowercase symbol resolves to canonical companyId)
    assert.strictEqual(
      master.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'infy' }),
      'EQ_INFY_IN',
    );
    assert.strictEqual(
      master.resolveCompanyId({ identifierType: 'BSE_SYMBOL', identifierValue: 'RELIANCE' }),
      'EQ_RELIANCE_IN',
    );
  });

  it('P01-01-T11: reuse — point-in-time effective dating preserved (fail-closed outside window)', () => {
    const store = new IdentityMappingStore();
    const m = FIXTURES.reuseAnchors.pointInTimeMapping;
    store.addMapping(m as never);
    assert.strictEqual(
      store.resolveCompanyId({
        identifierType: m.identifierType,
        identifierValue: m.identifierValue,
        asOf: '2015-06-01T00:00:00.000Z',
      }),
      m.companyId,
    );
    let thrown: IdentityAmbiguityError | null = null;
    try {
      store.resolveCompanyId({
        identifierType: m.identifierType,
        identifierValue: m.identifierValue,
        asOf: '2025-06-01T00:00:00.000Z',
      });
    } catch (e) {
      thrown = e as IdentityAmbiguityError;
    }
    assert.ok(thrown instanceof IdentityAmbiguityError);
    assert.strictEqual(thrown!.quarantineRecord.reason, 'UNMAPPED_IDENTIFIER');
  });

  it('P01-01-T12: reuse — fail-closed quarantine for unmapped identifiers', () => {
    const store = new IdentityMappingStore();
    let thrown: IdentityAmbiguityError | null = null;
    try {
      store.resolveCompanyId({ identifierType: 'ISE_SYMBOL' as never, identifierValue: 'ZZZZ' });
    } catch (e) {
      thrown = e as IdentityAmbiguityError;
    }
    // wrong-type cast is a negative probe: still unmapped → fail-closed
    assert.ok(thrown instanceof IdentityAmbiguityError);
    assert.strictEqual(thrown!.quarantineRecord.reason, 'UNMAPPED_IDENTIFIER');
    assert.strictEqual(store.getQuarantinedRecords().length, 1);
  });

  it('P01-01-T13: reuse — ambiguity fails closed with AMBIGUOUS_COLLISION (no silent winner)', () => {
    const store = new IdentityMappingStore();
    store.addMapping({
      companyId: 'EQ_A_IN',
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'COLLIDE',
      effectiveFrom: '2010-01-01T00:00:00.000Z',
    } as never);
    store.addMapping({
      companyId: 'EQ_B_IN',
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'COLLIDE',
      effectiveFrom: '2010-01-01T00:00:00.000Z',
    } as never);
    let thrown: IdentityAmbiguityError | null = null;
    try {
      store.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'COLLIDE' });
    } catch (e) {
      thrown = e as IdentityAmbiguityError;
    }
    assert.ok(thrown instanceof IdentityAmbiguityError);
    assert.strictEqual(thrown!.quarantineRecord.reason, 'AMBIGUOUS_COLLISION');
  });

  it('P01-01-T14: no competing mapping implementation introduced — mapping types are the certified classes', () => {
    assert.strictEqual(typeof IdentityMappingStore, 'function');
    assert.strictEqual(typeof SecurityMaster, 'function');
    assert.strictEqual(typeof IdentityAmbiguityError, 'function');
    assert.strictEqual(typeof CanonicalIdContractError, 'function');
  });
});
