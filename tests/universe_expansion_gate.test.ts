/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: D05 Wave-3 universe expansion gate — conformance, no deposition
 *
 * Governing: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01;
 * task: Wave-3 bounded expansion (2026-11-06). The gate NEVER deposits: it validates
 * candidate records and emits deterministic reports. Corpus, runtime assets, manifests
 * and existing pins remain byte-identical until (and unless) a separately-authorized
 * deposition PR re-lands them together. All fixture candidates below are SYNTHETIC and
 * carry synthetic identifiers; no real security attribute is asserted anywhere here.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  evaluateWave3Expansion,
  materialiseMergedCorpus,
  isIsinCheckDigitValid,
} from '../src/identity/universe_expansion_gate.js';
import { SecurityMasterEntity } from '../src/identity/security_master.js';

const ROOT = process.cwd();
const CORPUS_PATH = path.join(ROOT, 'evidence/operator_drop/d05_security_master_broad_universe.json');
const WAVE2_DISPOSITION_PATH = path.join(ROOT, 'evidence/operator_drop/wave2-2026-11-06/disposition-2026-11-06.json');
const priorCorpus: SecurityMasterEntity[] = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf8'));
const wave2ScopeIsins: string[] = JSON.parse(fs.readFileSync(WAVE2_DISPOSITION_PATH, 'utf8'))
  .rows.map((r: { isin: string }) => r.isin);

let seq = 0;
/** Synthetic ISIN with a correct Luhn check digit. ISINs are fixture-only, never real-market identifiers. */
function synthIsin(): string {
  seq += 1;
  const body = `INE${String(seq).padStart(8, '0')}`; // 11 chars; + check digit = 12
  for (let d = 0; d <= 9; d++) {
    const candidate = `${body}${d}`;
    if (isIsinCheckDigitValid(candidate)) return candidate;
  }
  throw new Error('no valid check digit found (should be unreachable for numeric bodies)');
}

