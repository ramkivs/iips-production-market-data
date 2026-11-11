import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, readdirSync, readFileSync, statSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { EventEmitter } from 'node:events';
import { createConnection, type Socket } from 'node:net';
import { DatabaseSync } from 'node:sqlite';
import { ClassPJournal, inspectClassPJournal, type ClassPContext } from '../src/ipc/classPJournal.js';
import { createConnectionHandler } from '../src/ipc/dispatch.js';
import { diagnosticSink } from '../src/ipc/protocol.js';
import { closeDatabase } from '../src/persistence/connection.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS, startIpcServer } from '../src/ipc/entrypoint.js';
const run = promisify(execFile);
const context = (): ClassPContext => ({ connectionId: '00000000-0000-0000-0000-000000000001', connectedAt: new Date().toISOString(), settlement: 'half-close-required', frame: { receivedBytes: 123, declaredBodyBytes: 119 }, envelope: { v: 1, op: 'portfolio.importBroker', requestId: 'synthetic-secret-correlation', requestIdType: 'string' } });
const fixture = () => mkdtempSync(join(tmpdir(), 'class-p-journal-'));

test('durable redacted reason/detail/correlation survives fresh process; viewer does not mutate', async () => {
  const root = fixture();
  try {
    const journal = new ClassPJournal(root);
    assert.equal(journal.append('CALLER_SUPPLIED_AUTHORITY', 'refused keys: SECRET-broker-token', context()).status, 'persisted');
    assert.equal(journal.append('BINDING_INVALID', 'binding resolution failed', context()).status, 'persisted');
    const before = readdirSync(root).map(name => [name, readFileSync(join(root,name),'utf8'), statSync(join(root,name)).mtimeMs]);
    const result = inspectClassPJournal(root);
    assert.equal(result.issues.length, 0);
    assert.equal(result.records.length, 2);
    const refusal = result.records.find(r => r.reason === 'CALLER_SUPPLIED_AUTHORITY')!;
    assert.equal(refusal.requestIdSha256, createHash('sha256').update('synthetic-secret-correlation').digest('hex'));
    assert.equal(refusal.operation, 'portfolio.importBroker');
    assert.equal(refusal.protocolVersion, 1);
    assert.equal(refusal.connection.id, '00000000-0000-0000-0000-000000000001');
    assert.equal(refusal.frame.receivedBytes, 123);
    assert.ok(!JSON.stringify(result).includes('SECRET'));
    assert.ok(!JSON.stringify(result).includes('synthetic-secret-correlation'));
    assert.equal(result.records.find(r => r.reason === 'BINDING_INVALID')!.detail, 'Binding lookup failed (not proof of absent binding)');
    new ClassPJournal(root);
    const viewer = new URL('../src/ipc/inspectClassPDiagnostics.js', import.meta.url);
    const output = await run(process.execPath, [fileURLToPath(viewer), '--directory', root]);
    assert.equal(JSON.parse(output.stdout).records.length, 2);
    assert.deepEqual(readdirSync(root).map(name => [name, readFileSync(join(root,name),'utf8'), statSync(join(root,name)).mtimeMs]), before);
    if (process.platform !== 'win32') assert.equal(statSync(join(root,String(before[0][0]))).mode & 0o777, 0o600);
  } finally { rmSync(root,{recursive:true,force:true}); }
});

test('bounded segment count and byte rotation, old records removed, inspection not pruning', () => {
  const root = fixture();
  try {
    const journal = new ClassPJournal(root, {maxRecords: 3, maxBytes: 8192});
    for (let i=0;i<12;i++) assert.equal(journal.append('MALFORMED_FRAME','bad JSON SECRET',context()).status,'persisted');
    assert.ok(readdirSync(root).length <= 3);
    assert.ok(readdirSync(root).reduce((n,name)=>n+statSync(join(root,name)).size,0) <= 8192);
    assert.equal(inspectClassPJournal(root).issues.length,0);
  } finally { rmSync(root,{recursive:true,force:true}); }
});

test('concurrent independent processes publish complete unique records without overwriting', async () => {
  const root = fixture();
  try {
    const moduleUrl = new URL('../src/ipc/classPJournal.js',import.meta.url).href;
    await Promise.all(Array.from({length:4},()=>run(process.execPath,['--input-type=module','-e', `import {ClassPJournal} from ${JSON.stringify(moduleUrl)}; const j=new ClassPJournal(${JSON.stringify(root)}); for(let i=0;i<15;i++) { const o=j.append('MALFORMED_FRAME','bad',${JSON.stringify(context())}); if(o.status!=='persisted') process.exit(1); }`])));
    const result=inspectClassPJournal(root);
    assert.equal(result.records.length,60); assert.equal(result.issues.length,0);
    assert.equal(new Set(result.records.map(r=>r.id)).size,60);
  } finally { rmSync(root,{recursive:true,force:true}); }
});

