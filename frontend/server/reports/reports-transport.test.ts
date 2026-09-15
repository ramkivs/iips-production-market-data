/**
 * UI08 (D82) — Reports HTTP transport tests (offline, deterministic).
 *
 * Proves authorization, server-derived tenant/owner, tenant isolation, cross-tenant denial,
 * template limitation, engine-produced content, PIT pinning, byte-identical re-opening and the
 * explicit historical-as-of limitation at the HTTP boundary.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PersistenceService } from '../persistence/persistence-service';
import { resetReportsPersistence } from './reports-service';
import { handleReportsRequest, type ReportSourceProvider } from './reports-transport';
import { createReadExecutor } from '../admin-transport';
import type { GovernedUniverseProvider } from '../p12-request-handler';
import type { OidcVerifier } from '../../src/core/auth/keycloakAdapter';

const METADATA = { issuer: 'http://localhost:8080/realms/iips', jwksUri: 'http://localhost:8080/realms/iips/certs', clientId: 'iips-spa' };

const VINTAGE = {
  asOf: '2026-08-09T00:00:00.000Z',
  dataVersion: 'v1.1-replay-baseline',
  mode: 'SNAPSHOT',
  dataSource: 'governed:certified-v2.0-reference-universe',
  classification: 'REAL',
  contributingSnapshotIds: ['snap_Banking'] as readonly string[],
};

function universe(vintage = VINTAGE): GovernedUniverseProvider {
  return {
    screenerUniverse: async () => [],
    searchUniverse: async () => [],
    securities: async () => [],
    vintage: async () => vintage,
  };
}

const CSIP = {
  intelligence: { portfolioId: 'PF-REAL', scenario: 'Balanced', diversificationScore: 71 },
  ranking: [{ companyId: 'Banking', conviction: 80 }],
  allocation: { recommendation: 'hold', rulesApplied: ['r1'] },
  diversification: { diversificationBand: 'balanced', flags: [] },
  opportunity: { top: [{ companyId: 'Banking' }], rationale: 'r' },
  correlation: { flags: [] },
};
const source: ReportSourceProvider = { csip: () => CSIP };

/**
 * A deterministic stand-in for ReportingEngine.build() — pure, no clock.
 * Signature matches the transport's `buildReport` contract (csip fields are `unknown` there).
 */
let buildCount = 0;
function buildReport(args: {
  reportType: string;
  portfolioId: string;
  csip: { intelligence: unknown; ranking: unknown; allocation: unknown; diversification: unknown; opportunity: unknown; correlation: unknown };
}) {
  buildCount += 1;
  const intelligence = args.csip.intelligence as typeof CSIP.intelligence;
  return {
    reportId: `report-${args.reportType.toLowerCase().replace(/\s+/g, '-')}-${args.portfolioId}`,
    reportType: args.reportType,
    portfolioId: args.portfolioId,
    payload: {
      portfolioId: args.portfolioId,
      scenario: intelligence.scenario,
      diversificationScore: intelligence.diversificationScore,
      ranking: args.csip.ranking,
    },
  };
}

const tmpDirs: string[] = [];
function tmpDir(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'iips-ui08-'));
  tmpDirs.push(d);
  return d;
}
beforeEach(() => { resetReportsPersistence(); buildCount = 0; });
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
  resetReportsPersistence();
});

function store(dir = tmpDir()): PersistenceService {
  return new PersistenceService({ dataDir: dir });
}

function verifier(claims: Record<string, unknown>): OidcVerifier {
  return { verify: vi.fn().mockResolvedValue({ subject: 'u1', claims, expiry: Date.now() / 1000 + 3600 }) };
}
function claimsFor(username: string, role: string, tenant = 'tenant-A'): Record<string, unknown> {
  return { iss: METADATA.issuer, aud: 'iips-spa', preferred_username: username, tenant, realm_access: { roles: [role] } };
}

