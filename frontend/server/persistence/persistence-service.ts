/**
 * Program v3.0 — PF-1: bounded durable-persistence authority (Class C — filesystem journal).
 *
 * GOVERNED CONTRACT (binding): PF-1a (durable persistence) → Class C (filesystem journal) →
 * TD-2 (service contract) → TD-3 (journal versioning) → TD-7a (env-var gitignored local data dir).
 *
 * This is a CONSUMER-NEUTRAL AUTHORITY LAYER ONLY. It knows nothing about notifications,
 * P-1, admin recipients, Keycloak, Macro, CSIP, Research, Evidence, Intelligence, Screener,
 * or any future P-item schema.
 *
 * Public contract (TD-2 — exactly these primitives):
 *   append(input)                              — create a durable record (dedup: no-op + existing)
 *   readById(tenant, owner, recordId)          — read one record (tenant+owner scoped)
 *   listOrdered(tenant, owner)                 — records, createdAt DESC then seq DESC
 *   updateReadState(tenant, owner, id, read)   — idempotent read-state change (the ONLY update)
 *   exists(tenant, owner, dedupKey)            — dedup/existence lookup
 *
 * Server-authoritative invariants (TD-2 §5): recordId, tenant/owner scoping is enforced on every
 * read/update/lookup, createdAt/seq/updatedAt are server-derived, and the journal is the
 * authoritative source; the index is derived and always rebuildable. The CALLER (server
 * transport) is responsible for deriving tenant/owner from the authenticated principal —
 * this service is a library authority, not an HTTP/RBAC boundary (no second authorization model).
 *
 * Journal semantics (TD-2 §7, TD-3): append-only JSON-lines journal with a whole-journal version
 * header on the first line. Writer writes only the current version; an unknown version fails
 * closed. A truncated FINAL line is quarantined by rewriting the valid prefix (never partially
 * applied); a malformed NON-final line fails closed (index reconstruction failure).
 *
 * Compaction (TD-3): NOT built in v1 (deferred). The recorded invariants (identity/order
 * stability, atomic replacement, fail-safe) constrain any FUTURE compaction, not this file.
 *
 * Data directory (TD-7a): env-var-configured (`IIPS_DATA_DIR`), local-development default
 * `<cwd>/.iips-data`, gitignored, server-owned, OS-permission-scoped. TD-7b (production)
 * remains deferred.
 */
import * as realFs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/** Whole-journal format version (TD-3). Any grammar/semantics change MUST increment this. */
export const JOURNAL_FORMAT_VERSION = 1;
const HEADER = { journalFormatVersion: JOURNAL_FORMAT_VERSION };
const JOURNAL_FILE = 'journal.ndjson';

export type PersistenceErrorCode =
  | 'WRITE_FAILED'
  | 'JOURNAL_MALFORMED'
  | 'JOURNAL_VERSION_UNSUPPORTED'
  | 'INDEX_RECONSTRUCTION_FAILED';

export class PersistenceError extends Error {
  constructor(readonly code: PersistenceErrorCode, message: string) {
    super(message);
    this.name = 'PersistenceError';
  }
}

/** Minimal filesystem surface (node:fs by default; injectable for deterministic failure tests). */
export interface JournalFs {
  existsSync(p: string): boolean;
  readFileSync(p: string, encoding: 'utf8'): string;
  appendFileSync(p: string, data: string): void;
  writeFileSync(p: string, data: string): void;
  mkdirSync(p: string, opts: { recursive: boolean }): void;
}

export interface AppendInput {
  /** Server-resolved resource tenant (never taken from an HTTP client). */
  readonly tenantId: string;
  /** Server-resolved owner user (never taken from an HTTP client). */
  readonly ownerUserId: string;
  /** Stable dedup identity; a duplicate append is a no-op returning the existing record. */
  readonly dedupKey: string;
  /** Opaque consumer payload (JSON-serializable). Unknown to this authority. */
  readonly payload: unknown;
}

export interface PersistedRecord {
  readonly recordId: string;
  readonly tenantId: string;
  readonly ownerUserId: string;
  readonly dedupKey: string;
  readonly payload: unknown;
  readonly createdAt: string;
  readonly seq: number;
  readonly read: boolean;
  readonly updatedAt: string | null;
}

