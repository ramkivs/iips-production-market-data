/**
 * Dhan W-14 — 96-instrument batch payload validation (Scope B, BLK-2 corrected)
 *
 * Strict, offline validation that the approved Scope B sample is faithfully
 * represented in one deterministic Dhan Market Quote payload. No live call,
 * no credential read. Fails if even one instrument is missing or mis-mapped.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

import {
  buildDhanBatchQuotePayload,
  buildDhanBatchQuoteRequestBody,
  validatePayloadMatchesInstruments,
  type DhanBatchQuoteInstrument,
} from '../src/providers/dhan/dhan_batch_quote_payload.js';
import { DhanApiClient } from '../src/providers/dhan/dhan_api_client.js';

// ── helpers ────────────────────────────────────────────────────────────────

/** Load the generated Scope B artifacts (produced by scripts/dhan-w14-build-scope-b-payload.mjs). */
function loadGeneratedPayload(): Record<string, number[]> {
  return JSON.parse(readFileSync(resolve('evidence/dhan-w14-e4/w14-scope-b-batch-payload.json'), 'utf8'));
}
function loadReconciliationManifest(): {
  instruments: Array<{
    companyId: string; originalCompanyId: string; identityCorrected: boolean;
    isin: string; exchange: string; exchangeSegment: 'NSE_EQ'|'BSE_EQ'; series: string;
    canonicalSecurityIdentity: string; dhanSecurityId: string; p7LineNumber: number;
  }>;
  counts: { total: number; byExchangeSegment: Record<string,number>; byP7Series: Record<string,number>; distinctCompanies: number; distinctIsins: number; corrected: number; dualListedIsins: string[] };
  payload: { payloadSha256: string };
} {
  return JSON.parse(readFileSync(resolve('evidence/dhan-w14-e4/w14-scope-b-reconciliation-manifest.json'), 'utf8'));
}
function loadP7Manifest(): { records: Array<{ companyId: string; exchange: string; segment: string; series: string; isin: string; dhanSecurityId: string; disposition: string; mapping: { exchangeSegment: string } }> } {
  return JSON.parse(readFileSync(resolve('evidence/dhan-p7/qualification-manifest.json'), 'utf8'));
}
function loadReconSource(): { records: Array<{ companyId: string; companyIdResolvesInP04Now: string; p04CompanyIdChanged: boolean; exchangeSegment: string; dhanSecurityId: string; isin: string; series: string; securityIdentity: string }> } {
  return JSON.parse(readFileSync(resolve('evidence/dhan-w14-e4/e4-sample-reconciliation.json'), 'utf8'));
}

function toBatchInstruments(): DhanBatchQuoteInstrument[] {
  const manifest = loadReconciliationManifest();
  return manifest.instruments.map((i) => ({
    companyId: i.companyId,
    originalCompanyId: i.originalCompanyId,
    identityCorrected: i.identityCorrected,
    isin: i.isin,
    exchange: i.exchange as 'NSE'|'BSE',
    exchangeSegment: i.exchangeSegment,
    series: i.series,
    canonicalSecurityIdentity: i.canonicalSecurityIdentity,
    dhanSecurityId: i.dhanSecurityId,
  }));
}

