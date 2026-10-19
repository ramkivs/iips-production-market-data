/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: D05 Security Master — Identity / Eligibility CHARACTERIZATION
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 *                 AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001 (D05 corpus)
 *                 f3-ui08-security-master-functional-2026-09-23-001 (UI08 surface)
 * Execution Mode: NON_PRODUCTION / OFFLINE_BOOTSTRAP / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ WHAT THIS SUITE IS ═══════════════════════════════════════════════════════════════════
 *  CHARACTERIZATION (also called "golden master") coverage. This suite records the
 *  OBSERVED behaviour of the governed D05 identity stack at a known source revision so the
 *  behaviour and its limits are reproducible, reviewable, and protected against silent
 *  change.
 *
 *  A PASSING TEST HERE IS NOT AN ACCEPTANCE STATEMENT.
 *
 *  Four conditions below are recorded as `[OBSERVED DEFECT — UNRESOLVED]` or
 *  `[OBSERVED INCONSISTENCY — UNRESOLVED]`. For those tests the assertion pins the CURRENT
 *  OUTPUT, not an approved invariant. If a defect is later repaired the corresponding test
 *  will FAIL — that failure is the signal to update this characterization deliberately, not
 *  a regression to be suppressed. Tests marked `[APPROVED INVARIANT]` record behaviour that
 *  an existing authority act or existing suite already establishes as intended.
 *
 *  ══ WHAT THIS SUITE DELIBERATELY DOES NOT DO ════════════════════════════════════════════
 *   · It does NOT assert that `sourceClassification: 'REAL'` or `quality: 'GOOD'` is
 *     CORRECT for any record. It asserts only that the resolver currently emits them.
 *   · It does NOT decide whether a D05 record is real-market, synthetic, or of unknown
 *     eligibility. No D05 row carries a typed eligibility discriminator, and none is
 *     invented here. Where a modelled filler record is used, it is identified only by the
 *     repository's own documented corpus composition.
 *   · It does NOT decide whether an absent `faceValue` / `currency` must be rejected,
 *     quarantined, or defaulted. It records the current default and marks the policy choice
 *     as requiring a Program Authority decision.
 *   · It does NOT convert the AIIL dual BSE scrip-code mapping into an approved mapping
 *     rule, and does NOT assert which scrip code is "current" and which is "historical".
 *     It records only that no temporal distinction is present in the data.
 *   · It does NOT specify a required descriptor-versioning model. The existing authoritative
 *     contract (F-3 act §2 "full resolution descriptor") does not define descriptor temporal
 *     validity, so no such requirement is asserted here.
 *   · It changes NO production behaviour. This suite performs no mutation of source,
 *     schema, corpus, manifest or configuration.
 *
 *  ══ DECISION DEPENDENCIES (Program Authority — see the accompanying decision brief) ══════
 *   CHAR-A-01, CHAR-A-02 : blocked on "what provenance/eligibility semantics IPD may assert"
 *   CHAR-B-01, CHAR-B-03 : blocked on "default / reject / quarantine for absent descriptor
 *                          attributes"
 *   CHAR-C-02            : blocked on "is historical descriptor validity in scope"
 *   CHAR-D-01            : blocked on "reconcile manifest ruling vs. corpus effective dates"
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

