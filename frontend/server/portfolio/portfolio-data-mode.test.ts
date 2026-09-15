/**
 * D85 — UI12 → Portfolio data-mode propagation tests (offline, deterministic).
 *
 * Covers every D85 §7 criterion:
 *   - SNAPSHOT returns the existing Portfolio data (unchanged);
 *   - LIVE returns LIVE_UNAVAILABLE with NO snapshot data substitution;
 *   - PIT returns PIT_UNAVAILABLE with NO snapshot data substitution;
 *   - the mode comes from the authenticated user's PERSISTED preference;
 *   - tenant/owner isolation remains intact;
 *   - existing authorization behaviour remains intact (mode is never client-supplied).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PersistenceService } from '../persistence/persistence-service';
import { savePreferences, resetSettingsPersistence } from '../settings/settings-service';
import {
  DEGRADED_STATES,
  buildDegradedPortfolio,
  portfolioForMode,
  resolvePortfolioDataMode,
} from './portfolio-data-mode';

const TENANT_A = 'tenant-A';
const TENANT_B = 'tenant-B';
const OWNER_1 = 'analyst-a';
const OWNER_2 = 'analyst-b';

/** Stand-in for the certified computation. Identity is asserted, never recomputed. */
const SNAPSHOT_PAYLOAD = Object.freeze({
  holdings: [{ companyId: 'Banking', weight: 0.25, verdict: 'BUY' }],
  provenance: {
    dataSource: 'certified v2.0 platform (frozen sector engines + CSIP) over frozen v1.1 Replay Baseline inputs',
    freshness: 'SNAPSHOT',
  },
});
let computeCalls = 0;
const computeSnapshot = () => { computeCalls += 1; return SNAPSHOT_PAYLOAD; };

const BASE = { theme: 'light', density: 'comfortable', showDegradedDetail: true } as const;

let dataDir: string;
const svc = () => new PersistenceService({ dataDir });

beforeEach(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd85-portfolio-mode-'));
  resetSettingsPersistence();
  computeCalls = 0;
});
afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  resetSettingsPersistence();
});

describe('D85 — SNAPSHOT preserves existing Portfolio behaviour', () => {
  it('returns the certified payload byte-for-byte, unchanged', () => {
    const out = portfolioForMode('SNAPSHOT', computeSnapshot);
    expect(out).toBe(SNAPSHOT_PAYLOAD);                 // same object — not rebuilt
    expect(JSON.stringify(out)).toBe(JSON.stringify(SNAPSHOT_PAYLOAD));
  });

  it('invokes the existing computation exactly once', () => {
    portfolioForMode('SNAPSHOT', computeSnapshot);
    expect(computeCalls).toBe(1);
  });

  it('preserves the existing SNAPSHOT provenance', () => {
    const out = portfolioForMode('SNAPSHOT', computeSnapshot) as typeof SNAPSHOT_PAYLOAD;
    expect(out.provenance.freshness).toBe('SNAPSHOT');
    expect(out.provenance.dataSource).toMatch(/frozen v1\.1 Replay Baseline inputs/);
  });

  it('is the default for a principal who never saved preferences', () => {
    expect(resolvePortfolioDataMode(TENANT_A, OWNER_1, svc())).toBe('SNAPSHOT');
  });
});

describe('D85 — LIVE returns a governed degraded state, never a fallback', () => {
  it('returns LIVE_UNAVAILABLE', () => {
    const out = buildDegradedPortfolio('LIVE');
    expect(out.state).toBe('LIVE_UNAVAILABLE');
    expect(out.dataMode).toBe('LIVE');
    expect(out.dataAvailable).toBe(false);
  });

  it('NEVER invokes the snapshot computation', () => {
    portfolioForMode('LIVE', computeSnapshot);
    expect(computeCalls).toBe(0);
  });

  it('carries NO portfolio data and no substituted values', () => {
    const out = portfolioForMode('LIVE', computeSnapshot) as Record<string, unknown>;
    expect(out.holdings).toEqual([]);
    const s = JSON.stringify(out);
    expect(s).not.toMatch(/Banking/);        // no baseline holding leaked
    expect(s).not.toMatch(/BUY/);
    expect(s).not.toMatch(/0\.25/);
    // ⚠ The word "Replay Baseline" DOES appear — inside the disclosure sentence stating the
    // baseline was NOT used. Assert the absence of baseline DATA and the presence of the
    // explicit negation, rather than banning the phrase (which would forbid the disclosure).
    expect(out.provenance).not.toMatchObject({ freshness: 'SNAPSHOT' });
    expect(String((out.provenance as Record<string, unknown>).transportSemantics))
      .toMatch(/NOT silently served from the frozen v1\.1 Replay Baseline/);
  });

  it('cites R-2 as the dependency', () => {
    expect(buildDegradedPortfolio('LIVE').dependency).toMatch(/R-2 provider ingestion/);
  });

  it('states explicitly that no fallback or fabrication occurred', () => {
    const t = buildDegradedPortfolio('LIVE').provenance.transportSemantics;
    expect(t).toMatch(/NOT silently served from the frozen v1\.1 Replay Baseline/);
    expect(t).toMatch(/no provider value is substituted or fabricated/);
  });

  it('does not claim SNAPSHOT freshness', () => {
    const p = buildDegradedPortfolio('LIVE').provenance;
    expect(p.freshness).toBe('UNAVAILABLE');
    expect(p.freshness).not.toBe('SNAPSHOT');
  });
});

