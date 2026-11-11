import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import { DurablePortfolioStore } from '../src/persistence/portfolio_store.js';
import { mapManualRequest } from '../src/persistence/manualPersonalPortfolio.js';
import { verifyAuditChain } from '../src/persistence/audit.js';
const owner = { canonicalOwnerId: 'synthetic-owner', tenantId: 'synthetic-tenant' };
const id = 'DEFAULT_PORTFOLIO';
function fixture(saved = false, at = 1) {
 const db = new DatabaseSync(':memory:'); db.exec('PRAGMA foreign_keys=ON');
 ensureMigrations(db, GATE3_MIGRATIONS);
 const store = new DurablePortfolioStore(db, undefined, { revisionCap: 1000 });
 const request = mapManualRequest([{symbol:'INFY',quantity:10,averageBuyPrice:100,currentPrice:110,active:true},{symbol:'TCS',quantity:5,averageBuyPrice:200,currentPrice:210,active:true}]);
 store.create(owner,id,request);
 if(saved) store.save(owner,id,mapManualRequest([{symbol:'INFY',quantity:11,averageBuyPrice:100,currentPrice:110,active:true}]),1);
 const original = saved ? 2 : 1;
 if(at !== 1) {
   db.prepare('UPDATE portfolio_holdings SET revision=?').run(original); // no-op, fixtures stay FK-valid
   db.prepare('INSERT INTO portfolio_revisions SELECT portfolio_id,canonical_owner_id,?,operation,total_market_value,weight_sum_percentage,holdings_count,provenance_digest,content_digest,created_at FROM portfolio_revisions WHERE revision=?').run(at,original);
   db.prepare('INSERT INTO portfolio_holdings SELECT canonical_owner_id,portfolio_id,?,holding_key,symbol,company_id,quantity,average_buy_price,current_price,market_value,weight_percentage,active,source_broker,lineage_digest,identity_status,resolution_disposition,created_at,security_identity FROM portfolio_holdings WHERE revision=?').run(at,original);
   db.prepare('UPDATE portfolios SET current_revision=?').run(at);
 }
 const current = at !== 1 ? at : original;
 store.delete(owner,id,current);
 return { db,store,current };
}
function dump(db:DatabaseSync) { return JSON.stringify(['portfolios','portfolio_revisions','portfolio_holdings','portfolio_contributions','portfolio_restore_receipts','audit_events'].map(t=>db.prepare(`SELECT * FROM ${t}`).all())); }
for(const saved of [false,true]) test(`restoration preserves history, holdings, contributions and isSaved=${saved}`,()=>{
 const {db,store,current}=fixture(saved);
 const history=db.prepare('SELECT * FROM portfolio_revisions ORDER BY revision').all();
 const holdings=db.prepare('SELECT * FROM portfolio_holdings WHERE revision=?').all(current);
 const contributions=db.prepare('SELECT * FROM portfolio_contributions').all();
 const receipt=store.restore(owner,id,current,'retry-key');
 assert.equal(receipt.revision,current+2);assert.equal(receipt.isSaved,saved);
 assert.deepEqual(db.prepare('SELECT * FROM portfolio_revisions WHERE revision<=? ORDER BY revision').all(current+1),history);
 assert.deepEqual(db.prepare('SELECT * FROM portfolio_holdings WHERE revision=?').all(current+2).map(r=>({...r,revision:current})),holdings.map(r=>({...r})));
 assert.deepEqual(db.prepare('SELECT * FROM portfolio_contributions').all(),contributions);
 assert.equal(store.get(owner,id).isSaved,saved);assert.equal(store.list(owner)[0].isSaved,saved);
 assert.equal(store.revisions(owner,id).at(-1)?.operation,'RESTORE');
 const before=dump(db);assert.deepEqual(store.restore(owner,id,current,'retry-key'),receipt);assert.equal(dump(db),before);
 assert.throws(()=>store.restore(owner,id,current,'other'));assert.equal(dump(db),before);
 assert.throws(()=>store.restore(owner,id,current+1,'retry-key'));assert.equal(dump(db),before);
 assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);assert.ok(verifyAuditChain(db));db.close();
});
test('isolation and invalid/stale requests have no effect',()=>{
 const {db,store,current}=fixture();const before=dump(db);
 for(const [who,rev,key,pid] of [[{...owner,tenantId:'foreign'},current,'k',id],[{...owner,canonicalOwnerId:'foreign'},current,'k',id],[owner,current+1,'k',id],[owner,current,'',id],[owner,NaN,'k',id],[owner,current,'k','OTHER']] as const) {
 assert.throws(()=>store.restore(who,pid,rev,key));assert.equal(dump(db),before);
 }
 db.prepare("UPDATE portfolio_revisions SET operation='RESET' WHERE operation='DELETE'").run();const invalid=dump(db);assert.throws(()=>store.restore(owner,id,current,'k'));assert.equal(dump(db),invalid);db.close();
});
test('cap 1000 succeeds; subsequent saves blocked; cap overflow has no effects',()=>{
 const a=fixture(false,998);assert.equal(a.store.restore(owner,id,998,'cap').revision,1000);
 assert.throws(()=>a.store.save(owner,id,mapManualRequest([{symbol:'X',quantity:1,averageBuyPrice:1,currentPrice:1,active:true}]),1000),/capped/);a.db.close();
 const b=fixture(false,999);const before=dump(b.db);assert.throws(()=>b.store.restore(owner,id,999,'overflow'),/capped/);assert.equal(dump(b.db),before);b.db.close();
});

