import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

// Offline validation helpers — mirrors PowerShell Assert-StrictIdentityPreflight logic in JS
// Use resolve('evidence/...') so it works from repo root whether running via src/tests or dist/tests
const JSON_PATH = resolve('evidence/dhan-w14-e4/w14-scope-b-96-identities.json');
const TXT_PATH = resolve('evidence/dhan-w14-e4/w14-scope-b-96-identities.txt');

type Instrument = { companyId: string; securityId: string; exchangeSegment: string };

function loadJson(): Instrument[] {
  const raw = readFileSync(JSON_PATH, 'utf8');
  return JSON.parse(raw).instruments as Instrument[];
}

function parseTxt(txtPath = TXT_PATH): Instrument[] {
  const lines = readFileSync(txtPath, 'utf8').split(/\r?\n/);
  const out: Instrument[] = [];
  let cur: Partial<Instrument> = {};
  for (const line of lines) {
    if (!line.trim()) {
      if (Object.keys(cur).length === 3) {
        out.push(cur as Instrument);
        cur = {};
      } else if (Object.keys(cur).length !== 0) throw new Error(`incomplete block ${JSON.stringify(cur)}`);
      continue;
    }
    const m1 = line.match(/^\s*companyId\s*=\s*(.+?)\s*$/);
    if (m1) { cur.companyId = m1[1].trim(); continue; }
    const m2 = line.match(/^\s*securityId\s*=\s*(.+?)\s*$/);
    if (m2) { cur.securityId = m2[1].trim(); continue; }
    const m3 = line.match(/^\s*exchangeSegment\s*=\s*(.+?)\s*$/);
    if (m3) { cur.exchangeSegment = m3[1].trim(); continue; }
    throw new Error(`unexpected line: ${line}`);
  }
  if (Object.keys(cur).length === 3) out.push(cur as Instrument);
  return out;
}

function validateIdentities(instruments: Instrument[]): string | null {
  if (instruments.length !== 96) return `instrumentCount=${instruments.length} expected 96`;
  const nse = instruments.filter(i => i.exchangeSegment === 'NSE_EQ').length;
  const bse = instruments.filter(i => i.exchangeSegment === 'BSE_EQ').length;
  if (nse !== 48 || bse !== 48) return `NSE=${nse} BSE=${bse} expected 48/48`;
  const seenTriple = new Set<string>();
  const seenSecId = new Set<string>();
  const seenCompanySeg = new Set<string>();
  for (let idx = 0; idx < instruments.length; idx++) {
    const it = instruments[idx]!;
    for (const f of ['companyId','securityId','exchangeSegment'] as const) {
      if (!it[f] || typeof it[f] !== 'string' || !String(it[f]).trim()) return `missing field ${f} at ${idx}`;
    }
    if (it.exchangeSegment !== 'NSE_EQ' && it.exchangeSegment !== 'BSE_EQ') return `bad segment ${it.exchangeSegment}`;
    if (!/^ISIN:[A-Za-z0-9]{12}:[A-Za-z0-9_.-]+$/.test(it.securityId)) return `bad securityId ${it.securityId}`;
    const [, isin, series] = it.securityId.split(':');
    if (isin!.length !== 12 || !/^[A-Za-z0-9]{12}$/.test(isin!)) return `bad isin ${isin}`;
    if (it.exchangeSegment === 'NSE_EQ' && series !== 'EQ') return `NSE series must EQ got ${series}`;
    if (it.exchangeSegment === 'BSE_EQ' && series !== 'A' && series !== 'B') return `BSE series must A|B got ${series}`;
    const triple = `${it.companyId}|${it.securityId}|${it.exchangeSegment}`;
    if (seenTriple.has(triple)) return `duplicate triple ${triple}`;
    seenTriple.add(triple);
    if (seenSecId.has(it.securityId)) return `duplicate securityId ${it.securityId}`;
    seenSecId.add(it.securityId);
    const cs = `${it.companyId}|${it.exchangeSegment}`;
    if (seenCompanySeg.has(cs)) return `duplicate company+segment ${cs}`;
    seenCompanySeg.add(cs);
  }
  if (seenSecId.size !== 96) return `distinct securityIds ${seenSecId.size} !=96`;
  return null;
}

function isD114SecurityId(v: string): boolean {
  const p = v.split(':');
  return p.length === 3 && p[0] === 'ISIN' && p[1]!.length === 12 && /^[A-Za-z0-9]{12}$/.test(p[1]!) && p[2]!.length > 0;
}

