/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: D05 Security Master — Integrity Semantics ACCEPTANCE (SMI-*)
 *
 * Governed under: IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-PROGRAM-AUTHORITY-DECISION-2026-10-19-01 (C1–C7)
 *                 IIPS-V3-IPD-SECURITY-MASTER-INTEGRITY-IMPLEMENTATION-ACT-2026-10-19-01
 *                 AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001 (D05 corpus — read only)
 * Execution Mode: NON_PRODUCTION / OFFLINE_BOOTSTRAP / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * Acceptance criteria for the corrected producer semantics of ObjectResolverService and the
 * UI08 Security Master surface (implementation act §4). Findings:
 *   B1 unsupported provenance/quality classification    → SMI-01, SMI-02, SMI-09, SMI-12
 *   B2 missing-descriptor fallbacks                      → SMI-03, SMI-04, SMI-05, SMI-10, SMI-11
 *   B3 historical descriptor correctness                 → SMI-06, SMI-11
 *   B4 AIIL mapping inconsistency (UNRESOLVED — guard)   → SMI-08
 *   Boundaries (no D05 mutation, valid resolution intact) → SMI-02, SMI-03, SMI-07
 *
 * A passing run is regression evidence for IPD producer semantics only. It is NOT product
 * acceptance, real-market eligibility, historical accuracy, consumer admission or production
 * readiness (decision §5.6). Nothing here classifies any record as real-market or synthetic.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import {
  SecurityMaster,
  SecurityMasterEntity,
  getGovernedBroadSecurityMaster,
  getGovernedOfflineSecurityMaster,
  GOVERNED_OFFLINE_REFERENCE_ENTITIES,
  D05_BROAD_UNIVERSE_ENTITIES,
  D05_BROAD_UNIVERSE_SOURCE_REVISION,
} from '../src/identity/index.js';
import { ObjectResolverService, ResolvedSecurityObject } from '../src/transports/object_resolver.js';
import { UI08SecurityMasterModalBuilder } from '../src/ui/view_models/ui08_security_master_modal.js';
import { SecurityMasterSurface } from '../frontend/src/features/security-master/SecurityMasterSurface.js';

const ROOT = process.cwd();
const MANIFEST_PATH = join(ROOT, 'evidence/operator_drop/d05_security_master_manifest.json');
const CORPUS_JSON_PATH = join(ROOT, 'evidence/operator_drop/d05_security_master_broad_universe.json');
const RESOLVER_PATH = join(ROOT, 'src/transports/object_resolver.ts');

function renderSurface(props: React.ComponentProps<typeof SecurityMasterSurface>, url: string): string {
  return renderToString(
    React.createElement(MemoryRouter, { initialEntries: [url] }, React.createElement(SecurityMasterSurface, props))
  );
}

/** A single ad-hoc registration (ungoverned) for controlled descriptor scenarios. */
function adhoc(overrides: Partial<SecurityMasterEntity>, symbol = 'SMIFIX'): { sm: SecurityMaster; resolve: () => ResolvedSecurityObject } {
  const sm = new SecurityMaster();
  sm.registerEntity({
    companyId: `EQ_${symbol}_IN`,
    isin: 'INE000A01010',
    companyName: 'SMI Controlled Registration',
    industry: 'Unclassified',
    sector: 'UNCLASSIFIED',
    effectiveFrom: '2020-01-01T00:00:00.000Z',
    listings: [{ exchange: 'NSE', symbol, status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
    ...overrides,
  });
  return { sm, resolve: () => new ObjectResolverService(sm).resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: symbol }) };
}