interface JournalRecord {
  seq: number;
  op: 'create' | 'readState';
  recordId: string;
  tenantId?: string;
  ownerUserId?: string;
  dedupKey?: string;
  payload?: unknown;
  createdAt?: string;
  read?: boolean;
  updatedAt?: string;
}

export interface PersistenceServiceOptions {
  readonly dataDir: string;
  readonly fs?: JournalFs;
}

/** TD-7a: env-var-configured data directory with a gitignored local default. */
export function resolveDataDir(env: NodeJS.ProcessEnv = process.env): string {
  return path.resolve(env.IIPS_DATA_DIR ?? path.join(process.cwd(), '.iips-data'));
}

export class PersistenceService {
  private readonly fs: JournalFs;
  private readonly journalPath: string;
  private readonly records = new Map<string, PersistedRecord>();
  private readonly dedup = new Map<string, string>();
  private nextSeq = 1;

  constructor(opts: PersistenceServiceOptions) {
    this.fs = opts.fs ?? (realFs as unknown as JournalFs);
    this.journalPath = path.join(opts.dataDir, JOURNAL_FILE);
    this.load();
  }

  // --- TD-2 operations -------------------------------------------------------

  /** Create a durable record. Duplicate dedupKey (per tenant+owner) → no-op, existing record. */
  append(input: AppendInput): PersistedRecord {
    const key = this.dedupKey(input.tenantId, input.ownerUserId, input.dedupKey);
    const existingId = this.dedup.get(key);
    if (existingId !== undefined) return this.records.get(existingId)!;

    const record: PersistedRecord = {
      recordId: randomUUID(),
      tenantId: input.tenantId,
      ownerUserId: input.ownerUserId,
      dedupKey: input.dedupKey,
      payload: input.payload,
      createdAt: new Date().toISOString(),
      seq: this.nextSeq,
      read: false,
      updatedAt: null,
    };
    const line: JournalRecord = {
      seq: record.seq, op: 'create', recordId: record.recordId,
      tenantId: record.tenantId, ownerUserId: record.ownerUserId,
      dedupKey: record.dedupKey, payload: record.payload, createdAt: record.createdAt,
    };
    this.writeLine(line);
    this.nextSeq += 1;
    this.records.set(record.recordId, record);
    this.dedup.set(key, record.recordId);
    return record;
  }

  readById(tenantId: string, ownerUserId: string, recordId: string): PersistedRecord | undefined {
    const r = this.records.get(recordId);
    return r && r.tenantId === tenantId && r.ownerUserId === ownerUserId ? r : undefined;
  }

  listOrdered(tenantId: string, ownerUserId: string): PersistedRecord[] {
    return [...this.records.values()]
      .filter((r) => r.tenantId === tenantId && r.ownerUserId === ownerUserId)
      .sort((a, b) => (a.createdAt === b.createdAt ? b.seq - a.seq : (a.createdAt < b.createdAt ? 1 : -1)));
  }

  /** Idempotent read-state change. Unknown/foreign record → undefined (no-op). */
  updateReadState(tenantId: string, ownerUserId: string, recordId: string, read: boolean): PersistedRecord | undefined {
    const existing = this.readById(tenantId, ownerUserId, recordId);
    if (!existing || existing.read === read) return existing;
    const updatedAt = new Date().toISOString();
    const line: JournalRecord = { seq: this.nextSeq, op: 'readState', recordId, read, updatedAt };
    this.writeLine(line);
    this.nextSeq += 1;
    const updated: PersistedRecord = { ...existing, read, updatedAt };
    this.records.set(recordId, updated);
    return updated;
  }

  exists(tenantId: string, ownerUserId: string, dedupKey: string): boolean {
    return this.dedup.has(this.dedupKey(tenantId, ownerUserId, dedupKey));
  }

  // --- Internal ----------------------------------------------------------------

  private dedupKey(tenantId: string, ownerUserId: string, dedupKey: string): string {
    return `${tenantId}\u0000${ownerUserId}\u0000${dedupKey}`;
  }