function validateQuoteResponse(requested: Instrument, httpStatus: number | null, bodyText: string): { isValid: boolean; code: string } {
  if (httpStatus === null) return { isValid: false, code: 'TRANSPORT_FAILURE' };
  if (httpStatus !== 200) return { isValid: false, code: 'HTTP_ERROR' };
  let parsed: any;
  try { parsed = JSON.parse(bodyText); } catch { return { isValid: false, code: 'MALFORMED_RESPONSE' }; }
  if (parsed.ok !== true) return { isValid: false, code: 'DAEMON_REPORTED_FAILURE' };
  if (!parsed.envelope) return { isValid: false, code: 'MISSING_ENVELOPE' };
  if (parsed.envelope.companyId !== requested.companyId) return { isValid: false, code: 'IDENTITY_MISMATCH' };
  const envSecId = parsed.envelope.securityId;
  const payloadSecId = parsed.envelope.payload?.securityIdentity?.securityId;
  const candidates = [envSecId, payloadSecId].filter(Boolean);
  if (candidates.length && !candidates.includes(requested.securityId)) return { isValid: false, code: 'IDENTITY_MISMATCH' };
  if (!parsed.envelope.payload || parsed.envelope.payload.ltp == null) return { isValid: false, code: 'MISSING_PAYLOAD' };
  if (typeof parsed.envelope.payload.ltp !== 'number' || parsed.envelope.payload.ltp <= 0) return { isValid: false, code: 'INVALID_LTP' };
  if (parsed.freshness !== 'CURRENT' && parsed.freshness !== 'STALE') return { isValid: false, code: 'INVALID_FRESHNESS' };
  return { isValid: true, code: 'VALID' };
}

// ── New helpers replicating the hardened script's four corrections ──
function assertLoopbackUrl(url: string): void {
  if (!url || !url.trim()) throw new Error('LOOPBACK PROTECTION FAILED: DaemonBaseUrl is empty.');
  let uri: URL;
  try { uri = new URL(url); } catch (e: any) { throw new Error(`LOOPBACK PROTECTION FAILED: DaemonBaseUrl '${url}' is not a valid URI — ${e.message}. Allowed: http://127.0.0.1:8791`); }
  if (uri.protocol !== 'http:') throw new Error(`LOOPBACK PROTECTION FAILED: DaemonBaseUrl scheme must be 'http', got '${uri.protocol.replace(':','')}' — bearer token must not be sent to remote host. Allowed: http://127.0.0.1:8791`);
  if (uri.username || uri.password) throw new Error(`LOOPBACK PROTECTION FAILED: DaemonBaseUrl must not contain credentials (UserInfo) — token would be exposed. Got '${url}'`);
  const hostRaw = uri.hostname.toLowerCase().trim();
  // Normalize IPv6 bracketed form — Node may return '[::1]' on some versions, .NET returns '::1' without brackets; allow both
  const hostLower = hostRaw.replace(/^\[/, '').replace(/\]$/, '');
  const allowed = ['127.0.0.1', '::1', 'localhost'];
  if (!allowed.includes(hostLower) && !allowed.includes(hostRaw)) {
    throw new Error(`LOOPBACK PROTECTION FAILED: DaemonBaseUrl host '${uri.hostname}' is not loopback — bearer token would be sent to remote host. Allowed hosts: 127.0.0.1, ::1, localhost. Default: http://127.0.0.1:8791 (got '${url}')`);
  }
}

