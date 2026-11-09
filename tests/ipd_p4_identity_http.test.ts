import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { SecurityMaster } from '../src/identity/security_master.js';
import { DhanInstrumentRegistry, type DhanInstrumentMapping } from '../src/providers/dhan/dhan_instrument_map.js';
import { DhanIdentityApiService } from '../src/providers/dhan/dhan_identity_api.js';
import { createMarketDataHttpServer } from '../src/providers/dhan/dhan_market_data_http.js';

const isin = 'INE000SYNTH1';
const row: DhanInstrumentMapping = { companyId:'COMP-A', isin, securityId:`ISIN:${isin}:EQ`, exchange:'NSE', exchangeSegment:'NSE_EQ', symbol:'SYNTH', dhanSecurityId:'PRIVATE-ID', mappingProvenance:'DHAN_INSTRUMENT_MASTER', lastVerifiedAt:'2026-01-01T00:00:00Z', active:true };
function setup(rows: DhanInstrumentMapping[] = [row]) {
 const master = new SecurityMaster();
 master.registerEntity({ companyId:'COMP-A', isin, cin:'', companyName:'Synthetic', industry:'T', sector:'T', effectiveFrom:'2026-01-01', listings:[{ exchange:'NSE', symbol:'SYNTH', status:'ACTIVE', lotSize:1, tickSize:0.05 }] });
 const registry = new DhanInstrumentRegistry(); rows.forEach(r => registry.register(r));
 return new DhanIdentityApiService(master, registry);
}
const exact = { companyId:'COMP-A', exchange:'NSE' as const, securityId:`ISIN:${isin}:EQ` };
test('exact resolution, ambiguity, missing and stale evidence fail closed', () => {
 const api = setup(); const result = api.resolve(exact);
 assert.equal(result.status, 'QUALIFIED');
 if (result.status === 'QUALIFIED') assert.equal(result.securityIdentity.isinAuthority, 'NON_AUTHORITATIVE');
 assert.equal(api.resolve({...exact, securityId:`ISIN:${isin}:BE`}).status, 'AMBIGUOUS');
 assert.equal(api.resolve({...exact, companyId:'OTHER'}).status, 'UNRESOLVED');
 assert.equal(api.resolve({...exact, securityId:'bad'}).status, 'UNRESOLVED');
 assert.deepEqual(api.qualify({isin:'', exchange:'NSE'}).status, 'UNRESOLVED');
 assert.equal((api.qualify({isin:'bad', exchange:'NSE'}) as {reason:string}).reason, 'INVALID_ISIN_SYNTAX');
 assert.equal((api.qualify({isin:'INE000NOPE12', exchange:'NSE'}) as {reason:string}).reason, 'MISSING_P04_CORRESPONDENCE');
 assert.equal((api.qualify({isin, exchange:'BSE'}) as {reason:string}).reason, 'INACTIVE_OR_MISSING_LISTING');
 assert.equal((setup([]).qualify({isin, exchange:'NSE'}) as {reason:string}).reason, 'MISSING_P7_MAPPING');
 assert.equal((setup([{...row, lastVerifiedAt:undefined}]).qualify({isin, exchange:'NSE'}) as {reason:string}).reason, 'STALE_SOURCE_EVIDENCE');
 const multi = setup([row, {...row, securityId:`ISIN:${isin}:BE`, dhanSecurityId:'OTHER'}]);
 assert.equal(multi.qualify({isin, exchange:'NSE'}).status, 'AMBIGUOUS');
 assert.equal(multi.resolve(exact).status, 'AMBIGUOUS');
 assert.ok(!JSON.stringify(api.search('synth')).includes('PRIVATE-ID'));
});

test('authenticated HTTP contracts and validation', async () => {
 const server = createMarketDataHttpServer({ service: {} as never, identityService: setup(), token:'secret', env:{} });
 await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
 const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
 const post = (path:string, body:string, auth = 'Bearer secret') => fetch(base+path, {method:'POST', headers:{authorization:auth}, body});
 try {
  assert.equal((await post('/v1/instruments/search','{}','')).status, 401);
  assert.equal((await post('/v1/identity/resolve','{')).status, 400);
  assert.equal((await post('/v1/identity/resolve',JSON.stringify({...exact, extra:1}))).status, 400);
  assert.equal((await post('/v1/identity/qualify',JSON.stringify({exchange:'BAD'}))).status, 400);
  const q = await post('/v1/identity/qualify', JSON.stringify({exchange:'NSE'}));
  assert.equal((await q.json() as {reason:string}).reason, 'MISSING_ISIN');
  const resolved = await post('/v1/identity/resolve', JSON.stringify(exact));
  assert.equal((await resolved.json() as {status:string}).status, 'QUALIFIED');
  const search = await post('/v1/instruments/search', JSON.stringify({query:'SYN'}));
  assert.ok(!JSON.stringify(await search.json()).includes('PRIVATE-ID'));
  assert.equal((await post('/v1/instruments/search', JSON.stringify({query:'x'.repeat(17000)}))).status, 413);
 } finally { server.closeAllConnections(); await new Promise<void>(r => server.close(() => r())); }
});
