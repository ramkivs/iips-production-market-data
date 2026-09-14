/**
 * Program v3.0 — PF-1: durable-persistence authority tests (offline, deterministic).
 *
 * Covers the approved TD-2/TD-3/TD-7a contract: append/readById/listOrdered/
 * updateReadState/exists; server-derived identity; tenant+owner isolation; createdAt ordering;
 * dedup; idempotent read-state; restart/reload; journal reconstruction; malformed/unknown/
 * truncated journal behavior; write/index failures; deterministic temp-dir isolation; and the
 * env-var data-directory resolution. Uses only node:fs/node:os/node:path (no new dependency).
 */
import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  PersistenceService,
  PersistenceError,
  resolveDataDir,
  JOURNAL_FORMAT_VERSION,
  type JournalFs,
} from './persistence-service';

const tmpDirs: string[] = [];

function tmpDir(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'iips-pf1-'));
  tmpDirs.push(d);
  return d;
}

afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

const A = { tenantId: 'tenant-A', ownerUserId: 'u1', dedupKey: 'k1', payload: { note: 'first' } };
const B = { tenantId: 'tenant-A', ownerUserId: 'u2', dedupKey: 'k1', payload: { note: 'other owner' } };

describe('PF-1 — append + server-derived identity', () => {
  it('creates a durable record with server-derived identity', () => {
    const svc = new PersistenceService({ dataDir: tmpDir() });
    const r = svc.append(A);
    expect(r.recordId).toBeTruthy();
    expect(r.tenantId).toBe('tenant-A');
    expect(r.ownerUserId).toBe('u1');
    expect(r.dedupKey).toBe('k1');
    expect(r.payload).toEqual({ note: 'first' });
    expect(r.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(r.seq).toBe(1);
    expect(r.read).toBe(false);
    expect(r.updatedAt).toBeNull();
  });

  it('assigns monotonic sequence across appends', () => {
    const svc = new PersistenceService({ dataDir: tmpDir() });
    const r1 = svc.append({ ...A, dedupKey: 'a' });
    const r2 = svc.append({ ...A, dedupKey: 'b' });
    expect(r1.seq).toBe(1);
    expect(r2.seq).toBe(2);
  });
});

describe('PF-1 — read / list / ordering', () => {
  it('readById returns the record and enforces tenant+owner scoping', () => {
    const svc = new PersistenceService({ dataDir: tmpDir() });
    const r = svc.append(A);
    expect(svc.readById('tenant-A', 'u1', r.recordId)?.recordId).toBe(r.recordId);
    expect(svc.readById('tenant-B', 'u1', r.recordId)).toBeUndefined(); // cross-tenant
    expect(svc.readById('tenant-A', 'u2', r.recordId)).toBeUndefined(); // cross-owner
  });

  it('listOrdered returns own records only, createdAt DESC with seq tiebreak', () => {
    const svc = new PersistenceService({ dataDir: tmpDir() });
    svc.append({ ...A, dedupKey: 'x' });
    svc.append({ ...A, dedupKey: 'y' });
    svc.append({ ...A, tenantId: 'tenant-B', dedupKey: 'z' }); // other tenant
    const mine = svc.listOrdered('tenant-A', 'u1');
    expect(mine).toHaveLength(2);
    expect(mine.every((r) => r.tenantId === 'tenant-A' && r.ownerUserId === 'u1')).toBe(true);
    expect(mine[0].seq).toBe(2); // newest first
    expect(mine[1].seq).toBe(1);
  });
});

describe('PF-1 — dedup + idempotent read-state', () => {
  it('duplicate append of the same dedupKey is a no-op returning the existing record', () => {
    const svc = new PersistenceService({ dataDir: tmpDir() });
    const first = svc.append(A);
    const again = svc.append(A);
    expect(again.recordId).toBe(first.recordId);
    expect(svc.listOrdered('tenant-A', 'u1')).toHaveLength(1);
  });

  it('dedupKey is scoped per tenant+owner (same key, different owner → distinct records)', () => {
    const svc = new PersistenceService({ dataDir: tmpDir() });
    const r1 = svc.append(A);
    const r2 = svc.append(B);
    expect(r1.recordId).not.toBe(r2.recordId);
  });

  it('exists() is tenant+owner scoped', () => {
    const svc = new PersistenceService({ dataDir: tmpDir() });
    svc.append(A);
    expect(svc.exists('tenant-A', 'u1', 'k1')).toBe(true);
    expect(svc.exists('tenant-A', 'u2', 'k1')).toBe(false);
    expect(svc.exists('tenant-B', 'u1', 'k1')).toBe(false);
  });

  it('updateReadState is idempotent (repeat yields same end-state)', () => {
    const svc = new PersistenceService({ dataDir: tmpDir() });
    const r = svc.append(A);
    const u1 = svc.updateReadState('tenant-A', 'u1', r.recordId, true)!;
    const u2 = svc.updateReadState('tenant-A', 'u1', r.recordId, true)!;
    expect(u1.read).toBe(true);
    expect(u2.read).toBe(true);
    expect(u2.updatedAt).toBe(u1.updatedAt); // no second change
  });

  it('updateReadState is tenant+owner scoped (foreign record → undefined)', () => {
    const svc = new PersistenceService({ dataDir: tmpDir() });
    const r = svc.append(A);
    expect(svc.updateReadState('tenant-B', 'u1', r.recordId, true)).toBeUndefined();
    expect(svc.readById('tenant-A', 'u1', r.recordId)?.read).toBe(false);
  });
});

describe('PF-1 — durability / restart / reconstruction', () => {
  it('restart reload rebuilds identical state from the journal', () => {
    const dir = tmpDir();
    const svc1 = new PersistenceService({ dataDir: dir });
    const r = svc1.append(A);
    svc1.updateReadState('tenant-A', 'u1', r.recordId, true);

    const svc2 = new PersistenceService({ dataDir: dir }); // reload
    const reloaded = svc2.readById('tenant-A', 'u1', r.recordId)!;
    expect(reloaded.recordId).toBe(r.recordId);
    expect(reloaded.payload).toEqual({ note: 'first' });
    expect(reloaded.read).toBe(true);
    expect(svc2.listOrdered('tenant-A', 'u1')).toHaveLength(1);
  });

  it('rebuilt service preserves dedup identity', () => {
    const dir = tmpDir();
    new PersistenceService({ dataDir: dir }).append(A);
    const svc2 = new PersistenceService({ dataDir: dir });
    const again = svc2.append(A);
    expect(svc2.listOrdered('tenant-A', 'u1')).toHaveLength(1);
    expect(again.dedupKey).toBe('k1');
  });
});

describe('PF-1 — journal failure semantics (TD-3)', () => {
  function writeRaw(dir: string, content: string): void {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'journal.ndjson'), content);
  }

  it('unknown journal version → fail closed', () => {
    const dir = tmpDir();
    writeRaw(dir, '{"journalFormatVersion":99}\n');
    expect(() => new PersistenceService({ dataDir: dir })).toThrowError(PersistenceError);
    try { new PersistenceService({ dataDir: dir }); } catch (e) {
      expect((e as PersistenceError).code).toBe('JOURNAL_VERSION_UNSUPPORTED');
    }
  });

  it('malformed non-final record → fail closed (index reconstruction failure)', () => {
    const dir = tmpDir();
    writeRaw(dir, [
      `{"journalFormatVersion":${JOURNAL_FORMAT_VERSION}}`,
      '{"seq":1,"op":"create","recordId":"a","tenantId":"tenant-A","ownerUserId":"u1","dedupKey":"k","payload":{},"createdAt":"2026-01-01T00:00:00.000Z"}',
      'THIS IS NOT JSON',
      '{"seq":3,"op":"create","recordId":"b","tenantId":"tenant-A","ownerUserId":"u1","dedupKey":"k2","payload":{},"createdAt":"2026-01-02T00:00:00.000Z"}',
    ].join('\n') + '\n');
    try { new PersistenceService({ dataDir: dir }); throw new Error('should not reach'); } catch (e) {
      expect((e as PersistenceError).code).toBe('JOURNAL_MALFORMED');
    }
  });

  it('truncated final line → quarantined; valid records served', () => {
    const dir = tmpDir();
    const valid = `{"seq":1,"op":"create","recordId":"a","tenantId":"tenant-A","ownerUserId":"u1","dedupKey":"k","payload":{"note":"x"},"createdAt":"2026-01-01T00:00:00.000Z"}`;
    writeRaw(dir, `{"journalFormatVersion":${JOURNAL_FORMAT_VERSION}}\n${valid}\n{"seq":2,"op":"crea`);
    const svc = new PersistenceService({ dataDir: dir });
    const rows = svc.listOrdered('tenant-A', 'u1');
    expect(rows).toHaveLength(1);
    expect(rows[0].payload).toEqual({ note: 'x' });
    // the quarantined tail must be removed from the journal
    const text = fs.readFileSync(path.join(dir, 'journal.ndjson'), 'utf8');
    expect(text).not.toContain('"seq":2'); // the truncated append's seq is gone
    expect(text).toContain('"seq":1'); // the valid record survives
  });

  it('empty journal is a valid empty state', () => {
    const dir = tmpDir();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'journal.ndjson'), '');
    const svc = new PersistenceService({ dataDir: dir });
    expect(svc.listOrdered('tenant-A', 'u1')).toHaveLength(0);
  });

  it('missing journal is a valid first-run state', () => {
    const svc = new PersistenceService({ dataDir: tmpDir() });
    expect(svc.listOrdered('tenant-A', 'u1')).toHaveLength(0);
  });
});

