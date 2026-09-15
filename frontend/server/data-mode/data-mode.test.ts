/**
 * D89 — global UI12 data-mode propagation tests (offline, deterministic).
 *
 * Covers the D89 non-negotiable contract across every mode-aware surface:
 *   - SNAPSHOT byte-identical to the direct certified call (the D54 §97 gate);
 *   - LIVE  → LIVE_UNAVAILABLE, never a Snapshot fallback;
 *   - PIT   → PIT_UNAVAILABLE, never a Snapshot fallback;
 *   - mode read from the authenticated principal's persisted UI12 preference;
 *   - tenant/owner isolation;
 *   - no client-supplied mode authority;
 *   - Macro EXEMPT (never routed through this module).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PersistenceService } from '../persistence/persistence-service';
import { savePreferences, resetSettingsPersistence } from '../settings/settings-service';
import {
  DEGRADED_STATES,
  buildDegradedResponse,
  dispatchForPrincipal,
  forMode,
  resolveDataMode,
} from './data-mode';
import {
  computeCertifiedExecutive,
  computeCertifiedPortfolio,
  computeCertifiedDecisionMatrix,
  computeCertifiedCrossSector,
  computeCertifiedCompany,
  computeCertifiedEvidence,
  computeCertifiedReplay,
} from '../executive-transport';

const TENANT_A = 'tenant-A';
const TENANT_B = 'tenant-B';
const OWNER_1 = 'analyst-a';
const OWNER_2 = 'analyst-b';
const BASE = { theme: 'light', density: 'comfortable', showDegradedDetail: true } as const;

/** Every certified computation now reachable through the shared mode seam. */
const CERTIFIED: [string, () => unknown][] = [
  ['Executive', computeCertifiedExecutive],
  ['Portfolio', computeCertifiedPortfolio],
  ['Decision Matrix', computeCertifiedDecisionMatrix],
  ['Cross-Sector', computeCertifiedCrossSector],
  ['Company', () => computeCertifiedCompany('Banking')],
  ['Evidence', () => computeCertifiedEvidence('Banking')],
  ['Replay', () => computeCertifiedReplay('Banking')],
];

let dataDir: string;
const svc = () => new PersistenceService({ dataDir });

beforeEach(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd89-data-mode-'));
  resetSettingsPersistence();
});
afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  resetSettingsPersistence();
});

describe('D89 — SNAPSHOT byte-equivalence (D54 §97 gate)', () => {
  for (const [name, fn] of CERTIFIED) {
    it(`${name}: SNAPSHOT is byte-identical to the direct certified call`, () => {
      expect(JSON.stringify(forMode(name, 'SNAPSHOT', fn))).toBe(JSON.stringify(fn()));
    });
  }

  it('SNAPSHOT returns the certified object itself, never a rewrapped copy', () => {
    const marker = { certified: true };
    expect(forMode('Executive', 'SNAPSHOT', () => marker)).toBe(marker);
  });

  it('SNAPSHOT is the governed default when no preference was ever saved', () => {
    expect(resolveDataMode(TENANT_A, OWNER_1, svc())).toBe('SNAPSHOT');
    const marker = { certified: true };
    expect(dispatchForPrincipal('Executive', { tenantId: TENANT_A, ownerUserId: OWNER_1 }, () => marker, svc())).toBe(marker);
  });

  it('SNAPSHOT applies when no owner can be resolved — no owner is invented', () => {
    const marker = { certified: true };
    expect(dispatchForPrincipal('Executive', { tenantId: TENANT_A, ownerUserId: undefined }, () => marker, svc())).toBe(marker);
  });
});

describe('D89 — LIVE never falls back to SNAPSHOT', () => {
  for (const [name, fn] of CERTIFIED) {
    it(`${name}: LIVE returns LIVE_UNAVAILABLE and never computes the snapshot`, () => {
      let calls = 0;
      const out = forMode(name, 'LIVE', () => { calls += 1; return fn(); }) as Record<string, unknown>;
      expect(calls).toBe(0);
      expect(out.state).toBe('LIVE_UNAVAILABLE');
      expect(out.dataAvailable).toBe(false);
      expect(out.surface).toBe(name);
    });
  }

  it('cites R-2 and states no substitution occurred', () => {
    const out = buildDegradedResponse('Executive', 'LIVE');
    expect(out.dependency).toMatch(/R-2 provider ingestion/);
    expect(out.provenance.transportSemantics).toMatch(/NOT silently served from the frozen v1\.1 Replay Baseline/);
    expect(out.provenance.transportSemantics).toMatch(/no provider value is substituted or fabricated/);
  });

  it('never claims SNAPSHOT freshness', () => {
    expect(buildDegradedResponse('Executive', 'LIVE').provenance.freshness).toBe('UNAVAILABLE');
  });

  it('carries no certified payload fields', () => {
    const s = JSON.stringify(buildDegradedResponse('Executive', 'LIVE'));
    expect(s).not.toMatch(/"portfolio"|"ranking"|"decisions"|"companies"/);
  });
});

