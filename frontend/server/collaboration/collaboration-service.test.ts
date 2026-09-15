/**
 * UI10 (D83) — collaboration persistence, NS-5 pinning and reference-integrity tests.
 *
 * Covers the D83 §18 criteria at the service layer: persistence, retrieval, restart/journal
 * reconstruction, tenant isolation, owner scoping, cross-tenant denial, governed-reference
 * integrity, mention resolution, assignment, activity, NS-5 vintage pinning and vintage
 * mismatch disclosure.
 *
 * Offline and deterministic — node:fs/os/path via the existing PersistenceService only.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PersistenceService } from '../persistence/persistence-service';
import {
  COLLABORATION_SCOPE,
  CollaborationValidationError,
  addComment,
  assignThread,
  createThread,
  deleteComment,
  deleteThread,
  listThreads,
  readThread,
  resetCollaborationPersistence,
  unassignThread,
  validateRef,
  vintageStatus,
  type CollaborationResolvers,
  type PinnedVintage,
} from './collaboration-service';

const TENANT_A = 'tenant-A';
const TENANT_B = 'tenant-B';
const OWNER_1 = 'analyst-a';
const OWNER_2 = 'analyst-b';

const V1: PinnedVintage = { dataVersion: 'v1.1-replay-baseline', asOf: '2026-08-09T00:00:00.000Z', mode: 'SNAPSHOT' };
const V2: PinnedVintage = { dataVersion: 'v1.2', asOf: '2026-12-01T00:00:00.000Z', mode: 'SNAPSHOT' };

const SUBJECT = { kind: 'company', id: 'Banking' };

/** Governed objects that exist; members of tenant-A only. */
const resolvers: CollaborationResolvers = {
  resolveObject: (tenantId, ref) =>
    tenantId === TENANT_A && ((ref.kind === 'company' && ref.id === 'Banking') || (ref.kind === 'evidence' && ref.id === 'ev_Banking')),
  tenantMembers: (tenantId) => (tenantId === TENANT_A ? ['analyst-a', 'analyst-b', 'viewer-a'] : []),
};

let dataDir: string;
const svc = () => new PersistenceService({ dataDir });
const open1 = (s: PersistenceService) => createThread(TENANT_A, OWNER_1, 'T-1', SUBJECT, V1, resolvers, s);

beforeEach(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui10-collab-'));
  resetCollaborationPersistence();
});
afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  resetCollaborationPersistence();
});

describe('UI10 — governed reference integrity (INT-013)', () => {
  it('opens a thread on a governed object', async () => {
    const t = await open1(svc());
    expect(t.threadId).toBe('T-1');
    expect(t.subject).toEqual(SUBJECT);
  });

  it('rejects an object kind outside the closed governed set — no provider records', () => {
    expect(() => validateRef({ kind: 'provider-quote', id: 'X' })).toThrow(/invalid-object-kind/);
    expect(() => validateRef({ kind: 'company', id: '' })).toThrow(/invalid-object-id/);
    expect(() => validateRef('company:Banking')).toThrow(/governed-ref-required/);
  });

  it('rejects a thread on an UNRESOLVABLE governed object (404)', async () => {
    await expect(createThread(TENANT_A, OWNER_1, 'T-x', { kind: 'company', id: 'NOPE' }, V1, resolvers, svc()))
      .rejects.toMatchObject({ status: 404, message: 'governed-object-not-found' });
  });

  it('rejects a reference that resolves only in ANOTHER tenant', async () => {
    await expect(createThread(TENANT_B, OWNER_1, 'T-x', SUBJECT, V1, resolvers, svc()))
      .rejects.toMatchObject({ status: 404 });
  });

  it('rejects a comment citing an unresolvable object, storing nothing', async () => {
    const s = svc();
    await open1(s);
    await expect(addComment(TENANT_A, OWNER_1, 'T-1', { text: 'see this', references: [{ kind: 'report', id: 'ghost' }] }, V1, resolvers, s))
      .rejects.toMatchObject({ status: 404 });
    expect(readThread(TENANT_A, OWNER_1, 'T-1', s)!.comments).toHaveLength(0);
  });

  it('accepts a comment citing a resolvable governed object (sharing by reference)', async () => {
    const s = svc();
    await open1(s);
    const t = await addComment(TENANT_A, OWNER_1, 'T-1', { text: 'compare', references: [{ kind: 'evidence', id: 'ev_Banking' }] }, V1, resolvers, s);
    expect(t.comments[0].references).toEqual([{ kind: 'evidence', id: 'ev_Banking' }]);
  });
});

