/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: D05 Security Master — Identity / Eligibility CHARACTERIZATION → REGRESSION GUARDS
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 *                 AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001 (D05 corpus)
 *                 f3-ui08-security-master-functional-2026-09-23-001 (UI08 surface)
 *                 IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-PROGRAM-AUTHORITY-DECISION-2026-10-19-01 (C1–C7)
 *                 IIPS-V3-IPD-SECURITY-MASTER-INTEGRITY-IMPLEMENTATION-ACT-2026-10-19-01
 * Execution Mode: NON_PRODUCTION / OFFLINE_BOOTSTRAP / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ HISTORY OF THIS SUITE ════════════════════════════════════════════════════════════════
 *  Published at main@02a5803 (PR #26) as CHARACTERIZATION coverage: eight tests that pinned the
 *  OBSERVED behaviour of the D05 identity stack, four of them marked
 *  `[OBSERVED DEFECT — UNRESOLVED]` and one `[OBSERVED INCONSISTENCY — UNRESOLVED]`. Those
 *  assertions documented defects; they were never an acceptance contract.
 *
 *  The Program Authority then approved the C1–C7 semantic direction, and the Security Master
 *  integrity implementation act (2026-10-19-01) repaired the defects. As the original header
 *  required, the defect-pinning tests then FAILED and are here updated DELIBERATELY — not
 *  suppressed. Each keeps its original identifier for traceability and is re-marked:
 *
 *   CHAR-A-01  [CORRECTED — REGRESSION GUARD]  no literal REAL/GOOD; origin UNKNOWN
 *   CHAR-A-02  [CORRECTED — REGRESSION GUARD]  UI08 renders no REAL claim; discloses origin
 *   CHAR-B-01  [CORRECTED — REGRESSION GUARD]  absent faceValue/currency → null + PARTIAL
 *   CHAR-B-02  [OBSERVED — CONTROL]            unchanged: populated values pass through
 *   CHAR-B-03  [CORRECTED — REGRESSION GUARD]  faceValue 0 → INVALID (≠ absent), never 1
 *   CHAR-C-01  [APPROVED INVARIANT]            unchanged: effective-dated identity resolution
 *   CHAR-C-02  [CORRECTED — REGRESSION GUARD]  historical asOf disclosed; not silently current
 *   CHAR-D-01  [OBSERVED INCONSISTENCY — UNRESOLVED]  unchanged: AIIL needs authoritative BSE
 *                                                listing-history evidence (decision §5.2)
 *
 *  The full acceptance coverage for the corrected semantics lives in
 *  tests/d05_security_master_integrity_semantics.test.ts (SMI-*).
 *
 * ══ WHAT THIS SUITE STILL DELIBERATELY DOES NOT DO ═══════════════════════════════════════
 *   · It does NOT decide whether any D05 record is real-market or synthetic. No D05 row carries
 *     a typed origin discriminator, and none is invented here. The modelled Tier-2 record is
 *     identified only by the repository's own documented corpus composition, which is NOT
 *     treated as per-record truth (C2).
 *   · It does NOT assert historical descriptor correctness. Historical descriptor versioning
 *     remains a separate, unauthorized capability (decision §5.1); only honest disclosure of
 *     the current-snapshot basis is asserted.
 *   · It does NOT convert the AIIL dual BSE scrip-code mapping into an approved mapping rule,
 *     and does NOT assert which scrip code is "current" and which is "historical".
 *   · It mutates NO D05 corpus, schema, manifest or configuration.
 *   · A passing run here is regression evidence for IPD producer semantics only — not product
 *     acceptance, qualification, consumer admission or production readiness (decision §5.6).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import {
  SecurityMaster,
  SecurityMasterEntity,
  IdentityAmbiguityError,
  getGovernedBroadSecurityMaster,
  D05_BROAD_UNIVERSE_ENTITIES,
} from '../src/identity/index.js';
import { ObjectResolverService } from '../src/transports/object_resolver.js';
import { App } from '../frontend/src/app/App.js';
import { SessionProvider } from '../frontend/src/core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from '../frontend/src/core/session/session.js';

/* ── Shared helpers ─────────────────────────────────────────────────────────────────────── */

const MANIFEST_PATH = join(process.cwd(), 'evidence/operator_drop/d05_security_master_manifest.json');
const RESOLVER_PATH = join(process.cwd(), 'src/transports/object_resolver.ts');

/** Render the routed app server-side so the UI08 surface output is observed, not assumed. */
function renderAt(path: string): string {
  return renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: [path] },
      React.createElement(SessionProvider, {
        session: ANONYMOUS_SESSION,
        children: React.createElement(App, {}),
      })
    )
  );
}