describe('SMI: D05 Security Master integrity semantics (acceptance)', () => {
  const broad = getGovernedBroadSecurityMaster();
  const resolver = new ObjectResolverService(broad);

  it('SMI-01 [B1/C1/C2]: no governed D05 record — of all 2,250 — receives a REAL classification; every record is UNCLASSIFIED with UNKNOWN origin, regardless of ISIN validity or position in the corpus', () => {
    const classifications = new Set<string>();
    const origins = new Set<string>();
    for (const entity of D05_BROAD_UNIVERSE_ENTITIES) {
      const r = resolver.resolveObject({ identifierType: 'ISIN', identifierValue: entity.isin });
      assert.strictEqual(r.companyId, entity.companyId);
      classifications.add(r.provenance.sourceClassification);
      origins.add(`${r.integrity.recordOrigin.classification}/${r.integrity.recordOrigin.basis}`);
    }
    assert.deepStrictEqual([...classifications], ['UNCLASSIFIED'], 'one evidence-supported state for every record');
    assert.deepStrictEqual([...origins], ['UNKNOWN/NO_RECORD_SPECIFIC_ORIGIN_EVIDENCE']);
    // The reported 52 / 2,198 aggregate split is not per-record truth (C2): an externally named
    // issuer (index 0) and a modelled filler (index 52) carry the SAME origin state.
    const named = resolver.resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: 'RELIANCE' });
    const modelled = resolver.resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: 'IT0001' });
    assert.deepStrictEqual(named.integrity.recordOrigin, modelled.integrity.recordOrigin);
  });

  it('SMI-02 [B1/C2 provenance]: provenance is bound to the governed corpus revision, which equals the manifest and the SHA-256 of the deposited corpus; ungoverned registrations carry no revision', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
    const corpusSha = createHash('sha256').update(readFileSync(CORPUS_JSON_PATH)).digest('hex');

    assert.strictEqual(D05_BROAD_UNIVERSE_SOURCE_REVISION.batchId, manifest.batchId);
    assert.strictEqual(D05_BROAD_UNIVERSE_SOURCE_REVISION.fileChecksumSha256, manifest.fileChecksumSha256);
    assert.strictEqual(D05_BROAD_UNIVERSE_SOURCE_REVISION.recordCount, manifest.recordCount);
    assert.strictEqual(D05_BROAD_UNIVERSE_SOURCE_REVISION.authorizationRef, manifest.authorizationRef);
    assert.strictEqual(D05_BROAD_UNIVERSE_SOURCE_REVISION.operatingMode, manifest.operatingMode);
    assert.strictEqual(corpusSha, manifest.fileChecksumSha256, 'D05 corpus is byte-identical to its governed deposition (not mutated)');
    assert.strictEqual(D05_BROAD_UNIVERSE_ENTITIES.length, manifest.recordCount);

    const r = resolver.resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: 'INFY' });
    assert.deepStrictEqual(r.integrity.sourceRevision, { ...D05_BROAD_UNIVERSE_SOURCE_REVISION });
    assert.strictEqual(r.provenance.lineageDigest.length, 64);

    // Lineage digest binds the corpus revision: the same entity at the same asOf hashes
    // differently when resolved from an unrevisioned master.
    const asOf = '2026-10-19T00:00:00.000Z';
    const infy = D05_BROAD_UNIVERSE_ENTITIES.find((e) => e.companyId === 'EQ_INFY_IN')!;
    const plain = new SecurityMaster();
    plain.registerEntity(infy);
    const a = resolver.resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', asOf });
    const b = new ObjectResolverService(plain).resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', asOf });
    assert.notStrictEqual(a.provenance.lineageDigest, b.provenance.lineageDigest);
    assert.strictEqual(b.integrity.sourceRevision, null);
  });

  it('SMI-03 [B2 preservation]: every valid, explicitly sourced D05 descriptor is preserved exactly; complete current descriptors derive GOOD with no anomalies', () => {
    for (const entity of D05_BROAD_UNIVERSE_ENTITIES) {
      const r = resolver.resolveObject({ identifierType: 'ISIN', identifierValue: entity.isin });
      assert.strictEqual(r.faceValue, entity.faceValue, `${entity.companyId} faceValue preserved`);
      assert.strictEqual(r.currency, entity.currency, `${entity.companyId} currency preserved`);
      assert.strictEqual(r.integrity.descriptor.complete, true);
      assert.strictEqual(r.provenance.quality, 'GOOD');
      assert.deepStrictEqual(r.integrity.qualityAnomalyCodes, []);
    }
  });

  it('SMI-04 [B2/C4]: missing or invalid faceValue / currency are never substituted — each yields null, an explicit status, an anomaly code and PARTIAL quality', () => {
    const cases: Array<{
      name: string;
      overrides: Partial<SecurityMasterEntity>;
      faceValue: 'SOURCE_PROVIDED' | 'MISSING' | 'INVALID';
      currency: 'SOURCE_PROVIDED' | 'MISSING' | 'INVALID';
      codes: string[];
    }> = [
      { name: 'both absent', overrides: {}, faceValue: 'MISSING', currency: 'MISSING', codes: ['MISSING_MANDATORY_FIELD:faceValue', 'MISSING_MANDATORY_FIELD:currency'] },
      { name: 'faceValue zero', overrides: { faceValue: 0, currency: 'INR' }, faceValue: 'INVALID', currency: 'SOURCE_PROVIDED', codes: ['OUT_OF_RANGE_VALUE:faceValue'] },
      { name: 'faceValue negative', overrides: { faceValue: -5, currency: 'INR' }, faceValue: 'INVALID', currency: 'SOURCE_PROVIDED', codes: ['OUT_OF_RANGE_VALUE:faceValue'] },
      { name: 'faceValue NaN', overrides: { faceValue: Number.NaN, currency: 'INR' }, faceValue: 'INVALID', currency: 'SOURCE_PROVIDED', codes: ['OUT_OF_RANGE_VALUE:faceValue'] },
      { name: 'faceValue Infinity', overrides: { faceValue: Number.POSITIVE_INFINITY, currency: 'INR' }, faceValue: 'INVALID', currency: 'SOURCE_PROVIDED', codes: ['OUT_OF_RANGE_VALUE:faceValue'] },
      { name: 'faceValue string', overrides: { faceValue: '10' as unknown as number, currency: 'INR' }, faceValue: 'INVALID', currency: 'SOURCE_PROVIDED', codes: ['OUT_OF_RANGE_VALUE:faceValue'] },
      { name: 'currency unsupported', overrides: { faceValue: 10, currency: 'EUR' }, faceValue: 'SOURCE_PROVIDED', currency: 'INVALID', codes: ['CURRENCY_MISMATCH:currency'] },
      { name: 'currency lower-case', overrides: { faceValue: 10, currency: 'inr' }, faceValue: 'SOURCE_PROVIDED', currency: 'INVALID', codes: ['CURRENCY_MISMATCH:currency'] },
      { name: 'currency empty', overrides: { faceValue: 10, currency: '' }, faceValue: 'SOURCE_PROVIDED', currency: 'MISSING', codes: ['MISSING_MANDATORY_FIELD:currency'] },
    ];
    for (const c of cases) {
      const r = adhoc(c.overrides).resolve();
      assert.strictEqual(r.integrity.descriptor.faceValue, c.faceValue, `${c.name}: faceValue status`);
      assert.strictEqual(r.integrity.descriptor.currency, c.currency, `${c.name}: currency status`);
      assert.strictEqual(r.faceValue, c.faceValue === 'SOURCE_PROVIDED' ? 10 : null, `${c.name}: faceValue never substituted`);
      assert.strictEqual(r.currency, c.currency === 'SOURCE_PROVIDED' ? 'INR' : null, `${c.name}: currency never substituted`);
      assert.strictEqual(r.provenance.quality, 'PARTIAL', `${c.name}: never GOOD`);
      assert.deepStrictEqual(r.integrity.qualityAnomalyCodes, c.codes, `${c.name}: anomaly codes`);
      assert.strictEqual(r.integrity.descriptor.complete, false);
    }
    // Control: explicit USD is a supported, preserved currency.
    const usd = adhoc({ faceValue: 10, currency: 'USD' }).resolve();
    assert.strictEqual(usd.currency, 'USD');
    assert.strictEqual(usd.provenance.quality, 'GOOD');
  });

  it('SMI-05 [B2 trace]: the 5-entity governed offline reference master carries no faceValue/currency in source — previously masked by the 1/INR fallback, now disclosed as MISSING', () => {
    for (const e of GOVERNED_OFFLINE_REFERENCE_ENTITIES) {
      assert.strictEqual(e.faceValue, undefined, `${e.companyId} source has no faceValue`);
      assert.strictEqual(e.currency, undefined, `${e.companyId} source has no currency`);
    }
    const r = new ObjectResolverService(getGovernedOfflineSecurityMaster()).resolveObject({
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'RELIANCE',
    });
    assert.strictEqual(r.companyId, 'EQ_RELIANCE_IN', 'identity resolution intact');
    assert.strictEqual(r.faceValue, null);
    assert.strictEqual(r.currency, null);
    assert.strictEqual(r.provenance.quality, 'PARTIAL');
    assert.strictEqual(r.integrity.sourceRevision, null, 'no governed deposition manifest backs the reference fixture');
  });

  it('SMI-06 [B3]: asOf scopes identity only — current queries are CURRENT_SNAPSHOT; historical queries are disclosed as not versioned (or outside the record window) and never GOOD', () => {
    const current = resolver.resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: 'AXISBANK' });
    assert.strictEqual(current.integrity.temporal.descriptorStatus, 'CURRENT_SNAPSHOT');
    assert.strictEqual(current.integrity.temporal.historicalAsOfRequested, false);
    assert.strictEqual(current.provenance.quality, 'GOOD');

    const today = resolver.resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: 'AXISBANK', asOf: new Date().toISOString() });
    assert.strictEqual(today.integrity.temporal.descriptorStatus, 'CURRENT_SNAPSHOT', 'an explicit asOf of today is current');
    assert.strictEqual(today.provenance.quality, 'GOOD');

    const in2020 = resolver.resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: 'AXISBANK', asOf: '2020-06-01T00:00:00.000Z' });
    assert.strictEqual(in2020.companyId, 'EQ_AXISBANK_IN');
    assert.strictEqual(in2020.integrity.temporal.descriptorStatus, 'AS_OF_NOT_VERSIONED');
    assert.strictEqual(in2020.provenance.quality, 'PARTIAL');
    assert.deepStrictEqual(in2020.integrity.qualityAnomalyCodes, ['DESCRIPTOR_NOT_AS_OF_SCOPED']);

    const utibank = resolver.resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: 'UTIBANK', asOf: '2005-01-01T00:00:00.000Z' });
    assert.strictEqual(utibank.companyId, 'EQ_AXISBANK_IN', 'effective-dated identity preserved (CHAR-C-01)');
    assert.strictEqual(utibank.integrity.temporal.descriptorStatus, 'OUTSIDE_RECORD_EFFECTIVE_WINDOW');
    assert.strictEqual(utibank.provenance.quality, 'PARTIAL');
    assert.strictEqual(utibank.provenance.asOf, '2005-01-01T00:00:00.000Z');

    for (const r of [current, today, in2020, utibank]) {
      assert.strictEqual(r.integrity.temporal.descriptorBasis, 'CURRENT_SNAPSHOT');
      assert.strictEqual(r.integrity.temporal.descriptorHistoricallyVerified, false, 'historical accuracy is never claimed');
      assert.strictEqual(r.integrity.temporal.listingsEffectiveDated, false);
    }

    // A record whose own window has closed is outside its window even for an in-window alias.
    const closed = adhoc({ faceValue: 10, currency: 'INR', effectiveTo: '2021-12-31T23:59:59.999Z' }, 'CLOSEDREC');
    const atClosedWindow = new ObjectResolverService(closed.sm).resolveObject({
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'CLOSEDREC',
      asOf: '2021-06-01T00:00:00.000Z',
    });
    assert.strictEqual(atClosedWindow.integrity.temporal.descriptorStatus, 'AS_OF_NOT_VERSIONED');
  });

  it('SMI-07 [regression]: fail-closed identity behaviour is unchanged — unmapped and pre-window historical identifiers still throw, and UTIBANK today still fails closed', () => {
    assert.throws(() => resolver.resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: 'NOT_A_TICKER' }), /UNMAPPED_IDENTIFIER/);
    assert.throws(() => resolver.resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: 'UTIBANK' }), /UNMAPPED_IDENTIFIER/);
    assert.throws(
      () => resolver.resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: 'AXISBANK', asOf: '2005-01-01T00:00:00.000Z' }),
      /UNMAPPED_IDENTIFIER/,
      'the corpus AXISBANK mapping starts 2015-01-01; no identity is fabricated for 2005'
    );
  });

  it('SMI-08 [B4 — evidence-backed runtime correction]: preserve the deposit and remove the false 543989→Authum runtime association without inventing listing dates', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
    assert.strictEqual(manifest.aiilRuling, 'RULING_3_DUAL_EFFECTIVE_DATED_MAPPING', 'retain the as-deposited label; no separate ruling record was located');
    const sourceAiil = D05_BROAD_UNIVERSE_ENTITIES.find((e) => e.companyId === 'EQ_AIIL_IN')!;
    assert.strictEqual(sourceAiil.effectiveTo, undefined, 'deposited corpus remains unchanged');
    assert.deepStrictEqual(sourceAiil.listings.filter((l) => l.exchange === 'BSE').map((l) => l.scripCode), ['543989', '539177']);

    const runtimeAiil = resolver.resolveObject({ identifierType: 'ISIN', identifierValue: 'INE206F01022' });
    assert.strictEqual(runtimeAiil.companyId, 'EQ_AIIL_IN');
    assert.strictEqual(runtimeAiil.companyName, 'Authum Investment & Infrastructure Limited');
    assert.deepStrictEqual(runtimeAiil.listings.filter((l) => l.exchange === 'BSE').map((l) => l.scripCode), ['539177']);
    assert.strictEqual(runtimeAiil.integrity.temporal.listingsEffectiveDated, false);
    assert.strictEqual(runtimeAiil.integrity.temporal.descriptorStatus, 'CURRENT_SNAPSHOT');

    for (const asOf of ['2016-01-01T00:00:00.000Z', '2026-10-19T00:00:00.000Z']) {
      assert.throws(
        () => resolver.resolveObject({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:543989', asOf }),
        /UNMAPPED_IDENTIFIER/
      );
      const authumByBse = resolver.resolveObject({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:539177', asOf });
      assert.strictEqual(authumByBse.companyId, 'EQ_AIIL_IN');
      assert.strictEqual(authumByBse.integrity.temporal.listingsEffectiveDated, false);
    }
  });

  it('SMI-09 [C3/C6]: quality, classification and provenance are never an eligibility decision — consumer eligibility is NOT_ASSERTED even for complete GOOD records, and no admission flag exists', () => {
    const r = resolver.resolveObject({ identifierType: 'NSE_SYMBOL', identifierValue: 'RELIANCE' });
    assert.strictEqual(r.provenance.quality, 'GOOD');
    assert.strictEqual(r.integrity.consumerEligibility, 'NOT_ASSERTED');
    const keys: string[] = [];
    const walk = (o: unknown, prefix: string): void => {
      if (o && typeof o === 'object' && !Array.isArray(o)) {
        for (const [k, v] of Object.entries(o)) {
          keys.push(`${prefix}${k}`);
          walk(v, `${prefix}${k}.`);
        }
      }
    };
    walk(r, '');
    const admissionKeys = keys.filter((k) => /eligib|admit|admission|isReal|realMarket/i.test(k));
    assert.deepStrictEqual(admissionKeys, ['integrity.consumerEligibility'], 'the only eligibility-bearing field declares non-assertion');
  });

  it('SMI-10 [B1/B2 UI08 view model]: the UI08 quality indicator follows the resolver-derived quality instead of a hard-coded GOOD', () => {
    const missing = adhoc({});
    const vmMissing = UI08SecurityMasterModalBuilder.build({
      query: { identifierType: 'NSE_SYMBOL', identifierValue: 'SMIFIX' },
      resolverService: new ObjectResolverService(missing.sm),
    });
    assert.strictEqual(vmMissing.qualityIndicator.state, 'PARTIAL');

    const vmGood = UI08SecurityMasterModalBuilder.build({
      query: { identifierType: 'NSE_SYMBOL', identifierValue: 'INFY' },
      resolverService: resolver,
    });
    assert.strictEqual(vmGood.qualityIndicator.state, 'GOOD');
  });

  it('SMI-11 [B2/B3/C5 surface]: UI08 discloses missing descriptors, the current-snapshot temporal basis, the governed revision and non-assertion of eligibility', () => {
    const missing = adhoc({});
    const out = renderSurface({ securityMaster: missing.sm }, '/security-master?type=NSE_SYMBOL&value=SMIFIX');
    assert.ok(out.includes('Not provided by source (missing — no default substituted)'));
    assert.ok(!out.includes('>Face Value</td><td style="padding:8px">1</td>'), 'no substituted face value');
    assert.ok(!out.includes('>Currency</td><td style="padding:8px">INR</td>'), 'no substituted currency');
    assert.ok(out.includes('PARTIAL (MISSING_MANDATORY_FIELD:faceValue, MISSING_MANDATORY_FIELD:currency)'));
    assert.ok(out.includes('None — not hydrated from a governed deposition'));

    const historical = renderSurface({}, '/security-master?type=NSE_SYMBOL&value=UTIBANK&asOf=2005-01-01T00:00:00.000Z');
    assert.ok(historical.includes('EQ_AXISBANK_IN'));
    assert.ok(historical.includes('the resolved record is NOT effective at 2005-01-01T00:00:00.000Z'));
    assert.ok(historical.includes('not historical'));

    const current = renderSurface({}, '/security-master?type=NSE_SYMBOL&value=INFY');
    assert.ok(current.includes('Current governed snapshot (descriptor and listings are not versioned)'));
    assert.ok(current.includes('BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001'));
    assert.ok(current.includes('OFFLINE_BOOTSTRAP'));
    assert.ok(current.includes('Not asserted by IPD — each consumer decides its own admission'));
    assert.ok(current.includes('Exchange Listings (current governed snapshot; not effective-dated)'));
    assert.ok(current.includes('>Face Value</td><td style="padding:8px">5</td>'), 'valid descriptor rendered unchanged');
  });

  it('SMI-12 [B1/B2 source guard]: the resolver contains no REAL literal, no literal GOOD and no 1 / INR fallback', () => {
    const src = readFileSync(RESOLVER_PATH, 'utf8');
    assert.ok(!/'REAL'/.test(src), "no 'REAL' literal");
    assert.ok(!/quality:\s*'GOOD'/.test(src), 'no literal quality GOOD');
    assert.ok(!/:\s*1;/.test(src), 'no numeric 1 fallback for faceValue');
    assert.ok(!/\?\s*'USD'\s*:\s*'INR'/.test(src), 'no INR default for currency');
  });
});