describe('UI10 — mentions resolve against the tenant roster', () => {
  it('accepts a mention of a tenant member', async () => {
    const s = svc();
    await open1(s);
    const t = await addComment(TENANT_A, OWNER_1, 'T-1', { text: 'hi', mentions: ['viewer-a'] }, V1, resolvers, s);
    expect(t.comments[0].mentions).toEqual(['viewer-a']);
  });

  it('REJECTS an unknown handle rather than storing free text (404)', async () => {
    const s = svc();
    await open1(s);
    await expect(addComment(TENANT_A, OWNER_1, 'T-1', { text: 'hi', mentions: ['@someone'] }, V1, resolvers, s))
      .rejects.toMatchObject({ status: 404, message: 'mention-not-resolvable' });
    expect(readThread(TENANT_A, OWNER_1, 'T-1', s)!.comments).toHaveLength(0);
  });

  it('rejects a mention of a user who is not a member of this tenant', async () => {
    const s = svc();
    await open1(s);
    await expect(addComment(TENANT_A, OWNER_1, 'T-1', { text: 'hi', mentions: ['stranger'] }, V1, resolvers, s))
      .rejects.toMatchObject({ status: 404 });
  });
});

describe('UI10 — NS-5 vintage pinning', () => {
  it('pins the authoring vintage on the thread', async () => {
    expect((await open1(svc())).pinnedVintage).toEqual(V1);
  });

  it('pins the authoring vintage on every comment', async () => {
    const s = svc();
    await open1(s);
    const t = await addComment(TENANT_A, OWNER_1, 'T-1', { text: 'note' }, V1, resolvers, s);
    expect(t.comments[0].pinnedVintage).toEqual(V1);
  });

  it('discloses a MATCH when the pinned vintage equals the current one', async () => {
    const st = vintageStatus(await open1(svc()), V1);
    expect(st.matchesCurrent).toBe(true);
    expect(st.disclosure).toMatch(/matches the current governed vintage/);
  });

  it('DISCLOSES a mismatch without re-pinning or claiming retrievability', async () => {
    const t = await open1(svc());
    const st = vintageStatus(t, V2);
    expect(st.matchesCurrent).toBe(false);
    expect(st.pinned).toEqual(V1);      // unchanged — never silently re-pinned
    expect(st.current).toEqual(V2);
    expect(st.disclosure).toMatch(/DIFFERS/);
    expect(st.disclosure).toMatch(/NOT retrievable/);
    expect(st.disclosure).toMatch(/not re-pinned/);
  });

  it('states that historical-vintage authoring is unavailable and nothing is fabricated', () => {
    expect(COLLABORATION_SCOPE.vintageAvailability).toMatch(/NOT available/);
    expect(COLLABORATION_SCOPE.vintageAvailability).toMatch(/No historical vintage is fabricated/);
    expect(COLLABORATION_SCOPE.sharing).toMatch(/no object-level ACL/);
  });
});

