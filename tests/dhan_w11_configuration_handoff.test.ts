import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_MARKET_DATA_DAEMON_HOST, DEFAULT_MARKET_DATA_DAEMON_PORT,
  DHAN_VAULT_BACKEND_ENV, MARKET_DATA_DAEMON_HOST_ENV, MARKET_DATA_DAEMON_PORT_ENV,
  parseDhanVaultBackendSelector, startMarketDataDaemon,
} from '../src/providers/dhan/dhan_local_daemon.js';
import { DHAN_DEFAULT_BASE_URL, DHAN_DEFAULT_TIMEOUT_MS, DHAN_ENV_KEYS, resolveDhanProviderConfig } from '../src/providers/dhan/dhan_config.js';
import { MARKET_DATA_TRANSPORT_TOKEN_ENV, MARKET_DATA_REQUEST_TIMEOUT_MS } from '../src/providers/dhan/dhan_market_data_http.js';

// Entirely synthetic references and bearer. No real vault, credential or vendor access.
const refs = { IIPS_DHAN_CLIENT_ID_SECRET_PATH: 'vault://synthetic/client-id', IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH: 'vault://synthetic/access-token', IIPS_DHAN_VAULT_PROVIDER: 'WINDOWS_DPAPI' };
const token = 'synthetic-w11-local-bearer';
const now = new Date('2026-11-15T12:00:00Z');