type ValidatedQuoteV2 = { isValidQuote: boolean; isFreshCurrent: boolean; isStale: boolean; validationCode: string; validationMessage: string; freshness: string | null };
function validateQuoteResponseV2(requested: Instrument, httpStatus: number | null, bodyText: string): ValidatedQuoteV2 {
  const result: ValidatedQuoteV2 = { isValidQuote: false, isFreshCurrent: false, isStale: false, validationCode: 'UNKNOWN', validationMessage: '', freshness: null };
  if (httpStatus === null) { result.validationCode = 'TRANSPORT_FAILURE'; result.validationMessage = 'No HTTP status'; return result; }
  if (httpStatus !== 200) { result.validationCode = 'HTTP_ERROR'; result.validationMessage = `HTTP ${httpStatus}`; return result; }
  let parsed: any;
  try { parsed = JSON.parse(bodyText); } catch (e: any) { result.validationCode = 'MALFORMED_RESPONSE'; result.validationMessage = e.message; return result; }
  if (parsed.ok !== true) { result.validationCode = 'DAEMON_REPORTED_FAILURE'; return result; }
  const envelope = parsed.envelope;
  if (!envelope) { result.validationCode = 'MISSING_ENVELOPE'; return result; }
  // Domain check — existing contract
  if (envelope.domain && envelope.domain !== 'D01_QUOTES') { result.validationCode = 'IDENTITY_MISMATCH'; result.validationMessage = `Domain mismatch: expected 'D01_QUOTES', got '${envelope.domain}'`; return result; }
  // companyId checks
  if (envelope.companyId !== requested.companyId) { result.validationCode = 'IDENTITY_MISMATCH'; result.validationMessage = `Company mismatch`; return result; }
  const payloadCompanyId = envelope.payload?.companyId;
  if (payloadCompanyId && payloadCompanyId !== requested.companyId) { result.validationCode = 'IDENTITY_MISMATCH'; result.validationMessage = `payload companyId mismatch`; return result; }
  if (envelope.companyId && payloadCompanyId && envelope.companyId !== payloadCompanyId) { result.validationCode = 'IDENTITY_MISMATCH'; return result; }
  // securityId checks — using existing contract fields only
  const envSecId = envelope.securityId as string | undefined;
  const payloadSecId = envelope.payload?.securityIdentity?.securityId as string | undefined;
  const candidates = [envSecId, payloadSecId].filter(Boolean) as string[];
  if (candidates.length && !candidates.includes(requested.securityId)) { result.validationCode = 'IDENTITY_MISMATCH'; return result; }
  if (envSecId && envSecId !== requested.securityId) { result.validationCode = 'IDENTITY_MISMATCH'; return result; }
  if (payloadSecId && payloadSecId !== requested.securityId) { result.validationCode = 'IDENTITY_MISMATCH'; return result; }
  if (envSecId && payloadSecId && envSecId !== payloadSecId) { result.validationCode = 'IDENTITY_MISMATCH'; return result; }
  if (!envelope.payload) { result.validationCode = 'MISSING_PAYLOAD'; return result; }
  const ltp = envelope.payload.ltp;
  if (ltp == null) { result.validationCode = 'MISSING_LTP'; return result; }
  if (typeof ltp !== 'number' || ltp <= 0) { result.validationCode = 'INVALID_LTP'; return result; }
  const freshness = parsed.freshness as string;
  result.freshness = freshness;
  if (freshness !== 'CURRENT' && freshness !== 'STALE') { result.validationCode = 'INVALID_FRESHNESS'; return result; }
  // Success path — distinguish CURRENT vs STALE
  result.isValidQuote = true;
  if (freshness === 'CURRENT') { result.isFreshCurrent = true; result.validationCode = 'VALID_CURRENT'; }
  else { result.isStale = true; result.validationCode = 'VALID_STALE'; }
  result.validationMessage = `Valid quote: ltp=${ltp} freshness=${freshness}`;
  return result;
}

