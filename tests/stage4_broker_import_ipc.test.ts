import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createConnection } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS, startIpcServer } from '../src/ipc/entrypoint.js';
import { createConnectionHandler } from '../src/ipc/dispatch.js';
import { closeDatabase } from '../src/persistence/connection.js';
import { listenIpc, resolveEndpointTarget, settlementPolicyForEndpoint } from '../src/ipc/endpoint.js';
import type { BrokerImportRequest, BrokerImportOutcome } from '../src/contracts/broker_import_ipc.js';

const req: BrokerImportRequest = { portfolioId:'BROKER-IPC', expectedRevision:0, contentDigest:'abc123', fileName:'holdings.csv', sourceBroker:'DHAN', importedAt:'2026-11-09T12:00:00.000Z', holdings:[{symbol:'INFY',isin:'INE009A01021',exchange:'NSE',quantity:5,averageBuyPrice:1500,currentPrice:1600,marketValue:8000,weightPercentage:100,active:true,sourceBroker:'DHAN',lineageDigest:'lineage'}] };
function call(path:string, op:string, payload?:unknown): Promise<Record<string, any> | null> {
 return new Promise((resolve,reject) => { const socket=createConnection({path}); const chunks:Buffer[]=[];
  socket.on('data',chunk => chunks.push(chunk)); socket.on('error',reject); socket.on('close',()=>{const b=Buffer.concat(chunks); resolve(b.length>=4 ? JSON.parse(b.subarray(4,4+b.readUInt32BE()).toString()) : null);});
  socket.on('connect',()=>{const b=Buffer.from(JSON.stringify({v:1,op,payload,requestId:'r1'}));const prefix=Buffer.alloc(4);prefix.writeUInt32BE(b.length);socket.end(Buffer.concat([prefix,b]));});
 });
}
function seed(db:DatabaseSync) { const now='2026-11-09T00:00:00.000Z'; db.prepare("INSERT INTO local_principal_bindings (binding_id,principal_label,status,created_at,updated_at,revoked_at) VALUES ('b','local','ACTIVE',?,?,NULL)").run(now,now); db.prepare("INSERT INTO local_principal_memberships (membership_id,binding_id,tenant_id,canonical_owner_id,status,created_at,updated_at,revoked_at) VALUES ('m','b','tenant','owner','ACTIVE',?,?,NULL)").run(now,now); }

test('real Stage 4 IPC commit, refusal, duplicate and retrieval', async () => {
 const root=mkdtempSync(join(tmpdir(),'stage4-ipc-')); const dbPath=join(root,'db.sqlite'); const db=new DatabaseSync(dbPath); ensureMigrations(db,GATE3_MIGRATIONS); seed(db);
 const env={IIPS_LOCAL_PERSONAL_USE:'1',IIPS_G2_IPC_ENDPOINT:'stage4',IIPS_G3_LOCAL_STATE_DIR:join(root,'state'),IIPS_G3_DATABASE_PATH:dbPath};
 const started=await startIpcServer({env}); assert.ok(started.ok,started.error); const path=started.target!.path;
 try {
  const invalid=await call(path,'portfolio.importBroker',{...req,portfolioId:'../bad'}); assert.equal(invalid?.outcome,'INVALID_REQUEST');
  const bad=await call(path,'portfolio.importBroker',{...req,holdings:[...req.holdings,{...req.holdings[0],symbol:'UNKNOWN',isin:'INE999X01011'}]});
  assert.equal(bad?.ok,true); assert.equal(bad?.result.code,'REFUSED_UNRESOLVED_IDENTITY'); assert.equal(bad?.result.storeEffect,'NONE');
  assert.equal((db.prepare('SELECT count(*) AS n FROM portfolios').get() as {n:number}).n,0);
  const first=await call(path,'portfolio.importBroker',req); const outcome=first?.result as BrokerImportOutcome;
  assert.equal(first?.ok,true); assert.equal(outcome.ok,true); if(outcome.ok !== true) throw new Error('not committed');
  assert.equal(outcome.revision,1); assert.equal(outcome.holdingsPersisted,1); assert.equal(outcome.storeEffect,'REVISION_COMMITTED');
  const duplicate=await call(path,'portfolio.importBroker',{...req,expectedRevision:1}); assert.equal(duplicate?.result.disposition,'ALREADY_IMPORTED_NO_OP'); assert.equal(duplicate?.result.revision,1);
  const get=await call(path,'portfolio.get',{portfolioId:req.portfolioId}); assert.equal(get?.ok,true); assert.equal(get?.result.revision,1); assert.equal(get?.result.holdings.length,1); assert.equal(get?.result.holdings[0].securityIdentity.securityId,'ISIN:INE009A01021:EQ');
  assert.equal((await call(path,'portfolio.importBroker',{...req,owner:'spoof'})),null);
 } finally { await started.handle!.stop(); closeDatabase(); db.close(); rmSync(root,{recursive:true,force:true}); }
});

test('IPC requires binding and authorization; missing operation and exceptions fail closed', async () => {
 const root=mkdtempSync(join(tmpdir(),'stage4-guard-')); const db=new DatabaseSync(':memory:'); ensureMigrations(db,GATE3_MIGRATIONS);
 const target=resolveEndpointTarget({IIPS_G2_IPC_ENDPOINT:'test',IIPS_G3_LOCAL_STATE_DIR:join(root,'state')},process.platform);
 let calls=0; const stub=() => {calls++; throw new Error('SECRET');};
 let server=await listenIpc(target,createConnectionHandler(db,{settlement:settlementPolicyForEndpoint(target),env:{IIPS_LOCAL_PERSONAL_USE:'1'},brokerImportConsumer:stub}));
 try { assert.equal(await call(target.path,'portfolio.importBroker',req),null); assert.equal(calls,0); } finally {await server.stop();}
 seed(db);
 server=await listenIpc(target,createConnectionHandler(db,{settlement:settlementPolicyForEndpoint(target),env:{},brokerImportConsumer:stub}));
 try { assert.equal((await call(target.path,'portfolio.importBroker',req))?.outcome,'WRITE_NOT_AUTHORIZED'); assert.equal(calls,0); } finally {await server.stop();}
 server=await listenIpc(target,createConnectionHandler(db,{settlement:settlementPolicyForEndpoint(target),env:{IIPS_LOCAL_PERSONAL_USE:'1'}}));
 try {assert.equal((await call(target.path,'portfolio.importBroker',req))?.outcome,'UNAVAILABLE');} finally {await server.stop();}
 server=await listenIpc(target,createConnectionHandler(db,{settlement:settlementPolicyForEndpoint(target),env:{IIPS_LOCAL_PERSONAL_USE:'1'},brokerImportConsumer:stub}));
 try {const result=await call(target.path,'portfolio.importBroker',req); assert.equal(result?.outcome,'UNAVAILABLE'); assert.ok(!JSON.stringify(result).includes('SECRET')); assert.equal(calls,1);} finally {await server.stop(); db.close(); rmSync(root,{recursive:true,force:true});}
});