test('failed fsync is explicit, counted, sanitized, and not published as durable', () => {
  const root=fixture(); const notices:unknown[]=[];
  try {
    const journal=new ClassPJournal(root,{onFailure:n=>notices.push(n),testBeforeSync:()=>{throw Object.assign(new Error('SECRET-path'),{code:'ENOSPC'});}});
    assert.deepEqual(journal.append('MALFORMED_FRAME','SECRET',context()),{status:'failed',code:'ENOSPC'});
    assert.equal(journal.failures,1); assert.equal(notices.length,1);
    assert.ok(!JSON.stringify(notices).includes('SECRET')); assert.deepEqual(readdirSync(root),[]);
  } finally {rmSync(root,{recursive:true,force:true});}
});

test('missing journal after initialization fails visibly, never silently recreates it', () => {
  const root=fixture();const notices:unknown[]=[];
  const journal=new ClassPJournal(root,{onFailure:n=>notices.push(n)});
  rmSync(root,{recursive:true});
  assert.equal(journal.append('IDLE_TIMEOUT','no complete frame',context()).status,'failed');
  assert.equal(notices.length,1);
  assert.throws(()=>inspectClassPJournal(root));
});

test('unsafe permissions/configuration and malformed records rejected', () => {
  const root=fixture();
  try {
    assert.throws(()=>new ClassPJournal('relative'));
    assert.throws(()=>new ClassPJournal(root,{maxRecords:0}));
    if(process.platform!=='win32') {chmodSync(root,0o755);assert.throws(()=>new ClassPJournal(root));chmodSync(root,0o700);}
    writeFileSync(join(root,'1234567890123-00000000-0000-0000-0000-000000000000.json'),'SECRET-not-json');
    const output=inspectClassPJournal(root); assert.equal(output.records.length,0);assert.equal(output.issues.length,1);assert.ok(!JSON.stringify(output).includes('SECRET-not-json'));
  } finally {rmSync(root,{recursive:true,force:true});}
});

test('dispatch persists before destruction, preserves sink, zero Class P wire bytes, no broker payload', async () => {
  const root=fixture();const db=new DatabaseSync(':memory:');ensureMigrations(db,GATE3_MIGRATIONS);
  diagnosticSink.drain();
  class FakeSocket extends EventEmitter {
    destroyed=false; writes=0;
    write(): boolean {this.writes++;return true;}
    destroy(): this {
      assert.equal(inspectClassPJournal(root).records.length,1,'durable before socket destroy');
      this.destroyed=true; return this;
    }
  }
  const socket=new FakeSocket();
  try {
    createConnectionHandler(db,{diagnosticJournal:new ClassPJournal(root)})(socket as unknown as Socket);
    const json=Buffer.from(JSON.stringify({v:1,op:'portfolio.importBroker',requestId:'synthetic-secret-correlation',payload:{owner:'SECRET-authority',holdings:[{symbol:'SECRET-holding'}]}}));
    const prefix=Buffer.alloc(4);prefix.writeUInt32BE(json.length);socket.emit('data',Buffer.concat([prefix,json]));socket.emit('end');
    await new Promise(resolve=>setTimeout(resolve,20));
    assert.equal(socket.destroyed,true);assert.equal(socket.writes,0);
    const record=inspectClassPJournal(root).records[0];assert.equal(record.reason,'CALLER_SUPPLIED_AUTHORITY');assert.equal(record.frame.receivedBytes,json.length+4);
    assert.ok(!JSON.stringify(record).includes('SECRET'));assert.equal(diagnosticSink.peek().at(-1)?.journalOutcome?.status,'persisted');
    assert.equal(diagnosticSink.drain().length,1);assert.equal(diagnosticSink.peek().length,0);
  } finally {db.close();rmSync(root,{recursive:true,force:true});}
});