describe('UI10 — comments, assignment and activity', () => {
  it('records the author from the principal, never from input', async () => {
    const s = svc();
    await open1(s);
    const t = await addComment(TENANT_A, OWNER_1, 'T-1', { text: 'mine' }, V1, resolvers, s);
    expect(t.comments[0].authorUserId).toBe(OWNER_1);
  });

  it('rejects empty comment text', async () => {
    const s = svc();
    await open1(s);
    await expect(addComment(TENANT_A, OWNER_1, 'T-1', { text: '   ' }, V1, resolvers, s)).rejects.toThrow(CollaborationValidationError);
  });

  it('deletes a comment; unknown deletes are false', async () => {
    const s = svc();
    await open1(s);
    const t = await addComment(TENANT_A, OWNER_1, 'T-1', { text: 'x' }, V1, resolvers, s);
    expect(deleteComment(TENANT_A, OWNER_1, 'T-1', t.comments[0].commentId, s)).toBe(true);
    expect(readThread(TENANT_A, OWNER_1, 'T-1', s)!.comments).toHaveLength(0);
    expect(deleteComment(TENANT_A, OWNER_1, 'T-1', 'ghost', s)).toBe(false);
  });

  it('assigns and unassigns to a tenant member', async () => {
    const s = svc();
    await open1(s);
    const t = assignThread(TENANT_A, OWNER_1, 'T-1', OWNER_2, resolvers, s);
    expect(t.assignment).toMatchObject({ assigneeUserId: OWNER_2, assignedBy: OWNER_1 });
    expect(unassignThread(TENANT_A, OWNER_1, 'T-1', s)).toBe(true);
    expect(readThread(TENANT_A, OWNER_1, 'T-1', s)!.assignment).toBeNull();
    expect(unassignThread(TENANT_A, OWNER_1, 'T-1', s)).toBe(false);
  });

  it('rejects assigning a non-member (404)', async () => {
    const s = svc();
    await open1(s);
    expect(() => assignThread(TENANT_A, OWNER_1, 'T-1', 'stranger', resolvers, s)).toThrow(/assignee-not-resolvable/);
  });

  it('records an ordered activity log of every action', async () => {
    const s = svc();
    await open1(s);
    await addComment(TENANT_A, OWNER_1, 'T-1', { text: 'x' }, V1, resolvers, s);
    assignThread(TENANT_A, OWNER_1, 'T-1', OWNER_2, resolvers, s);
    const kinds = readThread(TENANT_A, OWNER_1, 'T-1', s)!.activity.map((a) => a.kind);
    expect(kinds).toEqual(['thread-created', 'comment-added', 'assigned']);
  });
});

describe('UI10 — persistence, restart and isolation', () => {
  it('a thread, its comments, assignment and activity survive a restart', async () => {
    const first = svc();
    await open1(first);
    await addComment(TENANT_A, OWNER_1, 'T-1', { text: 'durable', mentions: ['viewer-a'] }, V1, resolvers, first);
    assignThread(TENANT_A, OWNER_1, 'T-1', OWNER_2, resolvers, first);

    const after = readThread(TENANT_A, OWNER_1, 'T-1', svc())!;
    expect(after.comments).toHaveLength(1);
    expect(after.comments[0].pinnedVintage).toEqual(V1);
    expect(after.comments[0].mentions).toEqual(['viewer-a']);
    expect(after.assignment!.assigneeUserId).toBe(OWNER_2);
    expect(after.activity).toHaveLength(3);
  });

  it('a deleted thread does not resurrect after a restart', async () => {
    const first = svc();
    await open1(first);
    deleteThread(TENANT_A, OWNER_1, 'T-1', first);
    expect(listThreads(TENANT_A, OWNER_1, svc())).toHaveLength(0);
  });

  it('another tenant sees nothing', async () => {
    const s = svc();
    await open1(s);
    expect(listThreads(TENANT_B, OWNER_1, s)).toHaveLength(0);
    expect(readThread(TENANT_B, OWNER_1, 'T-1', s)).toBeUndefined();
  });

  it('another owner in the same tenant sees nothing', async () => {
    const s = svc();
    await open1(s);
    expect(listThreads(TENANT_A, OWNER_2, s)).toHaveLength(0);
    expect(readThread(TENANT_A, OWNER_2, 'T-1', s)).toBeUndefined();
  });

  it('another owner cannot delete this principal thread', async () => {
    const s = svc();
    await open1(s);
    expect(deleteThread(TENANT_A, OWNER_2, 'T-1', s)).toBe(false);
    expect(listThreads(TENANT_A, OWNER_1, s)).toHaveLength(1);
  });

  it('rejects a duplicate threadId', async () => {
    const s = svc();
    await open1(s);
    await expect(open1(s)).rejects.toThrow(/thread-exists/);
  });

  it('ignores records written by another consumer of the same journal', async () => {
    const s = svc();
    s.append({ tenantId: TENANT_A, ownerUserId: OWNER_1, dedupKey: 'notification\u0000n-1', payload: { kind: 'other' } });
    expect(listThreads(TENANT_A, OWNER_1, s)).toHaveLength(0);
  });
});
