/**
 * R-3 (D74) — saved-screen durable persistence tests (offline, deterministic).
 *
 * Covers the D74 acceptance criteria: save persistence, retrieval, restart/journal
 * reconstruction, tenant isolation, owner scoping, dedup/record identity, and
 * cross-tenant/cross-owner access denial.
 *
 * Uses only node:fs/os/path via the existing PersistenceService — no new dependency and
 * no new persistence technology. The accepted P12 screener contract is NOT exercised or
 * modified here; these tests cover the transport-layer store only.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PersistenceService } from './persistence-service';
import {
  listScreens,
  readScreen,
  resetSavedScreensService,
  saveScreen,
  savedScreensService,
} from './saved-screens-store';

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const OWNER_1 = 'user-1';
const OWNER_2 = 'user-2';

/** A definition shaped like the certified C6 contract output (stored verbatim). */
const DEFINITION = Object.freeze({
  screenId: 'screen-001',
  tenantId: TENANT_A,
  version: '1.0',
  filters: [{ field: 'MD:pricing.close', op: 'gt', value: 100 }],
  sort: [{ field: 'MD:pricing.close', direction: 'desc' }],
  tieBreakField: 'canonicalSecurityId',
  savedAt: '2026-09-14T00:00:00.000Z',
  pitCapable: true,
});

let dataDir: string;
const svc = () => new PersistenceService({ dataDir });

beforeEach(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'r3-saved-screens-'));
  resetSavedScreensService();
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  resetSavedScreensService();
});

describe('R-3 — saved-screen persistence (D74)', () => {
  it('persists a saved definition and returns a durable record identity', () => {
    const rec = saveScreen(svc(), TENANT_A, OWNER_1, 'screen-001', DEFINITION);
    expect(rec.recordId).toBeTruthy();
    expect(rec.screenId).toBe('screen-001');
    expect(rec.definition).toEqual(DEFINITION);
    expect(rec.createdAt).toBeTruthy();
  });

  it('retrieves a saved definition by record id', () => {
    const s = svc();
    const rec = saveScreen(s, TENANT_A, OWNER_1, 'screen-001', DEFINITION);
    const got = readScreen(s, TENANT_A, OWNER_1, rec.recordId);
    expect(got?.definition).toEqual(DEFINITION);
  });

  it('lists saved screens for the owner', () => {
    const s = svc();
    saveScreen(s, TENANT_A, OWNER_1, 'screen-001', DEFINITION);
    saveScreen(s, TENANT_A, OWNER_1, 'screen-002', { ...DEFINITION, screenId: 'screen-002' });
    const list = listScreens(s, TENANT_A, OWNER_1);
    expect(list).toHaveLength(2);
    expect(list.map((r) => r.screenId).sort()).toEqual(['screen-001', 'screen-002']);
  });

  // --- Restart / journal reconstruction -------------------------------------------
  it('a saved definition survives a fresh service instance (restart)', () => {
    saveScreen(svc(), TENANT_A, OWNER_1, 'screen-001', DEFINITION);

    // A brand-new instance over the same data dir reconstructs from the journal alone.
    const afterRestart = listScreens(svc(), TENANT_A, OWNER_1);
    expect(afterRestart).toHaveLength(1);
    expect(afterRestart[0].definition).toEqual(DEFINITION);
  });

  it('record identity is stable across a restart', () => {
    const before = saveScreen(svc(), TENANT_A, OWNER_1, 'screen-001', DEFINITION);
    const after = readScreen(svc(), TENANT_A, OWNER_1, before.recordId);
    expect(after?.recordId).toBe(before.recordId);
    expect(after?.createdAt).toBe(before.createdAt);
  });

  // --- Tenant isolation / owner scoping -------------------------------------------
  it('cross-tenant retrieval is denied', () => {
    const rec = saveScreen(svc(), TENANT_A, OWNER_1, 'screen-001', DEFINITION);
    expect(readScreen(svc(), TENANT_B, OWNER_1, rec.recordId)).toBeUndefined();
    expect(listScreens(svc(), TENANT_B, OWNER_1)).toHaveLength(0);
  });

  it('cross-owner retrieval within the same tenant is denied', () => {
    const rec = saveScreen(svc(), TENANT_A, OWNER_1, 'screen-001', DEFINITION);
    expect(readScreen(svc(), TENANT_A, OWNER_2, rec.recordId)).toBeUndefined();
    expect(listScreens(svc(), TENANT_A, OWNER_2)).toHaveLength(0);
  });

  it('the same screenId in two tenants yields two independent records', () => {
    const s = svc();
    const a = saveScreen(s, TENANT_A, OWNER_1, 'screen-001', DEFINITION);
    const b = saveScreen(s, TENANT_B, OWNER_1, 'screen-001', { ...DEFINITION, tenantId: TENANT_B });
    expect(a.recordId).not.toBe(b.recordId);
    expect(listScreens(s, TENANT_A, OWNER_1)).toHaveLength(1);
    expect(listScreens(s, TENANT_B, OWNER_1)).toHaveLength(1);
  });

  // --- Dedup / identity -------------------------------------------------------------
  it('re-saving the same screenId is idempotent and returns the existing record', () => {
    const s = svc();
    const first = saveScreen(s, TENANT_A, OWNER_1, 'screen-001', DEFINITION);
    const second = saveScreen(s, TENANT_A, OWNER_1, 'screen-001', DEFINITION);
    expect(second.recordId).toBe(first.recordId);
    expect(listScreens(s, TENANT_A, OWNER_1)).toHaveLength(1);
  });

  it('an unknown record id returns undefined rather than throwing', () => {
    expect(readScreen(svc(), TENANT_A, OWNER_1, 'no-such-record')).toBeUndefined();
  });

  // --- Isolation from other consumers ----------------------------------------------
  it('does not surface records written by another consumer of the same journal', () => {
    const s = svc();
    s.append({ tenantId: TENANT_A, ownerUserId: OWNER_1, dedupKey: 'notification\u0000n-1', payload: { kind: 'other' } });
    saveScreen(s, TENANT_A, OWNER_1, 'screen-001', DEFINITION);
    const list = listScreens(s, TENANT_A, OWNER_1);
    expect(list).toHaveLength(1);
    expect(list[0].screenId).toBe('screen-001');
  });

  it('savedScreensService() returns a stable process-wide instance until reset', () => {
    process.env.IIPS_DATA_DIR = dataDir;
    try {
      expect(savedScreensService()).toBe(savedScreensService());
      resetSavedScreensService();
      expect(savedScreensService()).toBeInstanceOf(PersistenceService);
    } finally {
      delete process.env.IIPS_DATA_DIR;
    }
  });
});
