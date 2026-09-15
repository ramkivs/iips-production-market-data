/**
 * R-2 tests — CM-UDiFF PARSING (§N "source parsing", "current CM-UDiFF contract parsing")
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isLegacyCmFormat, LEGACY_COLUMNS, OPTIONAL_TAGS, parseCmUdiff, parseUdiffFileName,
  REQUIRED_TAGS, splitCsvLine,
} from '../src/cmudiffParser.js';
import { fixtures } from './helpers.js';

const F = fixtures();
const VALID = 'BhavCopy_NSE_CM_0_0_0_20260102_F_0000.csv';
const MIXED = 'BhavCopy_NSE_CM_0_0_0_20260105_F_0000.csv';
const SRC_TS = '2026-01-02T16:30:00Z';

function parse(name, overrides = {}) {
  return parseCmUdiff({
    text: F[name], sourceRef: name, sourceId: 'r2-reference-file', sourceTimestamp: SRC_TS,
    ...overrides,
  });
}

test('CM-UDiFF — a valid Common Bhavcopy Final file parses', () => {
  const r = parse(VALID);
  assert.equal(r.ok, true, r.error?.reason);
  assert.equal(r.rows.length, 4);
  assert.equal(r.header.includes('TradDt'), true);
  assert.equal(r.header.includes('ClsPric'), true);
});

test('CM-UDiFF — ISO tags bind by NAME, so values land on the right fields', () => {
  const r = parse(VALID);
  const row = r.rows.find((x) => x.TckrSymb === 'SYNTHALPHA');
  assert.equal(row.TradDt, '2026-01-02');
  assert.equal(row.Sgmt, 'CM');
  assert.equal(row.Src, 'NSE');
  assert.equal(row.ISIN, 'INE000A01001');
  assert.equal(row.SctySrs, 'EQ');
  assert.equal(row.ClsPric, '1015.00');
  assert.equal(row.TtlTradgQty, '250000');
  assert.equal(row.TtlNbOfTxsExctd, '12500');
});

test('CM-UDiFF — empty cells become null, never "" or 0 (P01 NL-7)', () => {
  const r = parse(VALID);
  const row = r.rows.find((x) => x.TckrSymb === 'SYNTHALPHA');
  assert.equal(row.XpryDt, null);
  assert.equal(row.RptdTxSts, null);
  assert.equal(row.FininstrmActlXpryDt ?? null, null);
  assert.notEqual(row.XpryDt, '');
  assert.notEqual(row.XpryDt, 0);
});

test('§H — reserved UDiFF tags are NOT carried onto parsed rows', () => {
  const r = parse(VALID);
  for (const row of r.rows) {
    for (const tag of ['Rsvd01', 'Rsvd02', 'Rsvd03', 'Rsvd04']) {
      assert.equal(row[tag], undefined, `${tag} should not be exposed`);
    }
  }
});

test('§F.40 — every parsed row carries source provenance', () => {
  const r = parse(VALID);
  for (const row of r.rows) {
    assert.equal(row._sourceRef, VALID);
    assert.equal(row._sourceId, 'r2-reference-file');
    assert.equal(row._sourceTimestamp, SRC_TS);
  }
});

test('§F.35 — the discontinued legacy CM CSV format is REFUSED, not mis-parsed', () => {
  const r = parse('SYNTHETIC_legacy_cm_format.csv');
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'MALFORMED_RESPONSE');
  assert.match(r.error.reason, /legacy CM Bhavcopy CSV format/);
});

test('§F.35 — legacy detection keys on the legacy header, not on a filename', () => {
  assert.equal(isLegacyCmFormat(LEGACY_COLUMNS.slice()), true);
  assert.equal(isLegacyCmFormat(['TradDt', 'BizDt', 'Sgmt', 'Src', 'ISIN', 'TckrSymb', 'SctySrs', 'ClsPric']), false);
});

test('E5 — a file missing required ISO tags fails loudly rather than mis-binding', () => {
  const r = parse('SYNTHETIC_missing_required_tags.csv');
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'MALFORMED_RESPONSE');
  assert.match(r.error.reason, /required ISO tag\(s\) absent/);
  for (const tag of ['ISIN', 'TckrSymb', 'SctySrs', 'ClsPric']) assert.match(r.error.reason, new RegExp(tag));
});

test('§J — a short/malformed row is quarantined by the parser, not dropped silently', () => {
  const r = parse('SYNTHETIC_quality_cases_20260106.csv');
  assert.equal(r.ok, true);
  assert.equal(r.malformed.length, 1);
  assert.match(r.malformed[0].reason, /fewer cells than required/);
  assert.equal(r.malformed[0].lineNumber, 8);
});

test('E5 — an empty body is rejected', () => {
  const r = parseCmUdiff({ text: '   ', sourceRef: 'x.csv', sourceId: 's', sourceTimestamp: SRC_TS });
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'MALFORMED_RESPONSE');
});

test('E5 — a missing sourceRef is rejected (§F.40 provenance is mandatory)', () => {
  const r = parseCmUdiff({ text: F[VALID], sourceRef: '', sourceId: 's', sourceTimestamp: SRC_TS });
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'MALFORMED_RESPONSE');
});

test('CSV — quoted fields with embedded commas are split correctly', () => {
  const parts = splitCsvLine('A,"B, C",D');
  assert.deepEqual(parts, ['A', 'B, C', 'D']);
});

test('CSV — escaped double quotes are unescaped', () => {
  assert.deepEqual(splitCsvLine('"He said ""hi""",X'), ['He said "hi"', 'X']);
});

test('UDiFF filename — business date and FINAL marker are recovered', () => {
  const m = parseUdiffFileName(VALID);
  assert.equal(m.parsed, true);
  assert.equal(m.exchange, 'NSE');
  assert.equal(m.segment, 'CM');
  assert.equal(m.businessDate, '2026-01-02');
  assert.equal(m.kind, 'FINAL');
});

test('UDiFF filename — a non-conforming name is reported as unparsed, not guessed', () => {
  assert.equal(parseUdiffFileName('random.csv').parsed, false);
});

test('§F.34 — the required/optional tag sets are explicit and disjoint', () => {
  for (const t of REQUIRED_TAGS) assert.equal(OPTIONAL_TAGS.includes(t), false, `${t} cannot be both`);
  assert.ok(REQUIRED_TAGS.includes('ClsPric'));
  assert.ok(REQUIRED_TAGS.includes('TckrSymb'));
});
