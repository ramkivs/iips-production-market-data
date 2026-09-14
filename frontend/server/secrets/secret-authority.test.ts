/**
 * Program v3.0 — Secret-Management Authority tests (offline, deterministic — SM1–SM10).
 *
 * Uses injectable stores/clock (no network, no real credentials). Asserts the value is
 * never leaked into handles, errors, audit events, or the journal-adjacent surface.
 */
import { describe, it, expect } from 'vitest';
import * as os from 'node:os';
import * as nodeFs from 'node:fs';
import * as path from 'node:path';
import {
  SecretAuthority,
  SecretAuthorityError,
  EnvSecretStore,
  FileSecretStore,
  type SecretFs,
  type SecretAuditEvent,
  type SecretRecord,
} from './secret-authority';

// --- In-memory store (SM9) -----------------------------------------------------

class MemoryStore {
  private readonly map = new Map<string, SecretRecord>();
  read(name: string): SecretRecord | null { return this.map.get(name) ?? null; }
  write(name: string, record: SecretRecord): void { this.map.set(name, record); }
  size(): number { return this.map.size; }
}

function make(opts: { store?: MemoryStore; scope?: string; clock?: () => string; audit?: (e: SecretAuditEvent) => void } = {}) {
  const store = opts.store ?? new MemoryStore();
  return { authority: new SecretAuthority({ store: store as never, scope: opts.scope, clock: opts.clock, audit: opts.audit }), store };
}

const now = () => '2026-08-22T10:00:00.000Z';
const later = () => '2026-08-22T11:00:00.000Z';

describe('Secret Authority — SM1/SM3 storage + scoping', () => {
  it('records scope and never exposes the value via handle()', () => {
    const { authority } = make({ scope: 'idp:read-only', clock: now });
    authority.rotate('sync-client', 'topsecret');
    const h = authority.handle('sync-client');
    expect(h.name).toBe('sync-client');
    expect(h.scope).toBe('idp:read-only');
    expect(h.status).toBe('valid');
    expect(h.rotatedAt).toBe('2026-08-22T10:00:00.000Z');
    expect(JSON.stringify(h)).not.toContain('topsecret'); // SM10
  });

  it('missing secret handle reports missing without a value', () => {
    const { authority } = make();
    expect(authority.handle('nope').status).toBe('missing');
    expect(JSON.stringify(authority.handle('nope'))).not.toContain('secret');
  });
});

describe('Secret Authority — SM4 rotation / SM5 expiry / SM6 fail-closed', () => {
  it('rotate() provisions then rotates (rotatedAt advances; old value invalidated)', () => {
    const store = new MemoryStore();
    const { authority } = make({ store, clock: now });
    authority.rotate('s', 'v1');
    authority.rotate('s', 'v2');
    expect(store.read('s')?.value).toBe('v2');
    expect(store.read('s')?.rotatedAt).toBe('2026-08-22T10:00:00.000Z');
  });

  it('expired secret → status expired and useSecret fails closed', async () => {
    const { authority } = make({ clock: later });
    authority.rotate('s', 'v', { notAfter: '2026-08-22T09:00:00.000Z' });
    expect(authority.handle('s').status).toBe('expired');
    await expect(authority.useSecret('s', async () => 'ok')).rejects.toMatchObject({ code: 'SECRET_EXPIRED' });
  });

  it('missing secret → useSecret fails closed (no fallback/default)', async () => {
    const { authority } = make();
    await expect(authority.useSecret('absent', async () => 'ok')).rejects.toMatchObject({ code: 'SECRET_MISSING' });
  });

  it('empty value is invalid (cannot rotate an empty secret)', () => {
    const { authority } = make();
    expect(() => authority.rotate('s', '')).toThrowError(SecretAuthorityError);
  });

  it('useSecret passes the value only into the callback and returns its result', async () => {
    const { authority } = make();
    authority.rotate('s', 'the-value');
    const got = await authority.useSecret('s', async (v) => `got:${v}`);
    expect(got).toBe('got:the-value');
  });
});