/**
 * A D05 corpus record whose companyName / ISIN / CIN follow the modelled Tier-2 filler
 * pattern. The repository's own audit (BLOCK-3L-BROKER-CSV-FULL-RESOLUTION-AUDIT.md,
 * "Executive Summary & Definitive Finding", point 2) documents corpus indices 52–2249 as
 * modelled synthetic Tier-2 expansion equities.
 *
 * IMPORTANT: this test does not rely on that classification being authoritative. It is used
 * only as a record that is observably NOT one of the 52 externally-named issuers, so that
 * the resolver's classification claim can be shown to be invariant across both kinds of
 * record. No D05 field carries a real/synthetic discriminator (asserted in CHAR-A-01).
 */
const MODELLED_TIER2_SYMBOL = 'IT0001';
const EXTERNALLY_NAMED_SYMBOL = 'RELIANCE';

/* ══════════════════════════════════════════════════════════════════════════════════════════
 * CHAR-A — UNSUPPORTED CLASSIFICATION CLAIMS
 * ════════════════════════════════════════════════════════════════════════════════════════ */

describe('CHAR-A: D05 classification claims are no longer literal assertions (regression guards)', () => {
  it('CHAR-A-01 [CORRECTED — REGRESSION GUARD]: the resolver asserts no REAL classification and no literal GOOD; record origin is UNKNOWN for a modelled Tier-2 record and an externally-named issuer alike', () => {
    const resolver = new ObjectResolverService(getGovernedBroadSecurityMaster());

    const modelled = resolver.resolveObject({
      identifierType: 'NSE_SYMBOL',
      identifierValue: MODELLED_TIER2_SYMBOL,
    });
    const named = resolver.resolveObject({
      identifierType: 'NSE_SYMBOL',
      identifierValue: EXTERNALLY_NAMED_SYMBOL,
    });

    assert.strictEqual(modelled.companyId, 'EQ_IT0001_IN');

    // ── CORRECTED: no unsupported REAL assertion on either record (C1).
    for (const r of [modelled, named]) {
      assert.notStrictEqual(r.provenance.sourceClassification, 'REAL');
      assert.strictEqual(r.provenance.sourceClassification, 'UNCLASSIFIED');
      assert.strictEqual(r.integrity.recordOrigin.classification, 'UNKNOWN');
      assert.strictEqual(r.integrity.recordOrigin.basis, 'NO_RECORD_SPECIFIC_ORIGIN_EVIDENCE');
      assert.strictEqual(r.integrity.consumerEligibility, 'NOT_ASSERTED');
    }

    // ── STILL TRUE (preserved observation): the D05 row contract exposes no field from which a
    //    real-market, synthetic, eligibility or provenance-tier value could be derived. Hence
    //    the only evidence-supported origin state is UNKNOWN — for every record (C2).
    const corpusRowKeys = Object.keys(D05_BROAD_UNIVERSE_ENTITIES[52]).map((k) => k.toLowerCase());
    const eligibilityBearingKey = corpusRowKeys.find((k) =>
      /eligib|synthetic|real|classification|vendor|sourc|quality|tier/.test(k)
    );
    assert.strictEqual(eligibilityBearingKey, undefined);

    // ── CORRECTED: the literals are gone from the resolver source.
    const resolverSource = readFileSync(RESOLVER_PATH, 'utf8');
    assert.ok(!/sourceClassification:\s*'REAL'/.test(resolverSource), "no literal sourceClassification: 'REAL'");
    assert.ok(!/quality:\s*'GOOD'/.test(resolverSource), "no literal quality: 'GOOD'");

    // ── LIMIT: quality GOOD may still be DERIVED for a record whose assessed descriptors are
    //    complete and current (both records here). That is a completeness statement only; it
    //    is not origin and not eligibility (C3). It does not make IT0001 real.
    assert.strictEqual(modelled.provenance.quality, 'GOOD');
    assert.deepStrictEqual(modelled.integrity.qualityAnomalyCodes, []);
  });

  it('CHAR-A-02 [CORRECTED — REGRESSION GUARD]: the UI08 surface renders no REAL claim and discloses unknown record origin for the modelled record', () => {
    const out = renderAt(
      `/security-master?type=NSE_SYMBOL&value=${encodeURIComponent(MODELLED_TIER2_SYMBOL)}`
    );

    assert.ok(out.includes('EQ_IT0001_IN'), 'the modelled record resolves and is displayed (C5 bounded display)');
    assert.ok(out.includes('Source Classification'), 'the classification row remains visible');
    assert.ok(out.includes('UNCLASSIFIED'), 'the classification renders UNCLASSIFIED');
    assert.ok(!/>REAL</.test(out), 'no cell renders a bare REAL classification');
    assert.ok(out.includes('Record Origin'), 'a record-origin row is rendered');
    assert.ok(out.includes('not asserted as real-market'), 'origin is disclosed as unknown');
    assert.ok(out.includes('security-master-origin-disclosure'), 'the non-production disclosure is rendered');
  });
});