async function call(
  who: { user: string; role: string; tenant?: string } | null,
  urlPath: string,
  method: 'GET' | 'POST' | 'DELETE',
  s: PersistenceService,
  body?: unknown,
  u: GovernedUniverseProvider = universe(),
): Promise<{ status: number; body: Record<string, unknown> }> {
  const deps = { metadata: METADATA, verifier: verifier(claimsFor(who?.user ?? 'analyst-a', who?.role ?? 'iips-analyst', who?.tenant)) };
  const executor = createReadExecutor(deps);
  const server = http.createServer((req, res) => {
    void handleReportsRequest(req, res, executor, u, source, buildReport, { store: s });
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}${urlPath}`, {
      method,
      headers: {
        ...(who ? { Authorization: 'Bearer t' } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, body: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}

const ANALYST = { user: 'analyst-a', role: 'iips-analyst' };
const VIEWER = { user: 'viewer-a', role: 'iips-viewer' };
const OTHER_TENANT = { user: 'analyst-b', role: 'iips-analyst', tenant: 'tenant-B' };
const d = (b: Record<string, unknown>) => b.data as Record<string, unknown>;
const list = (b: Record<string, unknown>) => b.data as Record<string, unknown>[];

describe('UI08 transport — authorization (fail-closed)', () => {
  it('unauthenticated GET is 401', async () => {
    expect((await call(null, '/api/reports', 'GET', store())).status).toBe(401);
  });

  it('a viewer MAY read reports', async () => {
    expect((await call(VIEWER, '/api/reports', 'GET', store())).status).toBe(200);
  });

  it('a viewer may NOT generate a report (403)', async () => {
    expect((await call(VIEWER, '/api/reports', 'POST', store(), { reportType: 'Executive' })).status).toBe(403);
  });

  it('an analyst may generate a report (201)', async () => {
    const { status, body } = await call(ANALYST, '/api/reports', 'POST', store(), { reportType: 'Executive' });
    expect(status).toBe(201);
    expect(d(body).reportType).toBe('Executive');
  });

  it('a token claiming a foreign tenant is 401', async () => {
    const { status, body } = await call({ user: 'analyst-a', role: 'iips-analyst', tenant: 'tenant-B' }, '/api/reports', 'GET', store());
    expect(status).toBe(401);
    expect(body.error).toBe('no-valid-tenant');
  });
});

describe('UI08 transport — templates and engine-produced content', () => {
  it('advertises exactly the five platform templates', async () => {
    const { body } = await call(ANALYST, '/api/reports', 'GET', store());
    expect(body.templates).toEqual([
      'Executive', 'Investment Committee', 'Portfolio Summary', 'Allocation Recommendation', 'Sector Dashboard',
    ]);
  });

  it('rejects an invented report type (400)', async () => {
    const { status, body } = await call(ANALYST, '/api/reports', 'POST', store(), { reportType: 'Custom Deck' });
    expect(status).toBe(400);
    expect(body.error).toBe('invalid-reportType');
  });

  it('report content comes from the engine — client-supplied payload is ignored', async () => {
    const { body } = await call(ANALYST, '/api/reports', 'POST', store(), {
      reportType: 'Executive',
      payload: { diversificationScore: 999, injected: true },
    });
    const reportBody = d(body).reportBody as Record<string, unknown>;
    expect(reportBody.diversificationScore).toBe(71);
    expect(reportBody.injected).toBeUndefined();
  });

  it('returns the certified P13 UI08 view shape', async () => {
    const { body } = await call(ANALYST, '/api/reports', 'POST', store(), { reportType: 'Executive' });
    const r = d(body);
    expect(r.surfaceName).toBe('UI08');
    expect(r.disposition).toBe('EXTEND');
    expect(r.provenanceView).toBeDefined();
    // AD-17/M-2 preserved by the accepted contract.
    expect(r.replayReproducibilityClaimed).toBe(false);
  });
});

describe('UI08 transport — PIT pinning, byte identity and the stated limitation', () => {
  it('pins dataVersion/asOf/mode on the generated report', async () => {
    const { body } = await call(ANALYST, '/api/reports', 'POST', store(), { reportType: 'Executive' });
    expect(d(body).pitPinning).toEqual({ dataVersion: VINTAGE.dataVersion, asOf: VINTAGE.asOf, mode: VINTAGE.mode });
  });

  it('re-opening a stored report is byte-identical and integrity-verified', async () => {
    const s = store();
    const created = d((await call(ANALYST, '/api/reports', 'POST', s, { reportType: 'Executive' })).body);
    const { body } = await call(ANALYST, `/api/reports/${encodeURIComponent(String(created.reportId))}`, 'GET', s);
    expect(d(body).payloadHash).toBe(created.payloadHash);
    expect(d(body).reportBody).toEqual(created.reportBody);
    expect(d(body).storedIntegrityVerified).toBe(true);
  });

  it('same-vintage regeneration is reported byte-identical on list', async () => {
    const s = store();
    await call(ANALYST, '/api/reports', 'POST', s, { reportType: 'Executive' });
    const { body } = await call(ANALYST, '/api/reports', 'GET', s);
    const reg = list(body)[0].regeneration as Record<string, unknown>;
    expect(reg.sameVintage).toBe(true);
    expect(reg.byteIdentical).toBe(true);
  });

  it('a DIFFERENT current vintage is not-comparable, not a failure', async () => {
    const s = store();
    await call(ANALYST, '/api/reports', 'POST', s, { reportType: 'Executive' });
    const later = universe({ ...VINTAGE, asOf: '2026-12-01T00:00:00.000Z' });
    const { body } = await call(ANALYST, '/api/reports', 'GET', s, undefined, later);
    const reg = list(body)[0].regeneration as Record<string, unknown>;
    expect(reg.sameVintage).toBe(false);
    expect(reg.byteIdentical).toBeNull();
  });

  it('discloses that arbitrary historical as-of regeneration is UNAVAILABLE', async () => {
    const s = store();
    await call(ANALYST, '/api/reports', 'POST', s, { reportType: 'Executive' });
    const { body } = await call(ANALYST, '/api/reports', 'GET', s);
    const lim = list(body)[0].pitLimitation as Record<string, unknown>;
    expect(String(lim.historicalAsOf)).toMatch(/UNAVAILABLE/);
    expect(String(lim.historicalAsOf)).toMatch(/No historical vintage is fabricated/);
    expect(lim.replayReproducibilityClaimed).toBe(false);
    expect(String((body.provenance as Record<string, unknown>).transportSemantics))
      .toMatch(/Arbitrary historical as-of regeneration is UNAVAILABLE/);
  });

  it('records lineage with source, snapshots and generatedAt', async () => {
    const { body } = await call(ANALYST, '/api/reports', 'POST', store(), { reportType: 'Executive' });
    const lineage = d(body).lineage as Record<string, unknown>;
    expect(lineage.dataSource).toBe(VINTAGE.dataSource);
    expect(lineage.contributingSnapshotIds).toEqual(['snap_Banking']);
    expect(lineage.generatedAt).toBeTruthy();
  });
});

describe('UI08 transport — lifecycle and isolation', () => {
  it('deletes a stored report, and an unknown delete is 404', async () => {
    const s = store();
    const created = d((await call(ANALYST, '/api/reports', 'POST', s, { reportType: 'Executive' })).body);
    const id = encodeURIComponent(String(created.reportId));
    expect((await call(ANALYST, `/api/reports/${id}`, 'DELETE', s)).status).toBe(200);
    expect((await call(ANALYST, `/api/reports/${id}`, 'DELETE', s)).status).toBe(404);
  });

  it('an unknown report id is 404', async () => {
    expect((await call(ANALYST, '/api/reports/nope', 'GET', store())).status).toBe(404);
  });

  it('a different tenant sees no reports and cannot read one', async () => {
    const s = store();
    const created = d((await call(ANALYST, '/api/reports', 'POST', s, { reportType: 'Executive' })).body);
    expect(list((await call(OTHER_TENANT, '/api/reports', 'GET', s)).body)).toHaveLength(0);
    expect((await call(OTHER_TENANT, `/api/reports/${encodeURIComponent(String(created.reportId))}`, 'GET', s)).status).toBe(404);
  });

  it('a different owner in the same tenant sees no reports', async () => {
    const s = store();
    await call(ANALYST, '/api/reports', 'POST', s, { reportType: 'Executive' });
    expect(list((await call(VIEWER, '/api/reports', 'GET', s)).body)).toHaveLength(0);
  });

  it('survives a restart over HTTP, byte-identically (journal reconstruction)', async () => {
    const dir = tmpDir();
    const created = d((await call(ANALYST, '/api/reports', 'POST', store(dir), { reportType: 'Executive' })).body);
    const { body } = await call(ANALYST, '/api/reports', 'GET', store(dir));
    expect(list(body)).toHaveLength(1);
    expect(list(body)[0].payloadHash).toBe(created.payloadHash);
    expect(list(body)[0].storedIntegrityVerified).toBe(true);
  });
});
