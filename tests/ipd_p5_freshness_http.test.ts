import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { CanonicalEnvelope } from '../src/contracts/envelope.js';
import type { MarketQuotePayload } from '../src/contracts/d01_quotes.js';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import { DhanInstrumentRegistry } from '../src/providers/dhan/dhan_instrument_map.js';
import { DhanApiClient } from '../src/providers/dhan/dhan_api_client.js';
import { DhanBoundedCache, dhanQuoteCacheKey } from '../src/providers/dhan/dhan_operational_controls.js';
import { freshnessStatus } from '../src/providers/dhan/dhan_freshness_status.js';
import { DhanMarketDataService } from '../src/providers/dhan/dhan_market_data_service.js';
import { createMarketDataHttpServer } from '../src/providers/dhan/dhan_market_data_http.js';

const time = Date.parse('2026-09-25T10:00:00Z');
const iso = (ms: number) => new Date(ms).toISOString();
const unknown = { outcome: 'UNKNOWN' as const, lastFailure: null };
const id = buildD114SecurityIdentity('INE000SYNTH1', 'EQ')!;
const scope = { companyId: 'COMP-A', exchangeSegment: 'NSE_EQ' as const, isin:id.isin, series:id.series };
const request = { companyId: scope.companyId, exchangeSegment: scope.exchangeSegment, securityIdentity: id };
const key = dhanQuoteCacheKey(scope);
function envelope(asOf: unknown, receivedAt: unknown = iso(time)) {
  return { provenance: { asOf, receivedAt, evaluatedAt: iso(time) } } as CanonicalEnvelope<MarketQuotePayload>;
}
function rig(cache = new DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>(2)) {
  let now = time; let calls = 0; let fail = false;
  const registry = new DhanInstrumentRegistry();
  registry.register({ companyId:'COMP-A', isin:id.isin, securityId:id.securityId, exchange:'NSE', exchangeSegment:'NSE_EQ', symbol:'SYN', dhanSecurityId:'PRIVATE', mappingProvenance:'SYNTHETIC_PRE_ACCESS_FIXTURE', active:true });
  const client = new DhanApiClient({ config:{baseUrl:'https://synthetic.invalid', timeoutMs:1000, readiness:'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'} as never,
    credentialResolver:{resolve:async () => ({accessToken:'SECRET', clientId:'CLIENT'})} as never,
    transport:{ async send() { calls++; return fail ? {status:400, bodyText:'SECRET PROVIDER DETAIL'} : { status:200, bodyText:JSON.stringify({status:'success',data:{NSE_EQ:{PRIVATE:{last_price:100, ohlc:{open:99,close:99,high:101,low:98}, volume:100, net_change:1, last_trade_time:'25/09/2026 15:29:58'}}}}) }; } } });
  const service = new DhanMarketDataService({ client, securityMaster:new SecurityMaster(), instrumentRegistry:registry, cache, now:() => new Date(now) });
  service.start();
  return {service, cache, advance:(ms:number) => {now += ms;}, fail:() => {fail=true;}, calls:() => calls};
}

test('D01 and D02 evaluator boundaries and missing/invalid evidence', () => {
 for (const [domain, threshold] of [['D01_QUOTES',900], ['D02_OHLCV',86400]] as const) {
  for (const [age, verdict, suppressed, concession] of [[threshold, 'GOOD', false, false], [threshold+1, 'STALE', false, true], [2*threshold, 'STALE', false, true], [2*threshold+1, 'UNAVAILABLE', true, false]] as const) {
   const status = freshnessStatus(domain, { state:'STALE', entry:envelope(iso(time-age*1000)) }, iso(time), unknown);
   assert.equal(status.verdict, verdict); assert.equal(status.thresholdSeconds, threshold);
   assert.equal(status.suppressExecution, suppressed); assert.equal(status.eligibleForUse, !suppressed); assert.equal(status.staleConcessionActive, concession);
  }
  for (const [value, evidence] of [[undefined, 'MISSING'], ['', 'MISSING'], ['invalid-secret', 'INVALID']] as const) {
   const status = freshnessStatus(domain, {state:'UNAVAILABLE', entry:envelope(value, 'bad')}, iso(time), unknown);
   assert.equal(status.timestampEvidence, evidence); assert.equal(status.asOf, null); assert.equal(status.receivedAt, null);
   assert.equal(status.verdict, 'UNAVAILABLE'); assert.equal(status.ageSeconds, null); assert.equal(status.suppressExecution, true);
  }
 }
});