/* ══════════════════════════════════════════════════════════════════════════════════════════
 * CHAR-B — SILENT DESCRIPTOR DEFAULTS
 * ════════════════════════════════════════════════════════════════════════════════════════ */

describe('CHAR-B: absent or invalid descriptor attributes are never silently substituted (regression guards)', () => {
  const register = (overrides: Partial<SecurityMasterEntity>, symbol: string, companyId: string) => {
    const sm = new SecurityMaster();
    const entity: SecurityMasterEntity = {
      companyId,
      isin: 'INE000A01010',
      companyName: 'Characterization Registration',
      industry: 'Unclassified',
      sector: 'UNCLASSIFIED',
      effectiveFrom: '2020-01-01T00:00:00.000Z',
      listings: [{ exchange: 'NSE', symbol, status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
      ...overrides,
    };
    sm.registerEntity(entity);
    return new ObjectResolverService(sm).resolveObject({
      identifierType: 'NSE_SYMBOL',
      identifierValue: symbol,
    });
  };

  it('CHAR-B-01 [CORRECTED — REGRESSION GUARD]: a registration without faceValue or currency resolves with null descriptors, MISSING status and PARTIAL quality — never 1 / INR / GOOD / REAL', () => {
    const resolved = register({}, 'NODESC', 'EQ_CHAR_NODESC_IN');

    // ── CORRECTED: the source supplies neither field, and the output supplies neither (C4).
    assert.strictEqual(resolved.faceValue, null, 'absent faceValue is not defaulted to 1');
    assert.strictEqual(resolved.currency, null, 'absent currency is not defaulted to INR');
    assert.strictEqual(resolved.integrity.descriptor.faceValue, 'MISSING');
    assert.strictEqual(resolved.integrity.descriptor.currency, 'MISSING');
    assert.strictEqual(resolved.integrity.descriptor.complete, false);

    // ── CORRECTED: the gap is disclosed through quality and anomaly codes.
    assert.strictEqual(resolved.provenance.quality, 'PARTIAL');
    assert.notStrictEqual(resolved.provenance.quality, 'GOOD');
    assert.deepStrictEqual(resolved.integrity.qualityAnomalyCodes, [
      'MISSING_MANDATORY_FIELD:faceValue',
      'MISSING_MANDATORY_FIELD:currency',
    ]);
    assert.strictEqual(resolved.provenance.sourceClassification, 'UNCLASSIFIED');
    // An ad-hoc registration was not hydrated from a governed deposition.
    assert.strictEqual(resolved.integrity.sourceRevision, null);
  });

  it('CHAR-B-02 [OBSERVED — CONTROL]: populated faceValue and currency pass through unchanged — valid, explicitly sourced descriptors are preserved', () => {
    const inr = register({ faceValue: 10, currency: 'INR' }, 'CHARINR', 'EQ_CHAR_INR_IN');
    assert.strictEqual(inr.faceValue, 10);
    assert.strictEqual(inr.currency, 'INR');

    const usd = register({ faceValue: 10, currency: 'USD' }, 'CHARUSD', 'EQ_CHAR_USD_IN');
    assert.strictEqual(usd.faceValue, 10);
    assert.strictEqual(usd.currency, 'USD', 'a populated non-INR currency is projected faithfully');

    assert.strictEqual(usd.integrity.descriptor.complete, true);
    assert.strictEqual(usd.provenance.quality, 'GOOD', 'complete, current descriptors may derive GOOD');

    // Control: correction of the absent/invalid paths (CHAR-B-01/03) did not disturb valid data.
  });

  it('CHAR-B-03 [CORRECTED — REGRESSION GUARD]: a non-positive faceValue is reported INVALID — distinguishable from an absent one — and never collapses to 1', () => {
    const zero = register({ faceValue: 0, currency: 'INR' }, 'CHARZERO', 'EQ_CHAR_ZERO_IN');
    assert.strictEqual(zero.faceValue, null, 'an invalid faceValue is not displayed as a value');
    assert.notStrictEqual(zero.faceValue, 1, 'and is never substituted by the old fallback');
    assert.strictEqual(zero.integrity.descriptor.faceValue, 'INVALID', 'explicit zero ≠ absent');
    assert.strictEqual(zero.integrity.descriptor.currency, 'SOURCE_PROVIDED');
    assert.strictEqual(zero.currency, 'INR', 'a valid sibling descriptor is preserved');
    assert.strictEqual(zero.provenance.quality, 'PARTIAL');
    assert.deepStrictEqual(zero.integrity.qualityAnomalyCodes, ['OUT_OF_RANGE_VALUE:faceValue']);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════════════════
 * CHAR-C — HISTORICAL IDENTIFIER RESOLUTION vs. DESCRIPTOR TEMPORAL VALIDITY
 * ════════════════════════════════════════════════════════════════════════════════════════ */

describe('CHAR-C: asOf governs identifier mapping only — and the descriptor now says so (characterization + regression guard)', () => {
  const HISTORICAL_ASOF = '2005-01-01T00:00:00.000Z';

  it('CHAR-C-01 [APPROVED INVARIANT]: effective-dated identifier resolution works — UTIBANK@2005 resolves to EQ_AXISBANK_IN and UTIBANK@today fails closed', () => {
    const sm = getGovernedBroadSecurityMaster();

    const historical = sm.resolveCompanyId({
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'UTIBANK',
      asOf: HISTORICAL_ASOF,
    });
    assert.strictEqual(historical, 'EQ_AXISBANK_IN');

    assert.throws(
      () =>
        sm.resolveCompanyId({
          identifierType: 'NSE_SYMBOL',
          identifierValue: 'UTIBANK',
          asOf: '2026-10-19T00:00:00.000Z',
        }),
      IdentityAmbiguityError,
      'the historical alias is inactive at the current date'
    );

    // This half of the behaviour is already an approved, tested invariant
    // (tests/p04_governed_offline_security_master.test.ts P04-BOOTSTRAP-03 and
    //  tests/p04_expanded_broad_universe_runtime_qualification.test.ts QUAL-08).
  });

  it('CHAR-C-02 [CORRECTED — REGRESSION GUARD]: a historical asOf no longer silently returns the present-day descriptor as though it were historical — the current-snapshot basis is disclosed and quality is not GOOD', () => {
    const resolver = new ObjectResolverService(getGovernedBroadSecurityMaster());

    const historical = resolver.resolveObject({
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'UTIBANK',
      asOf: HISTORICAL_ASOF,
    });
    const current = resolver.resolveObject({
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'AXISBANK',
    });

    // ── PRESERVED: identity resolution honours the asOf (CHAR-C-01).
    assert.strictEqual(historical.companyId, 'EQ_AXISBANK_IN');

    // ── PRESERVED FACT: the only descriptor available is the current snapshot. It is still
    //    returned — historical values do not exist in the governed data and none is invented.
    assert.deepStrictEqual(historical.listings, current.listings);

    // ── CORRECTED: the payload now tells the consumer exactly that (not silent any more).
    const t = historical.integrity.temporal;
    assert.strictEqual(t.identityResolution, 'EFFECTIVE_DATED_AS_OF');
    assert.strictEqual(t.identityAsOf, HISTORICAL_ASOF);
    assert.strictEqual(t.historicalAsOfRequested, true);
    assert.strictEqual(t.descriptorBasis, 'CURRENT_SNAPSHOT');
    assert.strictEqual(t.descriptorHistoricallyVerified, false);
    assert.strictEqual(t.listingsEffectiveDated, false);
    // EQ_AXISBANK_IN's own record window starts 2015-01-01, so 2005 is outside it.
    assert.strictEqual(t.descriptorStatus, 'OUTSIDE_RECORD_EFFECTIVE_WINDOW');
    assert.strictEqual(historical.provenance.quality, 'PARTIAL');
    assert.deepStrictEqual(historical.integrity.qualityAnomalyCodes, [
      'DESCRIPTOR_RECORD_NOT_EFFECTIVE_AT_AS_OF',
      'DESCRIPTOR_NOT_AS_OF_SCOPED',
    ]);

    // The current query is unaffected.
    assert.strictEqual(current.integrity.temporal.descriptorStatus, 'CURRENT_SNAPSHOT');
    assert.strictEqual(current.provenance.quality, 'GOOD');

    // ── LIMIT — NOT AN ACCEPTANCE OF HISTORICAL ACCURACY ─────────────────────────────────
    // Historical descriptor versioning is NOT implemented and NOT authorized (decision §5.1).
    // This guard asserts only that the absence of historical descriptor data is disclosed.
  });
});

/* ══════════════════════════════════════════════════════════════════════════════════════════
 * CHAR-D — AIIL MANIFEST RULING vs. OBSERVED EFFECTIVE-DATE RECORDS
 * ════════════════════════════════════════════════════════════════════════════════════════ */

describe('CHAR-D: AIIL manifest ruling vs. observed corpus effective dates (characterization)', () => {
  it('CHAR-D-01 [OBSERVED INCONSISTENCY — UNRESOLVED]: the manifest declares RULING_3_DUAL_EFFECTIVE_DATED_MAPPING, but both AIIL BSE scrip codes are concurrently active with no effectiveTo', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

    // ── SOURCE OF TRUTH 1 — the governed manifest.
    assert.strictEqual(
      manifest.aiilRuling,
      'RULING_3_DUAL_EFFECTIVE_DATED_MAPPING',
      'the deposition manifest declares a dual EFFECTIVE-DATED mapping for AIIL'
    );
    assert.strictEqual(manifest.authorizationRef, 'AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001');

    // ── SOURCE OF TRUTH 2 — the governed corpus record.
    const aiil = D05_BROAD_UNIVERSE_ENTITIES.find((e) => e.companyId === 'EQ_AIIL_IN');
    assert.ok(aiil, 'EQ_AIIL_IN is present in the corpus');
    assert.strictEqual(aiil.effectiveTo, undefined, 'the AIIL entity record carries no effectiveTo');

    const bseListings = aiil.listings.filter((l) => l.exchange === 'BSE');
    assert.strictEqual(bseListings.length, 2, 'AIIL carries two BSE listing rows');
    assert.deepStrictEqual(
      bseListings.map((l) => l.scripCode).sort(),
      ['539177', '543989'],
      'the two BSE scrip codes are 539177 and 543989'
    );

    // ── OBSERVABLE OUTPUT — no temporal distinction exists between the two scrip codes.
    const sm = getGovernedBroadSecurityMaster();
    for (const asOf of [
      '2016-01-01T00:00:00.000Z',
      '2020-06-01T00:00:00.000Z',
      '2026-10-19T00:00:00.000Z',
    ]) {
      for (const scrip of ['BSE:539177', 'BSE:543989']) {
        assert.strictEqual(
          sm.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: scrip, asOf }),
          'EQ_AIIL_IN',
          `${scrip} resolves at ${asOf}`
        );
      }
    }

    // ── CORPUS-WIDE CONTEXT: the absence of effective dating is not specific to AIIL.
    assert.strictEqual(
      D05_BROAD_UNIVERSE_ENTITIES.filter((e) => e.effectiveTo !== undefined).length,
      0,
      'no corpus record carries an effectiveTo'
    );
    assert.deepStrictEqual(
      [...new Set(D05_BROAD_UNIVERSE_ENTITIES.map((e) => e.effectiveFrom))],
      ['2015-01-01T00:00:00.000Z'],
      'every corpus record shares a single effectiveFrom'
    );

    // ── RECORDED LIMIT — NOT AN ACCEPTANCE ASSERTION ──────────────────────────────────────
    // This test exposes a three-way mismatch — manifest ruling vs. corpus record vs.
    // observable output — WITHOUT changing any of them. It deliberately does NOT assert:
    //   · which scrip code is "current" and which is "historical";
    //   · that either scrip code ought to be inactive at any particular date;
    //   · that the manifest wording is wrong and the data is right, or vice versa.
    // The reconciliation (corpus effective-date correction, or manifest/report wording
    // correction) is a governed-data change requiring Program Authority. Nothing here turns
    // the present mapping into an approved mapping rule.
  });
});
