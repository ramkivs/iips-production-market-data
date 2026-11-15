import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { computeLineageHash } from '../src/contracts/provenance.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import { DhanInstrumentRegistry } from '../src/providers/dhan/dhan_instrument_map.js';
import { DhanApiClient, type DhanHttpRequest, type DhanHttpResponse } from '../src/providers/dhan/dhan_api_client.js';
import { DhanMarketDataService, type QuoteRequest } from '../src/providers/dhan/dhan_market_data_service.js';
import { createMarketDataHttpServer, MarketDataTransportClient } from '../src/providers/dhan/dhan_market_data_http.js';
import { DhanServerHttpsTransport } from '../src/providers/dhan/dhan_server_egress.js';

const quote = { last_price: 100, ohlc: { open: 100, high: 100, low: 100, close: 100 }, volume: 10, net_change: 0, last_trade_time: '25/09/2026 15:29:58' };
function rig(n: number, send: (req: DhanHttpRequest) => Promise<DhanHttpResponse>, baseDelayMs = 2) {
 const registry = new DhanInstrumentRegistry(); const requests: QuoteRequest[] = [];
 for (let i = 1; i <= n; i++) {
  const isin = `INE${String(i).padStart(9, '0')}`; const companyId = `COMP${i}`; const segment = i % 2 ? 'NSE_EQ' : 'BSE_EQ';
  const identity = buildD114SecurityIdentity(isin, 'EQ')!;
  registry.register({ companyId, isin, securityId: identity.securityId, exchange: segment === 'NSE_EQ' ? 'NSE' : 'BSE', symbol: `SYN${i}`, exchangeSegment: segment, dhanSecurityId: String(100000 + i), mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE', instrumentType: 'EQUITY', active: true });
  requests.push({ companyId, securityIdentity: identity, exchangeSegment: segment });
 }
 const client = new DhanApiClient({config: {baseUrl:'https://synthetic.invalid/v2',timeoutMs:5000,readiness:'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'} as never, credentialResolver:{resolve:async()=>({accessToken:'fake',clientId:'fake'})}, transport:{send}});
 const service = new DhanMarketDataService({client,securityMaster:new SecurityMaster(),instrumentRegistry:registry, retry:{baseDelayMs,rng:()=>0}, now:()=>new Date('2026-09-25T10:00:00.000Z')}); service.start();
 return {service,requests};
}
function success(req: DhanHttpRequest): DhanHttpResponse {
 const grouped = JSON.parse(req.body!) as Record<string, number[]>; const data: Record<string,Record<string,typeof quote>> = {};
 for (const [segment, ids] of Object.entries(grouped)) { data[segment] = {}; for (const id of ids) data[segment]![id] = quote; }
 return {status:200,bodyText:JSON.stringify({status:'success',data})};
}
const delay = (ms:number) => new Promise(r => setTimeout(r,ms));

describe('Dhan portfolio batching and cancellation (offline)', () => {
 it('maps both exchanges and isolates missing, malformed and invalid instruments', async () => {
  const bodies:string[]=[]; const {service,requests}=rig(4,async req=>{ bodies.push(req.body!); const response=success(req); const obj=JSON.parse(response.bodyText); delete obj.data.NSE_EQ['100003']; obj.data.BSE_EQ['100004'].volume = 'bad'; return { ...response, bodyText: JSON.stringify(obj) }; });
  const out=await service.getPortfolioQuotes([...requests,{...requests[0]!,companyId:'unknown'}]);
  assert.equal(bodies.length,1); assert.deepEqual(JSON.parse(bodies[0]!),{NSE_EQ:[100001,100003],BSE_EQ:[100002,100004]});
  assert.equal(out.results[0]!.ok,true); assert.equal(out.results[1]!.ok,true);
  for (let i=0;i<2;i++) { const r=out.results[i]!; if (r.ok) { assert.equal(r.envelope.securityId,requests[i]!.securityIdentity.securityId); assert.equal(r.envelope.domain,'D01_QUOTES'); assert.equal(r.envelope.provenance.lineageHash, computeLineageHash(r.envelope.payload, { sourceClassification: r.envelope.provenance.sourceClassification, asOf: r.envelope.provenance.asOf, dataVersion: r.envelope.provenance.dataVersion })); } }
  for (const [i,code] of [[2,'INSTRUMENT_NOT_IN_RESPONSE'],[3,'MALFORMED_RESPONSE'],[4,'UNRESOLVED_INSTRUMENT']] as const) { const r=out.results[i]!; assert.equal(r.ok,false); if (!r.ok) assert.equal(r.failure.code,code); }
  assert.ok(!JSON.stringify(out).includes('100001'));
 });
 it('splits at 1000 and spaces batches; coalesces simultaneous identical portfolios', async () => {
  const times:number[]=[]; const sizes:number[]=[]; const {service,requests}=rig(1001,async req=>{ times.push(Date.now()); const x=JSON.parse(req.body!); sizes.push(Object.values(x).reduce((sum:number,a:unknown)=>sum+(a as number[]).length,0)); await delay(20); return success(req); });
  const [a,b]=await Promise.all([service.getPortfolioQuotes(requests),service.getPortfolioQuotes(requests)]);
  assert.equal(a.results.length,1001); assert.ok(a.results.every(x=>x.ok)); assert.ok(b.results.every(x=>x.ok));
  assert.deepEqual(sizes,[1000,1]); assert.ok(times[1]!-times[0]!>=1000);
 });
 it('active batch retries, and the pacing gate applies between attempts', async () => {
  const times:number[]=[]; const {service,requests}=rig(2,async req=>{times.push(Date.now()); return times.length===1 ? {status:503,bodyText:'{}'} : success(req);});
  const out=await service.getPortfolioQuotes(requests); assert.ok(out.results.every(x=>x.ok)); assert.equal(times.length,2); assert.ok(times[1]!-times[0]!>=1000);
 });
 it('429 Retry-After and next batch both use the shared gate', async () => {
  const times:number[]=[]; const {service,requests}=rig(1001,async req=>{ times.push(Date.now()); return times.length===1 ? {status:429,bodyText:'{}',retryAfter:'1'} : success(req); });
  const out=await service.getPortfolioQuotes(requests); assert.ok(out.results.every(r=>r.ok)); assert.equal(times.length,3);
  assert.ok(times[1]!-times[0]!>=1000); assert.ok(times[2]!-times[1]!>=1000);
 });
 it('cancels during backoff without another provider attempt', async () => {
  let calls=0; const {service,requests}=rig(1,async()=>{calls++; return {status:503,bodyText:'{}'};},500);
  const c=new AbortController(); const promise=service.getPortfolioQuotes(requests,c.signal); await delay(30); c.abort();
  const out=await promise; assert.equal(out.results[0]!.ok,false); await delay(1100); assert.equal(calls,1); assert.equal(service.getQuoteAttemptDiagnostics().at(-1)?.outcome,'CANCELLED');
 });
 it('one cancelled coalesced caller does not cancel another active caller', async () => {
  let calls=0; const {service,requests}=rig(1,async req=>{ calls++; await delay(80); return success(req); });
  const c=new AbortController(); const a=service.getQuote(requests[0]!,c.signal); const b=service.getQuote(requests[0]!); await delay(20); c.abort();
  assert.equal((await a).ok,false); assert.equal((await b).ok,true); assert.equal(calls,1);
 });
 it('authenticated HTTP batch route returns independent canonical results', async () => {
  let calls=0; const {service,requests}=rig(2,async req=>{calls++; return success(req);});
  const server=createMarketDataHttpServer({service,token:'synthetic-transport',env:{},requestTimeoutMs:2000}); await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
  try {
    const url=`http://127.0.0.1:${(server.address() as AddressInfo).port}/v1/quotes/batch`;
    const instruments=requests.map(r=>({companyId:r.companyId,securityId:r.securityIdentity.securityId,exchangeSegment:r.exchangeSegment}));
    const response=await fetch(url,{method:'POST',headers:{authorization:'Bearer synthetic-transport','content-type':'application/json'},body:JSON.stringify({instruments})});
    const body=await response.json() as {results: Array<{ok:boolean}>}; assert.equal(response.status,200); assert.equal(calls,1); assert.ok(body.results.every(r=>r.ok));
    const client=new MarketDataTransportClient(`http://127.0.0.1:${(server.address() as AddressInfo).port}`,'synthetic-transport',{env:{},timeoutMs:3000});
    const clientResult=await client.getPortfolioQuotes([...requests,{...requests[0]!,securityIdentity: null as never}]); assert.equal(clientResult.ok,true); if (clientResult.ok) { assert.equal(clientResult.results[0]!.ok,true); assert.equal(clientResult.results[1]!.ok,true); assert.equal(clientResult.results[2]!.ok,false); }
  } finally {server.closeAllConnections(); await new Promise<void>(r=>server.close(()=>r())); service.stop();}
 });
 it('cancelled work waiting for the pacing gate never sends', async () => {
  const times:number[]=[]; const {service,requests}=rig(2,async req=>{times.push(Date.now()); await delay(80); return success(req);});
  const first=service.getQuote(requests[0]!); await delay(10); const controller=new AbortController(); const second=service.getQuote(requests[1]!,controller.signal); await delay(20); controller.abort();
  assert.equal((await second).ok,false); assert.equal((await first).ok,true); await delay(1100); assert.equal(times.length,1);
 });
 it('HTTP deadline cancels a pending backoff', async () => {
  let calls=0; const {service,requests}=rig(1,async()=>{calls++; return {status:503,bodyText:'{}'};},500);
  const server=createMarketDataHttpServer({service,token:'synthetic-transport',env:{},requestTimeoutMs:80}); await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
  try { const r=requests[0]!; const response=await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/v1/quotes`,{method:'POST',headers:{authorization:'Bearer synthetic-transport','content-type':'application/json'},body:JSON.stringify({companyId:r.companyId,securityId:r.securityIdentity.securityId,exchangeSegment:r.exchangeSegment})}); assert.equal(response.status,504); await delay(1100); assert.equal(calls,1); assert.equal(service.getQuoteAttemptDiagnostics().at(-1)?.outcome,'CANCELLED'); }
  finally {server.closeAllConnections(); await new Promise<void>(r=>server.close(()=>r())); service.stop();}
 });
 it('HTTP timeout aborts the real egress fetch and prevents retries', async () => {
  let calls=0,aborts=0;
  const fetchImpl:typeof fetch=async (_url,init)=>{ calls++; return new Promise((_resolve,reject)=>{init!.signal!.addEventListener('abort',()=>{aborts++; reject(new DOMException('aborted','AbortError'));},{once:true});}); };
  const transport=new DhanServerHttpsTransport({allowedBaseUrl:'https://synthetic.invalid/v2',env:{},fetchImpl});
  const {service,requests}=rig(1,req=>transport.send(req));
  const server=createMarketDataHttpServer({service,token:'synthetic-transport',env:{},requestTimeoutMs:80}); await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
  try { const url=`http://127.0.0.1:${(server.address() as AddressInfo).port}/v1/quotes`; const req=requests[0]!; const response=await fetch(url,{method:'POST',headers:{authorization:'Bearer synthetic-transport','content-type':'application/json'},body:JSON.stringify({companyId:req.companyId,securityId:req.securityIdentity.securityId,exchangeSegment:req.exchangeSegment})}); assert.equal(response.status,504); assert.match(JSON.stringify(await response.json()),/provider receipt may be unknown/); await delay(1200); assert.equal(calls,1); assert.equal(aborts,1); }
  finally {server.closeAllConnections(); await new Promise<void>(r=>server.close(()=>r())); service.stop();}
 });
});