  private writeLine(record: JournalRecord): void {
    try {
      if (!this.fs.existsSync(path.dirname(this.journalPath))) {
        this.fs.mkdirSync(path.dirname(this.journalPath), { recursive: true });
      }
      const isNew = !this.fs.existsSync(this.journalPath) || this.fs.readFileSync(this.journalPath, 'utf8').length === 0;
      if (isNew) {
        this.fs.appendFileSync(this.journalPath, `${JSON.stringify(HEADER)}\n`);
      }
      this.fs.appendFileSync(this.journalPath, `${JSON.stringify(record)}\n`);
    } catch (e) {
      throw new PersistenceError('WRITE_FAILED', `journal append failed: ${String(e)}`);
    }
  }

  /** Rebuild the derived index from the journal (journal is the authority). */
  private load(): void {
    const file = this.journalPath;
    if (!this.fs.existsSync(file)) return; // first run — empty authority

    let text: string;
    try {
      text = this.fs.readFileSync(file, 'utf8');
    } catch (e) {
      throw new PersistenceError('INDEX_RECONSTRUCTION_FAILED', `journal read failed: ${String(e)}`);
    }
    if (text.length === 0) return; // valid empty journal

    let lines = text.split('\n').filter((l) => l.length > 0);

    // TD-3: whole-journal version header must be the first line and the current version.
    const header = this.parseLine(lines[0]);
    if (!header || header.journalFormatVersion !== JOURNAL_FORMAT_VERSION) {
      throw new PersistenceError('JOURNAL_VERSION_UNSUPPORTED', `journal version header missing or unsupported (expected ${JOURNAL_FORMAT_VERSION})`);
    }
    lines = lines.slice(1);

    // Truncated-tail quarantine: AT MOST the FINAL line may be unparseable (a partial append).
    // It is dropped and the valid prefix is rewritten; never partially applied.
    let tailQuarantined = false;
    if (lines.length > 0 && this.parseLine(lines[lines.length - 1]) === null) {
      lines = lines.slice(0, -1);
      tailQuarantined = true;
    }
    if (tailQuarantined) this.rewriteJournal(lines);

    // Replay (index reconstruction). Any OTHER malformed record fails closed.
    for (const line of lines) {
      const rec = this.parseLine(line);
      if (!rec) throw new PersistenceError('JOURNAL_MALFORMED', 'malformed non-final journal record');
      this.applyRecord(rec);
    }
  }

  private applyRecord(rec: JournalRecord): void {
    if (rec.op === 'create') {
      if (rec.seq !== undefined) this.nextSeq = Math.max(this.nextSeq, rec.seq + 1);
      const record: PersistedRecord = {
        recordId: rec.recordId,
        tenantId: rec.tenantId ?? '',
        ownerUserId: rec.ownerUserId ?? '',
        dedupKey: rec.dedupKey ?? '',
        payload: rec.payload,
        createdAt: rec.createdAt ?? '',
        seq: rec.seq ?? 0,
        read: false,
        updatedAt: null,
      };
      this.records.set(record.recordId, record);
      this.dedup.set(this.dedupKey(record.tenantId, record.ownerUserId, record.dedupKey), record.recordId);
    } else if (rec.op === 'readState') {
      if (rec.seq !== undefined) this.nextSeq = Math.max(this.nextSeq, rec.seq + 1);
      const existing = this.records.get(rec.recordId);
      if (existing) {
        this.records.set(rec.recordId, { ...existing, read: rec.read ?? existing.read, updatedAt: rec.updatedAt ?? null });
      }
      // readState for an unknown recordId is ignored on replay (create must precede it).
    }
  }

  private rewriteJournal(lines: string[]): void {
    try {
      const body = `${JSON.stringify(HEADER)}\n` + (lines.length ? `${lines.join('\n')}\n` : '');
      this.fs.writeFileSync(this.journalPath, body);
    } catch (e) {
      throw new PersistenceError('WRITE_FAILED', `journal tail recovery failed: ${String(e)}`);
    }
  }

  private parseLine(line: string): (JournalRecord & { journalFormatVersion?: number }) | null {
    try {
      return JSON.parse(line) as JournalRecord & { journalFormatVersion?: number };
    } catch {
      return null;
    }
  }
}
