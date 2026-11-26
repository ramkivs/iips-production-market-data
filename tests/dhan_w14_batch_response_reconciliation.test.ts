/**
 * Dhan W-14 — Batch response reconciliation (synthetic fixtures)
 *
 * Verifies that a Dhan batch quote response (POST /marketfeed/quote) can be
 * reconciled against all 96 requested Scope B instruments. Uses synthetic
 * responses only — never fabricates live market values as observations.
 *
 * Covers: all 96 returned, missing, unexpected, duplicate, partial,
 * invalid structure, and valid zero/unavailable market values.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  reconcileDhanBatchQuoteResponse,
  type DhanBatchQuoteInstrument,
  type DhanBatchQuoteResponse,
} from '../src/providers/dhan/dhan_batch_quote_payload.js';

// ── helpers ────────────────────────────────────────────────────────────────

function loadManifest(): { instruments: Array<DhanBatchQuoteInstrument & { p7LineNumber: number }> } {
  return JSON.parse(readFileSync(resolve('evidence/dhan-w14-e4/w14-scope-b-reconciliation-manifest.json'), 'utf8'));
}

function loadPayload(): Record<string, number[]> {
  return JSON.parse(readFileSync(resolve('evidence/dhan-w14-e4/w14-scope-b-batch-payload.json'), 'utf8'));
}

function instruments(): DhanBatchQuoteInstrument[] {
  const m = loadManifest();
  return m.instruments.map((i) => ({
    companyId: i.companyId,
    originalCompanyId: i.originalCompanyId,
    identityCorrected: i.identityCorrected,
    isin: i.isin,
    exchange: i.exchange,
    exchangeSegment: i.exchangeSegment,
    series: i.series,
    canonicalSecurityIdentity: i.canonicalSecurityIdentity,
    dhanSecurityId: i.dhanSecurityId,
  }));
}

/** Minimal synthetic DhanQuoteDto — valid per parseDhanQuoteBlock */
function syntheticQuote(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    last_price: 100.5,
    ohlc: { open: 99, high: 101, low: 98, close: 100.5 },
    volume: 10000,
    last_trade_time: '04/11/2026 15:30:00',
    ...overrides,
  };
}

/** Builds a synthetic success response that returns every requested instrument. */
function syntheticFullResponse(payload: Record<string, number[]>): DhanBatchQuoteResponse {
  const data: Record<string, Record<string, unknown>> = {};
  for (const [segment, ids] of Object.entries(payload)) {
    data[segment] = {};
    for (const id of ids) data[segment]![String(id)] = syntheticQuote();
  }
  return { status: 'success', data };
}