describe('CHAR-A: D05 classification claims are literal, not derived (characterization)', () => {
  it('CHAR-A-01 [OBSERVED DEFECT — UNRESOLVED]: ObjectResolverService stamps REAL and GOOD on a modelled Tier-2 D05 record, and the values are source literals rather than record-derived', () => {
    const resolver = new ObjectResolverService(getGovernedBroadSecurityMaster());

    const modelled = resolver.resolveObject({
      identifierType: 'NSE_SYMBOL',
      identifierValue: MODELLED_TIER2_SYMBOL,
    });
    const named = resolver.resolveObject({
      identifierType: 'NSE_SYMBOL',
      identifierValue: EXTERNALLY_NAMED_SYMBOL,
    });

    // ── OBSERVED: the claim is emitted for the modelled Tier-2 filler record.
    assert.strictEqual(modelled.companyId, 'EQ_IT0001_IN');
    assert.strictEqual(modelled.provenance.sourceClassification, 'REAL');
    assert.strictEqual(modelled.provenance.quality, 'GOOD');

    // ── OBSERVED: the claim is a constant. Both records receive the identical
    //    classification and quality regardless of which entity was resolved.
    assert.strictEqual(named.provenance.sourceClassification, 'REAL');
    assert.strictEqual(named.provenance.quality, 'GOOD');
    assert.strictEqual(
      modelled.provenance.sourceClassification,
      named.provenance.sourceClassification,
      'classification is invariant across a modelled filler record and an externally-named issuer'
    );

    // ── OBSERVED: the D05 row contract exposes no field from which a real-market,
    //    synthetic, eligibility, provenance-tier or quality value could be derived.
    const corpusRowKeys = Object.keys(D05_BROAD_UNIVERSE_ENTITIES[52]).map((k) => k.toLowerCase());
    const eligibilityBearingKey = corpusRowKeys.find((k) =>
      /eligib|synthetic|real|classification|vendor|sourc|quality|tier/.test(k)
    );
    assert.strictEqual(
      eligibilityBearingKey,
      undefined,
      'no D05 corpus row field can supply a classification or eligibility value — ' +
        'therefore any emitted classification is asserted, not derived'
    );

    // ── OBSERVED: the values are hard-coded string literals in the resolver source.
    const resolverSource = readFileSync(RESOLVER_PATH, 'utf8');
    assert.ok(
      /sourceClassification:\s*'REAL'/.test(resolverSource),
      "the literal sourceClassification: 'REAL' is present in src/transports/object_resolver.ts"
    );
    assert.ok(
      /quality:\s*'GOOD'/.test(resolverSource),
      "the literal quality: 'GOOD' is present in src/transports/object_resolver.ts"
    );

    // ── RECORDED LIMIT — NOT AN ACCEPTANCE ASSERTION ──────────────────────────────────────
    // These assertions document present output only. They do NOT assert that 'REAL' is a
    // correct or authorised classification for this record, and they do NOT establish the
    // record's real-market status. Per the repository's own standard
    // (evidence/target-shell-integration/PHASE2-EVIDENCE-PAYLOAD-FORENSIC-REPORT.md §10.3):
    // "sourceClassification values ... are governed attestations; asserting one over invented
    // data is a false attestation."
    // RESOLUTION REQUIRES: Program Authority determination of what provenance and eligibility
    // semantics IPD is authorised to assert from the governed D05 corpus.
  });

  it('CHAR-A-02 [OBSERVED DEFECT — UNRESOLVED]: the UI08 surface renders the unsupported classification claim to the user', () => {
    const out = renderAt(
      `/security-master?type=NSE_SYMBOL&value=${encodeURIComponent(MODELLED_TIER2_SYMBOL)}`
    );

    assert.ok(out.includes('EQ_IT0001_IN'), 'the modelled record resolves and is displayed');
    assert.ok(
      out.includes('Source Classification'),
      'the UI08 surface labels a source-classification row'
    );
    assert.ok(out.includes('REAL'), 'the surface renders the resolver classification claim verbatim');

    // ── RECORDED LIMIT — NOT AN ACCEPTANCE ASSERTION ──────────────────────────────────────
    // The rendered value is the resolver literal, not a governed per-record fact. Whether
    // synthetic or incompletely classified records may be displayed at all, and under what
    // explicit conditions, is a Program Authority decision — not settled here.
  });
});

/* ══════════════════════════════════════════════════════════════════════════════════════════
 * CHAR-B — SILENT DESCRIPTOR DEFAULTS
 * ════════════════════════════════════════════════════════════════════════════════════════ */

