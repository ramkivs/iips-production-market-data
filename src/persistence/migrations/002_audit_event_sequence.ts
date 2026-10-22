/**
 * Gate 3 — Migration 002: local, hash-chained audit event sequence (A-3).
 *
 * IMMUTABLE: checksummed into the migration ledger. The audit line is a local
 * SHA-256 chain anchored at the 64-zero genesis; it has no cross-system sink
 * and opens no socket.
 */
import type { Migration } from '../migration_ledger.js';

export const migration002AuditEventSequence: Migration = {
  id: '002_audit_event_sequence',
  sql: `
CREATE TABLE audit_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type      TEXT NOT NULL,
    subject_type    TEXT NOT NULL,
    subject_id      TEXT NOT NULL,
    detail_json     TEXT NOT NULL,
    prev_checksum   TEXT NOT NULL,
    entry_checksum  TEXT NOT NULL,
    created_at      TEXT NOT NULL
);

CREATE INDEX idx_audit_events_subject
    ON audit_events (subject_type, subject_id, id);

CREATE INDEX idx_audit_events_entry_checksum
    ON audit_events (entry_checksum);
`,
};