test('migration 006 preserves populated 005 data with foreign keys enabled',()=>{
 const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');ensureMigrations(db,GATE3_MIGRATIONS.slice(0,5));
 // Populate using only the pre-006 write vocabulary, never an actual database.
 const store=new DurablePortfolioStore(db);store.create(owner,id,mapManualRequest([{symbol:'INFY',quantity:1,averageBuyPrice:1,currentPrice:1,active:true}]));store.delete(owner,id,1);
 const tables=['portfolios','portfolio_revisions','portfolio_holdings','portfolio_contributions'];const before=tables.map(t=>db.prepare(`SELECT * FROM ${t}`).all());
 ensureMigrations(db,GATE3_MIGRATIONS);assert.deepEqual(tables.map(t=>db.prepare(`SELECT * FROM ${t}`).all()),before);assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
 assert.equal(store.restore(owner,id,1,'upgrade').revision,3);db.close();
});

test('IPC restore requires enabled personal path and ACTIVE authenticated membership; retries are stable',async()=>{
 const {createServer,createConnection}=await import('node:net');
 const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const {createConnectionHandler}=await import('../src/ipc/dispatch.js');
 const {db,current}=fixture();const root=mkdtempSync(join(tmpdir(),'restore-ipc-'));const path=join(root,'ipc.sock');
 const now=new Date().toISOString();
 db.prepare("INSERT INTO local_principal_bindings VALUES ('b','synthetic','ACTIVE',?,?,NULL)").run(now,now);
 db.prepare("INSERT INTO local_principal_memberships VALUES ('m','b',?,?,'ACTIVE',?,?,NULL)").run(owner.tenantId,owner.canonicalOwnerId,now,now);
 let enabled='0';const server=createServer({allowHalfOpen:true},socket=>createConnectionHandler(db,{env:{IIPS_LOCAL_PERSONAL_USE:enabled}})(socket));
 await new Promise<void>(resolve=>server.listen(path,resolve));
 const call=(payload:unknown)=>new Promise<Record<string,any>>((resolve,reject)=>{
  const socket=createConnection(path);const chunks:Buffer[]=[];socket.on('error',reject);socket.on('data',c=>chunks.push(c));socket.on('end',()=>{const b=Buffer.concat(chunks);resolve(b.length ? JSON.parse(b.subarray(4).toString()) : {zeroBytes:true});socket.destroy();});
  socket.on('connect',()=>{const body=Buffer.from(JSON.stringify({v:1,op:'portfolio.restore',payload}));const prefix=Buffer.alloc(4);prefix.writeUInt32BE(body.length);socket.end(Buffer.concat([prefix,body]));});
 });
 try {
 const payload={portfolioId:id,expectedRevision:current,idempotencyKey:'wire'};const before=dump(db);
 assert.equal((await call(payload)).outcome,'WRITE_NOT_AUTHORIZED');assert.equal(dump(db),before);
 enabled='1';assert.equal((await call({...payload,tenantId:owner.tenantId})).zeroBytes,true);assert.equal(dump(db),before);
 const receipt=await call(payload);assert.equal(receipt.ok,true);assert.equal(receipt.result.revision,current+2);const restored=dump(db);
 assert.deepEqual((await call(payload)).result,receipt.result);assert.equal(dump(db),restored);
 db.exec("UPDATE local_principal_memberships SET status='REVOKED'");const revoked=dump(db);assert.equal((await call(payload)).zeroBytes,true);assert.equal(dump(db),revoked);
 }finally{await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));db.close();rmSync(root,{recursive:true,force:true});}
});

test('restore rolls back all effects on a mid-transaction failure',()=>{
 const {db,current}=fixture();const before=dump(db);
 const faulty=new DurablePortfolioStore(db,{afterMutation(step){if(step==='restore-receipt-insert')throw new Error('synthetic fault');}},{revisionCap:1000});
 assert.throws(()=>faulty.restore(owner,id,current,'fault'),/synthetic fault/);assert.equal(dump(db),before);db.close();
});
test('repeated delete/restore retains saved state; old exact receipt survives later lifecycle',()=>{
 const {db,store,current}=fixture(true);const original=store.restore(owner,id,current,'first');store.delete(owner,id,original.revision);
 const next=store.restore(owner,id,original.revision,'second');assert.equal(next.revision,original.revision+2);assert.equal(store.get(owner,id).isSaved,true);
 const before=dump(db);assert.deepEqual(store.restore(owner,id,current,'first'),original);assert.equal(dump(db),before);db.close();
});