describe('CHAR-B: absent descriptor attributes fall back silently (characterization)', () => {
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

  it('CHAR-B-01 [OBSERVED DEFECT — UNRESOLVED]: a registration without faceValue or currency resolves to faceValue 1 / currency INR with quality GOOD and classification REAL', () => {
    const resolved = register({}, 'NODESC', 'EQ_CHAR_NODESC_IN');

    // ── OBSERVED: the source record supplies neither field; the output supplies both.
    assert.strictEqual(resolved.faceValue, 1, 'absent faceValue falls back to 1');
    assert.strictEqual(resolved.currency, 'INR', 'absent currency falls back to INR');

    // ── OBSERVED: the fallback carries no downgrade, anomaly, or warning of any kind.
    assert.strictEqual(resolved.provenance.quality, 'GOOD');
    assert.strictEqual(resolved.provenance.sourceClassification, 'REAL');
    assert.strictEqual(resolved.provenance.replayConstraintApplied, false);

    // ── RECORDED LIMIT — NOT AN ACCEPTANCE ASSERTION ──────────────────────────────────────
    // This records that an unsupported or legacy registration can silently receive default
    // financial attributes. It does NOT decide whether such a registration must be rejected,
    // quarantined, surfaced as unknown, or defaulted — that policy choice, and the quality
    // state it should carry, requires a Program Authority decision.
  });

  it('CHAR-B-02 [OBSERVED — CONTROL]: populated faceValue and currency pass through unchanged, proving the fallback only engages when the source value is absent', () => {
    const inr = register({ faceValue: 10, currency: 'INR' }, 'CHARINR', 'EQ_CHAR_INR_IN');
    assert.strictEqual(inr.faceValue, 10);
    assert.strictEqual(inr.currency, 'INR');

    const usd = register({ faceValue: 10, currency: 'USD' }, 'CHARUSD', 'EQ_CHAR_USD_IN');
    assert.strictEqual(usd.faceValue, 10);
    assert.strictEqual(usd.currency, 'USD', 'a populated non-INR currency is projected faithfully');

    // Control: the fallback is therefore a substitution for missing data, not a constant.
  });

  it('CHAR-B-03 [OBSERVED DEFECT — UNRESOLVED]: a non-positive faceValue also collapses to the fallback value of 1', () => {
    const zero = register({ faceValue: 0, currency: 'INR' }, 'CHARZERO', 'EQ_CHAR_ZERO_IN');
    assert.strictEqual(
      zero.faceValue,
      1,
      'a supplied faceValue of 0 is indistinguishable from an absent one in the output'
    );

    // ── RECORDED LIMIT — NOT AN ACCEPTANCE ASSERTION ──────────────────────────────────────
    // Records the loss of the distinction between "absent" and "explicitly zero". Whether
    // that distinction must be preserved is part of the same Program Authority decision as
    // CHAR-B-01; it is not decided here.
  });
});

/* ══════════════════════════════════════════════════════════════════════════════════════════
 * CHAR-C — HISTORICAL IDENTIFIER RESOLUTION vs. DESCRIPTOR TEMPORAL VALIDITY
 * ════════════════════════════════════════════════════════════════════════════════════════ */

describe('CHAR-C: asOf governs identifier mapping only — not the returned descriptor (characterization)', () => {
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

  it('CHAR-C-02 [OBSERVED DEFECT — UNRESOLVED]: the descriptor returned for a historical asOf is the current stored snapshot, not an asOf-scoped descriptor', () => {
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

    // ── OBSERVED: identity resolution honoured the asOf …
    assert.strictEqual(historical.companyId, 'EQ_AXISBANK_IN');

    // … but the descriptor is byte-identical to today's descriptor.
    assert.deepStrictEqual(
      historical.listings,
      current.listings,
      'a 2005 query returns the present-day AXISBANK exchange listings'
    );
    assert.ok(
      historical.listings.some((l) => l.symbol === 'AXISBANK'),
      'the 2005 query returns the post-rename symbol, not any 2005-era symbol'
    );

    // ── OBSERVED: the provenance echoes the requested asOf, so a consumer cannot detect
    //    from the payload that the descriptor is not asOf-scoped.
    assert.strictEqual(historical.provenance.asOf, HISTORICAL_ASOF);

    // ── RECORDED LIMIT — NOT AN ACCEPTANCE ASSERTION ──────────────────────────────────────
    // This test distinguishes two separate concepts and deliberately asserts ONLY the
    // negative observation:
    //   (a) EFFECTIVE-DATED IDENTIFIER RESOLUTION — implemented, tested, approved (CHAR-C-01);
    //   (b) HISTORICAL DESCRIPTOR VALIDITY        — not implemented; the resolver returns the
    //       current snapshot regardless of asOf.
    // No descriptor-versioning requirement is asserted: the existing authoritative contract
    // (F-3 act §2) requires "the full resolution descriptor" but is silent on descriptor
    // temporal validity. Whether historical descriptor versioning is in scope at all — and
    // if so, what shape it takes — requires a Program Authority decision.
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
