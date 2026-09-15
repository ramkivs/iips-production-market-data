/**
 * UI10 (D83) — Collaboration HTTP transport + resolver tests (offline, deterministic).
 *
 * Proves authorization, server-derived identity, tenant isolation, cross-tenant denial,
 * governed-reference integrity, mention resolution, assignment, activity, NS-5 pinning and
 * vintage-mismatch disclosure at the HTTP boundary — plus the roster-backed resolver.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PersistenceService } from '../persistence/persistence-service';
import { resetCollaborationPersistence, type CollaborationResolvers } from './collaboration-service';
import { handleCollaborationRequest } from './collaboration-transport';
import { buildCollaborationResolversFor, tenantMembersFrom } from './collaboration-resolvers';
import { DIRECTORY_OWNER, DIRECTORY_TENANT } from '../directory/roster-directory';
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

const resolvers: CollaborationResolvers = {
  resolveObject: (tenantId, ref) =>
    tenantId === 'tenant-A' && ((ref.kind === 'company' && ref.id === 'Banking') || (ref.kind === 'evidence' && ref.id === 'ev_Banking')),
  tenantMembers: (tenantId) => (tenantId === 'tenant-A' ? ['analyst-a', 'analyst-b', 'viewer-a'] : []),
};

const tmpDirs: string[] = [];
function tmpDir(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'iips-ui10-'));
  tmpDirs.push(d);
  return d;
}
beforeEach(() => resetCollaborationPersistence());
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
  resetCollaborationPersistence();
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
    void handleCollaborationRequest(req, res, executor, u, () => resolvers, { store: s });
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
const SUBJECT = { kind: 'company', id: 'Banking' };

describe('UI10 transport — authorization (fail-closed)', () => {
  it('unauthenticated GET is 401', async () => {
    expect((await call(null, '/api/collaboration', 'GET', store())).status).toBe(401);
  });

  it('a viewer MAY read threads', async () => {
    expect((await call(VIEWER, '/api/collaboration', 'GET', store())).status).toBe(200);
  });

  it('a viewer may NOT open a thread (403)', async () => {
    expect((await call(VIEWER, '/api/collaboration', 'POST', store(), { threadId: 'T-1', subject: SUBJECT })).status).toBe(403);
  });

  it('an analyst may open a thread (201)', async () => {
    const { status, body } = await call(ANALYST, '/api/collaboration', 'POST', store(), { threadId: 'T-1', subject: SUBJECT });
    expect(status).toBe(201);
    expect(d(body).surfaceName).toBe('UI10');
    expect(d(body).disposition).toBe('NEW');
  });

  it('a foreign tenant claim is 401', async () => {
    const { status, body } = await call({ user: 'analyst-a', role: 'iips-analyst', tenant: 'tenant-B' }, '/api/collaboration', 'GET', store());
    expect(status).toBe(401);
    expect(body.error).toBe('no-valid-tenant');
  });
});

describe('UI10 transport — governed reference integrity', () => {
  it('rejects an unresolvable governed object (404)', async () => {
    const { status, body } = await call(ANALYST, '/api/collaboration', 'POST', store(), { threadId: 'T-x', subject: { kind: 'company', id: 'NOPE' } });
    expect(status).toBe(404);
    expect(body.error).toBe('governed-object-not-found');
  });

  it('rejects an object kind outside the governed set (400)', async () => {
    const { status, body } = await call(ANALYST, '/api/collaboration', 'POST', store(), { threadId: 'T-x', subject: { kind: 'provider-quote', id: 'X' } });
    expect(status).toBe(400);
    expect(body.error).toBe('invalid-object-kind');
  });

  it('advertises only governed object kinds — no provider kind', async () => {
    const { body } = await call(ANALYST, '/api/collaboration', 'GET', store());
    expect(body.objectKinds).toEqual(['evidence', 'company', 'watchlist', 'report']);
  });

  it('accepts a comment citing a resolvable governed object', async () => {
    const s = store();
    await call(ANALYST, '/api/collaboration', 'POST', s, { threadId: 'T-1', subject: SUBJECT });
    const { status, body } = await call(ANALYST, '/api/collaboration/T-1/comments', 'POST', s, {
      text: 'compare', references: [{ kind: 'evidence', id: 'ev_Banking' }],
    });
    expect(status).toBe(201);
    expect((d(body).comments as Record<string, unknown>[])[0].references).toEqual([{ kind: 'evidence', id: 'ev_Banking' }]);
  });
});

describe('UI10 transport — mentions, assignment, activity', () => {
  it('accepts a mention of a tenant member and rejects an unknown handle', async () => {
    const s = store();
    await call(ANALYST, '/api/collaboration', 'POST', s, { threadId: 'T-1', subject: SUBJECT });
    expect((await call(ANALYST, '/api/collaboration/T-1/comments', 'POST', s, { text: 'hi', mentions: ['viewer-a'] })).status).toBe(201);
    const bad = await call(ANALYST, '/api/collaboration/T-1/comments', 'POST', s, { text: 'hi', mentions: ['@ghost'] });
    expect(bad.status).toBe(404);
    expect(bad.body.error).toBe('mention-not-resolvable');
  });

  it('assigns and unassigns; unknown assignee is 404', async () => {
    const s = store();
    await call(ANALYST, '/api/collaboration', 'POST', s, { threadId: 'T-1', subject: SUBJECT });
    const ok = await call(ANALYST, '/api/collaboration/T-1/assignment', 'POST', s, { assigneeUserId: 'analyst-b' });
    expect(ok.status).toBe(200);
    expect((d(ok.body).assignment as Record<string, unknown>).assigneeUserId).toBe('analyst-b');
    expect((await call(ANALYST, '/api/collaboration/T-1/assignment', 'DELETE', s)).status).toBe(200);
    expect((await call(ANALYST, '/api/collaboration/T-1/assignment', 'DELETE', s)).status).toBe(404);
    expect((await call(ANALYST, '/api/collaboration/T-1/assignment', 'POST', s, { assigneeUserId: 'stranger' })).status).toBe(404);
  });

  it('records an activity log', async () => {
    const s = store();
    await call(ANALYST, '/api/collaboration', 'POST', s, { threadId: 'T-1', subject: SUBJECT });
    await call(ANALYST, '/api/collaboration/T-1/comments', 'POST', s, { text: 'x' });
    const { body } = await call(ANALYST, '/api/collaboration/T-1', 'GET', s);
    expect((d(body).activity as Record<string, unknown>[]).map((a) => a.kind)).toEqual(['thread-created', 'comment-added']);
  });

  it('deletes a comment and a thread; unknown deletes are 404', async () => {
    const s = store();
    await call(ANALYST, '/api/collaboration', 'POST', s, { threadId: 'T-1', subject: SUBJECT });
    const withComment = await call(ANALYST, '/api/collaboration/T-1/comments', 'POST', s, { text: 'x' });
    const cid = String((d(withComment.body).comments as Record<string, unknown>[])[0].commentId);
    expect((await call(ANALYST, `/api/collaboration/T-1/comments/${encodeURIComponent(cid)}`, 'DELETE', s)).status).toBe(200);
    expect((await call(ANALYST, `/api/collaboration/T-1/comments/${encodeURIComponent(cid)}`, 'DELETE', s)).status).toBe(404);
    expect((await call(ANALYST, '/api/collaboration/T-1', 'DELETE', s)).status).toBe(200);
    expect((await call(ANALYST, '/api/collaboration/T-1', 'DELETE', s)).status).toBe(404);
  });
});

describe('UI10 transport — NS-5 pinning and disclosure', () => {
  it('pins the vintage on the thread and on every comment (accepted P13 contract)', async () => {
    const s = store();
    await call(ANALYST, '/api/collaboration', 'POST', s, { threadId: 'T-1', subject: SUBJECT });
    const { body } = await call(ANALYST, '/api/collaboration/T-1/comments', 'POST', s, { text: 'x' });
    expect(d(body).pinnedVintage).toEqual({ dataVersion: VINTAGE.dataVersion, asOf: VINTAGE.asOf, mode: VINTAGE.mode });
    // `_pinnedVintage` is stamped by buildCollaborationView, unmodified.
    expect((d(body).comments as Record<string, unknown>[])[0]._pinnedVintage)
      .toEqual({ dataVersion: VINTAGE.dataVersion, asOf: VINTAGE.asOf, mode: VINTAGE.mode });
  });

  it('discloses a vintage MISMATCH without re-pinning', async () => {
    const s = store();
    await call(ANALYST, '/api/collaboration', 'POST', s, { threadId: 'T-1', subject: SUBJECT });
    const later = universe({ ...VINTAGE, asOf: '2026-12-01T00:00:00.000Z', dataVersion: 'v1.2' });
    const { body } = await call(ANALYST, '/api/collaboration', 'GET', s, undefined, later);
    const vs = list(body)[0].vintageStatus as Record<string, unknown>;
    expect(vs.matchesCurrent).toBe(false);
    expect((vs.pinned as Record<string, unknown>).asOf).toBe(VINTAGE.asOf); // unchanged
    expect(String(vs.disclosure)).toMatch(/NOT retrievable/);
    expect(String(vs.disclosure)).toMatch(/not re-pinned/);
  });

  it('carries the scope statement including the no-ACL boundary', async () => {
    const { body } = await call(ANALYST, '/api/collaboration', 'GET', store());
    const scope = body.scope as Record<string, unknown>;
    expect(String(scope.sharing)).toMatch(/no object-level ACL/);
    expect(String(scope.vintageAvailability)).toMatch(/No historical vintage is fabricated/);
    expect(String((body.provenance as Record<string, unknown>).transportSemantics)).toMatch(/NS-5/);
  });
});

describe('UI10 transport — isolation and durability', () => {
  it('a different tenant sees no threads and cannot read one', async () => {
    const s = store();
    await call(ANALYST, '/api/collaboration', 'POST', s, { threadId: 'T-1', subject: SUBJECT });
    expect(list((await call(OTHER_TENANT, '/api/collaboration', 'GET', s)).body)).toHaveLength(0);
    expect((await call(OTHER_TENANT, '/api/collaboration/T-1', 'GET', s)).status).toBe(404);
  });

  it('a different owner in the same tenant sees no threads', async () => {
    const s = store();
    await call(ANALYST, '/api/collaboration', 'POST', s, { threadId: 'T-1', subject: SUBJECT });
    expect(list((await call(VIEWER, '/api/collaboration', 'GET', s)).body)).toHaveLength(0);
  });

  it('survives a restart over HTTP (journal reconstruction)', async () => {
    const dir = tmpDir();
    await call(ANALYST, '/api/collaboration', 'POST', store(dir), { threadId: 'T-1', subject: SUBJECT });
    await call(ANALYST, '/api/collaboration/T-1/comments', 'POST', store(dir), { text: 'durable' });
    const { body } = await call(ANALYST, '/api/collaboration', 'GET', store(dir));
    expect(list(body)).toHaveLength(1);
    expect(list(body)[0].totalComments).toBe(1);
  });
});

describe('UI10 resolvers — roster-backed membership', () => {
  it('returns enabled members of exactly one tenant from the directory snapshot', () => {
    const s = store();
    s.append({
      tenantId: DIRECTORY_TENANT, ownerUserId: DIRECTORY_OWNER, dedupKey: 'sync-1',
      payload: {
        syncId: 'sync-1', syncedAt: '2026-09-15T00:00:00.000Z', realm: 'iips',
        tenants: {
          'tenant-A': [
            { userId: 'analyst-a', roles: ['iips-analyst'], enabled: true },
            { userId: 'disabled-a', roles: ['iips-viewer'], enabled: false },
          ],
          'tenant-B': [{ userId: 'analyst-b', roles: ['iips-analyst'], enabled: true }],
        },
      },
    });
    expect(tenantMembersFrom(s, 'tenant-A')).toEqual(['analyst-a']); // disabled excluded
    expect(tenantMembersFrom(s, 'tenant-B')).toEqual(['analyst-b']); // never crosses tenants
  });

  it('FAILS CLOSED with no members when the directory has never synced', () => {
    expect(tenantMembersFrom(store(), 'tenant-A')).toEqual([]);
  });

  it('resolves watchlist/report references only for the OWNING principal', async () => {
    const wlStore = store();
    const wl = await import('../watchlists/watchlists-service');
    wl.createWatchlist('tenant-A', 'analyst-a', 'wl-1', 'mine', wlStore);

    const mine = buildCollaborationResolversFor('analyst-a', () => ['Banking'], { watchlistsStore: wlStore, directoryStore: store() });
    const other = buildCollaborationResolversFor('analyst-b', () => ['Banking'], { watchlistsStore: wlStore, directoryStore: store() });

    expect(await mine.resolveObject('tenant-A', { kind: 'watchlist', id: 'wl-1' })).toBe(true);
    // Another principal cannot cite it — owner scoping holds at the reference boundary.
    expect(await other.resolveObject('tenant-A', { kind: 'watchlist', id: 'wl-1' })).toBe(false);
    // Governed company identities come from the certified universe.
    expect(await mine.resolveObject('tenant-A', { kind: 'company', id: 'Banking' })).toBe(true);
    expect(await mine.resolveObject('tenant-A', { kind: 'company', id: 'Ghost' })).toBe(false);
  });
});
