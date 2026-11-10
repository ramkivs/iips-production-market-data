import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { startMarketDataDaemon } from '../src/providers/dhan/dhan_local_daemon.js';
import { DhanIdentityApiService } from '../src/providers/dhan/dhan_identity_api.js';
import { DhanInstrumentRegistry, type DhanInstrumentMapping } from '../src/providers/dhan/dhan_instrument_map.js';
import { SecurityMaster } from '../src/identity/security_master.js';

const isin = 'INE000SYNTH1';
const mapping: DhanInstrumentMapping = { companyId:'COMP-A', isin, securityId:`ISIN:${isin}:EQ`, exchange:'NSE', exchangeSegment:'NSE_EQ', symbol:'Synthetic Limited', dhanSecurityId:'private-provider-id', mappingProvenance:'SYNTHETIC_PRE_ACCESS_FIXTURE', active:true };
function service(rows: DhanInstrumentMapping[], entityIsin = isin) {
  const master = new SecurityMaster();
  master.registerEntity({ companyId:'COMP-A', isin:entityIsin, companyName:'Synthetic', industry:'T', sector:'T', effectiveFrom:'2026-01-01', listings:[{exchange:'NSE',symbol:'TICKER',status:'ACTIVE',lotSize:1,tickSize:0.05}] });
  const registry = new DhanInstrumentRegistry(); rows.forEach(row => registry.register(row));
  return new DhanIdentityApiService(master,registry);
}

test('discovery uses P04 ticker only for same mapped company, ISIN and exchange, without bypassing qualification', () => {
  const api = service([mapping]);
  assert.equal(api.search('tick')[0]?.result.status, 'QUALIFIED');
  assert.equal(api.search(' synthetic ')[0]?.result.status, 'QUALIFIED');
  assert.equal(api.search(isin)[0]?.result.status, 'QUALIFIED');
  assert.equal(api.search('not-found').length, 0);
  assert.equal(service([{...mapping, isin:undefined, securityId:undefined}]).search('TICKER').length, 0);
  assert.equal(service([mapping], 'INE000SYNTH2').search('TICKER').length, 0);
  assert.equal(service([{...mapping, companyId:'OTHER'}]).search('TICKER').length, 0);
  assert.equal(service([{...mapping, exchange:'BSE', exchangeSegment:'BSE_EQ'}]).search('TICKER').length, 0);
  const ambiguous = service([mapping, {...mapping,securityId:`ISIN:${isin}:BE`,dhanSecurityId:'other-id'}]).search('TICKER');
  assert.equal(ambiguous.length, 2);
  assert.ok(ambiguous.every(row => row.result.status === 'AMBIGUOUS'));
  const missingSeries = service([{...mapping, securityId:undefined}]).search('TICKER');
  assert.equal(missingSeries[0]?.result.status, 'UNRESOLVED');
});

test('actual daemon loads retained P7 and serves authenticated INFY ticker search offline', async () => {
  const started = await startMarketDataDaemon({env:{}, port:0, transportToken:'test-only'});
  assert.equal(started.ok, true);
  if (!started.ok) return;
  try {
    assert.equal(started.diagnostics.vendorEgressMode, 'DISABLED_PRE_ACCESS');
    assert.ok(started.diagnostics.qualifiedMappingsLoaded > 0);
    const url = started.diagnostics.baseUrl + '/v1/instruments/search';
    const post = (query:string, auth?:string) => fetch(url, {method:'POST',headers:{'content-type':'application/json', ...(auth ? {authorization:auth} : {})},body:JSON.stringify({query})});
    assert.equal((await post('INFY')).status, 401);
    assert.equal((await post('INFY','Bearer wrong')).status, 401);
    const response = await post('INFY','Bearer test-only');
    assert.equal(response.status,200);
    const body = await response.json() as {results: Array<{symbol:string;exchange:string;result:{status:string;securityIdentity?:{securityId:string;isinAuthority:string}}}>};
    assert.equal(body.results.length,2);
    for (const [exchange, securityId] of [['NSE','ISIN:INE009A01021:EQ'],['BSE','ISIN:INE009A01021:A']]) {
      const row = body.results.find(item => item.exchange === exchange);
      assert.equal(row?.result.status, 'QUALIFIED');
      assert.equal(row?.result.securityIdentity?.securityId,securityId);
      assert.equal(row?.result.securityIdentity?.isinAuthority,'NON_AUTHORITATIVE');
    }
    assert.ok(!JSON.stringify(body).includes('dhanSecurityId'));
    const name = await (await post('INFOSYS','Bearer test-only')).json() as {results:unknown[]};
    const isinSearch = await (await post('INE009A01021','Bearer test-only')).json() as {results:unknown[]};
    assert.equal(name.results.length,2); assert.equal(isinSearch.results.length,2);
  } finally { await started.handle.shutdown(); }
});

test('missing retained manifest is an explicit empty registry, not a fabricated INFY result', async () => {
  const started = await startMarketDataDaemon({env:{}, port:0, transportToken:'test-only', p7ManifestPath:'/nonexistent/ipd-p7-manifest.json'});
  assert.equal(started.ok, true);
  if (!started.ok) return;
  try {
    assert.equal(started.diagnostics.qualifiedMappingsLoaded,0);
    const response = await fetch(started.diagnostics.baseUrl+'/v1/instruments/search', {method:'POST',headers:{authorization:'Bearer test-only'},body:JSON.stringify({query:'INFY'})});
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{results:[]});
  } finally { await started.handle.shutdown(); }
});
