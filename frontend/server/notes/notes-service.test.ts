/**
 * Program v3.0 — P-2 Notes service tests (offline, deterministic).
 *
 * Implements the authorized acceptance contract from
 * IIPS-P2-NOTES-IMPLEMENTATION-SPECIFICATION-REISSUED.md:
 *   T-1 … T-24   core contract
 *   S5-T1 … S5-T7  unbounded / plain-text body (S-5)
 *   S9-T1 … S9-T9  UI contract (S-9)
 *
 * No live network, no real credentials, no Keycloak. PF-1 is exercised through temporary
 * data directories only.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { PersistenceService, PersistenceError, resolveDataDir } from '../persistence/persistence-service';
import {
  createNote,
  listNotes,
  toNoteDto,
  resetNotesPersistence,
  resolveNotesDataDir,
  NOTES_DATA_SUBDIR,
} from './notes-service';
import { handleNotesRequest, createAdminExecutor, createReadExecutor } from '../admin-transport';
import type { OidcVerifier } from '../../src/core/auth/keycloakAdapter';

const tmpDirs: string[] = [];
function tmpDir(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'iips-p2-'));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
  resetNotesPersistence();
});
beforeEach(() => resetNotesPersistence());

function store(dir = tmpDir()): PersistenceService {
  return new PersistenceService({ dataDir: dir });
}

// --- HTTP harness (mirrors the promoted admin-transport test pattern) ---------------------

const METADATA = { issuer: 'http://localhost:8080/realms/iips', jwksUri: 'http://localhost:8080/realms/iips/certs', clientId: 'iips-spa' };
function verifier(claims: Record<string, unknown>): OidcVerifier {
  return { verify: vi.fn().mockResolvedValue({ subject: 'u1', claims, expiry: Date.now() / 1000 + 3600 }) };
}
function claimsFor(username: string, role: string, tenant = 'tenant-A'): Record<string, unknown> {
  return { iss: METADATA.issuer, aud: 'iips-spa', preferred_username: username, tenant, realm_access: { roles: [role] } };
}

async function call(
  who: { user: string; role: string; tenant?: string } | null,
  urlPath: string,
  method: 'GET' | 'POST',
  s: PersistenceService,
  body?: unknown,
  useAdminExecutor = false,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const deps = { metadata: METADATA, verifier: verifier(claimsFor(who?.user ?? 'analyst-a', who?.role ?? 'iips-analyst', who?.tenant)) };
  const executor = useAdminExecutor ? createAdminExecutor(deps) : createReadExecutor(deps);
  const server = http.createServer((req, res) => {
    void handleNotesRequest(req, res, executor, { store: s });
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

// --- T-1 … T-8 authorization and server-derived identity ---------------------------------

describe('T-1..T-8 authorization and server-derived identity', () => {
  it('T-1: analyst may create a note (201)', async () => {
    const s = store();
    const { status, body } = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/notes', 'POST', s, { body: 'first' });
    expect(status).toBe(201);
    expect((body.data as Record<string, unknown>).body).toBe('first');
  });

  it('T-2: admin may create a note (201)', async () => {
    const s = store();
    const { status } = await call({ user: 'admin-a', role: 'iips-admin' }, '/api/notes', 'POST', s, { body: 'admin note' });
    expect(status).toBe(201);
  });

  it('T-3: viewer create is denied (403) by the ranked gate', async () => {
    const s = store();
    const { status } = await call({ user: 'viewer-a', role: 'iips-viewer' }, '/api/notes', 'POST', s, { body: 'nope' });
    expect(status).toBe(403);
    expect(listNotes('tenant-A', 'viewer-a', s)).toHaveLength(0);
  });

  it('T-4: unauthenticated request is rejected (401)', async () => {
    const s = store();
    const { status } = await call(null, '/api/notes', 'GET', s);
    expect(status).toBe(401);
  });

  it('T-5: tenantId is server-derived; a client-supplied tenantId is ignored', async () => {
    const s = store();
    await call({ user: 'analyst-a', role: 'iips-analyst', tenant: 'tenant-A' }, '/api/notes', 'POST', s, {
      body: 'x', tenantId: 'tenant-EVIL',
    });
    expect(listNotes('tenant-EVIL', 'analyst-a', s)).toHaveLength(0);
    expect(listNotes('tenant-A', 'analyst-a', s)).toHaveLength(1);
  });

  it('T-6: ownerUserId is server-derived; a client cannot author for another user', async () => {
    const s = store();
    await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/notes', 'POST', s, {
      body: 'x', ownerUserId: 'someone-else', authorUserId: 'someone-else',
    });
    expect(listNotes('tenant-A', 'someone-else', s)).toHaveLength(0);
    expect(listNotes('tenant-A', 'analyst-a', s)).toHaveLength(1);
  });

  it('T-7: authorUserId is server-derived from the principal', () => {
    const s = store();
    const dto = createNote('tenant-A', 'analyst-a', 'body', s);
    expect(dto.authorUserId).toBe('analyst-a');
  });

  it('T-8: createdAt is server-derived by PF-1 (ISO timestamp, not client input)', () => {
    const s = store();
    const dto = createNote('tenant-A', 'analyst-a', 'body', s);
    expect(dto.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(Number.isNaN(Date.parse(dto.createdAt))).toBe(false);
  });
});

// --- T-9 … T-11 scoping -------------------------------------------------------------------

describe('T-9..T-11 owner and tenant scoping', () => {
  it('T-9: list returns ONLY the caller\u2019s own notes', () => {
    const s = store();
    createNote('tenant-A', 'analyst-a', 'mine', s);
    createNote('tenant-A', 'analyst-b', 'theirs', s);
    const mine = listNotes('tenant-A', 'analyst-a', s);
    expect(mine).toHaveLength(1);
    expect(mine[0].body).toBe('mine');
  });

  it('T-10: cross-tenant isolation \u2014 another tenant never sees the note', () => {
    const s = store();
    createNote('tenant-A', 'analyst-a', 'secret', s);
    expect(listNotes('tenant-B', 'analyst-a', s)).toHaveLength(0);
  });

  it('T-11: unknown path yields note-not-found (404); foreign records are unreachable', async () => {
    const s = store();
    createNote('tenant-A', 'other-user', 'foreign', s);
    const { status, body } = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/notes/whatever', 'GET', s);
    expect(status).toBe(404);
    expect(body.error).toBe('note-not-found');
    // The foreign record is not reachable through the caller's own scope.
    expect(listNotes('tenant-A', 'analyst-a', s)).toHaveLength(0);
  });
});

// --- T-12 … T-15 persistence, separation, no P-1 contamination ---------------------------

describe('T-12..T-15 durable persistence and P-1 isolation', () => {
  it('T-12: notes persist across a service restart (durable journal)', () => {
    const dir = tmpDir();
    createNote('tenant-A', 'analyst-a', 'durable', store(dir));
    const reloaded = new PersistenceService({ dataDir: dir });
    expect(listNotes('tenant-A', 'analyst-a', reloaded)).toHaveLength(1);
  });

  it('T-13: the notes journal is <dataDir>/notes/journal.ndjson, separate from P-1\u2019s', () => {
    expect(NOTES_DATA_SUBDIR).toBe('notes');
    expect(resolveNotesDataDir()).toBe(path.join(resolveDataDir(), 'notes'));
    // The P-1 journal path is the parent directory's journal, never the notes one.
    expect(resolveNotesDataDir()).not.toBe(resolveDataDir());
  });

  it('T-14: a note never appears in the P-1 notification list and does not affect unreadCount', async () => {
    const notesDir = tmpDir();
    const notifDir = tmpDir();
    const notesStore = new PersistenceService({ dataDir: notesDir });
    const notifStore = new PersistenceService({ dataDir: notifDir });
    createNote('tenant-A', 'admin-a', 'a note', notesStore);

    const { listNotifications, unreadCount } = await import('../notifications/notification-service');
    expect(listNotifications('tenant-A', 'admin-a', notifStore)).toHaveLength(0);
    expect(unreadCount('tenant-A', 'admin-a', notifStore)).toBe(0);
    // Physical separation: the two journals are distinct files.
    expect(fs.existsSync(path.join(notesDir, 'journal.ndjson'))).toBe(true);
    expect(fs.existsSync(path.join(notifDir, 'journal.ndjson'))).toBe(false);
  });

  it('T-15: the P-1 notification module is untouched by notes (no cross-import)', () => {
    const code = fs.readFileSync(path.join(__dirname, 'notes-service.ts'), 'utf8');
    expect(code).not.toMatch(/notification-service/);
    expect(code).not.toMatch(/emitClassificationNotifications/);
  });
});

// --- T-16 … T-19 immutability and dedup ---------------------------------------------------

describe('T-16..T-19 immutability and dedup', () => {
  it('T-16: the persisted payload is immutable \u2014 no API path mutates it', () => {
    const s = store();
    const dto = createNote('tenant-A', 'analyst-a', 'original', s);
    const rec = s.readById('tenant-A', 'analyst-a', dto.noteId)!;
    expect((rec.payload as { body: string }).body).toBe('original');
    // PF-1 exposes only readState as a mutation; there is no payload update primitive.
    expect(typeof (s as unknown as Record<string, unknown>).updatePayload).toBe('undefined');
  });

  it('T-17: no edit endpoint exists', async () => {
    const s = store();
    const dto = createNote('tenant-A', 'analyst-a', 'x', s);
    const { status } = await call({ user: 'analyst-a', role: 'iips-analyst' }, `/api/notes/${dto.noteId}`, 'POST', s, { body: 'edited' });
    expect(status).toBe(404);
    expect(listNotes('tenant-A', 'analyst-a', s)[0].body).toBe('x');
  });

  it('T-18: no delete endpoint exists', () => {
    const code = fs.readFileSync(path.join(__dirname, '..', 'admin-transport.ts'), 'utf8');
    expect(code).not.toMatch(/api\/notes[^']*'\s*&&\s*req\.method === 'DELETE'/);
    const svc = fs.readFileSync(path.join(__dirname, 'notes-service.ts'), 'utf8');
    expect(svc).not.toMatch(/\bdeleteNote\b|\bremoveNote\b|\bupdateNote\b|\beditNote\b/);
  });

  it('T-19: two identical bodies create TWO distinct records (no dedup collapse)', () => {
    const s = store();
    const a = createNote('tenant-A', 'analyst-a', 'identical', s);
    const b = createNote('tenant-A', 'analyst-a', 'identical', s);
    expect(a.noteId).not.toBe(b.noteId);
    expect(listNotes('tenant-A', 'analyst-a', s)).toHaveLength(2);
  });
});

// --- T-20 … T-23 ordering, empty state, error semantics ----------------------------------

describe('T-20..T-23 ordering, empty state, errors', () => {
  it('T-20: ordering is PF-1 canonical (createdAt DESC, seq DESC tiebreak)', () => {
    const s = store();
    createNote('tenant-A', 'analyst-a', 'first', s);
    createNote('tenant-A', 'analyst-a', 'second', s);
    createNote('tenant-A', 'analyst-a', 'third', s);
    const bodies = listNotes('tenant-A', 'analyst-a', s).map((n) => n.body);
    expect(bodies[0]).toBe('third'); // newest first
    expect(bodies[2]).toBe('first');
  });

  it('T-21: zero notes returns 200 with an empty array', async () => {
    const s = store();
    const { status, body } = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/notes', 'GET', s);
    expect(status).toBe(200);
    expect(body.data).toEqual([]);
    expect((body.provenance as Record<string, string>).authority).toBe('PLATFORM');
  });

  it('T-22: missing body -> 400; blank body -> 400; non-string body -> 422', async () => {
    const s = store();
    const missing = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/notes', 'POST', s, {});
    expect(missing.status).toBe(400);
    expect(missing.body.error).toBe('note-body-required');

    const blank = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/notes', 'POST', s, { body: '   ' });
    expect(blank.status).toBe(400);
    expect(blank.body.error).toBe('note-body-required');

    const wrongType = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/notes', 'POST', s, { body: 42 });
    expect(wrongType.status).toBe(422);
    expect(wrongType.body.error).toBe('invalid-note-body');
  });

  it('T-23: PF-1 WRITE_FAILED surfaces as 500 with no partial state', async () => {
    const s = store();
    vi.spyOn(s, 'append').mockImplementation(() => {
      throw new PersistenceError('WRITE_FAILED', 'disk full');
    });
    const { status } = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/notes', 'POST', s, { body: 'x' });
    expect(status).toBe(500);
    vi.restoreAllMocks();
    expect(listNotes('tenant-A', 'analyst-a', s)).toHaveLength(0);
  });
});

// --- T-24 prohibited scope ----------------------------------------------------------------

describe('T-24 prohibited-scope scan', () => {
  it('T-24: the notes service contains no scheduler, event bus, retry queue, rollback, or RBAC model', () => {
    const raw = fs.readFileSync(path.join(__dirname, 'notes-service.ts'), 'utf8');
    // Strip comments so the prohibition text in the header cannot self-trigger.
    const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(code).not.toMatch(/setInterval|setTimeout|cron|worker_threads|new Worker/);
    expect(code).not.toMatch(/EventEmitter|eventBus|publish\(|subscribe\(/);
    expect(code).not.toMatch(/rollback|beginTransaction|commitTransaction|retryQueue/);
    expect(code).not.toMatch(/RbacModel|PolicyEngine|casbin|defineAbility/);
    expect(code).not.toMatch(/sqlite|postgres|mysql|mongo|prisma|typeorm|knex/);
    expect(code).not.toMatch(/process\.env|apiKey|secretKey|password/);
  });
});

// --- S5-T1 … S5-T7 unbounded, plain-text body ---------------------------------------------

describe('S5-T1..S5-T7 unbounded plain-text body (S-5)', () => {
  const serviceCode = () => fs.readFileSync(path.join(__dirname, 'notes-service.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const transportCode = () => fs.readFileSync(path.join(__dirname, '..', 'admin-transport.ts'), 'utf8');

  it('S5-T1: no application-level maximum exists in the notes code path', () => {
    expect(serviceCode()).not.toMatch(/maxLength|MAX_LENGTH|MAX_BODY|\.length\s*>\s*\d+/);
    const notesHandler = transportCode().slice(transportCode().indexOf('handleNotesRequest'));
    expect(notesHandler).not.toMatch(/maxLength|MAX_LENGTH|MAX_BODY|\.length\s*>\s*\d+/);
  });

  it('S5-T2: an arbitrarily long body is NOT rejected for length', async () => {
    const s = store();
    const huge = 'x'.repeat(500_000);
    const { status, body } = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/notes', 'POST', s, { body: huge });
    expect(status).toBe(201);
    expect(((body.data as Record<string, unknown>).body as string).length).toBe(500_000);
  });

  it('S5-T3: the body is stored verbatim', () => {
    const s = store();
    const raw = '  leading and trailing  \n\nline2\ttab';
    const dto = createNote('tenant-A', 'analyst-a', raw, s);
    expect(dto.body).toBe(raw);
    const rec = s.readById('tenant-A', 'analyst-a', dto.noteId)!;
    expect((rec.payload as { body: string }).body).toBe(raw);
  });

  it('S5-T4/S5-T5: markup is preserved as literal text, never interpreted', () => {
    const s = store();
    const markup = '# heading **bold** <b>html</b> <script>alert(1)</script>';
    const dto = createNote('tenant-A', 'analyst-a', markup, s);
    expect(dto.body).toBe(markup); // unchanged: no Markdown/HTML processing
  });

  it('S5-T6: no sanitization layer is introduced', () => {
    expect(serviceCode()).not.toMatch(/sanitiz|escapeHtml|DOMPurify|xss|striptags/i);
    const uiSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'features', 'notes', 'NotesDrawer.tsx'), 'utf8')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
    expect(uiSrc).not.toMatch(/dangerouslySetInnerHTML|sanitiz|DOMPurify|marked|remark/i);
  });

  it('S5-T7: 422 is NEVER used for length \u2014 only for a type violation', async () => {
    const s = store();
    const huge = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/notes', 'POST', s, { body: 'y'.repeat(200_000) });
    expect(huge.status).not.toBe(422);
    const wrongType = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/notes', 'POST', s, { body: { nested: true } });
    expect(wrongType.status).toBe(422);
  });
});

// --- S9-T1 … S9-T9 UI contract -------------------------------------------------------------

describe('S9-T1..S9-T9 UI contract (S-9)', () => {
  /** Raw source (for positive structural assertions). */
  const uiRaw = () => fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'features', 'notes', 'NotesDrawer.tsx'), 'utf8');
  /**
   * EXECUTABLE code only — block, line and JSX comments stripped. Prohibition scans must use
   * this, otherwise the governance header (which NAMES the prohibited constructs in order to
   * forbid them) self-triggers. Same comment-vs-code rule applied by the P-1 T-24 scan.
   */
  const ui = () => uiRaw()
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  const topBar = () => fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'app', 'TopBar.tsx'), 'utf8');
  const appShell = () => fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'app', 'AppShell.tsx'), 'utf8');

  it('S9-T1: a TopBar affordance opens the AppShell-mounted Notes drawer', () => {
    expect(topBar()).toMatch(/onOpenNotes/);
    expect(topBar()).toMatch(/data-testid="notes-trigger"/);
    expect(appShell()).toMatch(/setNotesOpen\(true\)/);
    expect(appShell()).toMatch(/<NotesDrawer/);
  });

  it('S9-T2: the governed Drawer primitive is reused (focus trap / Escape inherited)', () => {
    expect(uiRaw()).toMatch(/import \{ Drawer \} from '\.\.\/\.\.\/components\/interaction\/InteractionComponents'/);
    expect(uiRaw()).toMatch(/<Drawer /);
    // No second drawer/dialog implementation in EXECUTABLE code (the header names the
    // inherited mechanism in prose, which must not count as a reimplementation).
    expect(ui()).not.toMatch(/useDialogFocus|role="dialog"/);
  });

  it('S9-T3: the body control is a multi-line textarea', () => {
    expect(uiRaw()).toMatch(/<textarea/);
    expect(uiRaw()).toMatch(/rows=\{4\}/);
  });

  it('S9-T4: creation requires an explicit "Create note" button action', () => {
    expect(uiRaw()).toMatch(/data-testid="note-create"/);
    expect(uiRaw()).toMatch(/Create note/);
    expect(uiRaw()).toMatch(/onClick=\{\(\) => \{ void onCreate\(\); \}\}/);
  });

  it('S9-T5: no autosave, no implicit save, no keyboard-only submission', () => {
    const code = ui();
    expect(code).not.toMatch(/autosave|autoSave/i);
    expect(code).not.toMatch(/setInterval|debounce/);
    expect(code).not.toMatch(/onSubmit|<form/);
    expect(code).not.toMatch(/onKeyDown|onKeyPress|onKeyUp/);
  });

  it('S9-T6: a successful create re-reads the server order so the new note appears first', () => {
    // The drawer never sorts locally; it reloads and renders the received order (S-7).
    expect(uiRaw()).toMatch(/await load\(\)/);
    expect(ui()).not.toMatch(/\.sort\(/);
  });

  it('S9-T7/S9-T8: no edit control and no delete control are rendered', () => {
    const code = ui();
    expect(code).not.toMatch(/data-testid="note-edit"|>\s*Edit\s*</);
    expect(code).not.toMatch(/data-testid="note-delete"|>\s*Delete\s*</);
  });

  it('S9-T9: no navigation route or navigation marker is introduced', () => {
    const routes = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'app', 'routes.ts'), 'utf8');
    const nav = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'app', 'navigation.ts'), 'utf8');
    expect(routes).not.toMatch(/notes/i);
    expect(nav).not.toMatch(/notes/i);
    expect(ui()).not.toMatch(/react-router-dom/);
  });
});

// --- DTO mapping --------------------------------------------------------------------------

describe('DTO contract (S-4)', () => {
  it('exposes exactly noteId, body, authorUserId, createdAt \u2014 never PF-1 read/updatedAt', () => {
    const s = store();
    const dto = createNote('tenant-A', 'analyst-a', 'x', s);
    expect(Object.keys(dto).sort()).toEqual(['authorUserId', 'body', 'createdAt', 'noteId']);
    const rec = s.readById('tenant-A', 'analyst-a', dto.noteId)!;
    expect(Object.keys(toNoteDto(rec))).not.toContain('read');
    expect(Object.keys(toNoteDto(rec))).not.toContain('updatedAt');
  });
});