test('dispatch failure still destroys without wire details and retains failure outcome', async () => {
  const root=fixture();const db=new DatabaseSync(':memory:');ensureMigrations(db,GATE3_MIGRATIONS);
  const notices:unknown[]=[];const journal=new ClassPJournal(root,{onFailure:n=>notices.push(n)});rmSync(root,{recursive:true});diagnosticSink.drain();
  const socket=new EventEmitter() as EventEmitter & {destroy:()=>void;write:()=>void};let destroyed=false;
  socket.destroy=()=>{destroyed=true;};socket.write=()=>{throw new Error('must never write');};
  try {
    createConnectionHandler(db,{diagnosticJournal:journal})(socket as unknown as Socket);
    socket.emit('data',Buffer.from([0,2,0,0]));
    await new Promise(resolve=>setTimeout(resolve,20));assert.equal(destroyed,true);assert.equal(notices.length,1);assert.equal(diagnosticSink.drain()[0].journalOutcome?.status,'failed');
  } finally {db.close();}
});


test('byte cap independently rotates and an untrusted extra field never reaches viewer output', () => {
  const root=fixture();
  try {
    const journal=new ClassPJournal(root,{maxRecords:256,maxBytes:8192});
    for(let i=0;i<30;i++) assert.equal(journal.append('BINDING_ABSENT','the ACTIVE binding has no ACTIVE membership',context()).status,'persisted');
    assert.ok(readdirSync(root).length < 30);
    assert.ok(readdirSync(root).reduce((n,name)=>n+statSync(join(root,name)).size,0)<=8192);
    const name=readdirSync(root)[0];const path=join(root,name);const record=JSON.parse(readFileSync(path,'utf8'));
    record.process.secret='SECRET-injected';writeFileSync(path,JSON.stringify(record));
    const result=inspectClassPJournal(root);assert.equal(result.issues.length,1);assert.ok(!JSON.stringify(result).includes('SECRET-injected'));
  } finally {rmSync(root,{recursive:true,force:true});}
});

test('post-publication retention failure is distinct and visible', () => {
  const root=fixture(); const notices:unknown[]=[];
  try {
    const journal=new ClassPJournal(root,{onFailure:n=>notices.push(n),testBeforeSync:()=>writeFileSync(join(root,'1234567890123-00000000-0000-0000-0000-000000000000.json'),'x'.repeat(9000))});
    const outcome=journal.append('MALFORMED_FRAME','bad',context());
    assert.equal(outcome.status,'persisted_with_failure');assert.ok(outcome.recordId);assert.equal(notices.length,1);
    assert.equal(inspectClassPJournal(root).records.length,1);
  } finally {rmSync(root,{recursive:true,force:true});}
});

test('normal startup requires safe configured journal and fails closed before listen', async () => {
  const root=fixture();
  try {
    const bad=join(root,'not-directory');writeFileSync(bad,'fixture');
    const result=await startIpcServer({env:{IIPS_G3_DATABASE_PATH:join(root,'isolated.sqlite'),IIPS_G3_LOCAL_STATE_DIR:join(root,'state'),IIPS_G2_IPC_ENDPOINT:'journal-startup-test',IIPS_G3_DIAGNOSTIC_DIR:bad}});
    assert.equal(result.ok,false);assert.equal(result.phase,'diagnostics');assert.equal(result.handle,undefined);
  } finally {closeDatabase();rmSync(root,{recursive:true,force:true});}
});


test('normal startup default journal is active and retains a synthetic refusal across server restart', async () => {
  const root=fixture();
  const env={IIPS_G3_DATABASE_PATH:join(root,'isolated.sqlite'),IIPS_G3_LOCAL_STATE_DIR:join(root,'state'),IIPS_G2_IPC_ENDPOINT:`journal-active-${process.pid}`};
  let started=await startIpcServer({env});
  try {
    assert.equal(started.ok,true,started.error);
    const bytes=await new Promise<Buffer>((resolve,reject)=>{
      const chunks:Buffer[]=[];const socket=createConnection({path:started.target!.path});
      socket.on('error',reject);socket.on('data',chunk=>chunks.push(chunk));socket.on('close',()=>resolve(Buffer.concat(chunks)));
      socket.on('connect',()=>{
        const json=Buffer.from(JSON.stringify({v:1,op:'portfolio.list',requestId:'synthetic-startup'}));const prefix=Buffer.alloc(4);prefix.writeUInt32BE(json.length);socket.end(Buffer.concat([prefix,json]));
      });
    });
    assert.equal(bytes.length,0);
    const directory=join(root,'ipc-diagnostics');
    assert.equal(inspectClassPJournal(directory).records[0].reason,'BINDING_ABSENT');
    await started.handle!.stop();
    closeDatabase();
    started=await startIpcServer({env});assert.equal(started.ok,true,started.error);
    assert.equal(inspectClassPJournal(directory).records.length,1);
  } finally {if(started.ok) await started.handle!.stop();closeDatabase();rmSync(root,{recursive:true,force:true});}
});
