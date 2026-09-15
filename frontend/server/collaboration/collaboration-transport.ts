/**
 * UI10 COLLABORATION — HTTP transport.
 *
 * Authority: D83-R1 decision A. Requirement: INT-013 / D4_01 / D4_03.
 *
 * Mirrors the promoted notes / UI12 / UI07 / UI08 dispatch pattern: reached from a path-prefix
 * branch in `executive-transport` with the EXISTING READ executor. No new RBAC model, no new
 * executor, `readSurfaceFor` is NOT extended.
 *
 * Routes (owner-scoped, server-derived identity):
 *   GET    /api/collaboration                         — threads + NS-5 vintage status
 *   POST   /api/collaboration                         — open a thread on a governed object
 *   GET    /api/collaboration/:id                     — one thread
 *   DELETE /api/collaboration/:id                     — delete a thread
 *   POST   /api/collaboration/:id/comments            — add a comment (mentions/references)
 *   DELETE /api/collaboration/:id/comments/:commentId — delete a comment
 *   POST   /api/collaboration/:id/assignment          — assign
 *   DELETE /api/collaboration/:id/assignment          — unassign
 *
 * ⚠ The accepted P13 `buildCollaborationView` is consumed UNMODIFIED — it enforces NS-5 by
 *   stamping `_pinnedVintage` on every comment and rejecting fabricated provenance.
 *
 * ⚠ Reference integrity (INT-013): every governed reference is resolved SERVER-SIDE within the
 *   tenant. An unresolved or cross-tenant reference fails closed 404. Raw provider records are
 *   unreachable — the object-kind set is closed and contains no provider kind.
 *
 * ⚠ AD-17/M-2, ReplayService and the replay hardcodes are untouched.
 */
import type http from 'node:http';
import { AuthError } from '../../src/core/auth/keycloakAdapter';
import type { SecuredExecutor } from '../secured-executor';
import { guardRead, guardExecute, TransportError } from '../admin-transport';
import type { GovernedUniverseProvider } from '../p12-request-handler';
import {
  COLLABORATION_SCOPE,
  CollaborationValidationError,
  addComment,
  assignThread,
  createThread,
  deleteComment,
  deleteThread,
  getCollaborationPersistence,
  listThreads,
  readThread,
  unassignThread,
  vintageStatus,
  type CollaborationResolvers,
  type PinnedVintage,
  type Thread,
} from './collaboration-service';
// The ACCEPTED P13 UI10 contract — consumed unmodified (D83 §13).
// @ts-expect-error — accepted P13 JavaScript module; imported without modification.
import * as newSurfaces from '../../../p13/src/newSurfaces.js';

function readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      chunks.push(c);
      if (chunks.reduce((n, b) => n + b.length, 0) > 1_000_000) reject(new TransportError(400, 'request-body-too-large'));
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (raw.trim() === '') { resolve({}); return; }
      try { resolve(JSON.parse(raw) as Record<string, unknown>); } catch { reject(new TransportError(400, 'invalid-json')); }
    });
    req.on('error', reject);
  });
}

export function isCollaborationPath(url: string | undefined): boolean {
  return (url ?? '').split('?')[0].startsWith('/api/collaboration');
}

/** Decorate a thread with the accepted P13 view plus the NS-5 vintage-status disclosure. */
function decorate(thread: Thread, tenantId: string, current: PinnedVintage, dataSource: string, classification: string): Record<string, unknown> {
  // The pinned provenance is the vintage the thread references (NS-5).
  const pinnedProvenance = {
    dataSource,
    classification,
    asOf: thread.pinnedVintage.asOf,
    dataVersion: thread.pinnedVintage.dataVersion,
    mode: thread.pinnedVintage.mode,
    quality: 'good',
    receivedAt: thread.pinnedVintage.asOf,
    completenessPct: 100,
  };
  const view = newSurfaces.buildCollaborationView({
    threadId: thread.threadId,
    comments: thread.comments,
    pinnedProvenance,
    tenantId,
  }) as Record<string, unknown>;

  return {
    ...view,
    subject: thread.subject,
    createdBy: thread.createdBy,
    createdAt: thread.createdAt,
    assignment: thread.assignment,
    activity: thread.activity,
    vintageStatus: vintageStatus(thread, current),
    scope: COLLABORATION_SCOPE,
  };
}