function mkCandidate(symbolSeq: number, overrides: Partial<SecurityMasterEntity> = {}): SecurityMasterEntity {
  return {
    companyId: `EQ_W3FX${String(symbolSeq).padStart(4, '0')}_IN`,
    isin: synthIsin(),
    companyName: `Wave-3 Fixture Company ${symbolSeq} Limited`,
    industry: 'Fixture Industry',
    sector: 'UNCLASSIFIED',
    listingStatus: 'ACTIVE',
    lotSize: 1,
    tickSize: 0.05,
    faceValue: 10,
    currency: 'INR',
    effectiveFrom: '2020-01-01T00:00:00.000Z',
    listings: [
      { exchange: 'NSE', symbol: `W3FX${String(symbolSeq).padStart(4, '0')}`, status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
    ],
    ...overrides,
  } as SecurityMasterEntity;
}

describe('D05 Wave-3 universe expansion gate — conformance (no deposition)', () => {
  it('W3G-00: fixture ISINs are Luhn-correct and none collides with the governed corpus', () => {
    for (let i = 0; i < 12; i++) {
      const isin = synthIsin();
      assert.ok(isIsinCheckDigitValid(isin), `fixture ISIN must pass Luhn: ${isin}`);
      assert.ok(!priorCorpus.some((e) => e.isin === isin));
    }
    assert.ok(isIsinCheckDigitValid('INE002A01018'), 'sanity: RELIANCE ISIN passes');
  });

  it('W3G-01: a complete, active, unique candidate is ADDED; prior corpus bytes-of-record are not mutated', () => {
    const before = JSON.stringify(priorCorpus);
    const cand = mkCandidate(1);
    const report = evaluateWave3Expansion(priorCorpus, [cand]);
    assert.strictEqual(report.counts.ADDED, 1);
    assert.strictEqual(report.dispositions[0].verdict, 'ELIGIBLE_NEW');
    assert.strictEqual(report.mergedRecordCount, 2251);
    assert.strictEqual(JSON.stringify(priorCorpus), before, 'input corpus must remain untouched');
  });

  it('W3G-02: ISIN failing ISO 6166 shape/check digit is INELIGIBLE', () => {
    const cand = mkCandidate(2, { isin: 'XX0000INVALID1' } as Partial<SecurityMasterEntity>);
    const report = evaluateWave3Expansion(priorCorpus, [cand]);
    assert.strictEqual(report.counts.INELIGIBLE, 1);
    assert.strictEqual(report.dispositions[0].disposition, 'INELIGIBLE');
  });

  it('W3G-03: missing exchange symbol evidence → UNRESOLVED (cannot validate an unevidenced listing)', () => {
    const cand = mkCandidate(3, {
      listings: [{ exchange: 'NSE', symbol: '', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
    } as Partial<SecurityMasterEntity>);
    const report = evaluateWave3Expansion(priorCorpus, [cand]);
    assert.strictEqual(report.counts.UNRESOLVED, 1);
    assert.strictEqual(report.counts.ADDED, 0);
  });

  it('W3G-04: duplicate within the deposit — first wins, later identical identifiers are INELIGIBLE', () => {
    const a = mkCandidate(4);
    const b = mkCandidate(4, { isin: a.isin }); // same ISIN
    const report = evaluateWave3Expansion(priorCorpus, [a, b]);
    assert.strictEqual(report.counts.ADDED, 1);
    assert.strictEqual(report.counts.INELIGIBLE, 1);
    assert.strictEqual(report.dispositions[1].verdict, 'DUPLICATE_IN_DEPOSIT');
  });

  it('W3G-05: ISIN governed by another corpus record → IDENTITY_CONFLICT / INELIGIBLE', () => {
    const cand = mkCandidate(5, { isin: 'INE002A01018', companyId: 'EQ_W3FX0005_IN' }); // RELIANCE's ISIN
    const report = evaluateWave3Expansion(priorCorpus, [cand]);
    assert.strictEqual(report.counts.ADDED, 0);
    assert.strictEqual(report.dispositions[0].verdict, 'IDENTITY_CONFLICT');
  });

  it('W3G-06: companyId governed by another record → IDENTITY_CONFLICT / INELIGIBLE', () => {
    const cand = mkCandidate(6, { companyId: 'EQ_RELIANCE_IN' });
    const report = evaluateWave3Expansion(priorCorpus, [cand]);
    assert.strictEqual(report.counts.ADDED, 0);
    assert.strictEqual(report.dispositions[0].verdict, 'IDENTITY_CONFLICT');
  });

  it('W3G-07: listing symbol already governed (different ISIN) → IDENTITY_CONFLICT / INELIGIBLE', () => {
    const cand = mkCandidate(7, {
      listings: [{ exchange: 'NSE', symbol: 'RELIANCE', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
    } as Partial<SecurityMasterEntity>);
    const report = evaluateWave3Expansion(priorCorpus, [cand]);
    assert.strictEqual(report.counts.ADDED, 0);
    assert.strictEqual(report.dispositions[0].verdict, 'IDENTITY_CONFLICT');
  });

  it('W3G-08: stable duplicate companyId+ISIN pair → ALREADY_PRESENT, never ADDED again', () => {
    const corpusRecord = priorCorpus.find((e) => e.companyId === 'EQ_RELIANCE_IN')!;
    const report = evaluateWave3Expansion(priorCorpus, [structuredClone(corpusRecord)]);
    assert.strictEqual(report.counts.ALREADY_PRESENT, 1);
    assert.strictEqual(report.counts.ADDED, 0);
  });

  it('W3G-09: SUSPENDED / DELISTED / unknown listingStatus are INELIGIBLE for Tier-2 CM', () => {
    for (const status of ['SUSPENDED', 'DELISTED'] as const) {
      const cand = mkCandidate(9, { listingStatus: status });
      const report = evaluateWave3Expansion(priorCorpus, [cand]);
      assert.strictEqual(report.counts.ADDED, 0);
      assert.strictEqual(report.dispositions[0].disposition, 'INELIGIBLE');
    }
    const missing = mkCandidate(9, { listingStatus: undefined } as Partial<SecurityMasterEntity>);
    const report = evaluateWave3Expansion(priorCorpus, [missing]);
    assert.strictEqual(report.dispositions[0].disposition, 'UNRESOLVED');
  });

  it('W3G-10: effectiveTo before effectiveFrom → INELIGIBLE', () => {
    const cand = mkCandidate(10, {
      effectiveFrom: '2026-01-10T00:00:00.000Z',
      effectiveTo: '2026-01-01T00:00:00.000Z',
    });
    const report = evaluateWave3Expansion(priorCorpus, [cand]);
    assert.strictEqual(report.counts.ADDED, 0);
    assert.strictEqual(report.dispositions[0].verdict, 'EFFECTIVE_WINDOW_INVALID');
  });

  it('W3G-11: missing authoritative fields (faceValue/lotSize/tickSize) → UNRESOLVED, never invented', () => {
    const cand = mkCandidate(11, { faceValue: undefined } as Partial<SecurityMasterEntity>);
    const report = evaluateWave3Expansion(priorCorpus, [cand]);
    assert.strictEqual(report.counts.UNRESOLVED, 1);
    assert.ok(report.dispositions[0].reasons.some((r) => r.includes('faceValue')));
    const cand2 = mkCandidate(11, { lotSize: undefined } as Partial<SecurityMasterEntity>);
    const report2 = evaluateWave3Expansion(priorCorpus, [cand2]);
    assert.ok(report2.dispositions[0].reasons.some((r) => r.includes('lotSize')));
  });

  it('W3G-12: report is deterministic and coverage of the 67 B-04 ISINs is 0 present / 67 absent on the unchanged corpus', () => {
    const cand = mkCandidate(12);
    const r1 = evaluateWave3Expansion(priorCorpus, [cand], { scopeIsins: wave2ScopeIsins });
    const r2 = evaluateWave3Expansion(priorCorpus, [cand], { scopeIsins: wave2ScopeIsins });
    assert.deepStrictEqual(r1, r2, 'identical inputs produce identical reports');
    assert.strictEqual(wave2ScopeIsins.length, 67);
    assert.strictEqual(r1.scopeCoverage?.evaluated, 67);
    assert.strictEqual(r1.scopeCoverage?.present, 0);
    assert.strictEqual(r1.scopeCoverage?.absent, 67);
    assert.ok(!r1.scopeCoverage?.rows.some((r) => r.isin === 'INE415A01038'), 'AGI (resolved row) is outside the 67');
  });

  it('W3G-13: merged corpus materialisation is order-stable (new rows appended by companyId) and adds nothing on zero eligible', () => {
    const merged = materialiseMergedCorpus(priorCorpus, []);
    assert.strictEqual(merged.entities.length, 2250);
    assert.deepStrictEqual(merged.entities, priorCorpus);
    const withEligible = materialiseMergedCorpus(
      priorCorpus,
      [mkCandidate(13), mkCandidate(14), mkCandidate(15)],
    );
    assert.strictEqual(withEligible.entities.length, 2253);
    const appended = withEligible.entities.slice(2250);
    assert.deepStrictEqual(appended.map((e) => e.companyId), appended.map((e) => e.companyId).sort());
  });

  it('W3G-14: contract violations (blank companyName / tickSize) are INELIGIBLE via validateInstrumentMaster binding', () => {
    const cand = mkCandidate(14, { companyName: '   ' } as Partial<SecurityMasterEntity>);
    const report = evaluateWave3Expansion(priorCorpus, [cand]);
    assert.strictEqual(report.counts.ADDED, 0);
    assert.ok(['UNRESOLVED', 'INELIGIBLE'].includes(report.dispositions[0].disposition));
    const cand2 = mkCandidate(14, { tickSize: 0 });
    const report2 = evaluateWave3Expansion(priorCorpus, [cand2]);
    assert.strictEqual(report2.counts.ADDED, 0);
  });

  it('W3G-15: no Wave-3 deposit artifacts are created by evaluating the gate', () => {
    assert.ok(!fs.existsSync(path.join(ROOT, 'evidence/operator_drop/wave3-2026-11-06/deposition-fakemarker')));
    const before = fs.readdirSync(path.join(ROOT, 'evidence/operator_drop'));
    evaluateWave3Expansion(priorCorpus, [mkCandidate(15)]);
    const after = fs.readdirSync(path.join(ROOT, 'evidence/operator_drop'));
    assert.deepStrictEqual(after, before, 'evaluation must not write to the governed deposition directory');
  });
});
