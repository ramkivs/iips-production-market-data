/**
 * R-2 tests — EQUITY ELIGIBILITY FILTER (§N "equity filtering"; §F.37–39, §A.2)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assessEligibility, classifySeries, DEFAULT_EQUITY_SERIES, filterEligible, NON_EQUITY_SERIES_PATTERNS,
} from '../src/equityEligibility.js';
import { parseCmUdiff } from '../src/cmudiffParser.js';
import { fixtures } from './helpers.js';

const F = fixtures();
const SRC_TS = '2026-01-05T16:30:00Z';

function rows(name) {
  return parseCmUdiff({ text: F[name], sourceRef: name, sourceId: 'r2-reference-file', sourceTimestamp: SRC_TS }).rows;
}

test('§A.2 — EQ-series NSE CM equity is eligible', () => {
  const v = assessEligibility({ Sgmt: 'CM', SctySrs: 'EQ', ISIN: 'INE000A01001', TckrSymb: 'SYNTHALPHA' });
  assert.equal(v.eligible, true);
});

test('§A.2 — BE-series (trade-for-trade) equity is eligible', () => {
  assert.equal(assessEligibility({ Sgmt: 'CM', SctySrs: 'BE', ISIN: 'INE000C01003', TckrSymb: 'SYNTHGAMMA' }).eligible, true);
});

test('§F.39 — debt/NCD series N2 must NOT enter the canonical equity dataset', () => {
  const v = assessEligibility({ Sgmt: 'CM', SctySrs: 'N2', ISIN: 'INE000N02005', TckrSymb: 'SYNTHNCD751', XpryDt: '2029-06-15' });
  assert.equal(v.eligible, false);
  assert.equal(v.seriesClass, 'DEBT_OR_NCD');
});

test('§F.39 — debt series ND must NOT enter', () => {
  assert.equal(assessEligibility({ Sgmt: 'CM', SctySrs: 'ND', ISIN: 'INE000N0D006', TckrSymb: 'X' }).eligible, false);
});

test('§F.39 — Sovereign Gold Bond (GB) must NOT enter the equity dataset', () => {
  const v = assessEligibility({ Sgmt: 'CM', SctySrs: 'GB', ISIN: 'INE000G0B007', TckrSymb: 'SYNTHSGBJUN28', XpryDt: '2028-06-30' });
  assert.equal(v.eligible, false);
  assert.equal(v.seriesClass, 'GOVT_SECURITY');
});

test('default-deny — an UNRECOGNISED series is refused, not admitted', () => {
  const v = assessEligibility({ Sgmt: 'CM', SctySrs: 'ZZ', ISIN: 'INE000A01001', TckrSymb: 'X' });
  assert.equal(v.eligible, false);
  assert.equal(v.seriesClass, 'UNKNOWN');
  assert.match(v.reason, /default-deny/);
});

test('§A.1 — a non-CM segment is refused (NSE Capital Market only)', () => {
  assert.equal(assessEligibility({ Sgmt: 'FO', SctySrs: 'EQ', ISIN: 'INE000A01001', TckrSymb: 'X' }).eligible, false);
  assert.equal(assessEligibility({ Sgmt: 'CD', SctySrs: 'EQ', ISIN: 'INE000A01001', TckrSymb: 'X' }).eligible, false);
});

test('§H — a missing ISIN or symbol is refused', () => {
  assert.equal(assessEligibility({ Sgmt: 'CM', SctySrs: 'EQ', ISIN: null, TckrSymb: 'X' }).eligible, false);
  assert.equal(assessEligibility({ Sgmt: 'CM', SctySrs: 'EQ', ISIN: 'INE000A01001', TckrSymb: null }).eligible, false);
});

test('consistency — an equity-eligible series carrying an expiry is refused', () => {
  const v = assessEligibility({ Sgmt: 'CM', SctySrs: 'EQ', ISIN: 'INE000A01001', TckrSymb: 'X', XpryDt: '2027-01-01' });
  assert.equal(v.eligible, false);
  assert.match(v.reason, /carries XpryDt/);
});

test('series classification — known classes are named, unknown is not guessed', () => {
  assert.equal(classifySeries('EQ').class, 'EQUITY');
  assert.equal(classifySeries('BE').class, 'EQUITY');
  assert.equal(classifySeries('N2').class, 'DEBT_OR_NCD');
  assert.equal(classifySeries('N5').class, 'DEBT_OR_NCD');
  assert.equal(classifySeries('ND').class, 'DEBT_OR_NCD');
  assert.equal(classifySeries('GB').class, 'GOVT_SECURITY');
  assert.equal(classifySeries('QQ').known, false);
});

test('§F.37/§F.38 — filtering the mixed fixture admits only the 2 equities', () => {
  const r = filterEligible(rows('BhavCopy_NSE_CM_0_0_0_20260105_F_0000.csv'));
  assert.equal(r.eligibleCount, 2);
  assert.equal(r.ineligibleCount, 3);
  assert.deepEqual(r.eligible.map((x) => x.TckrSymb).sort(), ['SYNTHALPHA', 'SYNTHEPS']);
});

test('§J — rejections are accounted for by class, so nothing disappears silently', () => {
  const r = filterEligible(rows('BhavCopy_NSE_CM_0_0_0_20260105_F_0000.csv'));
  const total = Object.values(r.rejectionsByClass).reduce((a, b) => a + b, 0);
  assert.equal(total, r.ineligibleCount);
  assert.equal(r.rejectionsByClass.DEBT_OR_NCD, 2);
  assert.equal(r.rejectionsByClass.GOVT_SECURITY, 1);
});

test('the clean fixture admits every row', () => {
  const r = filterEligible(rows('BhavCopy_NSE_CM_0_0_0_20260102_F_0000.csv'));
  assert.equal(r.eligibleCount, 4);
  assert.equal(r.ineligibleCount, 0);
});

test('the allow-list is data, so a future equity series can be added by configuration', () => {
  assert.ok(DEFAULT_EQUITY_SERIES.includes('EQ'));
  const v = assessEligibility(
    { Sgmt: 'CM', SctySrs: 'ST', ISIN: 'INE000A01001', TckrSymb: 'X' },
    { equitySeries: ['EQ', 'BE', 'ST'] },
  );
  assert.equal(v.eligible, true);
});

test('the non-equity pattern table is non-empty and each entry names its class', () => {
  assert.ok(NON_EQUITY_SERIES_PATTERNS.length >= 4);
  for (const p of NON_EQUITY_SERIES_PATTERNS) assert.ok(p.class && p.pattern);
});