describe('D89 — PIT never falls back to SNAPSHOT', () => {
  for (const [name, fn] of CERTIFIED) {
    it(`${name}: PIT returns PIT_UNAVAILABLE and never computes the snapshot`, () => {
      let calls = 0;
      const out = forMode(name, 'PIT', () => { calls += 1; return fn(); }) as Record<string, unknown>;
      expect(calls).toBe(0);
      expect(out.state).toBe('PIT_UNAVAILABLE');
      expect(out.dataAvailable).toBe(false);
    });
  }

  it('states PIT capability is not wired to transport', () => {
    expect(buildDegradedResponse('Executive', 'PIT').dependency).toMatch(/NOT wired to transport/);
  });

  it('exposes a closed degraded-state set', () => {
    expect([...DEGRADED_STATES]).toEqual(['LIVE_UNAVAILABLE', 'PIT_UNAVAILABLE']);
  });
});

describe('D89 — mode comes from the authenticated persisted preference', () => {
  it('honours LIVE across every surface', () => {
    const s = svc();
    savePreferences(TENANT_A, OWNER_1, { ...BASE, defaultDataMode: 'LIVE' }, s);
    for (const [name, fn] of CERTIFIED) {
      const out = dispatchForPrincipal(name, { tenantId: TENANT_A, ownerUserId: OWNER_1 }, fn, s) as Record<string, unknown>;
      expect(out.state).toBe('LIVE_UNAVAILABLE');
    }
  });

  it('honours PIT across every surface', () => {
    const s = svc();
    savePreferences(TENANT_A, OWNER_1, { ...BASE, defaultDataMode: 'PIT' }, s);
    for (const [name, fn] of CERTIFIED) {
      const out = dispatchForPrincipal(name, { tenantId: TENANT_A, ownerUserId: OWNER_1 }, fn, s) as Record<string, unknown>;
      expect(out.state).toBe('PIT_UNAVAILABLE');
    }
  });

  it('survives a restart — read from the journal, not memory', () => {
    savePreferences(TENANT_A, OWNER_1, { ...BASE, defaultDataMode: 'LIVE' }, svc());
    expect(resolveDataMode(TENANT_A, OWNER_1, svc())).toBe('LIVE');
  });
});

describe('D89 — tenant and owner isolation', () => {
  it('another tenant is unaffected', () => {
    const s = svc();
    savePreferences(TENANT_A, OWNER_1, { ...BASE, defaultDataMode: 'LIVE' }, s);
    expect(resolveDataMode(TENANT_B, OWNER_1, s)).toBe('SNAPSHOT');
  });

  it('another owner in the same tenant is unaffected', () => {
    const s = svc();
    savePreferences(TENANT_A, OWNER_1, { ...BASE, defaultDataMode: 'PIT' }, s);
    expect(resolveDataMode(TENANT_A, OWNER_2, s)).toBe('SNAPSHOT');
  });
});

describe('D89 — no client-supplied mode authority', () => {
  it('resolution accepts only server-derived identity', () => {
    // (tenantId, ownerUserId, store?) — no request/query/body parameter exists.
    expect(resolveDataMode.length).toBeLessThanOrEqual(3);
  });

  it('dispatch accepts only a principal and the certified computation', () => {
    expect(dispatchForPrincipal.length).toBeLessThanOrEqual(4);
  });
});

describe('D89 — Macro exemption (WP-MACRO-03)', () => {
  it('/api/macro is NOT routed through the data-mode seam', () => {
    const transport = fs.readFileSync(
      path.join(process.cwd(), 'server', 'executive-transport.ts'), 'utf8',
    );
    // The macro handler must dispatch to its own read handler, never through mode dispatch.
    const macroBlock = transport.slice(transport.indexOf("surface === 'macro'"), transport.indexOf("surface === 'macro'") + 400);
    expect(macroBlock).toMatch(/handleMacroReadRequest/);
    expect(macroBlock).not.toMatch(/dispatchForPrincipal/);
  });

  it('the macro payload keeps freshness LIVE, never SNAPSHOT', () => {
    const transport = fs.readFileSync(
      path.join(process.cwd(), 'server', 'executive-transport.ts'), 'utf8',
    );
    expect(transport).toMatch(/dataSource: 'MoSPI National Statistical Office',\s*\n\s*freshness: 'LIVE'/);
  });
});