describe('W-14 batch response reconciliation — synthetic fixtures', () => {
  it('all 96 instruments returned → ok, no missing/unexpected/duplicate/invalid', () => {
    const req = instruments();
    const payload = loadPayload();
    const response = syntheticFullResponse(payload);
    const r = reconcileDhanBatchQuoteResponse(req, response);
    assert.equal(r.requested, 96);
    assert.equal(r.returned, 96);
    assert.equal(r.matched, 96);
    assert.equal(r.missing.length, 0);
    assert.equal(r.unexpected.length, 0);
    assert.equal(r.duplicates.length, 0);
    assert.equal(r.invalid.length, 0);
    assert.equal(r.ok, true);
  });

  it('one missing instrument → MISSING_INSTRUMENT', () => {
    const req = instruments();
    const payload = loadPayload();
    const response = syntheticFullResponse(payload);
    // Remove one BSE instrument from response
    const bseKey = Object.keys(response.data.BSE_EQ ?? {})[0]!;
    delete response.data.BSE_EQ![bseKey];
    const r = reconcileDhanBatchQuoteResponse(req, response);
    assert.equal(r.returned, 95);
    assert.equal(r.missing.length, 1);
    assert.equal(r.missing[0]!.code, 'MISSING_INSTRUMENT');
    assert.equal(r.missing[0]!.dhanSecurityId, bseKey);
    assert.equal(r.ok, false);
  });

  it('multiple missing instruments → each reported', () => {
    const req = instruments();
    const payload = loadPayload();
    const response = syntheticFullResponse(payload);
    // Remove 3 NSE instruments
    const nseKeys = Object.keys(response.data.NSE_EQ ?? {});
    for (let i = 0; i < 3; i++) delete response.data.NSE_EQ![nseKeys[i]!];
    const r = reconcileDhanBatchQuoteResponse(req, response);
    assert.equal(r.missing.length, 3);
    assert.equal(r.returned, 93);
    assert.equal(r.ok, false);
  });

  it('unexpected response instrument → UNEXPECTED_INSTRUMENT', () => {
    const req = instruments();
    const payload = loadPayload();
    const response = syntheticFullResponse(payload);
    response.data.BSE_EQ!['9999999'] = syntheticQuote();
    const r = reconcileDhanBatchQuoteResponse(req, response);
    assert.equal(r.returned, 97);
    assert.equal(r.unexpected.length, 1);
    assert.equal(r.unexpected[0]!.code, 'UNEXPECTED_INSTRUMENT');
    assert.equal(r.unexpected[0]!.dhanSecurityId, '9999999');
    assert.equal(r.missing.length, 0);
    assert.equal(r.ok, false);
  });

  it('duplicate request identity (two manifest entries same segment+ID) → DUPLICATE_RESPONSE_IDENTITY', () => {
    const req = instruments();
    // Inject duplicate: clone first entry with same segment+ID but different company (impossible in real 96 but tests detection)
    const dupReq = [...req, { ...req[0]! }];
    assert.equal(dupReq.length, 97);
    const payload = loadPayload();
    const response = syntheticFullResponse(payload);
    const r = reconcileDhanBatchQuoteResponse(dupReq, response);
    assert.equal(r.duplicates.length, 1);
    assert.equal(r.duplicates[0]!.code, 'DUPLICATE_RESPONSE_IDENTITY');
    assert.equal(r.ok, false);
  });

  it('partial response (only one segment) → missing for the other segment', () => {
    const req = instruments();
    const payload = loadPayload();
    const response: DhanBatchQuoteResponse = { status: 'success', data: { BSE_EQ: {} } };
    for (const id of payload.BSE_EQ ?? []) response.data.BSE_EQ![String(id)] = syntheticQuote();
    const r = reconcileDhanBatchQuoteResponse(req, response);
    assert.equal(r.returned, 48);
    assert.equal(r.missing.length, 48); // all NSE missing
    assert.ok(r.missing.every((m) => m.exchangeSegment === 'NSE_EQ'));
    assert.equal(r.ok, false);
  });

  it('instrument under wrong segment → counted as missing (correct) + unexpected (wrong)', () => {
    const req = instruments();
    const payload = loadPayload();
    const response = syntheticFullResponse(payload);
    // Move one NSE ID to BSE_EQ
    const nseId = String(payload.NSE_EQ![0]!);
    delete response.data.NSE_EQ![nseId];
    response.data.BSE_EQ![nseId] = syntheticQuote();
    const r = reconcileDhanBatchQuoteResponse(req, response);
    // NSE missing
    assert.ok(r.missing.some((m) => m.dhanSecurityId === nseId && m.exchangeSegment === 'NSE_EQ'));
    // BSE unexpected (that ID was not requested under BSE)
    // Note: if moved ID collides with an existing BSE ID it would be unexpected; if not, unexpected
    // Our first NSE ID is 25, which is not in BSE (BSE starts at 500049), so unexpected
    assert.ok(r.unexpected.some((u) => u.dhanSecurityId === nseId && u.exchangeSegment === 'BSE_EQ'));
    assert.equal(r.ok, false);
  });

  it('invalid response structure → INVALID_RESPONSE_STRUCTURE', () => {
    const req = instruments();
    assert.equal(reconcileDhanBatchQuoteResponse(req, null).invalid[0]!.code, 'INVALID_RESPONSE_STRUCTURE');
    assert.equal(reconcileDhanBatchQuoteResponse(req, {}).invalid[0]!.code, 'INVALID_RESPONSE_STRUCTURE');
    assert.equal(reconcileDhanBatchQuoteResponse(req, { status: 'failed', data: {} }).invalid[0]!.code, 'INVALID_RESPONSE_STRUCTURE');
    assert.equal(reconcileDhanBatchQuoteResponse(req, { status: 'success' }).invalid[0]!.code, 'INVALID_RESPONSE_STRUCTURE');
    assert.equal(reconcileDhanBatchQuoteResponse(req, { status: 'success', data: null }).invalid[0]!.code, 'INVALID_RESPONSE_STRUCTURE');
  });

  it('segment block not an object → INVALID_RESPONSE_STRUCTURE for that segment, plus missing', () => {
    const req = instruments();
    const payload = loadPayload();
    const response: unknown = { status: 'success', data: { BSE_EQ: null as unknown, NSE_EQ: {} } };
    // Fill NSE correctly
    for (const id of payload.NSE_EQ ?? []) (response as DhanBatchQuoteResponse).data.NSE_EQ![String(id)] = syntheticQuote();
    const r = reconcileDhanBatchQuoteResponse(req, response);
    assert.ok(r.invalid.some((i) => i.code === 'INVALID_RESPONSE_STRUCTURE'));
    // BSE missing (segment invalid → not counted as returned)
    assert.ok(r.missing.length >= 48);
  });

  it('valid zero / unavailable market values are NOT reconciliation failures', () => {
    const req = instruments();
    const payload = loadPayload();
    const response = syntheticFullResponse(payload);
    // Override three quotes with zero/empty depth — still present with correct required fields
    const keys = Object.keys(response.data.NSE_EQ ?? {});
    response.data.NSE_EQ![keys[0]!] = syntheticQuote({ last_price: 0, volume: 0 });
    response.data.NSE_EQ![keys[1]!] = syntheticQuote({ depth: { buy: [], sell: [] } });
    response.data.NSE_EQ![keys[2]!] = syntheticQuote({ average_price: 0, net_change: 0 });
    const r = reconcileDhanBatchQuoteResponse(req, response);
    assert.equal(r.ok, true, 'zero/absent-book values must not fail reconciliation (presence only)');
    assert.equal(r.missing.length, 0);
    assert.equal(r.unexpected.length, 0);
  });

  it('Dhan batch response with zero-filled book (D-5) reconciles as present (not malformed)', () => {
    // Exercises the D-5 follow-up: depth buy/sell can be empty when market is closed — that's present, not missing
    const req = instruments();
    const payload = loadPayload();
    const response = syntheticFullResponse(payload);
    // Simulate market-closed zero book for all 96
    for (const seg of Object.keys(response.data)) {
      for (const id of Object.keys(response.data[seg] ?? {})) {
        response.data[seg]![id] = syntheticQuote({ depth: { buy: [], sell: [] }, buy_quantity: 0, sell_quantity: 0 });
      }
    }
    const r = reconcileDhanBatchQuoteResponse(req, response);
    assert.equal(r.ok, true);
  });
});