describe('W-14 batch payload — Scope B 96 (BLK-2 corrected)', () => {
  it('artifacts exist and are valid JSON with expected counts', () => {
    const payload = loadGeneratedPayload();
    const recon = loadReconciliationManifest();
    assert.equal(recon.counts.total, 96);
    assert.equal(recon.instruments.length, 96);
    assert.equal(payload.BSE_EQ?.length, 48);
    assert.equal(payload.NSE_EQ?.length, 48);
    assert.equal(recon.counts.byP7Series.EQ, 48);
    assert.equal(recon.counts.byP7Series.A, 47);
    assert.equal(recon.counts.byP7Series.B, 1);
    assert.equal(recon.counts.distinctCompanies, 48);
    assert.equal(recon.counts.distinctIsins, 48);
  });

  it('exactly 96 instrument records and 96 unique (segment, securityId) combinations', () => {
    const instruments = toBatchInstruments();
    assert.equal(instruments.length, 96);
    const keys = instruments.map((i) => `${i.exchangeSegment}:${i.dhanSecurityId}`);
    assert.equal(new Set(keys).size, 96);
  });

  it('no duplicate instrument entries', () => {
    const instruments = toBatchInstruments();
    const counts = new Map<string, number>();
    for (const i of instruments) {
      const k = `${i.exchangeSegment}:${i.dhanSecurityId}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    for (const [k, c] of counts) assert.equal(c, 1, `duplicate ${k}`);
  });

  it('no missing approved sample entries and no unexpected additions (vs e4-sample-reconciliation.json)', () => {
    const reconSource = loadReconSource();
    const manifest = loadReconciliationManifest();
    // Scope B is source records with corrected companyId
    const expectedKeys = new Set(
      reconSource.records.map((r) => {
        const cid = r.p04CompanyIdChanged ? r.companyIdResolvesInP04Now : r.companyId;
        return `${cid}|${r.exchangeSegment}|${r.isin}|${r.series}|${r.dhanSecurityId}`;
      })
    );
    const actualKeys = new Set(
      manifest.instruments.map((i) => `${i.companyId}|${i.exchangeSegment}|${i.isin}|${i.series}|${i.dhanSecurityId}`)
    );
    assert.equal(expectedKeys.size, 96);
    assert.equal(actualKeys.size, 96);
    for (const k of expectedKeys) assert.ok(actualKeys.has(k), `missing approved instrument ${k}`);
    for (const k of actualKeys) assert.ok(expectedKeys.has(k), `unexpected instrument ${k}`);
  });

  it('correct exchange-segment assignment (BSE_EQ vs NSE_EQ, including BSE:B)', () => {
    const instruments = toBatchInstruments();
    const payload = buildDhanBatchQuotePayload(instruments);
    // AGI's BSE:B must be in BSE_EQ, not NSE_EQ
    assert.ok(payload.BSE_EQ?.includes(500187), 'AGI BSE:B 500187 must be under BSE_EQ');
    assert.ok(!payload.NSE_EQ?.includes(500187), 'AGI 500187 must not appear under NSE_EQ');
    // Every instrument appears under its declared segment
    for (const inst of instruments) {
      const bucket = payload[inst.exchangeSegment];
      assert.ok(bucket?.includes(Number(inst.dhanSecurityId)), `${inst.companyId} ${inst.dhanSecurityId} not in ${inst.exchangeSegment}`);
    }
    // Total counts match manifest
    assert.equal(payload.BSE_EQ?.length, 48);
    assert.equal(payload.NSE_EQ?.length, 48);
  });

  it('correct P7 registry mapping for every instrument', () => {
    const p7 = loadP7Manifest();
    const manifest = loadReconciliationManifest();
    const p7Keys = new Set(
      p7.records.filter((r) => r.disposition === 'QUALIFIED').map((r) => {
        const seg = r.mapping?.exchangeSegment ?? (r.exchange === 'NSE' ? 'NSE_EQ' : 'BSE_EQ');
        return `${r.companyId}|${seg}|${r.isin}|${r.series}|${r.dhanSecurityId}`;
      })
    );
    for (const inst of manifest.instruments) {
      const k = `${inst.companyId}|${inst.exchangeSegment}|${inst.isin}|${inst.series}|${inst.dhanSecurityId}`;
      assert.ok(p7Keys.has(k), `P7 mapping missing for ${k}`);
    }
  });

  it('correct handling of all six identity-renaming cases', () => {
    const manifest = loadReconciliationManifest();
    const corrected = manifest.instruments.filter((i) => i.identityCorrected);
    assert.equal(corrected.length, 6);

    const byIds = new Map(corrected.map((i) => [i.dhanSecurityId, i]));
    // TMPV
    assert.equal(byIds.get('3456')?.companyId, 'EQ_TMPV_IN');
    assert.equal(byIds.get('3456')?.originalCompanyId, 'EQ_TATAMOTORS_IN');
    assert.equal(byIds.get('500570')?.companyId, 'EQ_TMPV_IN');
    // BAJAJAUTO
    assert.equal(byIds.get('16669')?.companyId, 'EQ_BAJAJAUTO_IN');
    assert.equal(byIds.get('532977')?.companyId, 'EQ_BAJAJAUTO_IN');
    assert.equal(byIds.get('16669')?.originalCompanyId, 'EQ_BAJAJ-AUTO_IN');
    // LTM
    assert.equal(byIds.get('17818')?.companyId, 'EQ_LTM_IN');
    assert.equal(byIds.get('540005')?.companyId, 'EQ_LTM_IN');

    // Dhan IDs unchanged through correction (security IDs are the expected ones)
    assert.ok(byIds.has('3456') && byIds.has('500570') && byIds.has('16669') && byIds.has('532977') && byIds.has('17818') && byIds.has('540005'));

    // Original IDs must not appear as corrected companyId (they were renamed)
    const allCompanyIds = new Set(manifest.instruments.map((i) => i.companyId));
    assert.ok(!allCompanyIds.has('EQ_TATAMOTORS_IN'));
    assert.ok(!allCompanyIds.has('EQ_BAJAJ-AUTO_IN'));
    assert.ok(!allCompanyIds.has('EQ_LTIM_IN'));
  });

  it('no accidental loss of dual-listed instruments (all 48 ISINs appear in both NSE_EQ and BSE_EQ)', () => {
    const manifest = loadReconciliationManifest();
    // Every ISIN in the 96 should be dual-listed: one NSE, one BSE (the sample is 48 companies each with both listings)
    const byIsin = new Map<string, Set<string>>();
    for (const inst of manifest.instruments) {
      if (!byIsin.has(inst.isin)) byIsin.set(inst.isin, new Set());
      byIsin.get(inst.isin)!.add(inst.exchangeSegment);
    }
    assert.equal(byIsin.size, 48);
    for (const [isin, segments] of byIsin) {
      assert.equal(segments.size, 2, `ISIN ${isin} must appear in both NSE_EQ and BSE_EQ`);
      assert.ok(segments.has('NSE_EQ') && segments.has('BSE_EQ'), `ISIN ${isin} missing segment`);
    }
    assert.equal(manifest.counts.dualListedIsins.length, 48);
  });

  it('payload and reconciliation manifest agree exactly (and payload is valid Dhan JSON)', () => {
    const instruments = toBatchInstruments();
    const payloadJson = buildDhanBatchQuoteRequestBody(instruments);
    const result = validatePayloadMatchesInstruments(payloadJson, instruments);
    assert.equal(result.ok, true, `payload/manifest mismatch: ${result.issues.join('; ')}`);

    // Also compare against committed artifact bytes
    const committed = JSON.stringify(loadGeneratedPayload());
    const built = JSON.stringify(buildDhanBatchQuotePayload(instruments));
    assert.equal(committed, built, 'built payload must match committed w14-scope-b-batch-payload.json');

    // Payload is valid Dhan JSON: numeric IDs, correct segment keys, no credentials
    const parsed = JSON.parse(payloadJson);
    assert.deepEqual(Object.keys(parsed).sort(), ['BSE_EQ', 'NSE_EQ']);
    for (const seg of Object.keys(parsed)) {
      for (const id of parsed[seg]) {
        assert.equal(typeof id, 'number', `ID in ${seg} must be number, got ${typeof id}`);
        assert.ok(Number.isSafeInteger(id) && id > 0);
      }
    }
    assert.ok(!payloadJson.includes('access-token') && !payloadJson.includes('client-id') && !payloadJson.includes('Bearer'));

    // Payload matches the existing DhanApiClient.buildQuoteRequestBody grouping (interchangeable)
    const viaClient = DhanApiClient.buildQuoteRequestBody(
      instruments.map((i) => ({ exchangeSegment: i.exchangeSegment, dhanSecurityId: i.dhanSecurityId }))
    );
    assert.equal(JSON.stringify(JSON.parse(viaClient)), JSON.stringify(JSON.parse(payloadJson)));
  });

  it('validation fails if even one instrument is missing or mis-mapped', () => {
    const instruments = toBatchInstruments();
    const payloadJson = buildDhanBatchQuoteRequestBody(instruments);

    // Missing one instrument: payload from full set should not match truncated instrument list
    const truncated = instruments.slice(0, 95);
    const missingCheck = validatePayloadMatchesInstruments(payloadJson, truncated);
    assert.equal(missingCheck.ok, false);

    // Wrong segment: move one BSE instrument to NSE (BSE/NSE IDs are disjoint, so builder succeeds but payload differs)
    const misSeg = [...instruments];
    const idx = misSeg.findIndex((i) => i.exchangeSegment === 'BSE_EQ');
    misSeg[idx] = { ...misSeg[idx]!, exchangeSegment: 'NSE_EQ' } as DhanBatchQuoteInstrument;
    const swappedPayload = JSON.stringify(buildDhanBatchQuotePayload(misSeg));
    assert.notEqual(swappedPayload, JSON.stringify(loadGeneratedPayload()), 'mis-assigned segment must change payload');
    // Additionally, the swapped instrument set no longer matches the committed payload
    const viaSwapped = buildDhanBatchQuotePayload(misSeg);
    assert.equal(viaSwapped.BSE_EQ?.length, 47);
    assert.equal(viaSwapped.NSE_EQ?.length, 49);
  });

  it('artifact hashes are reproducible (payload SHA256 matches manifest, file bytes stable)', () => {
    const payload = loadGeneratedPayload();
    const manifest = loadReconciliationManifest();
    const minified = JSON.stringify(payload);
    const hash = createHash('sha256').update(minified).digest('hex');
    assert.equal(hash, manifest.payload.payloadSha256);
    assert.equal(minified.length > 0, true);
    // File bytes SHA256 (from generation log) is distinct from minified SHA256 by design (pretty vs minified)
    // so we only assert minified hash here, which is the canonical payload identity.
  });

  it('batch builder rejects duplicates and malformed IDs', () => {
    const instruments = toBatchInstruments();
    const dup = [...instruments, instruments[0]!];
    assert.throws(() => buildDhanBatchQuotePayload(dup), /Duplicate/);

    const badSeg = [{ ...instruments[0]!, exchangeSegment: 'NSE_FO' as unknown as 'NSE_EQ' }];
    // intentionally invalid segment
    assert.throws(() => buildDhanBatchQuotePayload(badSeg as unknown as DhanBatchQuoteInstrument[]), /exchangeSegment/);

    const badId = [{ ...instruments[0]!, dhanSecurityId: '00bad' }];
    assert.throws(() => buildDhanBatchQuotePayload(badId), /dhanSecurityId/);

    assert.throws(() => buildDhanBatchQuotePayload([]), /At least one instrument/);
  });
});