describe('PF-1 — write / index failures', () => {
  it('append write failure → WRITE_FAILED (no record reported as persisted)', () => {
    const dir = tmpDir();
    const failing = Object.create(fs) as JournalFs & typeof fs;
    failing.appendFileSync = () => { throw new Error('disk full'); };
    const svc = new PersistenceService({ dataDir: dir, fs: failing });
    try { svc.append(A); throw new Error('should not reach'); } catch (e) {
      expect((e as PersistenceError).code).toBe('WRITE_FAILED');
    }
    expect(svc.listOrdered('tenant-A', 'u1')).toHaveLength(0);
  });

  it('journal read failure on load → INDEX_RECONSTRUCTION_FAILED', () => {
    const dir = tmpDir();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'journal.ndjson'), `{"journalFormatVersion":${JOURNAL_FORMAT_VERSION}}\n`);
    const failing = Object.create(fs) as JournalFs & typeof fs;
    failing.readFileSync = () => { throw new Error('io error'); };
    try { new PersistenceService({ dataDir: dir, fs: failing }); throw new Error('should not reach'); } catch (e) {
      expect((e as PersistenceError).code).toBe('INDEX_RECONSTRUCTION_FAILED');
    }
  });
});

describe('PF-1 — TD-7a data directory', () => {
  it('resolveDataDir honors IIPS_DATA_DIR', () => {
    expect(resolveDataDir({ IIPS_DATA_DIR: '/custom/data' })).toBe(path.resolve('/custom/data'));
  });

  it('resolveDataDir defaults to <cwd>/.iips-data', () => {
    expect(resolveDataDir({})).toBe(path.join(process.cwd(), '.iips-data'));
  });

  it('does not use frozen certification datasets as writable storage (service writes under its own dataDir)', () => {
    const dir = tmpDir();
    const svc = new PersistenceService({ dataDir: dir });
    svc.append(A);
    // Only the journal file may exist inside the dataDir — nothing under source-controlled paths.
    expect(fs.readdirSync(dir)).toEqual(['journal.ndjson']);
  });
});
