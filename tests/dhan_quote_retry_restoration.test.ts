import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { DhanBoundedCache, DhanConcurrencyLimiter, DhanRateLimiter, DhanRefreshOrchestrator, DhanRequestCoalescer } from '../src/providers/dhan/dhan_operational_controls.js';
import { dhanFailure, dhanOk } from '../src/providers/dhan/dhan_failures.js';
import type { CanonicalEnvelope } from '../src/contracts/envelope.js';
import type { MarketQuotePayload } from '../src/contracts/d01_quotes.js';

const scope = { companyId: 'SYNTHETIC', exchangeSegment: 'NSE_EQ' as const, isin: 'INE000SYNTH1', series: 'EQ' };
const envelope = { provenance: { asOf: new Date().toISOString(), lineageHash: 'lineage-original' }, payload: { ltp: 100 } } as CanonicalEnvelope<MarketQuotePayload>;
function rig(fn: () => Promise<ReturnType<typeof dhanOk<CanonicalEnvelope<MarketQuotePayload>>> | ReturnType<typeof dhanFailure>>, maxAttempts = 3) {
 const cache = new DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>(4);
 const r = new DhanRefreshOrchestrator({ cache, limiter: new DhanRateLimiter({ maxRequests: 100, windowMs: 60000 }), concurrency: new DhanConcurrencyLimiter(4), coalescer: new DhanRequestCoalescer(), fetchQuote: fn, retry: { maxAttempts, baseDelayMs: 1, rng: () => 0 } });
 return { r, cache };
}
describe('quote retry restoration (offline)', () => {
 it('first success and duplicate simultaneous refresh share one attempt', async () => {
  let calls = 0; const {r} = rig(async () => { calls++; await new Promise(resolve => setTimeout(resolve, 20)); return dhanOk(envelope); });
  const [a,b] = await Promise.all([r.refresh([scope]), r.refresh([scope])]);
  assert.equal(a[0]!.status, 'SUCCESS'); assert.equal(b[0]!.status, 'SUCCESS'); assert.equal(calls, 1);
  assert.deepEqual(r.getAttemptDiagnostics().map(e => [e.attempt,e.outcome,e.final]), [[1,'SUCCESS',true]]);
 });
 it('transient 503 and timeout recover with pacing and preserved lineage', async () => {
  for (const code of ['HTTP_ERROR', 'TIMEOUT', 'TRANSPORT_FAILURE'] as const) {
   const times: number[] = []; const {r,cache} = rig(async () => { times.push(Date.now()); return times.length === 1 ? dhanFailure(code, 'redacted', { httpStatus: code === 'HTTP_ERROR' ? 503 : undefined }) : dhanOk(envelope); });
   assert.equal((await r.refresh([scope]))[0]!.status,'SUCCESS'); assert.equal(times.length,2); assert.ok(times[1]! - times[0]! >= 1000);
   assert.equal(cache.size,1); assert.equal(cache.get('SYNTHETIC|NSE_EQ|INE000SYNTH1|EQ',new Date().toISOString()).entry?.provenance.lineageHash,'lineage-original');
   const d = r.getAttemptDiagnostics(); assert.equal(d[0]!.code,code); assert.equal(d[0]!.final,false); assert.equal(d[1]!.outcome,'SUCCESS'); assert.equal(d[1]!.final,true); assert.ok(!JSON.stringify(d).includes('redacted'));
  }
 });
 it('different concurrent instruments share the one-second pacing gate', async () => {
  const times: number[] = []; const {r} = rig(async () => { times.push(Date.now()); return dhanOk(envelope); });
  const other = { ...scope, companyId: 'OTHER' };
  const results = await r.refresh([scope, other]);
  assert.equal(results.filter(x => x.status === 'SUCCESS').length, 2);
  assert.ok(times[1]! - times[0]! >= 1000);
 });
 it('429 honors Retry-After and records delay', async () => {
  const times: number[] = []; const {r} = rig(async () => { times.push(Date.now()); return times.length === 1 ? {ok:false as const, failure:{code:'RATE_LIMITED' as const,message:'private',httpStatus:429,retryAfterMs:1200}} : dhanOk(envelope); });
  assert.equal((await r.refresh([scope]))[0]!.status,'SUCCESS'); assert.ok(times[1]! - times[0]! >= 1200); assert.equal(r.getAttemptDiagnostics()[0]!.retryDelayMs,1200);
 });
 it('exhausts bounded retries; permanent failures stop immediately', async () => {
  let count=0; const exhausted=rig(async () => { count++; return dhanFailure('HTTP_ERROR','private',{httpStatus:500}); },2);
  const result=await exhausted.r.refresh([scope]); assert.equal(result[0]!.status,'FAILURE'); if (result[0]!.status === 'FAILURE') assert.match(result[0]!.message!, /exhausted after 2 attempts/); assert.equal(count,2); assert.equal(exhausted.r.getAttemptDiagnostics().at(-1)!.final,true);
  for (const code of ['AUTHENTICATION_FAILURE','MALFORMED_RESPONSE','INSTRUMENT_NOT_IN_RESPONSE'] as const) { let n=0; const x=rig(async () => { n++; return dhanFailure(code,'private'); }); assert.equal((await x.r.refresh([scope]))[0]!.status,'FAILURE'); assert.equal(n,1); }
 });
});