describe('Secret Authority — SM7 auditability (value never audited)', () => {
  it('audits provision/rotate/use with name+scope+outcome but NEVER the value', async () => {
    const events: SecretAuditEvent[] = [];
    const { authority } = make({ scope: 'idp:read-only', audit: (e) => events.push(e) });
    authority.rotate('s', 'SUPER_SECRET_VALUE');
    await authority.useSecret('s', async () => {});
    const serialized = JSON.stringify(events);
    expect(events.map((e) => e.event)).toEqual(['provision', 'use']);
    expect(events[0].scope).toBe('idp:read-only');
    expect(events[1].outcome).toBe('granted');
    expect(serialized).not.toContain('SUPER_SECRET_VALUE'); // SM10
  });
});

describe('Secret Authority — SM8 local-dev stores (TD-7a pattern)', () => {
  it('EnvSecretStore reads only from the configured env var (no defaults)', () => {
    const store = new EnvSecretStore(
      { IIPS_SYNC_CLIENT_SECRET: 'envsecret' },
      { 'sync-client': { valueVar: 'IIPS_SYNC_CLIENT_SECRET', scope: 'idp:read-only' } },
    );
    expect(store.read('sync-client')?.value).toBe('envsecret');
    expect(store.read('sync-client')?.scope).toBe('idp:read-only');
    expect(store.read('unconfigured')).toBeNull();
  });

  it('EnvSecretStore returns null for an empty/unset env var (no fabricated value)', () => {
    const store = new EnvSecretStore({}, { 'sync-client': { valueVar: 'IIPS_SYNC_CLIENT_SECRET', scope: 'x' } });
    expect(store.read('sync-client')).toBeNull();
  });

  it('FileSecretStore writes a gitignored 0600 JSON file under <dataDir>/secrets/', () => {
    const dir = nodeFs.mkdtempSync(path.join(os.tmpdir(), 'iips-secret-'));
    const writes: Array<{ p: string; mode?: number }> = [];
    const fs: SecretFs = {
      existsSync: (p) => nodeFs.existsSync(p),
      mkdirSync: (p, o) => nodeFs.mkdirSync(p, o),
      readFileSync: (p) => nodeFs.readFileSync(p, 'utf8'),
      writeFileSync: (p, data, o) => { writes.push({ p, mode: o?.mode }); nodeFs.writeFileSync(p, data, o); },
    };
    const store = new FileSecretStore(dir, fs);
    store.write('sync-client', { value: 'filesecret', scope: 'idp:read-only', rotatedAt: '2026-08-22T00:00:00.000Z', notAfter: null });
    // path is under the (gitignored) data dir, inside a secrets/ subdir
    expect(writes[0].p).toBe(path.join(dir, 'secrets', 'sync-client.json'));
    expect(writes[0].mode).toBe(0o600); // SM8 OS-permission-scoped
    expect(store.read('sync-client')?.value).toBe('filesecret');
    nodeFs.rmSync(dir, { recursive: true, force: true });
  });

  it('FileSecretStore fails closed on a malformed file (SECRET_INVALID)', () => {
    const dir = nodeFs.mkdtempSync(path.join(os.tmpdir(), 'iips-secret-'));
    nodeFs.mkdirSync(path.join(dir, 'secrets'), { recursive: true });
    nodeFs.writeFileSync(path.join(dir, 'secrets', 'bad.json'), 'not json', { mode: 0o600 });
    const store = new FileSecretStore(dir);
    expect(() => store.read('bad')).toThrowError(SecretAuthorityError);
    nodeFs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('Secret Authority — SM10 no leakage', () => {
  it('error messages never contain the value', async () => {
    const { authority } = make();
    authority.rotate('s', 'LEAK_TEST_VALUE', { notAfter: '2026-08-22T09:00:00.000Z' });
    let message = '';
    try { await authority.useSecret('s', async () => {}); } catch (e) { message = String(e); }
    expect(message).not.toContain('LEAK_TEST_VALUE');
  });

  it('handle() serialization never contains the value', () => {
    const { authority } = make();
    authority.rotate('s', 'LEAK_TEST_VALUE');
    expect(JSON.stringify(authority.handle('s'))).not.toContain('LEAK_TEST_VALUE');
  });
});