describe('D85 — PIT returns a governed degraded state, never a fallback', () => {
  it('returns PIT_UNAVAILABLE and never computes a snapshot', () => {
    const out = portfolioForMode('PIT', computeSnapshot) as Record<string, unknown>;
    expect(out.state).toBe('PIT_UNAVAILABLE');
    expect(out.dataAvailable).toBe(false);
    expect(computeCalls).toBe(0);
  });

  it('carries no portfolio data and no substituted values', () => {
    const out = portfolioForMode('PIT', computeSnapshot) as Record<string, unknown>;
    expect(JSON.stringify(out)).not.toMatch(/Banking/);
    expect(out.holdings).toEqual([]);
    expect((out.provenance as Record<string, unknown>).freshness).toBe('UNAVAILABLE');
  });

  it('states that PIT capability is not wired to transport', () => {
    expect(buildDegradedPortfolio('PIT').dependency).toMatch(/NOT wired to transport/);
  });

  it('exposes a closed degraded-state set', () => {
    expect([...DEGRADED_STATES]).toEqual(['LIVE_UNAVAILABLE', 'PIT_UNAVAILABLE']);
  });
});

describe('D85 — mode comes from the authenticated principal persisted preference', () => {
  it('honours a persisted LIVE preference', () => {
    const s = svc();
    savePreferences(TENANT_A, OWNER_1, { ...BASE, defaultDataMode: 'LIVE' }, s);
    expect(resolvePortfolioDataMode(TENANT_A, OWNER_1, s)).toBe('LIVE');
  });

  it('honours a persisted PIT preference', () => {
    const s = svc();
    savePreferences(TENANT_A, OWNER_1, { ...BASE, defaultDataMode: 'PIT' }, s);
    expect(resolvePortfolioDataMode(TENANT_A, OWNER_1, s)).toBe('PIT');
  });

  it('survives a restart — the mode is read from the journal, not memory', () => {
    savePreferences(TENANT_A, OWNER_1, { ...BASE, defaultDataMode: 'LIVE' }, svc());
    expect(resolvePortfolioDataMode(TENANT_A, OWNER_1, svc())).toBe('LIVE');
  });

  it('end-to-end: a persisted LIVE preference yields a degraded response', () => {
    const s = svc();
    savePreferences(TENANT_A, OWNER_1, { ...BASE, defaultDataMode: 'LIVE' }, s);
    const mode = resolvePortfolioDataMode(TENANT_A, OWNER_1, s);
    const out = portfolioForMode(mode, computeSnapshot) as Record<string, unknown>;
    expect(out.state).toBe('LIVE_UNAVAILABLE');
    expect(computeCalls).toBe(0);
  });

  it('end-to-end: a persisted SNAPSHOT preference yields the certified payload', () => {
    const s = svc();
    savePreferences(TENANT_A, OWNER_1, { ...BASE, defaultDataMode: 'SNAPSHOT' }, s);
    const out = portfolioForMode(resolvePortfolioDataMode(TENANT_A, OWNER_1, s), computeSnapshot);
    expect(out).toBe(SNAPSHOT_PAYLOAD);
  });
});

describe('D85 — tenant and owner isolation', () => {
  it('another TENANT is unaffected by this tenant preference', () => {
    const s = svc();
    savePreferences(TENANT_A, OWNER_1, { ...BASE, defaultDataMode: 'LIVE' }, s);
    expect(resolvePortfolioDataMode(TENANT_B, OWNER_1, s)).toBe('SNAPSHOT');
  });

  it('another OWNER in the same tenant is unaffected', () => {
    const s = svc();
    savePreferences(TENANT_A, OWNER_1, { ...BASE, defaultDataMode: 'PIT' }, s);
    expect(resolvePortfolioDataMode(TENANT_A, OWNER_2, s)).toBe('SNAPSHOT');
  });

  it('two principals hold independent modes simultaneously', () => {
    const s = svc();
    savePreferences(TENANT_A, OWNER_1, { ...BASE, defaultDataMode: 'LIVE' }, s);
    savePreferences(TENANT_A, OWNER_2, { ...BASE, defaultDataMode: 'SNAPSHOT' }, s);
    expect(resolvePortfolioDataMode(TENANT_A, OWNER_1, s)).toBe('LIVE');
    expect(resolvePortfolioDataMode(TENANT_A, OWNER_2, s)).toBe('SNAPSHOT');
  });
});

describe('D85 — no client-supplied mode path exists', () => {
  it('resolution takes only server-derived tenant and owner', () => {
    // Signature proof: (tenantId, ownerUserId, store?) — there is no request/query/body param,
    // so a client cannot influence the mode through this function.
    expect(resolvePortfolioDataMode.length).toBeLessThanOrEqual(3);
  });

  it('portfolioForMode accepts only a resolved mode and the existing computation', () => {
    expect(portfolioForMode.length).toBe(2);
  });
});