describe('W-11 version-specific daemon handoff (offline)', () => {
  it('pins the supported names and defaults without treating IRR URLs as daemon aliases', () => {
    assert.equal(MARKET_DATA_DAEMON_HOST_ENV, 'IIPS_MARKET_DATA_DAEMON_HOST');
    assert.equal(MARKET_DATA_DAEMON_PORT_ENV, 'IIPS_MARKET_DATA_DAEMON_PORT');
    assert.equal(MARKET_DATA_TRANSPORT_TOKEN_ENV, 'IIPS_MARKET_DATA_TRANSPORT_TOKEN');
    assert.equal(DHAN_VAULT_BACKEND_ENV, 'IIPS_DHAN_VAULT_BACKEND');
    assert.equal(DEFAULT_MARKET_DATA_DAEMON_HOST, '127.0.0.1'); assert.equal(DEFAULT_MARKET_DATA_DAEMON_PORT, 8791);
    assert.equal(DHAN_DEFAULT_BASE_URL, 'https://api.dhan.co/v2'); assert.equal(DHAN_DEFAULT_TIMEOUT_MS, 5000); assert.equal(MARKET_DATA_REQUEST_TIMEOUT_MS, 10000);
    assert.deepEqual(Object.values(DHAN_ENV_KEYS), ['IIPS_DHAN_BASE_URL','IIPS_DHAN_TIMEOUT_MS','IIPS_DHAN_CLIENT_ID_SECRET_PATH','IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH','IIPS_DHAN_VAULT_PROVIDER','IIPS_DHAN_SECRET_VERSION','IIPS_DHAN_SECRET_STATUS','IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT']);
    const missing = resolveDhanProviderConfig({ IIPS_MARKET_DATA_TRANSPORT_URL: 'ignored', IIPS_MARKET_DATA_BASE_URL: 'ignored', IIPS_MARKET_DATA_TIMEOUT_MS: '1' }, now);
    assert.equal(missing.ok, false); assert.equal(missing.config.timeoutMs,5000); assert.equal(missing.config.baseUrl,DHAN_DEFAULT_BASE_URL);
    if (!missing.ok) assert.equal(missing.failure.code,'CREDENTIALS_UNAVAILABLE');
  });
  it('documents selector and separate URL readers without changing historical admission', () => {
    assert.equal(parseDhanVaultBackendSelector(undefined),'disabled'); assert.equal(parseDhanVaultBackendSelector('  '),'disabled');
    assert.equal(parseDhanVaultBackendSelector(' windows-dpapi '),'windows-dpapi'); assert.equal(parseDhanVaultBackendSelector('disabled'),'disabled');
    for (const invalid of ['WINDOWS-DPAPI','dpapi','windows_dpapi','false']) assert.equal(parseDhanVaultBackendSelector(invalid),null);
    const doc=readFileSync('docs/integration/DHAN-W11-DAEMON-CONFIGURATION-HANDOFF.md','utf8');
    for (const name of ['IIPS_MARKET_DATA_TRANSPORT_URL','IIPS_MARKET_DATA_BASE_URL','IIPS_MARKET_DATA_TIMEOUT_MS','IIPS_DHAN_QUOTE_MAX_ATTEMPTS']) assert.ok(doc.includes(name));
    assert.match(doc,/W-11 remains PARTIAL/i); assert.match(doc,/actual host lineage is unknown/i);
  });
  it('refuses production, bad selector, host, port, token and CLI arguments before serving', async () => {
    const cases: Array<[Record<string,string>, string, string[]?]> = [
      [{ NODE_ENV:' Production ' },'PRODUCTION_NOT_AUTHORIZED'],
      [{ IIPS_DEPLOYMENT_ENV:'production' },'PRODUCTION_NOT_AUTHORIZED'],
      [{ IIPS_DHAN_VAULT_BACKEND:'unknown' },'VAULT_BACKEND_NOT_ALLOWED'],
      [{ IIPS_MARKET_DATA_DAEMON_HOST:'0.0.0.0' },'NON_LOOPBACK_HOST_REFUSED'],
      [{ IIPS_MARKET_DATA_DAEMON_PORT:'0' },'INVALID_PORT'],
      [{ IIPS_MARKET_DATA_DAEMON_PORT:'8791x' },'INVALID_PORT'],
      [{ IIPS_MARKET_DATA_TRANSPORT_TOKEN:'' },'TRANSPORT_TOKEN_MISSING'],
      [{ IIPS_MARKET_DATA_TRANSPORT_TOKEN:'bad value' },'TRANSPORT_TOKEN_WHITESPACE'],
      [{ IIPS_MARKET_DATA_TRANSPORT_TOKEN:'bad\u200bvalue' },'TRANSPORT_TOKEN_NOT_ASCII'],
      [{},'CLI_ARGUMENTS_FORBIDDEN',['unused']],
    ];
    for (const [overrides, expected, argv] of cases) {
      const result = await startMarketDataDaemon({ env:{ IIPS_MARKET_DATA_TRANSPORT_TOKEN:token,...overrides }, argv:argv ?? [] });
      assert.equal(result.ok,false); if (!result.ok) { assert.equal(result.code,expected); assert.ok(!result.error.includes(token)); }
    }
  });
  it('handles missing, malformed, mismatched, revoked and strictly zoned references without exposing them', async () => {
    const missing=resolveDhanProviderConfig({},now); assert.equal(missing.ok,false); if (!missing.ok) assert.equal(missing.failure.code,'CREDENTIALS_UNAVAILABLE');
    for (const extra of [
      { IIPS_DHAN_CLIENT_ID_SECRET_PATH:'not-a-reference' },
      { IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH:refs.IIPS_DHAN_CLIENT_ID_SECRET_PATH },
      { IIPS_DHAN_VAULT_PROVIDER:'unknown' },
      { IIPS_DHAN_SECRET_STATUS:'INVALID' },
      { IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT:'2026-11-16T12:00:00' },
      { IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT:'2026-02-30T12:00:00Z' },
      { IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT:'2026-11-16T12:00:00+14:30' },
    ]) {
      const r=resolveDhanProviderConfig({...refs,...extra},now); assert.equal(r.ok,false); if (!r.ok) { assert.equal(r.failure.code,'CONFIGURATION_INCOMPLETE'); assert.ok(!JSON.stringify(r.failure).includes(refs.IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH)); }
    }
    for (const extra of [{ IIPS_DHAN_SECRET_STATUS:'REVOKED' },{ IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT:'2026-11-15T11:59:59Z' }]) {
      const r=resolveDhanProviderConfig({...refs,...extra},now); assert.equal(r.ok,false); if (!r.ok) assert.equal(r.failure.code,'CREDENTIALS_EXPIRED');
    }
    const valid=resolveDhanProviderConfig({...refs,IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT:'2026-11-16T17:30:00+05:30'},now);
    assert.equal(valid.ok,true); if (valid.ok) { assert.equal(valid.config.accessTokenRef?.vaultProvider,'WINDOWS_DPAPI'); assert.equal(valid.config.accessTokenRef?.version,'v1'); assert.equal(valid.config.accessTokenRef?.status,'ACTIVE'); }
    const startup=await startMarketDataDaemon({env:{...refs,IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT:'not-a-time',IIPS_MARKET_DATA_TRANSPORT_TOKEN:token},port:0});
    assert.equal(startup.ok,false); if (!startup.ok) assert.equal(startup.code,'CONFIGURATION_INCOMPLETE');
  });
  it('uses disabled pre-access by default and authenticates loopback health without any provider call', async () => {
    let sends=0;
    const result=await startMarketDataDaemon({ env:{IIPS_MARKET_DATA_TRANSPORT_TOKEN:token,IIPS_MARKET_DATA_TRANSPORT_URL:'ignored',IIPS_MARKET_DATA_BASE_URL:'ignored'},port:0,providerTransport:{send:async()=>{sends++;throw new Error('unexpected');}} });
    assert.equal(result.ok,true); if (!result.ok) return;
    try {
      assert.equal(result.diagnostics.host,'127.0.0.1'); assert.equal(result.diagnostics.vaultBackendSelector,'disabled'); assert.equal(result.diagnostics.credentialReadinessCode,'CREDENTIALS_UNAVAILABLE');
      const noAuth=await fetch(`${result.diagnostics.baseUrl}/v1/health`); assert.equal(noAuth.status,401);
      const auth=await fetch(`${result.diagnostics.baseUrl}/v1/health`,{headers:{authorization:`Bearer ${token}`}}); assert.equal(auth.status,200);
      const body=await auth.json() as {liveProviderConnectivity:string}; assert.equal(body.liveProviderConnectivity,'NOT_CHECKED_PRE_ACCESS'); assert.equal(sends,0);
    } finally { await result.handle.shutdown(); }
  });
  it('rejects an invalid retry setting without performing provider egress', async () => {
    const r=await startMarketDataDaemon({env:{IIPS_MARKET_DATA_TRANSPORT_TOKEN:token,IIPS_DHAN_QUOTE_MAX_ATTEMPTS:'11'},port:0});
    assert.equal(r.ok,false); if (!r.ok) assert.equal(r.code,'CONFIGURATION_INCOMPLETE');
  });
});