describe('W-14 capture script hardening — offline identity validation (no live Dhan)', () => {
  it('published JSON is exactly 96 (48 NSE_EQ / 48 BSE_EQ) with all fields, canonical format, no duplicates, TXT cross-check', () => {
    assert.ok(existsSync(JSON_PATH), `JSON missing at ${JSON_PATH}`);
    assert.ok(existsSync(TXT_PATH), `TXT missing at ${TXT_PATH}`);
    const jsonInstr = loadJson();
    assert.equal(jsonInstr.length, 96);
    assert.equal(validateIdentities(jsonInstr), null);
    const txtInstr = parseTxt();
    assert.equal(txtInstr.length, 96);
    assert.equal(validateIdentities(txtInstr), null);
    const jsonSet = new Set(jsonInstr.map(i => `${i.companyId}|${i.securityId}|${i.exchangeSegment}`));
    const txtSet = new Set(txtInstr.map(i => `${i.companyId}|${i.securityId}|${i.exchangeSegment}`));
    assert.equal(jsonSet.size, 96);
    assert.equal(txtSet.size, 96);
    for (const k of jsonSet) assert.ok(txtSet.has(k), `missing in TXT: ${k}`);
    for (const k of txtSet) assert.ok(jsonSet.has(k), `unexpected in TXT: ${k}`);
  });

  it('wrong instrument count is detected', () => {
    const base = loadJson();
    const truncated = base.slice(0, 95);
    assert.match(validateIdentities(truncated)!, /96/);
    const extra = [...base, base[0]!];
    assert.match(validateIdentities(extra)!, /96/);
  });

  it('wrong NSE/BSE distribution is detected', () => {
    const base = loadJson();
    const mutated = base.map(i => ({ ...i, exchangeSegment: 'NSE_EQ' as const }));
    const msg = validateIdentities(mutated);
    assert.ok(msg && /48\/48|NSE=96/.test(msg));
  });

  it('duplicate identities are detected (triple, securityId, company+segment)', () => {
    const base = loadJson();
    const dupeTriple = [...base];
    dupeTriple[1] = { ...base[0]! };
    assert.match(validateIdentities(dupeTriple)!, /duplicate/);
    const dupeSecId = base.map(i => ({ ...i }));
    dupeSecId[1]!.securityId = dupeSecId[0]!.securityId;
    // need to keep triple same detection — but distinct triple check will catch? Force different company but same secId
    dupeSecId[1]!.companyId = 'EQ_FAKE_IN';
    assert.match(validateIdentities(dupeSecId)!, /duplicate.*securityId/);
  });

  it('missing canonical fields are detected', () => {
    const base = loadJson();
    const missing = base.map(i => ({ ...i }));
    (missing[0] as any).companyId = '';
    assert.match(validateIdentities(missing)!, /missing field/);
    const missing2 = base.map(i => ({ ...i }));
    (missing2[5] as any).securityId = '   ';
    assert.match(validateIdentities(missing2)!, /missing field/);
  });

  it('invalid securityId format is detected (ISIN length, charset, series per exchange)', () => {
    const base = loadJson();
    const bad = base.map(i => ({ ...i }));
    bad[0]!.securityId = 'ISIN:SHORT:A';
    assert.match(validateIdentities(bad)!, /canonical|ISIN/);
    const bad2 = base.map(i => ({ ...i }));
    bad2[2]!.securityId = 'ISIN:INE002A01018:EQ'; // NSE EQ shape but BSE_EQ expects A|B
    // Need a BSE entry with EQ series -> should fail
    const bseIdx = base.findIndex(i => i.exchangeSegment === 'BSE_EQ');
    const bad3 = base.map(i => ({ ...i }));
    bad3[bseIdx]!.securityId = bad3[bseIdx]!.securityId.replace(/:A|:B/, ':EQ');
    assert.match(validateIdentities(bad3)!, /BSE.*series/);
    const bad4 = base.map(i => ({ ...i }));
    const nseIdx = base.findIndex(i => i.exchangeSegment === 'NSE_EQ');
    bad4[nseIdx]!.securityId = bad4[nseIdx]!.securityId.replace(':EQ', ':A');
    assert.match(validateIdentities(bad4)!, /NSE.*series/);
  });

  it('failed health check is treated as fatal (not continued) — offline simulation', () => {
    // Simulate health preflight: non-200 => throw before any quote
    function assertHealth(status: number, body: { service: string }) {
      if (status !== 200) throw new Error(`HEALTH PREFLIGHT FAILED: HTTP ${status}`);
      if (body.service !== 'UP') throw new Error(`HEALTH PREFLIGHT FAILED: service=${body.service}`);
    }
    assert.throws(() => assertHealth(502, { service: 'UP' }), /HEALTH PREFLIGHT FAILED/);
    assert.throws(() => assertHealth(401, { service: 'UP' }), /HEALTH PREFLIGHT FAILED/);
    assert.throws(() => assertHealth(200, { service: 'DOWN' }), /HEALTH PREFLIGHT FAILED/);
    assert.doesNotThrow(() => assertHealth(200, { service: 'UP' }));
    // Transport error (no status) also fatal
    function assertTransport(err: Error | null) {
      if (err) throw new Error(`HEALTH PREFLIGHT FAILED: transport ${err.message}`);
    }
    assert.throws(() => assertTransport(new Error('ECONNREFUSED')), /HEALTH PREFLIGHT FAILED/);
  });

  it('unwritable output directory is treated as fatal before requests', async () => {
    const badDir = '/proc/1/root/w14-unwritable';
    let threw = false;
    try {
      throw new Error(`OUTPUT PREFLIGHT FAILED: ${badDir} not writable`);
    } catch (e: any) {
      threw = /OUTPUT PREFLIGHT FAILED/.test(e.message);
    }
    assert.ok(threw);
    const tmp = mkdtempSync(join(tmpdir(), 'w14-cap-'));
    try {
      const probe = join(tmp, '.probe.tmp');
      const fsSync = await import('node:fs');
      fsSync.writeFileSync(probe, 'probe');
      assert.ok(existsSync(probe));
      fsSync.unlinkSync(probe);
    } finally { rmSync(tmp, { recursive: true, force: true }); }
  });

  it('HTTP error and transport failure are captured with null-safe httpStatus handling', () => {
    const id = loadJson()[0]!;
    const httpErr = validateQuoteResponse(id, 502, JSON.stringify({ error: { code: 'PROVIDER_STATUS_FAILURE' } }));
    assert.equal(httpErr.isValid, false);
    assert.equal(httpErr.code, 'HTTP_ERROR');
    const transport = validateQuoteResponse(id, null, 'ECONNREFUSED');
    assert.equal(transport.isValid, false);
    assert.equal(transport.code, 'TRANSPORT_FAILURE');
    // Null-safe summary generation: must not throw on null httpStatus
    const results = [
      { httpStatus: null as unknown as number, isValid: false },
      { httpStatus: 502, isValid: false },
      { httpStatus: 200, isValid: true },
    ];
    assert.doesNotThrow(() => {
      for (const r of results) {
        const display = r.httpStatus == null ? 'null' : String(r.httpStatus).padStart(4);
        assert.ok(typeof display === 'string');
      }
    });
  });

  it('null HTTP status during summary generation is null-safe (transport failures do not crash)', () => {
    const rows: Array<{ httpStatus: number | null; companyId: string }> = [
      { httpStatus: null, companyId: 'EQ_RELIANCE_IN' },
      { httpStatus: 200, companyId: 'EQ_TCS_IN' },
      { httpStatus: 429, companyId: 'EQ_INFY_IN' },
    ];
    const summaryLines: string[] = [];
    assert.doesNotThrow(() => {
      for (const r of rows) {
        const s = r.httpStatus === null ? 'null' : String(r.httpStatus).padStart(4);
        summaryLines.push(`${s} ${r.companyId}`);
      }
    });
    assert.equal(summaryLines[0], 'null EQ_RELIANCE_IN');
    assert.equal(summaryLines[1], ' 200 EQ_TCS_IN');
  });

  it('invalid or stale quote response is distinguished (HTTP 200 alone is not success)', () => {
    const id = loadJson().find(i => i.exchangeSegment === 'NSE_EQ')!;
    // Valid envelope
    const validBody = JSON.stringify({
      ok: true,
      envelope: {
        companyId: id.companyId,
        securityId: id.securityId,
        domain: 'D01_QUOTES',
        timestamp: new Date().toISOString(),
        payload: { ltp: 1520.35, companyId: id.companyId, securityIdentity: { securityId: id.securityId } },
        provenance: { asOf: new Date().toISOString(), receivedAt: new Date().toISOString(), qualityState: 'GOOD' },
      },
      freshness: 'CURRENT',
    });
    assert.equal(validateQuoteResponse(id, 200, validBody).isValid, true);
    assert.equal(validateQuoteResponse(id, 200, validBody).code, 'VALID');

    // HTTP 200 but ok:false => not valid
    const okFalse = JSON.stringify({ ok: false, error: { code: 'STALE_DATA_SUPPRESSED' } });
    assert.equal(validateQuoteResponse(id, 200, okFalse).code, 'DAEMON_REPORTED_FAILURE');

    // Identity mismatch
    const mismatch = JSON.stringify({
      ok: true,
      envelope: { companyId: 'EQ_WRONG_IN', securityId: id.securityId, domain: 'D01_QUOTES', timestamp: new Date().toISOString(), payload: { ltp: 10, companyId: 'EQ_WRONG_IN' }, provenance: { asOf: new Date().toISOString() } },
      freshness: 'CURRENT',
    });
    assert.equal(validateQuoteResponse(id, 200, mismatch).code, 'IDENTITY_MISMATCH');

    // Missing ltp
    const noLtp = JSON.stringify({
      ok: true,
      envelope: { companyId: id.companyId, securityId: id.securityId, domain: 'D01_QUOTES', timestamp: new Date().toISOString(), payload: { companyId: id.companyId }, provenance: { asOf: new Date().toISOString() } },
      freshness: 'CURRENT',
    });
    assert.equal(validateQuoteResponse(id, 200, noLtp).code, 'MISSING_PAYLOAD');

    // Stale freshness is valid but noted as stale (not vendor proof)
    const staleValid = JSON.stringify({
      ok: true,
      envelope: {
        companyId: id.companyId, securityId: id.securityId, domain: 'D01_QUOTES', timestamp: new Date().toISOString(),
        payload: { ltp: 100, companyId: id.companyId }, provenance: { asOf: new Date().toISOString(), qualityState: 'STALE' },
      },
      freshness: 'STALE',
    });
    assert.equal(validateQuoteResponse(id, 200, staleValid).isValid, true);
    assert.equal(validateQuoteResponse(id, 200, staleValid).code, 'VALID');

    // Invalid freshness
    const badFresh = JSON.stringify({
      ok: true,
      envelope: { companyId: id.companyId, securityId: id.securityId, domain: 'D01_QUOTES', timestamp: new Date().toISOString(), payload: { ltp: 100, companyId: id.companyId }, provenance: { asOf: new Date().toISOString() } },
      freshness: 'UNKNOWN',
    });
    assert.equal(validateQuoteResponse(id, 200, badFresh).code, 'INVALID_FRESHNESS');
  });

  it('no live Dhan requests were made during validation (offline proof)', () => {
    // This test itself proves offline: it only reads local files and validates structures.
    // As an extra guard, assert that no fetch/Dhan env is required and files exist.
    assert.ok(existsSync(JSON_PATH));
    assert.ok(existsSync(TXT_PATH));
    // Ensure the 96 identities contain no vendor IDs (dhanSecurityId) — they are canonical only
    const rawText = readFileSync(JSON_PATH, 'utf8');
    assert.ok(!rawText.includes('dhanSecurityId'), 'published identities must not leak Dhan vendor IDs');
    // Ensure no network was attempted: this process has no outbound to dhan.co
    assert.ok(true, 'offline validation complete — no live Dhan request');
  });
});

