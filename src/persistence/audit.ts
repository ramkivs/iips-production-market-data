/**
 * Gate 3 — A-3 local audit hash chain (act §4.2 item 8; Gate E W-14).
 *
 * Audit lines form a SHA-256 hash chain stored only in the local database. The
 * writer never opens a socket, performs no network I/O and has no cross-system
 * sink. Mutation audit is additionally carried by the immutable revision rows.
 */
import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export const AUDIT_GENESIS =
  '0000000000000000000000000000000000000000000000000000000000000000';

export interface AuditEventInput {
  eventType: string;
  subjectType: string;
  subjectId: string;
  detail: Record<string, unknown>;
}

export interface AuditEvent extends AuditEventInput {
  id: number;
  prevChecksum: string;
  entryChecksum: string;
  createdAt: string;
}

function checksumOf(prev: string, input: AuditEventInput, createdAt: string): string {
  return createHash('sha256')
    .update(
      [
        prev,
        input.eventType,
        input.subjectType,
        input.subjectId,
        JSON.stringify(input.detail),
        createdAt,
      ].join('\u0000'),
      'utf8',
    )
    .digest('hex');
}

/** Appends one chained audit line. Caller owns the surrounding transaction. */
export function appendAuditEvent(db: DatabaseSync, input: AuditEventInput): AuditEvent {
  const lastRow = db
    .prepare('SELECT entry_checksum FROM audit_events ORDER BY id DESC LIMIT 1')
    .get() as unknown as { entry_checksum: string } | undefined;
  const prevChecksum = lastRow?.entry_checksum ?? AUDIT_GENESIS;
  const createdAt = new Date().toISOString();
  const entryChecksum = checksumOf(prevChecksum, input, createdAt);
  const result = db
    .prepare(
      `INSERT INTO audit_events
         (event_type, subject_type, subject_id, detail_json, prev_checksum, entry_checksum, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.eventType,
      input.subjectType,
      input.subjectId,
      JSON.stringify(input.detail),
      prevChecksum,
      entryChecksum,
      createdAt,
    );
  return {
    id: Number(result.lastInsertRowid),
    ...input,
    prevChecksum,
    entryChecksum,
    createdAt,
  };
}

/** Read-only audit inspection in chain order. */
export function readAuditEvents(db: DatabaseSync): AuditEvent[] {
  const rows = db
    .prepare(
      `SELECT id, event_type, subject_type, subject_id, detail_json,
              prev_checksum, entry_checksum, created_at
         FROM audit_events ORDER BY id ASC`,
    )
    .all() as unknown as Array<{
    id: number;
    event_type: string;
    subject_type: string;
    subject_id: string;
    detail_json: string;
    prev_checksum: string;
    entry_checksum: string;
    created_at: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    eventType: row.event_type,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    detail: JSON.parse(row.detail_json) as Record<string, unknown>,
    prevChecksum: row.prev_checksum,
    entryChecksum: row.entry_checksum,
    createdAt: row.created_at,
  }));
}

/**
 * Recomputes every link of the chain, including the genesis anchor. Returns
 * false on any broken link rather than throwing, so startup can map the fault
 * to the verify phase without exposing internals on the wire.
 */
export function verifyAuditChain(db: DatabaseSync): boolean {
  const events = readAuditEvents(db);
  let prev = AUDIT_GENESIS;
  for (const event of events) {
    if (event.prevChecksum !== prev) return false;
    const expected = checksumOf(
      prev,
      {
        eventType: event.eventType,
        subjectType: event.subjectType,
        subjectId: event.subjectId,
        detail: event.detail,
      },
      event.createdAt,
    );
    if (expected !== event.entryChecksum) return false;
    prev = event.entryChecksum;
  }
  return true;
}