test('actual quote refresh outcomes, failure preservation and non-mutating inspection', async () => {
 const r = rig();
 const view = () => r.service.getFreshness({domain:'D01_QUOTES', ...request});
 assert.equal(view().cacheState, 'MISS'); assert.equal(view().verdict, 'UNKNOWN'); assert.equal(view().suppressExecution, true);
 assert.equal(view().lastRefresh.outcome, 'UNKNOWN');
 assert.equal((await r.service.getQuote(request)).ok, true); assert.equal(view().lastRefresh.outcome, 'SUCCESS'); assert.equal(view().cacheState, 'CURRENT');
 assert.equal((await r.service.getQuote(request)).ok, true); assert.equal(view().lastRefresh.outcome, 'SKIPPED_FRESH'); assert.equal(r.calls(),1);
 const before = view().asOf; r.advance(16*60*1000); r.fail();
 assert.equal((await r.service.getQuote(request)).ok, false);
 const stale = view(); assert.equal(stale.lastRefresh.outcome, 'FAILURE'); assert.deepEqual(stale.lastRefresh.lastFailure, {code:'REFRESH_FAILED', priorPreserved:true});
 assert.equal(stale.cacheState, 'STALE'); assert.equal(stale.asOf, before); assert.equal(stale.verdict, 'STALE');
 assert.ok(!JSON.stringify(stale).includes('SECRET'));
 r.advance(15*60*1000); assert.equal(view().cacheState, 'UNAVAILABLE'); assert.equal(view().suppressExecution, true);
 // peek must not make A MRU: B was added after A; adding C must evict A.
 r.cache.set('B', envelope(iso(time))); view(); r.cache.set('C', envelope(iso(time)));
 assert.equal(view().cacheState, 'MISS'); assert.equal(view().lastRefresh.outcome, 'FAILURE');
 assert.equal(r.calls(), 2);
 const historical = r.service.getFreshness({domain:'D02_OHLCV'});
 assert.equal(historical.cacheState, 'NOT_AVAILABLE'); assert.equal(historical.verdict, 'UNKNOWN'); assert.equal(historical.thresholdSeconds,86400);
});

test('authenticated GET validation, read-only, safe internal error', async () => {
 const r = rig(); const server = createMarketDataHttpServer({service:r.service, token:'token', env:{}});
 await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
 const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1/freshness`;
 const auth = {authorization:'Bearer token'};
 const q = `?domain=D01_QUOTES&companyId=COMP-A&exchangeSegment=NSE_EQ&securityId=${encodeURIComponent(id.securityId)}`;
 try {
  assert.equal((await fetch(base+q)).status,401);
  for (const suffix of ['', '?domain=D01_QUOTES', '?domain=D02_OHLCV&companyId=X', '?domain=D02_OHLCV&domain=D02_OHLCV', '?domain=D02_OHLCV&extra=x', q.replace('NSE_EQ','BAD'), q.replace(encodeURIComponent(id.securityId),'bad')]) assert.equal((await fetch(base+suffix,{headers:auth})).status,400);
  const result = await (await fetch(base+q,{headers:auth})).json() as {cacheState:string,lastRefresh:{outcome:string}};
  assert.equal(result.cacheState,'MISS'); assert.equal(result.lastRefresh.outcome,'UNKNOWN');
  assert.equal((await fetch(base+'?domain=D02_OHLCV',{headers:auth})).status,200);
  assert.equal((await fetch(base+q,{method:'POST',headers:auth})).status,404);
  assert.equal(r.calls(),0); assert.equal(r.cache.size,0);
  r.cache.set(key, envelope(iso(time - 16*60*1000)));
  r.cache.set('B', envelope(iso(time)));
  const populated = await (await fetch(base+q,{headers:auth})).json() as {cacheState:string,verdict:string,lastRefresh:{outcome:string}};
  assert.equal(populated.cacheState,'STALE'); assert.equal(populated.verdict,'STALE'); assert.equal(populated.lastRefresh.outcome,'UNKNOWN');
  r.cache.set('C', envelope(iso(time)));
  assert.equal(r.cache.peek(key, iso(time)).state, 'MISS'); // HTTP GET did not touch LRU
  r.cache.set(key, envelope('invalid'));
  const invalid = await (await fetch(base+q,{headers:auth})).json() as {cacheState:string,timestampEvidence:string,suppressExecution:boolean};
  assert.equal(invalid.cacheState,'UNAVAILABLE'); assert.equal(invalid.timestampEvidence,'INVALID'); assert.equal(invalid.suppressExecution,true);
  assert.equal(r.calls(),0);
  const original = r.service.getFreshness; r.service.getFreshness = () => { throw new Error('SECRET'); };
  const error = await fetch(base+q,{headers:auth}); assert.equal(error.status,500); assert.ok(!(await error.text()).includes('SECRET'));
  r.service.getFreshness = original;
 } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