export async function handleCollaborationRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  executor: SecuredExecutor,
  universe: GovernedUniverseProvider,
  makeResolvers: (ownerUserId: string) => CollaborationResolvers,
  opts: { readonly store?: import('../persistence/persistence-service').PersistenceService } = {},
): Promise<void> {
  const url = (req.url ?? '').split('?')[0];
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '').trim();
  const method = req.method ?? 'GET';
  res.setHeader('Content-Type', 'application/json');

  try {
    const store = opts.store ?? getCollaborationPersistence();
    const segments = url.split('/').filter(Boolean); // api, collaboration, [id], [comments|assignment], [commentId]

    /**
     * The governed vintage for THIS tenant. Fetched after the guard resolves the principal so
     * the tenant is always the authenticated one — never a client-supplied value.
     */
    async function vintageFor(tenantId: string): Promise<{ v: PinnedVintage; dataSource: string; classification: string }> {
      const vt = await universe.vintage(tenantId);
      return {
        v: Object.freeze({ dataVersion: vt.dataVersion, asOf: vt.asOf, mode: vt.mode }),
        dataSource: vt.dataSource,
        classification: vt.classification,
      };
    }

    // ---- GET /api/collaboration ----------------------------------------------------------
    if (url === '/api/collaboration' && method === 'GET') {
      const p = await guardRead(executor, token, 'collaboration');
      const { v, dataSource, classification } = await vintageFor(p.tenantId);
      const data = listThreads(p.tenantId, p.userId, store).map((t) => decorate(t, p.tenantId, v, dataSource, classification));
      res.writeHead(200);
      res.end(JSON.stringify({
        data,
        objectKinds: ['evidence', 'company', 'watchlist', 'report'],
        scope: COLLABORATION_SCOPE,
        provenance: {
          dataSource, asOf: v.asOf, dataVersion: v.dataVersion, mode: v.mode,
          freshness: 'SNAPSHOT', authority: 'PLATFORM',
          transportSemantics:
            'owner-scoped collaboration threads (append-only journal). Every thread and comment PINS the governed vintage in force at authoring time (NS-5). A pinned earlier vintage is recorded but NOT retrievable; threads are never silently re-pinned and no historical vintage is fabricated. References resolve server-side to governed IIPS objects only.',
        },
      }));
      return;
    }

    // ---- POST /api/collaboration ---------------------------------------------------------
    if (url === '/api/collaboration' && method === 'POST') {
      const p = await guardExecute(executor, token, 'collaboration');
      const body = await readBody(req);
      const { v, dataSource, classification } = await vintageFor(p.tenantId);
      const thread = await createThread(p.tenantId, p.userId, body.threadId, body.subject, v, makeResolvers(p.userId), store);
      res.writeHead(201);
      res.end(JSON.stringify({ data: decorate(thread, p.tenantId, v, dataSource, classification) }));
      return;
    }

    // ---- POST /api/collaboration/:id/comments ---------------------------------------------
    if (segments.length === 4 && segments[3] === 'comments' && method === 'POST') {
      const p = await guardExecute(executor, token, 'collaboration');
      const body = await readBody(req);
      const { v, dataSource, classification } = await vintageFor(p.tenantId);
      const thread = await addComment(
        p.tenantId, p.userId, decodeURIComponent(segments[2]),
        { text: body.text, mentions: body.mentions, references: body.references },
        v, makeResolvers(p.userId), store,
      );
      res.writeHead(201);
      res.end(JSON.stringify({ data: decorate(thread, p.tenantId, v, dataSource, classification) }));
      return;
    }

    // ---- DELETE /api/collaboration/:id/comments/:commentId --------------------------------
    if (segments.length === 5 && segments[3] === 'comments' && method === 'DELETE') {
      const p = await guardExecute(executor, token, 'collaboration');
      if (!deleteComment(p.tenantId, p.userId, decodeURIComponent(segments[2]), decodeURIComponent(segments[4]), store)) {
        throw new TransportError(404, 'comment-not-found');
      }
      res.writeHead(200); res.end(JSON.stringify({ data: { deleted: true } }));
      return;
    }

    // ---- POST /api/collaboration/:id/assignment -------------------------------------------
    if (segments.length === 4 && segments[3] === 'assignment' && method === 'POST') {
      const p = await guardExecute(executor, token, 'collaboration');
      const body = await readBody(req);
      const { v, dataSource, classification } = await vintageFor(p.tenantId);
      const thread = assignThread(p.tenantId, p.userId, decodeURIComponent(segments[2]), body.assigneeUserId, makeResolvers(p.userId), store);
      res.writeHead(200);
      res.end(JSON.stringify({ data: decorate(thread, p.tenantId, v, dataSource, classification) }));
      return;
    }

    // ---- DELETE /api/collaboration/:id/assignment -----------------------------------------
    if (segments.length === 4 && segments[3] === 'assignment' && method === 'DELETE') {
      const p = await guardExecute(executor, token, 'collaboration');
      if (!unassignThread(p.tenantId, p.userId, decodeURIComponent(segments[2]), store)) {
        throw new TransportError(404, 'assignment-not-found');
      }
      res.writeHead(200); res.end(JSON.stringify({ data: { unassigned: true } }));
      return;
    }

    // ---- GET /api/collaboration/:id --------------------------------------------------------
    if (segments.length === 3 && method === 'GET') {
      const p = await guardRead(executor, token, 'collaboration');
      const thread = readThread(p.tenantId, p.userId, decodeURIComponent(segments[2]), store);
      if (!thread) throw new TransportError(404, 'thread-not-found');
      const { v, dataSource, classification } = await vintageFor(p.tenantId);
      res.writeHead(200);
      res.end(JSON.stringify({ data: decorate(thread, p.tenantId, v, dataSource, classification) }));
      return;
    }

    // ---- DELETE /api/collaboration/:id -----------------------------------------------------
    if (segments.length === 3 && method === 'DELETE') {
      const p = await guardExecute(executor, token, 'collaboration');
      if (!deleteThread(p.tenantId, p.userId, decodeURIComponent(segments[2]), store)) {
        throw new TransportError(404, 'thread-not-found');
      }
      res.writeHead(200); res.end(JSON.stringify({ data: { deleted: true } }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'collaboration-not-found' }));
  } catch (e) {
    if (e instanceof AuthError) { res.writeHead(e.status); res.end(JSON.stringify({ error: e.message })); return; }
    if (e instanceof TransportError) { res.writeHead(e.status); res.end(JSON.stringify({ error: e.message })); return; }
    if (e instanceof CollaborationValidationError) {
      res.writeHead(e.status); res.end(JSON.stringify({ error: e.message })); return;
    }
    res.writeHead(500); res.end(JSON.stringify({ error: 'collaboration transport error', detail: String(e) }));
  }
}
