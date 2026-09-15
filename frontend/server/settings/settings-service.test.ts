/**
 * UI12 (D80) — settings persistence tests (offline, deterministic).
 *
 * Covers the D80 acceptance criteria: persistence, retrieval, restart/journal reconstruction,
 * tenant isolation, owner scoping, cross-tenant denial — plus fail-closed validation and the
 * append-only revision model.
 *
 * Uses only node:fs/os/path via the existing PersistenceService. No new dependency.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PersistenceService } from '../persistence/persistence-service';
import {
  DEFAULT_PREFERENCES,
  SettingsValidationError,
  readPreferences,
  resetSettingsPersistence,
  savePreferences,
  validatePreferences,
  type UserPreferences,
} from './settings-service';

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const OWNER_1 = 'user-1';
const OWNER_2 = 'user-2';

const CUSTOM: UserPreferences = Object.freeze({
  theme: 'dark',
  density: 'compact',
  defaultDataMode: 'PIT',
  showDegradedDetail: false,
});

let dataDir: string;
const svc = () => new PersistenceService({ dataDir });

beforeEach(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui12-settings-'));
  resetSettingsPersistence();
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  resetSettingsPersistence();
});

describe('UI12 — governed defaults', () => {
  it('returns governed defaults at revision 0 when nothing was ever saved', () => {
    const dto = readPreferences(TENANT_A, OWNER_1, svc());
    expect(dto.preferences).toEqual(DEFAULT_PREFERENCES);
    expect(dto.revision).toBe(0);
    expect(dto.updatedAt).toBeNull();
  });
});

describe('UI12 — persistence and retrieval', () => {
  it('persists preferences and returns them', () => {
    const s = svc();
    const saved = savePreferences(TENANT_A, OWNER_1, CUSTOM, s);
    expect(saved.preferences).toEqual(CUSTOM);
    expect(saved.revision).toBe(1);
    expect(saved.updatedAt).toBeTruthy();
    expect(readPreferences(TENANT_A, OWNER_1, s).preferences).toEqual(CUSTOM);
  });

  it('a later save supersedes the earlier one (append-only revision model)', () => {
    const s = svc();
    savePreferences(TENANT_A, OWNER_1, CUSTOM, s);
    const second = savePreferences(TENANT_A, OWNER_1, { ...CUSTOM, theme: 'light' }, s);
    expect(second.revision).toBe(2);
    const effective = readPreferences(TENANT_A, OWNER_1, s);
    expect(effective.preferences.theme).toBe('light');
    expect(effective.revision).toBe(2);
  });

  // --- Restart / journal reconstruction -------------------------------------------
  it('saved preferences survive a fresh service instance (restart)', () => {
    savePreferences(TENANT_A, OWNER_1, CUSTOM, svc());
    // A brand-new instance over the same data dir reconstructs from the journal alone.
    const afterRestart = readPreferences(TENANT_A, OWNER_1, svc());
    expect(afterRestart.preferences).toEqual(CUSTOM);
    expect(afterRestart.revision).toBe(1);
  });

  it('revision history survives a restart and the newest revision wins', () => {
    const first = svc();
    savePreferences(TENANT_A, OWNER_1, CUSTOM, first);
    savePreferences(TENANT_A, OWNER_1, { ...CUSTOM, defaultDataMode: 'LIVE' }, first);
    const afterRestart = readPreferences(TENANT_A, OWNER_1, svc());
    expect(afterRestart.revision).toBe(2);
    expect(afterRestart.preferences.defaultDataMode).toBe('LIVE');
  });
});

describe('UI12 — tenant isolation and owner scoping', () => {
  it('another tenant sees governed defaults, never this tenant data', () => {
    const s = svc();
    savePreferences(TENANT_A, OWNER_1, CUSTOM, s);
    const other = readPreferences(TENANT_B, OWNER_1, s);
    expect(other.preferences).toEqual(DEFAULT_PREFERENCES);
    expect(other.revision).toBe(0);
  });

  it('another owner in the same tenant sees governed defaults', () => {
    const s = svc();
    savePreferences(TENANT_A, OWNER_1, CUSTOM, s);
    const other = readPreferences(TENANT_A, OWNER_2, s);
    expect(other.preferences).toEqual(DEFAULT_PREFERENCES);
    expect(other.revision).toBe(0);
  });

  it('the same owner id in two tenants keeps two independent preference sets', () => {
    const s = svc();
    savePreferences(TENANT_A, OWNER_1, CUSTOM, s);
    savePreferences(TENANT_B, OWNER_1, { ...CUSTOM, theme: 'light' }, s);
    expect(readPreferences(TENANT_A, OWNER_1, s).preferences.theme).toBe('dark');
    expect(readPreferences(TENANT_B, OWNER_1, s).preferences.theme).toBe('light');
  });

  it('does not surface records written by another consumer of the same journal', () => {
    const s = svc();
    s.append({ tenantId: TENANT_A, ownerUserId: OWNER_1, dedupKey: 'notification\u0000n-1', payload: { kind: 'other' } });
    const dto = readPreferences(TENANT_A, OWNER_1, s);
    expect(dto.revision).toBe(0);
    expect(dto.preferences).toEqual(DEFAULT_PREFERENCES);
  });
});

describe('UI12 — fail-closed validation', () => {
  it('rejects an unknown theme rather than coercing it', () => {
    expect(() => validatePreferences({ ...CUSTOM, theme: 'neon' })).toThrow(SettingsValidationError);
  });

  it('rejects an unknown data mode', () => {
    expect(() => validatePreferences({ ...CUSTOM, defaultDataMode: 'REALTIME' })).toThrow(/invalid-defaultDataMode/);
  });

  it('rejects a non-boolean showDegradedDetail', () => {
    expect(() => validatePreferences({ ...CUSTOM, showDegradedDetail: 'yes' })).toThrow(/invalid-showDegradedDetail/);
  });

  it('rejects a non-object payload', () => {
    expect(() => validatePreferences(null)).toThrow(/preferences-object-required/);
    expect(() => validatePreferences([])).toThrow(/preferences-object-required/);
  });

  it('ignores client-supplied tenant/owner keys — they can never reach storage', () => {
    const s = svc();
    savePreferences(
      TENANT_A,
      OWNER_1,
      { ...CUSTOM, tenantId: 'evil-tenant', ownerUserId: 'evil-user', recordId: 'x' },
      s,
    );
    // Stored payload carries ONLY the four governed preference keys.
    expect(Object.keys(readPreferences(TENANT_A, OWNER_1, s).preferences).sort())
      .toEqual(['defaultDataMode', 'density', 'showDegradedDetail', 'theme']);
    // The smuggled tenant is not readable as a tenant.
    expect(readPreferences('evil-tenant', OWNER_1, s).revision).toBe(0);
  });

  it('applies governed defaults for omitted keys without inventing values', () => {
    expect(validatePreferences({})).toEqual(DEFAULT_PREFERENCES);
  });
});