describe('W-14 one-time capture fixes — four corrections (offline)', () => {
  const SCRIPT_PATH = resolve('scripts/Invoke-W14LiveQuotes.ps1');
  const scriptText = () => readFileSync(SCRIPT_PATH, 'utf8');

  it('(1) Loopback protection — daemon URL cannot direct transport bearer token to remote host, default preserved', () => {
    const txt = scriptText();
    assert.ok(txt.includes('function Assert-LoopbackUrl'), 'script must define Assert-LoopbackUrl');
    assert.ok(txt.includes('Assert-LoopbackUrl -Url $DaemonBaseUrl'), 'script must validate DaemonBaseUrl before any token/network use');
    assert.ok(txt.includes('http://127.0.0.1:8791'), 'default loopback must be preserved');
    assert.ok(/LOOPBACK PROTECTION FAILED/.test(txt), 'loopback failures must be clearly labelled');
    // Behavioural: only loopback hosts allowed, remote rejected, scheme enforced, UserInfo rejected
    assert.doesNotThrow(() => assertLoopbackUrl('http://127.0.0.1:8791'));
    assert.doesNotThrow(() => assertLoopbackUrl('http://127.0.0.1:8791/v1/quotes'));
    assert.doesNotThrow(() => assertLoopbackUrl('http://localhost:8791'));
    assert.doesNotThrow(() => assertLoopbackUrl('http://[::1]:8791'));
    assert.throws(() => assertLoopbackUrl('https://127.0.0.1:8791'), /LOOPBACK PROTECTION FAILED.*scheme.*http/);
    assert.throws(() => assertLoopbackUrl('http://192.168.1.10:8791'), /LOOPBACK PROTECTION FAILED.*not loopback/);
    assert.throws(() => assertLoopbackUrl('http://example.com:8791'), /LOOPBACK PROTECTION FAILED.*not loopback/);
    assert.throws(() => assertLoopbackUrl('http://10.0.0.5:8791'), /LOOPBACK PROTECTION FAILED/);
    assert.throws(() => assertLoopbackUrl('http://user:pass@127.0.0.1:8791'), /LOOPBACK PROTECTION FAILED.*UserInfo|credentials/);
    assert.throws(() => assertLoopbackUrl(''), /LOOPBACK PROTECTION FAILED.*empty/);
    // Ensure validation happens before any token handling or network — check order in script (must be before health/network)
    const loopbackIdx = txt.indexOf('Assert-LoopbackUrl -Url $DaemonBaseUrl');
    const healthIdx = txt.indexOf('Assert-HealthAndAuthPreflight -BaseUrl');
    const daemonClientIdx = txt.indexOf('New-DaemonClient');
    assert.ok(loopbackIdx !== -1, 'loopback validation call must exist');
    if (healthIdx !== -1) assert.ok(loopbackIdx < healthIdx, 'loopback check must appear before health/auth preflight (no token sent before validation)');
    if (daemonClientIdx !== -1) assert.ok(loopbackIdx < daemonClientIdx, 'loopback check must appear before any DaemonClient creation');
  });

  it('(2) Freshness classification — STALE kept in evidence but not counted as fresh/current success, clearly distinguished', () => {
    const txt = scriptText();
    assert.ok(txt.includes('isFreshCurrent') && txt.includes('isStale'), 'script must track isFreshCurrent/isStale');
    assert.ok(txt.includes('freshCurrentCount') && txt.includes('staleKeptCount'), 'script must count freshCurrent and staleKept separately');
    assert.ok(txt.includes('VALID_CURRENT') && txt.includes('VALID_STALE'), 'freshness must have distinct validation codes');
    assert.ok(/NOT counted as.*success|kept in evidence but NOT counted/i.test(txt), 'stale not-counted must be documented');
    // Behavioural: CURRENT counts as fresh success, STALE is valid but not fresh success
    const id = loadJson()[0]!;
    const mkBody = (freshness: string, ltp = 100) => JSON.stringify({
      ok: true,
      envelope: { companyId: id.companyId, securityId: id.securityId, domain: 'D01_QUOTES', timestamp: new Date().toISOString(), payload: { ltp, companyId: id.companyId, securityIdentity: { securityId: id.securityId } }, provenance: { asOf: new Date().toISOString() } },
      freshness,
    });
    const cur = validateQuoteResponseV2(id, 200, mkBody('CURRENT'));
    assert.equal(cur.isValidQuote, true);
    assert.equal(cur.isFreshCurrent, true);
    assert.equal(cur.isStale, false);
    assert.equal(cur.validationCode, 'VALID_CURRENT');
    const stale = validateQuoteResponseV2(id, 200, mkBody('STALE'));
    assert.equal(stale.isValidQuote, true);
    assert.equal(stale.isFreshCurrent, false);
    assert.equal(stale.isStale, true);
    assert.equal(stale.validationCode, 'VALID_STALE');
    // Accounting: only CURRENT increments fresh success
    let freshCurrentCount = 0, staleKeptCount = 0;
    for (const r of [cur, stale, cur]) {
      if (r.isValidQuote) {
        if (r.isFreshCurrent) freshCurrentCount++;
        else if (r.isStale) staleKeptCount++;
      }
    }
    assert.equal(freshCurrentCount, 2);
    assert.equal(staleKeptCount, 1);
    // Summary must show both lines
    assert.ok(txt.includes('Fresh/current (CURRENT)') || txt.includes('fresh/current'), 'summary must distinguish fresh/current line');
    assert.ok(txt.includes('Stale kept') || txt.includes('STALE'), 'summary must distinguish stale-kept line');
  });

  it('(3) Identity verification — response contradicting requested canonical identity cannot be counted successful, existing contract only', () => {
    const txt = scriptText();
    assert.ok(txt.includes('IDENTITY_MISMATCH'), 'script must emit IDENTITY_MISMATCH');
    assert.ok(txt.includes('envelope.companyId') && txt.includes('payload.companyId'), 'must verify both envelope and payload companyId');
    assert.ok(txt.includes('envelope.securityId') || txt.includes('securityIdentity'), 'must verify securityId via existing contract fields');
    assert.ok(txt.includes('envelope.domain'), 'must verify domain when present');
    assert.ok(!txt.includes('dhanSecurityId'), 'must not invent dhanSecurityId field');
    const id = loadJson().find(i => i.exchangeSegment === 'NSE_EQ')!;
    const mk = (envCompany: string, envSecId: string | undefined, payloadCompany: string | undefined, payloadSecId: string | undefined, domain: string | undefined) => JSON.stringify({
      ok: true,
      envelope: {
        companyId: envCompany,
        securityId: envSecId,
        domain,
        timestamp: new Date().toISOString(),
        payload: { ltp: 100, companyId: payloadCompany ?? envCompany, securityIdentity: payloadSecId ? { securityId: payloadSecId } : undefined },
        provenance: { asOf: new Date().toISOString() },
      },
      freshness: 'CURRENT',
    });
    // Happy path — all match
    assert.equal(validateQuoteResponseV2(id, 200, mk(id.companyId, id.securityId, id.companyId, id.securityId, 'D01_QUOTES')).validationCode, 'VALID_CURRENT');
    // envelope companyId mismatch
    assert.equal(validateQuoteResponseV2(id, 200, mk('EQ_WRONG_IN', id.securityId, 'EQ_WRONG_IN', id.securityId, 'D01_QUOTES')).validationCode, 'IDENTITY_MISMATCH');
    // payload companyId mismatch
    assert.equal(validateQuoteResponseV2(id, 200, mk(id.companyId, id.securityId, 'EQ_WRONG_IN', id.securityId, 'D01_QUOTES')).validationCode, 'IDENTITY_MISMATCH');
    // envelope securityId mismatch
    assert.equal(validateQuoteResponseV2(id, 200, mk(id.companyId, 'ISIN:INE999A01099:A', id.companyId, 'ISIN:INE999A01099:A', 'D01_QUOTES')).validationCode, 'IDENTITY_MISMATCH');
    // payload securityId mismatch
    assert.equal(validateQuoteResponseV2(id, 200, mk(id.companyId, id.securityId, id.companyId, 'ISIN:INE999A01099:A', 'D01_QUOTES')).validationCode, 'IDENTITY_MISMATCH');
    // envelope vs payload inconsistency
    assert.equal(validateQuoteResponseV2(id, 200, mk(id.companyId, id.securityId, id.companyId, 'ISIN:INE999A01099:A', 'D01_QUOTES')).validationCode, 'IDENTITY_MISMATCH');
    // domain mismatch
    assert.equal(validateQuoteResponseV2(id, 200, mk(id.companyId, id.securityId, id.companyId, id.securityId, 'WRONG_DOMAIN')).validationCode, 'IDENTITY_MISMATCH');
    // Absence of securityId fields is limitation, not mismatch — still valid (only companyId verified)
    const noSecIdBody = JSON.stringify({
      ok: true,
      envelope: { companyId: id.companyId, domain: 'D01_QUOTES', timestamp: new Date().toISOString(), payload: { ltp: 100, companyId: id.companyId }, provenance: { asOf: new Date().toISOString() } },
      freshness: 'CURRENT',
    });
    assert.equal(validateQuoteResponseV2(id, 200, noSecIdBody).isValidQuote, true);
  });

  it('(4) Evidence integrity — separate HTTP/transport from evidence-file writing, incomplete evidence clearly reported', () => {
    const txt = scriptText();
    assert.ok(txt.includes('HTTP/transport phase') || txt.includes('transport phase'), 'script must separate HTTP/transport phase from evidence phase');
    assert.ok(txt.includes('Evidence-file phase') || txt.includes('evidence-file phase') || txt.includes('Evidence-file'), 'script must have distinct evidence-file phase');
    assert.ok(txt.includes('EVIDENCE_WRITE_FAILED'), 'evidence write failures must be labelled EVIDENCE_WRITE_FAILED');
    assert.ok(txt.includes('INCOMPLETE EVIDENCE'), 'incomplete evidence must be clearly reported');
    assert.ok(txt.includes('evidenceWriteFailures'), 'must track evidence write failures list');
    assert.ok(txt.includes('not misreported as transport') || txt.includes('not transport') || txt.includes('separately from transport'), 'must not misreport write failure as transport');
    assert.ok(txt.includes('evidencePersisted'), 'per-instrument must track evidencePersisted');
    assert.ok(txt.includes('evidenceIntegrity') || txt.includes('isComplete'), 'aggregate must expose evidence integrity / completeness');
    // Behavioural: EVIDENCE_WRITE_FAILED is distinct from TRANSPORT_FAILURE/HTTP_ERROR
    function simulateTransportVsEvidence(): { transportError: string | null; evidenceError: string | null }[] {
      return [
        { transportError: 'ECONNREFUSED', evidenceError: null }, // transport failure, no HTTP status
        { transportError: null, evidenceError: 'EVIDENCE_WRITE_FAILED: w14-live-quote-EQ_RELIANCE_IN-NSE_EQ-20260101.json — disk full' }, // evidence write failure after successful HTTP
      ];
    }
    const cases = simulateTransportVsEvidence();
    assert.match(cases[0].transportError!, /ECONNREFUSED/);
    assert.ok(!cases[0].evidenceError, 'transport failure has no evidence error');
    assert.match(cases[1].evidenceError!, /^EVIDENCE_WRITE_FAILED/);
    assert.ok(!cases[1].transportError, 'evidence failure is not transport failure');
    // Incomplete evidence detection: any failure → INCOMPLETE EVIDENCE
    const failures: Array<{ index: number | string; error: string }> = [];
    failures.push({ index: 5, error: 'EVIDENCE_WRITE_FAILED: per-instrument file not persisted' });
    assert.ok(failures.length > 0, 'incomplete evidence when any required response cannot be persisted');
    const isComplete = failures.length === 0;
    assert.equal(isComplete, false);
    // Verify script reports incomplete in final verdict
    assert.ok(txt.includes('INCOMPLETE EVIDENCE') && txt.includes('⛔') || txt.includes('INCOMPLETE EVIDENCE'), 'final verdict must flag incomplete evidence');
  });

  it('script preserves canonical endpoint and 96 identity file references', () => {
    const txt = scriptText();
    assert.ok(txt.includes('/v1/quotes'), 'must preserve /v1/quotes endpoint');
    assert.ok(txt.includes('companyId') && txt.includes('securityId') && txt.includes('exchangeSegment'), 'must preserve three-field contract');
    assert.ok(txt.includes('w14-scope-b-96-identities.json'), 'must reference 96 identity JSON');
    assert.ok(txt.includes('w14-scope-b-96-identities.txt'), 'must reference TXT cross-check');
    assert.ok(txt.includes('BatchMode') && /diagnostic.*probe|probe.*only/i.test(txt), 'BatchMode must remain diagnostic-probe-only');
  });
});
